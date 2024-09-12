"use client";

import React, { useState, useEffect, useRef } from "react";
import useCanvasWallet from "../CanvasWalletProvider";
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

const CanvasSolanaTransfer: React.FC = () => {
  const { client: canvasClient, user } = useCanvasWallet();
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

  return (
    <div
      ref={bodyRef}
      className="flex flex-col justify-center items-center gap-6 w-screen p-10"
    >
      <Card className="w-full max-w-2xl">
        <CardHeader className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Solana Transfer</h1>
            {user && (
              <Link href={`/profile/${user.username}`} passHref>
                <Button variant="outline">View Profile</Button>
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
                    : "secondary"
                }
                className="mx-1"
              >
                {clusterItem.name}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {successfulSignedTx ? (
            <div className="flex flex-col justify-center items-center gap-6">
              <Alert variant="default">
                <AlertDescription>
                  Transaction sent successfully
                </AlertDescription>
              </Alert>
              <Button variant="link" onClick={openTransactionLink}>
                Open in Solana.fm
              </Button>
              <Button onClick={clear} variant="secondary">
                Close
              </Button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendTransaction();
              }}
              className="space-y-6"
            >
              <h2 className="text-2xl text-center">Send Transaction</h2>
              {sourceAddress && (
                <div className="flex items-center gap-4">
                  <Label className="min-w-28">Source Address</Label>
                  <span className="flex-1 text-gray-400 truncate">
                    {sourceAddress}
                  </span>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="target">Target address</Label>
                <Input
                  type="text"
                  id="target"
                  value={targetAddress}
                  onChange={(e) => setTargetAddress(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (SOL)</Label>
                <Input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  step="0.000000001"
                />
              </div>
              {errorMessage && (
                <Alert variant="destructive">
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            type="submit"
            onClick={sendTransaction}
            disabled={isProcessing}
            variant={
              clusterInfo.cluster === "mainnet-beta" ? "destructive" : "default"
            }
          >
            {isProcessing ? "Processing..." : `Send (${clusterInfo.name})`}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CanvasSolanaTransfer;
