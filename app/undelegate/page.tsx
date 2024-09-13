"use client";

import React, { useState } from "react";
import {
  PublicKey,
  Connection,
  TransactionInstruction,
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
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCcw } from "lucide-react";
import useCanvasWallet from "../context/CanvasWalletProvider";
import { clusterList } from "@/lib/cluster";
import { PROGRAM_ID_STRING } from "@/lib/constants";
import Back from "../component/Back";

const PROGRAM_ID = new PublicKey(PROGRAM_ID_STRING!);

const Undelegate: React.FC = () => {
  const { client } = useCanvasWallet();
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const undelegateInstruction = (
    userPDA: PublicKey,
    userAuthority: PublicKey
  ): TransactionInstruction => {
    const discriminator = Buffer.from([131, 148, 180, 198, 91, 104, 42, 238]);

    const data = discriminator;

    return new TransactionInstruction({
      keys: [
        { pubkey: userPDA, isSigner: false, isWritable: true },
        { pubkey: userAuthority, isSigner: true, isWritable: true },
      ],
      programId: PROGRAM_ID,
      data: data,
    });
  };

  const handleUndelegate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!client?.isReady) {
      setErrorMessage("Canvas client not initialized");
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

          const userAuthority = new PublicKey(
            connectResponse.untrusted.address
          );
          const connection = new Connection(devnetCluster.url, "confirmed");

          const [userPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from("user"), userAuthority.toBuffer()],
            PROGRAM_ID
          );

          const instruction = undelegateInstruction(userPDA, userAuthority);

          const { blockhash } = await connection.getLatestBlockhash();

          const messageV0 = new TransactionMessage({
            payerKey: userAuthority,
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
        setSuccessMessage("Undelegation successful!");
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error) {
      console.error("Error during undelegation:", error);
      setErrorMessage(`Undelegation failed: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-10">
      <Back />
      <h1 className="text-2xl font-bold mb-6 ">Undelegate Voting Power</h1>

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
          <h2 className="text-xl font-semibold ">Undelegate</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUndelegate} className="space-y-4">
            <div className="space-y-2">
              <p>Click the button below to undelegate your voting power.</p>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-end mt-4">
          <Button
            onClick={handleUndelegate}
            disabled={isProcessing}
            variant="outline"
            className="w-full "
          >
            {isProcessing ? (
              <>
                <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                Undelegating...
              </>
            ) : (
              "Undelegate"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Undelegate;
