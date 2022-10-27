import React, { useEffect, useState } from 'react'
import { ConnectWallet, useAddress, useContract, useDisconnect, useMetamask, } from "@thirdweb-dev/react";
import { GetServerSideProps } from 'next';
import { sanityClient, urlFor } from '../../sanity';
import { Collection } from '../../typings';
import Link from 'next/link';
import { BigNumber } from 'ethers';
import toast, { Toaster } from 'react-hot-toast';

interface Props {
    collection: Collection
}

function NFTDropPage({ collection }: Props) {
    const [claimedSupply, setClaimedSupply] = useState<number>(0);
    const [totalSupply, setTotalSupply] = useState<BigNumber>();
    const [loading, setLoading] = useState<boolean>(true);
    const [priceInEth, setPriceInEth] = useState<string>();
    const { contract } = useContract(collection.address, "nft-drop");


    //auth
    const connectWithMetamask = useMetamask()
    const address = useAddress()
    const disconnect = useDisconnect()

    useEffect(() => {
        const fetchPrice = async () => {
            const claimConditions = await contract?.claimConditions.getAll();
            setPriceInEth(claimConditions?.[0].currencyMetadata.displayValue);
        }
        fetchPrice();
    }, [contract])


    useEffect(() => {
        if (!contract) return;
        const fetchNftDropData = async () => {
            setLoading(true);
            try {

                const claimed = await contract.getAllClaimed();
                const total = await contract.totalSupply();

                setClaimedSupply(claimed.length);
                setTotalSupply(total)
                setLoading(false)
            }
            catch (error) {
                console.log(error)
            }
        }
        fetchNftDropData();
    }, [contract])

    const mintNft = () => {
        if (!contract || !address) return;

        const quantity = 1;

        setLoading(true);
        const notification = toast.loading("Minting...", {
            style: {
                background: 'green',
                color: "white",
                fontWeight: "bolder",
                fontSize: "17px",
                padding: "20px"
            }
        })
        contract.claimTo(address, quantity).then((tx) => {
            const receipt = tx[0].receipt
            const claimedTokenId = tx[0].id
            const claimedNFT = tx[0].data()

            toast('HOORAY.. You Successfully Minted!', {
                duration: 8000,
                style: {
                    background: 'white',
                    color: "green",
                    fontWeight: "bolder",
                    fontSize: "17px",
                    padding: "20px"
                }
            })

            console.log(receipt)
            console.log(claimedTokenId)
            console.log(claimedNFT)

        })
            .catch((err) => {
                console.log(err)
                toast('Whoops... Somethign Went Wrong!', {
                    duration: 8000,
                    style: {
                        background: 'red',
                        color: "white",
                        fontWeight: "bolder",
                        fontSize: "17px",
                        padding: "20px"
                    }
                })
            })
            .finally(() => {
                setLoading(false)
                toast.dismiss(notification)
            })

    }

    return (
        <div className="flex h-screen flex-col lg:grid lg:grid-cols-10">
            <Toaster position="bottom-center" />
            {/* Left */}
            <div className="lg:col-span-4 bg-gradient-to-br from-cyan-800 to-rose-500">
                <div className="flex flex-col items-center justify-center py-2 lg:min-h-screen">
                    <div className="rounded-xl bg-gradient-to-br from-yellow-400 to-purple-600">
                        <img className="w-44 rounded-xl object-cover lg:h-96 lg:w-72" src={urlFor(collection.previewImage).url()} alt=""></img>

                    </div>
                    <div className="space-y-2 p-5 text-center">
                        <h1 className="text-4xl font-bold text-white">Aditya Apes</h1>
                        <h2 className="text-xl text-gray-300">A collection of aditya apes who live and breathe react</h2>
                    </div>
                </div>
            </div>

            {/* Right */}
            <div className="flex flex-1 flex-col p-12 lg:col-span-6">
                {/* header */}
                <header className="flex items-center justify-between">
                    <Link href={'/'}>
                        <h1 className="w-52 cursor-pointer text-xl font-extralight sm:w-80">
                            The
                            <span className='font-extrabold underline decoration-pink-600/50'> Aditya </span>
                            NFT Market Place
                        </h1>
                    </Link>
                    <button onClick={() => { address ? disconnect() : connectWithMetamask() }} className="rounded-full bg-rose-400 px-4 py-2 text-xs font-bold text-white lg:py-3 lg:text-base">{address ? 'Sign Out' : 'Sign In'}</button>
                </header>
                <hr className="my-2 border" />
                {address && (<p className='text-center text-sm text-rose-500'>You're logged in with wallet {address.substring(0, 5)}....{address.substring(address.length - 5)}</p>)}

                {/* Content */}
                <div className="mt-10 flex flex-1 flex-col items-center space-y-6 text-center lg:space-y-0">
                    <img className="w-80 object-cover pb-10 lg:h-40" src={urlFor(collection.mainImage).url()} alt=""></img>
                    <h1 className="text-3xl font-bold lg:text-5xl lg:font-extrabold">{collection.title}</h1>
                    {loading ? (
                        <p className="pt-2 text-xl text-green-500 animate-pulse">Loading Supply Count...</p>
                    ) : (
                        <p className="pt-2 text-xl text-green-500">{claimedSupply}/{totalSupply?.toString()} NFTs claimed</p>
                    )}

                </div>

                {/* Mint Button */}
                <button onClick={mintNft} disabled={loading || claimedSupply === totalSupply?.toNumber() || !address} className="h-16 w-full bg-red-600 text-white rounded-full font-bold disabled:bg-gray-400">
                    {loading ? (<>Loading</>) : claimedSupply === totalSupply?.toNumber() ? (<>SOLD OUT</>) : !address ? (<>Sign in to Mint</>) : (<span>Mint NFT({priceInEth} ETH)</span>)}
                </button>

            </div>
        </div>
    )
}

export default NFTDropPage


export const getServerSideProps: GetServerSideProps = async ({ params }) => {
    const query = `*[_type=="collection" && slug.current == $id][0]{
        _id,
        title,
        address,
        description,
        nftCollection,
        mainImage{
        asset
      },previewImage{asset},
      slug{current},
      creator->{
        _id,
        name,
        address,
        slug{
        current
      },
      },
      
      }`
    const collection = await sanityClient.fetch(query, { id: params?.id })
    if (!collection) {
        return {
            notFound: true
        }
    }
    return {
        props: {
            collection
        }
    }
}