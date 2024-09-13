"use client";

import React, {
  useState,
  createContext,
  useEffect,
  useContext,
  useCallback,
} from "react";
import { CanvasClient, CanvasInterface } from "@dscvr-one/canvas-client-sdk";
import { registerCanvasWallet } from "@dscvr-one/canvas-wallet-adapter";
import {
  Connection,
  PublicKey,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import bs58 from "bs58";
import { clusterList } from "@/lib/cluster";

interface CanvasWalletState {
  client: CanvasClient | null;
  address: string | null;
  icon: string | null;
  user: CanvasInterface.Lifecycle.User | undefined;
  content: CanvasInterface.Lifecycle.Content | undefined;
  balance: number | null;
}

interface CanvasWalletContextValue extends CanvasWalletState {
  isIframe: boolean;
  initializeWallet: () => Promise<void>;
  disconnectWallet: () => void;
  executeTransaction: (tx: Transaction) => Promise<any | null>;
  fetchBalance: () => Promise<void>;
}

const CanvasWalletContext = createContext<CanvasWalletContextValue | null>(
  null
);

const initialState: CanvasWalletState = {
  client: null,
  address: null,
  icon: null,
  user: undefined,
  content: undefined,
  balance: null,
};

export const CanvasWalletProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<CanvasWalletState>(initialState);
  const [isIframe, setIsIframe] = useState(false);

  const checkIframe = useCallback(() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  }, []);

  useEffect(() => {
    const iframeStatus = checkIframe();
    setIsIframe(iframeStatus);

    if (iframeStatus) {
      const newClient = new CanvasClient();
      registerCanvasWallet(newClient);
      setState((prev) => ({ ...prev, client: newClient }));
      console.log("Canvas client initialized in iframe");
    }
  }, [checkIframe]);

  const initializeWallet = async () => {
    if (!state.client) {
      console.error("Canvas client not initialized");
      return;
    }

    try {
      const info = await state.client.ready();
      if (info?.untrusted) {
        setState((prev) => ({
          ...prev,
          user: info.untrusted.user,
          content: info.untrusted.content,
        }));
      }

      const response = await state.client.connectWallet(clusterList[0].chainId);

      if (
        response?.untrusted &&
        "success" in response.untrusted &&
        response.untrusted.success
      ) {
        setState((prev) => ({
          ...prev,
          // @ts-ignore
          address: response.untrusted.address,
          // @ts-ignore
          icon: response.untrusted.walletIcon,
        }));
        console.log("Wallet initialized:", response.untrusted.address);
        fetchBalance();
      } else {
        console.error("Wallet initialization failed");
      }
    } catch (error) {
      console.error("Error during wallet initialization:", error);
    }
  };

  const disconnectWallet = () => {
    setState((prev) => ({
      ...initialState,
      client: prev.client,
    }));
    console.log("Wallet disconnected");
  };

  const executeTransaction = async (transaction: Transaction) => {
    if (!state.client || !state.address) {
      console.error("Client or wallet address unavailable");
      return null;
    }

    try {
      const connection = new Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.devnet.solana.com/",
        "confirmed"
      );
      const { blockhash } = await connection.getLatestBlockhash({
        commitment: "finalized",
      });

      transaction.recentBlockhash = blockhash;
      transaction.feePayer = new PublicKey(state.address);

      const serializedTx = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });
      const base58Tx = bs58.encode(serializedTx);

      const result = await state.client.signAndSendTransaction({
        unsignedTx: base58Tx,
        awaitCommitment: "confirmed",
        chainId: clusterList[0].chainId,
      });

      if (result?.untrusted?.success) {
        console.log("Transaction executed successfully:", result);

        fetchBalance();
        return result;
      } else {
        console.error("Transaction execution failed");
      }
    } catch (error) {
      console.error("Error executing transaction:", error);
    }
    return null;
  };

  const fetchBalance = async () => {
    if (!state.address) {
      console.error("Wallet address unavailable");
      return;
    }

    try {
      const connection = new Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.devnet.solana.com/",
        "confirmed"
      );
      const publicKey = new PublicKey(state.address);
      const balanceInLamports = await connection.getBalance(publicKey);
      const balanceInSOL = balanceInLamports / LAMPORTS_PER_SOL;

      setState((prev) => ({
        ...prev,
        balance: balanceInSOL,
      }));
      console.log("Wallet balance updated:", balanceInSOL);
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  const contextValue: CanvasWalletContextValue = {
    ...state,
    isIframe,
    initializeWallet,
    disconnectWallet,
    executeTransaction,
    fetchBalance,
  };

  return (
    <CanvasWalletContext.Provider value={contextValue}>
      {children}
    </CanvasWalletContext.Provider>
  );
};

export const useCanvasWallet = () => {
  const context = useContext(CanvasWalletContext);
  if (!context) {
    throw new Error(
      "useCanvasWallet must be used within a CanvasWalletProvider"
    );
  }
  return context;
};

export default useCanvasWallet;
