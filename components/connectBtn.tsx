import { usePhantomWallet } from "./phantomProvider";
export const ConnectButton = () => {
  const { connect } = usePhantomWallet();

  return <button onClick={connect}>Connect Wallet</button>;
};
