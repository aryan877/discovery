"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import advancedFormat from "dayjs/plugin/advancedFormat";
import duration from "dayjs/plugin/duration";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCcw } from "lucide-react";
import { clusterList } from "@/lib/cluster";
import { PROGRAM_ID_STRING } from "@/lib/constants";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  deserializeProposal,
  Proposal,
  ProposalStatus,
} from "@/lib/proposalUtils";
import Link from "next/link";

dayjs.extend(relativeTime);
dayjs.extend(advancedFormat);
dayjs.extend(duration);

const PROGRAM_ID_PK = new PublicKey(PROGRAM_ID_STRING);

const ProposalFeed: React.FC = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(dayjs());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(dayjs()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchProposals = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const devnetCluster = clusterList.find((c) => c.name === "Devnet");
      if (!devnetCluster) throw new Error("Devnet cluster not found");

      const connection = new Connection(devnetCluster.url, "confirmed");
      const programAccounts = await connection.getProgramAccounts(
        PROGRAM_ID_PK
      );

      const parsedProposals = programAccounts
        .map((item) =>
          deserializeProposal(item.pubkey.toBase58(), item.account.data)
        )
        .filter((proposal): proposal is Proposal => proposal !== null);

      setProposals(parsedProposals);
    } catch (err) {
      console.error("Error fetching proposals:", err);
      setError("Failed to fetch proposals. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const getStatus = (
    status: ProposalStatus,
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
    if (status.passed) return <Badge>Passed</Badge>;
    if (status.rejected) return <Badge className="bg-red-500">Rejected</Badge>;
    if (currentTime.isBefore(dayjs(Number(startTime) * 1000)))
      return <Badge>Upcoming</Badge>;
    if (currentTime.isAfter(dayjs(Number(endTime) * 1000)))
      return <Badge>Ended</Badge>;
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

  return (
    <div className="w-full max-w-2xl mx-auto mt-10 bg-neutral-800">
      <div className="flex flex-row items-center justify-between space-y-0 pb-6">
        <h1 className="text-2xl font-bold text-white">Proposal Feed</h1>
        <Button onClick={fetchProposals} disabled={loading} variant="outline">
          <RefreshCcw className="w-4 h-4 mr-2" />
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {proposals.map((proposal) => (
        <div
          key={proposal.publicKey}
          className="mb-6 p-4 bg-netrual-800 border border-neutral-600 rounded-md"
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center space-x-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback>
                  {proposal.account.creator.toBase58().slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <Link href={`/proposal/${proposal.publicKey}`}>
                  <h2 className="text-lg font-semibold">
                    {proposal.account.title || "Title Missing"}
                  </h2>
                </Link>
                <p className="text-xs text-muted-foreground">
                  Created by: {proposal.account.creator.toBase58().slice(0, 4)}
                  ...
                  {proposal.account.creator.toBase58().slice(-4)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getStatus(
                proposal.account.status,
                proposal.account.startTime,
                proposal.account.endTime
              )}
            </div>
          </div>
          <p className="mb-2">{proposal.account.description}</p>
          <div className="flex justify-between mb-1">
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
            className="h-2 mb-2"
          />
          <div className="flex justify-between items-center mt-2">
            <div className="flex space-x-2">
              <Button
                disabled={
                  !isActive(
                    proposal.account.startTime,
                    proposal.account.endTime
                  ) || !proposal.account.status.active
                }
                className="rounded"
                variant="outline"
              >
                Yes, proceed
              </Button>
              <Button
                variant="outline"
                disabled={
                  !isActive(
                    proposal.account.startTime,
                    proposal.account.endTime
                  ) || !proposal.account.status.active
                }
                className="rounded"
              >
                Do not proceed
              </Button>
            </div>
            <span className="font-medium">
              {isActive(proposal.account.startTime, proposal.account.endTime)
                ? `Ends in: ${getTimeRemaining(proposal.account.endTime)}`
                : `Ended ${dayjs(
                    Number(proposal.account.endTime) * 1000
                  ).fromNow()}`}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProposalFeed;
