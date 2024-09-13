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
import { RefreshCcw } from "lucide-react";
import useCanvasWallet from "../context/CanvasWalletProvider";
import { clusterList } from "@/lib/cluster";
import { PROGRAM_ID_STRING } from "@/lib/constants";
import Back from "../component/Back";
import RichTextEditor from "../component/RichTextEditor";

const PROGRAM_ID = new PublicKey(PROGRAM_ID_STRING!);

const CreateProposal: React.FC = () => {
  const { client } = useCanvasWallet();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [votingPeriodHours, setVotingPeriodHours] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => client?.resize());
    resizeObserver.observe(document.body);
    return () => resizeObserver.disconnect();
  }, [client]);

  const createProposalInstruction = (
    votingStatePDA: PublicKey,
    proposalPDA: PublicKey,
    proposerPubkey: PublicKey,
    title: string,
    description: string,
    votingPeriodSeconds: number
  ): TransactionInstruction => {
    const discriminator = Buffer.from([132, 116, 68, 174, 216, 160, 198, 22]);
    const titleBuffer = Buffer.from(title);
    const titleLength = Buffer.alloc(4);
    titleLength.writeUInt32LE(titleBuffer.length);
    const descriptionBuffer = Buffer.from(description);
    const descriptionLength = Buffer.alloc(4);
    descriptionLength.writeUInt32LE(descriptionBuffer.length);
    const votingPeriodBuffer = new BN(votingPeriodSeconds).toArrayLike(
      Buffer,
      "le",
      8
    );

    const data = Buffer.concat([
      discriminator,
      titleLength,
      titleBuffer,
      descriptionLength,
      descriptionBuffer,
      votingPeriodBuffer,
    ]);

    return new TransactionInstruction({
      keys: [
        { pubkey: votingStatePDA, isSigner: false, isWritable: true },
        { pubkey: proposalPDA, isSigner: false, isWritable: true },
        { pubkey: proposerPubkey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_ID,
      data: data,
    });
  };

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!client?.isReady) {
      setErrorMessage("Canvas client not initialized");
      return;
    }

    if (!title || !description || !votingPeriodHours) {
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

          const proposerPubkey = new PublicKey(
            connectResponse.untrusted.address
          );
          const connection = new Connection(devnetCluster.url, "confirmed");

          const [votingStatePDA] = PublicKey.findProgramAddressSync(
            [Buffer.from("voting_state")],
            PROGRAM_ID
          );

          const votingStateAccount = await connection.getAccountInfo(
            votingStatePDA
          );
          if (!votingStateAccount) {
            throw new Error("Voting state account not found");
          }
          const proposalCount = new BN(
            votingStateAccount.data.slice(8, 16),
            "le"
          );

          const [proposalPDA] = PublicKey.findProgramAddressSync(
            [
              Buffer.from("proposal"),
              proposalCount.toArrayLike(Buffer, "le", 8),
            ],
            PROGRAM_ID
          );

          const votingPeriodSeconds = Math.floor(
            parseFloat(votingPeriodHours) * 3600
          );

          const instruction = createProposalInstruction(
            votingStatePDA,
            proposalPDA,
            proposerPubkey,
            title,
            description,
            votingPeriodSeconds
          );

          const { blockhash } = await connection.getLatestBlockhash();

          const messageV0 = new TransactionMessage({
            payerKey: proposerPubkey,
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
        setTitle("");
        setDescription("");
        setVotingPeriodHours("");
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
    <div className="w-full max-w-2xl mx-auto mt-10">
      <Back />
      <h1 className="text-2xl font-bold mb-6 ">Create Proposal</h1>

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
          <h2 className="text-xl font-semibold ">New Proposal</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateProposal} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm ">
                Proposal Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter proposal title"
                required
                className=" border-neutral-600"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm ">
                Proposal Description
              </Label>
              <RichTextEditor
                value={description}
                onChange={setDescription}
                disabled={isProcessing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="votingPeriodHours" className="text-sm ">
                Voting Period (hours)
              </Label>
              <Input
                id="votingPeriodHours"
                type="number"
                step="0.1"
                min="0"
                value={votingPeriodHours}
                onChange={(e) => setVotingPeriodHours(e.target.value)}
                placeholder="Enter voting period"
                required
                className=" border-neutral-600"
              />
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-end mt-4">
          <Button
            onClick={handleCreateProposal}
            disabled={
              isProcessing || !title || !description || !votingPeriodHours
            }
            variant="outline"
            className="w-full "
          >
            {isProcessing ? (
              <>
                <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Proposal"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CreateProposal;
