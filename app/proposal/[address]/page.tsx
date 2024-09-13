"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Connection, PublicKey } from "@solana/web3.js";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import advancedFormat from "dayjs/plugin/advancedFormat";
import duration from "dayjs/plugin/duration";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ReactMarkdown from "react-markdown";
import { clusterList } from "@/lib/cluster";
import { deserializeProposal, Proposal } from "@/lib/proposalUtils";
import Back from "@/app/component/Back";

dayjs.extend(relativeTime);
dayjs.extend(advancedFormat);
dayjs.extend(duration);

const ProposalDetailPage: React.FC = () => {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(dayjs());

  const pathname = usePathname();
  const address = pathname?.split("/").pop();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(dayjs()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchProposal = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    setError(null);

    try {
      const devnetCluster = clusterList.find((c) => c.name === "Devnet");
      if (!devnetCluster) throw new Error("Devnet cluster not found");

      const connection = new Connection(devnetCluster.url, "confirmed");
      const accountInfo = await connection.getAccountInfo(
        new PublicKey(address)
      );

      if (!accountInfo) {
        throw new Error("Proposal not found");
      }

      const parsedProposal = deserializeProposal(address, accountInfo.data);
      if (!parsedProposal) {
        throw new Error("Failed to parse proposal data");
      }

      setProposal(parsedProposal);
    } catch (err) {
      console.error("Error fetching proposal:", err);
      setError("Failed to fetch proposal. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchProposal();
  }, [fetchProposal]);

  const getStatus = (
    status: Proposal["account"]["status"],
    startTime: bigint,
    endTime: bigint
  ) => {
    if (
      status.active &&
      currentTime.isAfter(dayjs(Number(startTime) * 1000)) &&
      currentTime.isBefore(dayjs(Number(endTime) * 1000))
    ) {
      return <Badge>Active</Badge>;
    }
    if (status.passed) return <Badge className="bg-green-500">Passed</Badge>;
    if (status.rejected) return <Badge className="bg-red-500">Rejected</Badge>;
    if (currentTime.isBefore(dayjs(Number(startTime) * 1000)))
      return <Badge className="bg-yellow-500">Upcoming</Badge>;
    if (currentTime.isAfter(dayjs(Number(endTime) * 1000)))
      return <Badge className="bg-gray-500">Ended</Badge>;
    return <Badge>Unknown</Badge>;
  };

  const getTimeRemaining = (endTime: bigint) => {
    const end = dayjs(Number(endTime) * 1000);
    if (!end.isValid()) return "Invalid date";

    const diff = end.diff(currentTime);
    if (diff <= 0) return "Ended";

    const duration = dayjs.duration(diff);
    return `${duration.days()}d ${duration.hours()}h ${duration.minutes()}m ${duration.seconds()}s`;
  };

  const calculateProgress = (yesVotes: bigint, noVotes: bigint) => {
    const total = Number(yesVotes) + Number(noVotes);
    return total === 0 ? 0 : (Number(yesVotes) / total) * 100;
  };

  const isActive = (startTime: bigint, endTime: bigint): boolean => {
    const start = dayjs(Number(startTime) * 1000);
    const end = dayjs(Number(endTime) * 1000);
    return (
      start.isValid() &&
      end.isValid() &&
      currentTime.isAfter(start) &&
      currentTime.isBefore(end)
    );
  };

  if (loading) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  if (error || !proposal) {
    return (
      <Alert variant="destructive" className="mt-10 max-w-2xl mx-auto">
        <AlertDescription>
          {error || "Failed to load proposal"}
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
              {dayjs(Number(proposal.account.startTime) * 1000).format(
                "MMM D, YYYY h:mm A"
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span>End Date:</span>
            <span>
              {dayjs(Number(proposal.account.endTime) * 1000).format(
                "MMM D, YYYY h:mm A"
              )}
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
        <div className="flex justify-center space-x-4">
          <Button
            disabled={
              !isActive(proposal.account.startTime, proposal.account.endTime) ||
              !proposal.account.status.active
            }
            className="w-full"
            variant="default"
          >
            Yes, proceed
          </Button>
          <Button
            disabled={
              !isActive(proposal.account.startTime, proposal.account.endTime) ||
              !proposal.account.status.active
            }
            className="w-full"
            variant="outline"
          >
            Do not proceed
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProposalDetailPage;
