"use client";

import React, { useState, useEffect, useRef } from "react";
import { useCanvasClient } from "../hooks/useCanvasClient";
import {
  PublicKey,
  Connection,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
} from "@solana/web3.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import * as bs58 from "bs58";

type ClusterInfo = {
  name: string;
  cluster: WalletAdapterNetwork;
  chainId: string;
  appUrl?: string;
};

const clusterList: ClusterInfo[] = [
  {
    name: "Devnet",
    cluster: WalletAdapterNetwork.Devnet,
    chainId: "solana:103",
  },
  {
    name: "Mainnet",
    cluster: WalletAdapterNetwork.Mainnet,
    chainId: "solana:101",
    appUrl: process.env.NEXT_PUBLIC_SOLANA_MAINNET_CLUSTER,
  },
];

const CanvasSolanaTransfer: React.FC = () => {
  const { isReady, client: canvasClient } = useCanvasClient();
  const [clusterInfo, setClusterInfo] = useState<ClusterInfo>(clusterList[0]);
  const [sourceAddress, setSourceAddress] = useState<string>("");
  const [targetAddress, setTargetAddress] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successfulSignedTx, setSuccessfulSignedTx] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bodyRef.current && canvasClient) {
      const resizeObserver = new ResizeObserver(() => canvasClient.resize());
      resizeObserver.observe(bodyRef.current);
      return () => resizeObserver.disconnect();
    }
  }, [canvasClient]);

  const createSendSolTransaction = async (
    cluster: WalletAdapterNetwork,
    amount: number,
    fromPubKey: PublicKey,
    toPubKey: PublicKey,
    appUrl?: string
  ) => {
    const connectionEndpoint = appUrl ?? clusterApiUrl(cluster);
    const connection = new Connection(connectionEndpoint);
    const { blockhash } = await connection.getLatestBlockhash();

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromPubKey,
        toPubkey: toPubKey,
        lamports: LAMPORTS_PER_SOL * amount,
      })
    );

    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPubKey;

    return transaction;
  };

  const createTx = async (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    connectResponse: any
  ): Promise<{ unsignedTx: string } | undefined> => {
    if (!connectResponse.untrusted.success) {
      setErrorMessage("Failed to connect wallet");
      return;
    }
    if (!targetAddress || !amount) {
      setErrorMessage("Please fill out all fields");
      return;
    }
    setSourceAddress(connectResponse.untrusted.address);
    const sourceAddressPublicKey = new PublicKey(
      connectResponse.untrusted.address
    );
    const targetAddressPublicKey = new PublicKey(targetAddress);
    const transaction = await createSendSolTransaction(
      clusterInfo.cluster,
      parseFloat(amount),
      sourceAddressPublicKey,
      targetAddressPublicKey,
      clusterInfo.appUrl
    );

    if (!transaction) {
      setErrorMessage("Failed to create send transaction");
      return;
    }

    const unsignedTx = bs58.default.encode(
      transaction.serialize({ requireAllSignatures: false })
    );

    return {
      unsignedTx,
    };
  };

  const sendTransaction = async () => {
    if (!canvasClient) return;
    setErrorMessage("");
    setIsProcessing(true);

    try {
      const response = await canvasClient.connectWalletAndSendTransaction(
        clusterInfo.chainId,
        createTx
      );

      if (!response) {
        setErrorMessage("Transaction not executed");
        return;
      }

      if (response.untrusted.success) {
        setSuccessfulSignedTx(response.untrusted.signedTx);
      } else if (response.untrusted.errorReason === "user-cancelled") {
        setErrorMessage("User cancelled transaction");
      } else {
        setErrorMessage(response.untrusted.error || "Unknown error");
      }
    } catch (error) {
      console.error("Error sending transaction:", error);
      setErrorMessage("Failed to send transaction");
    } finally {
      setIsProcessing(false);
    }
  };

  const openTransactionLink = () => {
    if (!successfulSignedTx || !canvasClient) return;
    const url = `https://solana.fm/tx/${successfulSignedTx}?cluster=${clusterInfo.cluster}`;
    canvasClient.openLink(url);
  };

  const clear = () => {
    setErrorMessage("");
    setSuccessfulSignedTx("");
    setSourceAddress("");
    setTargetAddress("");
    setAmount("");
    setClusterInfo(clusterList[0]);
  };

  if (!isReady) {
    return <p className="text-center">Loading...</p>;
  }

  return (
    <div
      ref={bodyRef}
      className="flex flex-col justify-center items-center gap-6 w-screen p-10"
    >
      {successfulSignedTx ? (
        <div className="flex flex-col justify-center items-center gap-6">
          <p className="text-2xl text-green-500">
            Transaction sent successfully
          </p>
          <a
            className="text-indigo-400 hover:underline text-indigo-300 cursor-pointer"
            onClick={openTransactionLink}
          >
            Open in Solana.fm
          </a>
          <button
            onClick={clear}
            className="bg-gray-500 hover:bg-gray-400 text-white font-bold py-2 px-4 border-b-4 border-gray-700 hover:border-gray-500 rounded"
          >
            Close
          </button>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendTransaction();
          }}
          className="flex flex-col justify-center items-center gap-6 w-full"
        >
          <h2 className="text-2xl">Send Transaction</h2>
          {sourceAddress && (
            <div className="flex items-center gap-4 w-full">
              <label className="min-w-28">Source Address</label>
              <span className="flex-1 text-gray-400">{sourceAddress}</span>
            </div>
          )}
          <div className="flex flex-col md:flex-row items-center gap-4 w-full">
            <label htmlFor="target" className="min-w-28">
              Target address
            </label>
            <input
              type="text"
              name="target"
              className="flex-1 text-gray-700 border border-gray-700 rounded-xl w-full"
              value={targetAddress}
              onChange={(e) => setTargetAddress(e.target.value)}
            />
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4 w-full">
            <label htmlFor="amount" className="min-w-28">
              Amount (SOL)
            </label>
            <input
              type="number"
              name="amount"
              className="flex-1 text-gray-700 border border-gray-700 rounded-xl w-full"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.000000001"
            />
          </div>
          {errorMessage && <p className="text-red-500">{errorMessage}</p>}
          <div className="flex flex-col md:flex-row gap-6 items-center">
            {clusterList.map((clusterItem) => (
              <button
                key={clusterItem.cluster}
                type="submit"
                className={`text-white font-bold py-2 px-4 border-b-4 rounded ${
                  clusterItem.cluster === WalletAdapterNetwork.Mainnet
                    ? "bg-amber-500 hover:bg-amber-400 border-amber-700 hover:border-amber-500"
                    : "bg-gray-500 hover:bg-gray-400 border-gray-700 hover:border-gray-500"
                }`}
                onClick={() => setClusterInfo(clusterItem)}
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : `Send (${clusterItem.name})`}
              </button>
            ))}
          </div>
        </form>
      )}
    </div>
  );
};

export default CanvasSolanaTransfer;
