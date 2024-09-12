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
import BN from "bn.js";
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
import { Textarea } from "@/components/ui/textarea";
import useCanvasWallet from "../CanvasWalletProvider";
import { clusterList } from "@/lib/cluster";
import { PROGRAM_ID } from "@/lib/constants";

const PROGRAM_ID_PK = new PublicKey(PROGRAM_ID!);

const CreateProposal: React.FC = () => {
  const { client } = useCanvasWallet();
  const [description, setDescription] = useState("");
  const [votingPeriod, setVotingPeriod] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => client?.resize());
    resizeObserver.observe(document.body);
    return () => resizeObserver.disconnect();
  }, [client]);

  const createProposalInstruction = (
    governancePDA: PublicKey,
    proposalPDA: PublicKey,
    userPubkey: PublicKey,
    description: string,
    votingPeriod: number
  ): TransactionInstruction => {
    const discriminator = Buffer.from([132, 116, 68, 174, 216, 160, 198, 22]);
    const descriptionBuffer = Buffer.from(description);
    const descriptionLength = Buffer.alloc(4);
    descriptionLength.writeUInt32LE(descriptionBuffer.length);
    const votingPeriodBuffer = new BN(votingPeriod).toArrayLike(
      Buffer,
      "le",
      8
    );

    const data = Buffer.concat([
      discriminator,
      descriptionLength,
      descriptionBuffer,
      votingPeriodBuffer,
    ]);

    return new TransactionInstruction({
      keys: [
        { pubkey: governancePDA, isSigner: false, isWritable: true },
        { pubkey: proposalPDA, isSigner: false, isWritable: true },
        { pubkey: userPubkey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_ID_PK,
      data: data,
    });
  };

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!client?.isReady) {
      setErrorMessage("Canvas client not initialized");
      return;
    }

    if (!description || !votingPeriod) {
      setErrorMessage("Please fill in all fields");
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

          const userPubkey = new PublicKey(connectResponse.untrusted.address);
          const connection = new Connection(devnetCluster.url, "confirmed");

          const [governancePDA] = PublicKey.findProgramAddressSync(
            [Buffer.from("governance")],
            PROGRAM_ID_PK
          );

          const governanceAccount = await connection.getAccountInfo(
            governancePDA
          );
          if (!governanceAccount) {
            throw new Error("Governance account not found");
          }
          const proposalCount = new BN(
            governanceAccount.data.slice(40, 48),
            "le"
          );

          const [proposalPDA] = PublicKey.findProgramAddressSync(
            [
              Buffer.from("proposal"),
              proposalCount.toArrayLike(Buffer, "le", 8),
            ],
            PROGRAM_ID_PK
          );

          const instruction = createProposalInstruction(
            governancePDA,
            proposalPDA,
            userPubkey,
            description,
            parseInt(votingPeriod)
          );

          const { blockhash } = await connection.getLatestBlockhash();

          const messageV0 = new TransactionMessage({
            payerKey: userPubkey,
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
        console.log("Transaction signature:", response.untrusted.signedTx);
        setSuccessMessage("Proposal created successfully!");
        setDescription("");
        setVotingPeriod("");
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error) {
      console.error("Error creating proposal:", error);
      setErrorMessage(`Failed to create proposal: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-10">
      <CardHeader>
        <h1 className="text-2xl font-bold">Create Proposal</h1>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateProposal} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="description">Proposal Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter proposal description"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="votingPeriod">Voting Period (in seconds)</Label>
            <Input
              id="votingPeriod"
              type="number"
              value={votingPeriod}
              onChange={(e) => setVotingPeriod(e.target.value)}
              placeholder="Enter voting period"
              required
            />
          </div>
          {errorMessage && (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          {successMessage && (
            <Alert variant="default">
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
      <CardFooter>
        <Button
          type="submit"
          onClick={handleCreateProposal}
          disabled={isProcessing || !description || !votingPeriod}
        >
          {isProcessing ? "Creating..." : "Create Proposal"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CreateProposal;
