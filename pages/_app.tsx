import "../styles/globals.css";
import type { AppProps } from "next/app";
import { PhantomWalletProvider } from "../components/phantomProvider";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <PhantomWalletProvider network="mainnet-beta">
      <Component {...pageProps} />
    </PhantomWalletProvider>
  );
}

export default MyApp;
