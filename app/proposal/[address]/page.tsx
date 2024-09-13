"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Connection, PublicKey } from "@solana/web3.js";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import advancedFormat from "dayjs/plugin/advancedFormat";
import duration from "dayjs/plugin/duration";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ReactMarkdown from "react-markdown";
import { clusterList } from "@/lib/cluster";
import {
  deserializeProposal,
  Proposal,
  ProposalStatus,
} from "@/lib/proposalUtils";
import { PROGRAM_ID_STRING } from "@/lib/constants";
import useCanvasWallet from "@/app/context/CanvasWalletProvider";
import Back from "@/app/component/Back";
import VoteButtons from "@/app/component/VoteButtons";

dayjs.extend(relativeTime);
dayjs.extend(advancedFormat);
dayjs.extend(duration);

const getDevnetConnection = () => {
  const devnetCluster = clusterList.find((c) => c.name === "Devnet");
  if (!devnetCluster) throw new Error("Devnet cluster not found");
  return new Connection(devnetCluster.url, "confirmed");
};

const fetchProposal = async (proposalAddress: string): Promise<Proposal> => {
  const connection = getDevnetConnection();
  const accountInfo = await connection.getAccountInfo(
    new PublicKey(proposalAddress)
  );

  if (!accountInfo) {
    throw new Error("Proposal not found");
  }

  const parsedProposal = deserializeProposal(proposalAddress, accountInfo.data);
  if (!parsedProposal) {
    throw new Error("Failed to parse proposal data");
  }

  return parsedProposal;
};

const ProposalDetailPage: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(dayjs());
  const pathname = usePathname();
  const proposalAddress = pathname?.split("/").pop() || "";
  const { address, initializeWallet } = useCanvasWallet();
  const queryClient = useQueryClient();

  const {
    data: proposal,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["proposal", proposalAddress],
    queryFn: () => fetchProposal(proposalAddress),
    enabled: !!proposalAddress,
    refetchInterval: 30000,
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(dayjs()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getStatus = useCallback(
    (status: ProposalStatus, startTime: number, endTime: number) => {
      const now = currentTime.unix();
      if (status.active && now >= startTime && now < endTime) {
        return <Badge>Active</Badge>;
      }
      if (status.passed) return <Badge className="bg-green-500">Passed</Badge>;
      if (status.rejected)
        return <Badge className="bg-red-500">Rejected</Badge>;
      if (now < startTime)
        return <Badge className="bg-yellow-500">Upcoming</Badge>;
      if (now >= endTime) return <Badge className="bg-gray-500">Ended</Badge>;
      return <Badge>Unknown</Badge>;
    },
    [currentTime]
  );

  const getTimeRemaining = useCallback(
    (endTime: number) => {
      const end = dayjs.unix(endTime);
      const diff = end.diff(currentTime);
      if (diff <= 0) return "Ended";

      const duration = dayjs.duration(diff);
      return `${duration.days()}d ${duration.hours()}h ${duration.minutes()}m ${duration.seconds()}s`;
    },
    [currentTime]
  );

  const calculateProgress = useCallback((yesVotes: bigint, noVotes: bigint) => {
    const total = Number(yesVotes) + Number(noVotes);
    return total === 0 ? 0 : (Number(yesVotes) / total) * 100;
  }, []);

  const handleVoteSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["proposal", proposalAddress] });
  }, [queryClient, proposalAddress]);

  if (isLoading) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  if (error || !proposal) {
    return (
      <Alert variant="destructive" className="mt-10 max-w-2xl mx-auto">
        <AlertDescription>
          {error instanceof Error ? error.message : "Failed to load proposal"}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-neutral-800">
      <Back />
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold ">{proposal.account.title}</h1>
          {getStatus(
            proposal.account.status,
            proposal.account.startTime,
            proposal.account.endTime
          )}
        </div>
        <div className="flex items-center space-x-2 mb-4">
          <Avatar className="w-8 h-8">
            <AvatarFallback>
              {proposal.account.creator.toBase58().slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-gray-400">
            Created by: {proposal.account.creator.toBase58().slice(0, 4)}...
            {proposal.account.creator.toBase58().slice(-4)}
          </span>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Description</h2>
        <ReactMarkdown className="prose prose-invert max-w-none">
          {proposal.account.description}
        </ReactMarkdown>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Proposal Details</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Start Date:</span>
            <span>
              {dayjs
                .unix(proposal.account.startTime)
                .format("MMM D, YYYY h:mm A")}
            </span>
          </div>
          <div className="flex justify-between">
            <span>End Date:</span>
            <span>
              {dayjs
                .unix(proposal.account.endTime)
                .format("MMM D, YYYY h:mm A")}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Time Remaining:</span>
            <span>{getTimeRemaining(proposal.account.endTime)}</span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Voting Results</h2>
        <div className="flex justify-between mb-2">
          <span className="font-medium">
            For: {proposal.account.yesVotes.toString()}
          </span>
          <span className="font-medium">
            Against: {proposal.account.noVotes.toString()}
          </span>
        </div>
        <Progress
          value={calculateProgress(
            proposal.account.yesVotes,
            proposal.account.noVotes
          )}
          className="h-2 mb-4"
        />
        {address ? (
          <VoteButtons proposal={proposal} onVoteSuccess={handleVoteSuccess} />
        ) : (
          <Button
            onClick={initializeWallet}
            variant="outline"
            className="rounded-md w-full"
          >
            Connect Wallet
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProposalDetailPage;
