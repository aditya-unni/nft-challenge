import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { ChainId, ThirdwebProvider } from "@thirdweb-dev/react";
import { SUPPORTED_CHAIN_IDS } from '@thirdweb-dev/sdk';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThirdwebProvider  desiredChainId={ChainId.Goerli} chainRpc={{ [ChainId.Goerli]: "https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161" }}>
      <Component {...pageProps} />
    </ThirdwebProvider>)
}

export default MyApp
