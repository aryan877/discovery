import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  PublicKey,
  Connection,
  TransactionInstruction,
  VersionedTransaction,
  TransactionMessage,
  SystemProgram,
} from "@solana/web3.js";
import bs58 from "bs58";
import useCanvasWallet from "../context/CanvasWalletProvider";
import { clusterList } from "@/lib/cluster";
import { PROGRAM_ID_STRING } from "@/lib/constants";
import { Proposal } from "@/lib/proposalUtils";

const PROGRAM_ID = new PublicKey(PROGRAM_ID_STRING);

interface VoteButtonsProps {
  proposal: Proposal;
  onVoteSuccess: () => void;
}

const VoteButtons: React.FC<VoteButtonsProps> = ({
  proposal,
  onVoteSuccess,
}) => {
  const { client, address, initializeWallet } = useCanvasWallet();
  const [isVoting, setIsVoting] = useState<boolean>(false);
  const [isFinalizing, setIsFinalizing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userVote, setUserVote] = useState<"Yes" | "No" | null>(null);
  const [isCheckingVote, setIsCheckingVote] = useState<boolean>(false);

  const getConnection = useCallback(() => {
    const devnetCluster = clusterList.find((c) => c.name === "Devnet");
    if (!devnetCluster) throw new Error("Devnet cluster not found");
    return new Connection(devnetCluster.url, "confirmed");
  }, []);

  const checkUserVote = useCallback(async () => {
    if (!address) return;

    setIsCheckingVote(true);
    try {
      const connection = getConnection();
      const [userVotePDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("user_vote"),
          new PublicKey(address).toBuffer(),
          new PublicKey(proposal.publicKey).toBuffer(),
        ],
        PROGRAM_ID
      );

      const accountInfo = await connection.getAccountInfo(userVotePDA);
      if (accountInfo && accountInfo.data.length > 0) {
        const voteType = accountInfo.data[1];
        setUserVote(voteType === 0 ? "Yes" : "No");
      } else {
        setUserVote(null);
      }
    } catch (error) {
      console.error("Error checking user vote:", error);
    } finally {
      setIsCheckingVote(false);
    }
  }, [address, proposal.publicKey, getConnection]);

  useEffect(() => {
    if (address) {
      checkUserVote();
    }
  }, [address, checkUserVote]);

  const vote = async (voteType: "Yes" | "No"): Promise<void> => {
    if (!client?.isReady || !address) {
      console.error("Canvas client or wallet not initialized");
      return;
    }

    setIsVoting(true);
    setError(null);

    try {
      const connection = getConnection();

      const [userVotePDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("user_vote"),
          new PublicKey(address).toBuffer(),
          new PublicKey(proposal.publicKey).toBuffer(),
        ],
        PROGRAM_ID
      );

      const [userPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("user"), new PublicKey(address).toBuffer()],
        PROGRAM_ID
      );

      const proposalPDA = new PublicKey(proposal.publicKey);

      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: proposalPDA, isSigner: false, isWritable: true },
          { pubkey: userVotePDA, isSigner: false, isWritable: true },
          { pubkey: userPDA, isSigner: false, isWritable: true },
          { pubkey: new PublicKey(address), isSigner: true, isWritable: true },
          {
            pubkey: SystemProgram.programId,
            isSigner: false,
            isWritable: false,
          },
        ],
        programId: PROGRAM_ID,
        data: Buffer.from([
          227,
          110,
          155,
          23,
          136,
          126,
          172,
          25,
          voteType === "Yes" ? 0 : 1,
        ]),
      });

      const { blockhash } = await connection.getLatestBlockhash();

      const messageV0 = new TransactionMessage({
        payerKey: new PublicKey(address),
        recentBlockhash: blockhash,
        instructions: [instruction],
      }).compileToV0Message();

      const transaction = new VersionedTransaction(messageV0);

      const serializedTx = transaction.serialize();
      const base58EncodedTx = bs58.encode(serializedTx);

      const response = await client.signAndSendTransaction({
        unsignedTx: base58EncodedTx,
        awaitCommitment: "confirmed",
        chainId: clusterList.find((c) => c.name === "Devnet")!.chainId,
      });

      if (response && response.untrusted.success) {
        console.log("Vote transaction signature:", response.untrusted.signedTx);
        setUserVote(voteType);
        onVoteSuccess();
      } else {
        throw new Error("Vote transaction failed");
      }
    } catch (error) {
      console.error("Error voting:", error);
      setError("Failed to submit vote. Please try again.");
    } finally {
      setIsVoting(false);
    }
  };

  const finalizeProposal = async () => {
    if (!client?.isReady || !address) {
      console.error("Canvas client or wallet not initialized");
      return;
    }

    setIsFinalizing(true);
    setError(null);

    try {
      const connection = getConnection();
      const proposalPDA = new PublicKey(proposal.publicKey);

      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: proposalPDA, isSigner: false, isWritable: true },
          { pubkey: new PublicKey(address), isSigner: true, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: Buffer.from([23, 68, 51, 167, 109, 173, 187, 164]),
      });

      const { blockhash } = await connection.getLatestBlockhash();

      const messageV0 = new TransactionMessage({
        payerKey: new PublicKey(address),
        recentBlockhash: blockhash,
        instructions: [instruction],
      }).compileToV0Message();

      const transaction = new VersionedTransaction(messageV0);

      const serializedTx = transaction.serialize();
      const base58EncodedTx = bs58.encode(serializedTx);

      const response = await client.signAndSendTransaction({
        unsignedTx: base58EncodedTx,
        awaitCommitment: "confirmed",
        chainId: clusterList.find((c) => c.name === "Devnet")!.chainId,
      });

      if (response && response.untrusted.success) {
        console.log(
          "Finalize transaction signature:",
          response.untrusted.signedTx
        );
        onVoteSuccess();
      } else {
        throw new Error("Finalize transaction failed");
      }
    } catch (error) {
      console.error("Error finalizing proposal:", error);
      setError("Failed to finalize proposal. Please try again.");
    } finally {
      setIsFinalizing(false);
    }
  };

  const isActive = (): boolean => {
    const now = BigInt(Math.floor(Date.now() / 1000));
    return (
      proposal.account.status.active !== undefined &&
      now >= proposal.account.startTime &&
      now < proposal.account.endTime
    );
  };

  const hasEnded = (): boolean => {
    const now = BigInt(Math.floor(Date.now() / 1000));
    return now >= proposal.account.endTime;
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-red-500 text-center p-2 bg-red-100 rounded-md">
          {error}
        </div>
      )}
      {!address ? (
        <Button
          onClick={initializeWallet}
          variant="outline"
          className="rounded-md w-full"
        >
          Connect Wallet
        </Button>
      ) : isCheckingVote ? (
        <p className="text-center">Checking your vote...</p>
      ) : userVote ? (
        <div className="text-center p-2 rounded-md">
          You have voted: <strong>{userVote}</strong>
        </div>
      ) : isActive() ? (
        <div className="flex justify-between space-x-4">
          <Button
            onClick={() => vote("Yes")}
            disabled={isVoting}
            variant="outline"
            className="rounded-md w-full"
          >
            {isVoting ? "Voting..." : "Yes, proceed"}
          </Button>
          <Button
            onClick={() => vote("No")}
            disabled={isVoting}
            variant="outline"
            className="rounded-md w-full"
          >
            {isVoting ? "Voting..." : "Do not proceed"}
          </Button>
        </div>
      ) : hasEnded() && proposal.account.status.active !== undefined ? (
        <Button
          onClick={finalizeProposal}
          disabled={isFinalizing}
          variant="outline"
          className="rounded-md w-full"
        >
          {isFinalizing ? "Finalizing..." : "Finalize Proposal"}
        </Button>
      ) : (
        <p className="text-sm text-gray-500 text-center">
          Voting is not active for this proposal.
        </p>
      )}
    </div>
  );
};

export default VoteButtons;
