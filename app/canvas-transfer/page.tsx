"use client";

import React, { useState, useEffect, useRef } from "react";
import useCanvasWallet from "../context/CanvasWalletProvider";
import Link from "next/link";
import {
  PublicKey,
  Connection,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
} from "@solana/web3.js";

import * as bs58 from "bs58";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ClusterInfo, clusterList } from "@/lib/cluster";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import Back from "../component/Back";

const CanvasSolanaTransfer: React.FC = () => {
  const { client: canvasClient, user } = useCanvasWallet();
  const [clusterInfo, setClusterInfo] = useState<ClusterInfo>(clusterList[0]);
  const [sourceAddress, setSourceAddress] = useState<string>("");
  const [targetAddress, setTargetAddress] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
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

  const sendTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canvasClient) return;
    setErrorMessage("");
    setSuccessMessage("");
    setIsProcessing(true);

    try {
      const response = await canvasClient.connectWalletAndSendTransaction(
        clusterInfo.chainId,
        createTx
      );

      if (!response) {
        throw new Error("Transaction not executed");
      }

      if (response.untrusted.success) {
        setSuccessMessage("Transaction sent successfully");
        setSourceAddress("");
        setTargetAddress("");
        setAmount("");
      } else if (response.untrusted.errorReason === "user-cancelled") {
        throw new Error("User cancelled transaction");
      } else {
        throw new Error(response.untrusted.error || "Unknown error");
      }
    } catch (error) {
      console.error("Error sending transaction:", error);
      setErrorMessage(`Failed to send transaction: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-10">
      <Back />
      <h1 className="text-2xl font-bold mb-6">Solana Transfer</h1>

      {errorMessage && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert variant="default" className="mb-6">
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      <Card className="bg-neutral-800 border-neutral-600">
        <CardHeader className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Send Transaction</h2>
            {user && (
              <Link href={`/profile/${user.username}`} passHref>
                <Button variant="outline" className=" border-neutral-600">
                  View Profile
                </Button>
              </Link>
            )}
          </div>
          <div className="flex justify-center">
            {clusterList.map((clusterItem) => (
              <Button
                key={clusterItem.cluster}
                onClick={() => setClusterInfo(clusterItem)}
                variant={
                  clusterInfo.cluster === clusterItem.cluster
                    ? "default"
                    : "outline"
                }
                className="mx-1  border-neutral-600"
              >
                {clusterItem.name}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={sendTransaction} className="space-y-4">
            {sourceAddress && (
              <div className="space-y-2">
                <Label className="text-sm ">Source Address</Label>
                <Input
                  type="text"
                  value={sourceAddress}
                  readOnly
                  className=" border-neutral-600 bg-neutral-700"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="target" className="text-sm ">
                Target Address
              </Label>
              <Input
                id="target"
                type="text"
                value={targetAddress}
                onChange={(e) => setTargetAddress(e.target.value)}
                placeholder="Enter target address"
                required
                className=" border-neutral-600"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm ">
                Amount (SOL)
              </Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                step="0.000000001"
                required
                className=" border-neutral-600"
              />
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-end mt-4">
          <Button
            onClick={sendTransaction}
            disabled={isProcessing || !targetAddress || !amount}
            variant="outline"
            className={` border-neutral-600 ${
              clusterInfo.cluster === "mainnet-beta"
                ? "bg-red-600 hover:bg-red-700 border-none"
                : ""
            }`}
          >
            {isProcessing ? "Processing..." : `Send (${clusterInfo.name})`}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CanvasSolanaTransfer;
