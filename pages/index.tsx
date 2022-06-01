import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { ConnectButton } from "../components/connectBtn";
import { usePhantomWallet } from "../components/phantomProvider";
import styles from "../styles/Home.module.css";

const Home: NextPage = () => {
  const { address } = usePhantomWallet();

  return (
    <>
      <ConnectButton />
      <br />
      Wallet Address: {address?.toString}
    </>
  );
};

export default Home;
