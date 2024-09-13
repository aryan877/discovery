"use client";

import React, { useState, useEffect } from "react";
import {
  PublicKey,
  Connection,
  TransactionInstruction,
  SystemProgram,
  VersionedTransaction,
  TransactionMessage,
} from "@solana/web3.js";
import bs58 from "bs58";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCcw } from "lucide-react";
import useCanvasWallet from "../context/CanvasWalletProvider";
import { clusterList } from "@/lib/cluster";
import { PROGRAM_ID_STRING } from "@/lib/constants";
import Back from "../component/Back";

const PROGRAM_ID = new PublicKey(PROGRAM_ID_STRING!);

const Delegate: React.FC = () => {
  const { client } = useCanvasWallet();
  const [delegateTo, setDelegateTo] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const delegateInstruction = (
    userPDA: PublicKey,
    delegatorAuthority: PublicKey,
    delegatePubkey: PublicKey
  ): TransactionInstruction => {
    const discriminator = Buffer.from([90, 147, 75, 178, 85, 88, 4, 137]);
    const delegateToBuffer = delegatePubkey.toBuffer();

    const data = Buffer.concat([discriminator, delegateToBuffer]);

    return new TransactionInstruction({
      keys: [
        { pubkey: userPDA, isSigner: false, isWritable: true },
        { pubkey: delegatorAuthority, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_ID,
      data: data,
    });
  };

  const handleDelegate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!client?.isReady) {
      setErrorMessage("Canvas client not initialized");
      return;
    }

    try {
      new PublicKey(delegateTo);
    } catch (error) {
      setErrorMessage("Invalid public key format for delegate address.");
      return;
    }

    if (!delegateTo) {
      setErrorMessage("Please provide delegate address");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsProcessing(true);

    try {
      const devnetCluster = clusterList.find((c) => c.name === "Devnet");
      if (!devnetCluster) {
        throw new Error("Devnet cluster not found");
      }

      const response = await client.connectWalletAndSendTransaction(
        devnetCluster.chainId,
        async (connectResponse) => {
          if (!connectResponse.untrusted.success) {
            throw new Error("Failed to connect wallet");
          }

          const delegatorPubkey = new PublicKey(
            connectResponse.untrusted.address
          );
          const connection = new Connection(devnetCluster.url, "confirmed");

          const [userPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from("user"), delegatorPubkey.toBuffer()],
            PROGRAM_ID
          );

          const delegatePubkey = new PublicKey(delegateTo);

          const instruction = delegateInstruction(
            userPDA,
            delegatorPubkey,
            delegatePubkey
          );

          const { blockhash } = await connection.getLatestBlockhash();

          const messageV0 = new TransactionMessage({
            payerKey: delegatorPubkey,
            recentBlockhash: blockhash,
            instructions: [instruction],
          }).compileToV0Message();

          const transaction = new VersionedTransaction(messageV0);

          const serializedTx = transaction.serialize();
          const base58EncodedTx = bs58.encode(serializedTx);

          return {
            unsignedTx: base58EncodedTx,
            awaitCommitment: "confirmed",
          };
        }
      );

      if (response && response.untrusted.success) {
        setSuccessMessage("Delegation successful!");
        setDelegateTo("");
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error) {
      console.error("Error during delegation:", error);
      setErrorMessage(`Delegation failed: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-10">
      <Back />
      <h1 className="text-2xl font-bold mb-6 ">Delegate Voting Power</h1>

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
        <CardHeader>
          <h2 className="text-xl font-semibold ">Delegate</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleDelegate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="delegateTo" className="text-sm ">
                Delegate To (Public Key)
              </Label>
              <Input
                id="delegateTo"
                value={delegateTo}
                onChange={(e) => setDelegateTo(e.target.value)}
                placeholder="Enter public key of delegate"
                required
                className=" border-neutral-600"
              />
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-end mt-4">
          <Button
            onClick={handleDelegate}
            disabled={isProcessing || !delegateTo}
            variant="outline"
            className="w-full "
          >
            {isProcessing ? (
              <>
                <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                Delegating...
              </>
            ) : (
              "Delegate"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Delegate;
