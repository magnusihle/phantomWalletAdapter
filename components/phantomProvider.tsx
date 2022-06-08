import { PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import nacl from "tweetnacl";

type PhantomWalletProviderProps = {
  children: ReactNode;
  network: Network;
};

export type PhantomWalletContextType = {
  address: PublicKey | null;
  connect: () => void;
};

const decryptPayload = (
  data: string,
  nonce: string,
  sharedSecret?: Uint8Array
) => {
  if (!sharedSecret) throw new Error("missing shared secret");

  const decryptedData = nacl.box.open.after(
    bs58.decode(data),
    bs58.decode(nonce),
    sharedSecret
  );
  if (!decryptedData) {
    throw new Error("Unable to decrypt data");
  }
  return JSON.parse(Buffer.from(decryptedData).toString("utf8"));
};

const encryptPayload = (payload: any, sharedSecret?: Uint8Array) => {
  if (!sharedSecret) throw new Error("missing shared secret");

  const nonce = nacl.randomBytes(24);

  const encryptedPayload = nacl.box.after(
    Buffer.from(JSON.stringify(payload)),
    nonce,
    sharedSecret
  );

  return [nonce, encryptedPayload];
};

const PhantomWalletContext = createContext<PhantomWalletContextType | null>(
  null
);

type Network = "mainnet-beta" | "testnet" | "devnet";

export const PhantomWalletProvider = ({
  children,
}: PhantomWalletProviderProps): JSX.Element => {
  const [address, setAddress] = useState<PublicKey | null>(null);
  const [session, setSession] = useState<string>();
  const [sharedSecret, setSharedSecret] = useState<Uint8Array>();
  const [dappKeyPair] = useState(nacl.box.keyPair());
  const [deepLink, setDeepLink] = useState<string>();
  const queryString =
    typeof window !== "undefined" ? window.location.search : "";
  const urlParams = new URLSearchParams(queryString);

  useEffect(() => {
    if (
      urlParams.get("phantom_encryption_public_key") ||
      urlParams.get("errorCode")
    ) {
      setDeepLink(window.location.href);
    }
  }, [urlParams]);

  const buildUrl = (path: string, params: URLSearchParams) =>
    `https://phantom.app/ul/v1/${path}?${params.toString()}`;

  const connect = async () => {
    const params = new URLSearchParams({
      dapp_encryption_public_key: bs58.encode(dappKeyPair.publicKey),
      cluster: "mainnet-beta",
      app_url: deepLink || window.location.href,
      redirect_link: deepLink || window.location.href,
    });

    const url = buildUrl("connect", params);
    document.location = url;
  };

  useEffect(() => {
    if (!deepLink) return;

    const url = new URL(deepLink);
    const params = url.searchParams;

    if (params.get("errorCode")) {
      return;
    }

    if (params.get("phantom_encryption_public_key")) {
      const sharedSecretDapp = nacl.box.before(
        bs58.decode(params.get("phantom_encryption_public_key")!),
        dappKeyPair.secretKey
      );

      const connectData = decryptPayload(
        params.get("data")!,
        params.get("nonce")!,
        sharedSecretDapp
      );

      setSharedSecret(sharedSecretDapp);
      setSession(connectData.session);
      setAddress(new PublicKey(connectData.public_key));

      console.log(session);
    }
  }, [deepLink, dappKeyPair.secretKey]);

  return (
    <PhantomWalletContext.Provider
      value={{
        address,
        connect,
      }}
    >
      <div>{children}</div>
    </PhantomWalletContext.Provider>
  );
};

export function usePhantomWallet(): PhantomWalletContextType {
  const context = useContext(PhantomWalletContext);
  if (!context) {
    throw new Error(
      "usePhantomWallet must be used within a PhantomWalletProvider"
    );
  }
  return context;
}
