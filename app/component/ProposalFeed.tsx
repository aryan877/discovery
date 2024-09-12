"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import advancedFormat from "dayjs/plugin/advancedFormat";
import duration from "dayjs/plugin/duration";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
  RefreshCcw,
  Clock,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import useCanvasWallet from "../CanvasWalletProvider";
import { clusterList } from "@/lib/cluster";
import { PROGRAM_ID } from "@/lib/constants";

dayjs.extend(relativeTime);
dayjs.extend(advancedFormat);
dayjs.extend(duration);

const PROGRAM_ID_PK = new PublicKey(PROGRAM_ID!);

interface ProposalStatus {
  active?: {};
  passed?: {};
  rejected?: {};
}

interface ProposalAccount {
  id: bigint;
  description: string;
  creator: PublicKey;
  yesVotes: bigint;
  noVotes: bigint;
  status: ProposalStatus;
  startTime: bigint;
  endTime: bigint;
}

interface Proposal {
  publicKey: string;
  account: ProposalAccount;
}

function deserializeProposal(
  publicKey: string,
  accountData: Buffer
): Proposal | null {
  try {
    const PROPOSAL_DISCRIMINATOR = Buffer.from([
      26, 94, 189, 187, 116, 136, 53, 33,
    ]);
    if (!accountData.slice(0, 8).equals(PROPOSAL_DISCRIMINATOR)) {
      return null;
    }

    let offset = 8; // Start after the discriminator

    // ID (u64)
    const id = accountData.readBigUInt64LE(offset);
    offset += 8;

    // Description (string)
    const descriptionLen = accountData.readUInt32LE(offset);
    offset += 4;
    const description = accountData
      .slice(offset, offset + descriptionLen)
      .toString("utf8");
    offset += descriptionLen;

    // Creator (PublicKey, 32 bytes)
    const creator = new PublicKey(accountData.slice(offset, offset + 32));
    offset += 32;

    // YesVotes (u64)
    const yesVotes = accountData.readBigUInt64LE(offset);
    offset += 8;

    // NoVotes (u64)
    const noVotes = accountData.readBigUInt64LE(offset);
    offset += 8;

    // Status (enum - Active, Passed, Rejected)
    const statusByte = accountData[offset];
    let status: ProposalStatus;
    if (statusByte === 0) status = { active: {} };
    else if (statusByte === 1) status = { passed: {} };
    else if (statusByte === 2) status = { rejected: {} };
    else throw new Error("Invalid status byte");
    offset += 1;

    // Start Time (i64)
    const startTime = accountData.readBigInt64LE(offset);
    offset += 8;

    // End Time (i64)
    const endTime = accountData.readBigInt64LE(offset);

    return {
      publicKey,
      account: {
        id,
        description,
        creator,
        yesVotes,
        noVotes,
        status,
        startTime,
        endTime,
      },
    };
  } catch (err) {
    console.error("Error parsing account data:", err);
    return null;
  }
}

const ProposalFeed: React.FC = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedProposal, setExpandedProposal] = useState<string | null>(null);
  const { client } = useCanvasWallet();

  const fetchProposals = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const devnetCluster = clusterList.find((c) => c.name === "Devnet");
      if (!devnetCluster) {
        throw new Error("Devnet cluster not found");
      }

      const connection = new Connection(devnetCluster.url, "confirmed");
      const programAccounts = await connection.getProgramAccounts(
        PROGRAM_ID_PK
      );

      const parsedProposals: Proposal[] = programAccounts
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

  const formatTime = (timestamp: bigint): string => {
    // Convert bigint to number, handling large values
    const date = dayjs(Number(timestamp) * 1000);
    return date.isValid()
      ? date.format("MMM D, YYYY [at] h:mm A")
      : "Invalid Date";
  };

  const getTimeStatus = (startTime: bigint, endTime: bigint): string => {
    const now = dayjs();
    const start = dayjs(Number(startTime) * 1000);
    const end = dayjs(Number(endTime) * 1000);

    if (!start.isValid() || !end.isValid()) {
      return "Invalid time data";
    }

    if (now.isBefore(start)) {
      const diff = start.diff(now, "year", true);
      if (diff > 1) {
        return `Starts in ${Math.floor(diff)} years`;
      } else {
        return `Starts ${start.fromNow()}`;
      }
    } else if (now.isAfter(end)) {
      return `Ended ${end.fromNow()}`;
    } else {
      const timeLeft = dayjs.duration(end.diff(now));
      const years = timeLeft.years();
      const months = timeLeft.months();
      const days = timeLeft.days();
      const hours = timeLeft.hours();
      const minutes = timeLeft.minutes();

      let timeString = "";
      if (years > 0) timeString += `${years}y `;
      if (months > 0) timeString += `${months}m `;
      if (days > 0) timeString += `${days}d `;
      if (hours > 0) timeString += `${hours}h `;
      timeString += `${minutes}m`;

      return `Ends in ${timeString}`;
    }
  };

  const getDuration = (startTime: bigint, endTime: bigint): string => {
    const start = dayjs(Number(startTime) * 1000);
    const end = dayjs(Number(endTime) * 1000);

    if (!start.isValid() || !end.isValid()) {
      return "Invalid duration";
    }

    const durationMs = end.diff(start);
    if (durationMs < 0) {
      return "Invalid duration (end before start)";
    }

    const durationObj = dayjs.duration(durationMs);
    const years = durationObj.years();
    const months = durationObj.months();
    const days = durationObj.days();
    const hours = durationObj.hours();
    const minutes = durationObj.minutes();

    let durationString = "";
    if (years > 0) durationString += `${years} year${years > 1 ? "s" : ""} `;
    if (months > 0)
      durationString += `${months} month${months > 1 ? "s" : ""} `;
    if (days > 0) durationString += `${days} day${days > 1 ? "s" : ""} `;
    if (hours > 0) durationString += `${hours} hour${hours > 1 ? "s" : ""} `;
    if (minutes > 0)
      durationString += `${minutes} minute${minutes > 1 ? "s" : ""}`;

    return durationString.trim() || "Less than a minute";
  };

  const isActive = (startTime: bigint, endTime: bigint): boolean => {
    const now = dayjs();
    const start = dayjs(Number(startTime) * 1000);
    const end = dayjs(Number(endTime) * 1000);
    return (
      start.isValid() &&
      end.isValid() &&
      now.isAfter(start) &&
      now.isBefore(end)
    );
  };

  const toggleExpand = (publicKey: string) => {
    setExpandedProposal(expandedProposal === publicKey ? null : publicKey);
  };

  const getStatusBadge = (status: ProposalStatus) => {
    if (status.active) return <Badge variant="default">Active</Badge>;
    if (status.passed) return <Badge variant="destructive">Passed</Badge>;
    if (status.rejected) return <Badge variant="destructive">Rejected</Badge>;
    return <Badge variant="secondary">Unknown</Badge>;
  };

  const getTimeBadge = (startTime: bigint, endTime: bigint) => {
    const now = dayjs();
    const start = dayjs(Number(startTime) * 1000);
    const end = dayjs(Number(endTime) * 1000);

    if (!start.isValid() || !end.isValid()) {
      return <Badge variant="destructive">Invalid Date</Badge>;
    }

    if (now.isBefore(start)) {
      return <Badge variant="secondary">Upcoming</Badge>;
    } else if (now.isAfter(end)) {
      return <Badge variant="outline">Ended</Badge>;
    } else {
      return <Badge variant="default">In Progress</Badge>;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 md:p-10 space-y-6 bg-background text-foreground rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Proposal Feed</h1>
        <Button
          onClick={fetchProposals}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          <RefreshCcw className="w-4 h-4 mr-2" />
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>
      {error && (
        <Card className="bg-destructive/15 border-destructive text-destructive mb-6">
          <CardContent className="pt-6">{error}</CardContent>
        </Card>
      )}
      <div className="grid grid-cols-1 gap-6">
        {proposals.map((proposal) => (
          <Card
            key={proposal.publicKey}
            className="overflow-hidden h-full flex flex-col"
          >
            <CardHeader
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleExpand(proposal.publicKey)}
            >
              <CardTitle className="flex justify-between items-center">
                <span className="text-lg">
                  Proposal #{proposal.account.id.toString()}
                </span>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(proposal.account.status)}
                  {getTimeBadge(
                    proposal.account.startTime,
                    proposal.account.endTime
                  )}
                  {expandedProposal === proposal.publicKey ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm mb-2 line-clamp-2">
                {proposal.account.description}
              </p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>
                  <strong>Creator:</strong>{" "}
                  {proposal.account.creator.toBase58()}
                </p>
                <p className="text-primary font-semibold flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {getTimeStatus(
                    proposal.account.startTime,
                    proposal.account.endTime
                  )}
                </p>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/50 flex justify-between items-center py-3">
              <div className="flex space-x-4">
                <div className="flex items-center space-x-1 text-success">
                  <ThumbsUp className="w-4 h-4" />
                  <span className="text-sm">
                    {proposal.account.yesVotes.toString()}
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-destructive">
                  <ThumbsDown className="w-4 h-4" />
                  <span className="text-sm">
                    {proposal.account.noVotes.toString()}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleExpand(proposal.publicKey)}
              >
                {expandedProposal === proposal.publicKey
                  ? "Hide Details"
                  : "Show Details"}
              </Button>
            </CardFooter>
            {expandedProposal === proposal.publicKey && (
              <div className="p-4 bg-muted/30 border-t">
                <div className="text-sm space-y-2 mb-4">
                  <p>
                    <strong>Public Key:</strong> {proposal.publicKey}
                  </p>
                  <p className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    <strong>Start Time:</strong>{" "}
                    {formatTime(proposal.account.startTime)}
                  </p>
                  <p className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    <strong>End Time:</strong>{" "}
                    {formatTime(proposal.account.endTime)}
                  </p>
                  <p className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    <strong>Duration:</strong>{" "}
                    {getDuration(
                      proposal.account.startTime,
                      proposal.account.endTime
                    )}
                  </p>
                  {(!dayjs(
                    Number(proposal.account.startTime) * 1000
                  ).isValid() ||
                    !dayjs(
                      Number(proposal.account.endTime) * 1000
                    ).isValid()) && (
                    <p className="flex items-center text-destructive">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      <strong>Warning:</strong> Invalid date data detected
                    </p>
                  )}
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    disabled={
                      !isActive(
                        proposal.account.startTime,
                        proposal.account.endTime
                      ) || !proposal.account.status.active
                    }
                  >
                    <ThumbsDown className="w-4 h-4 mr-2" /> Vote No
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-success text-success hover:bg-success hover:text-success-foreground"
                    disabled={
                      !isActive(
                        proposal.account.startTime,
                        proposal.account.endTime
                      ) || !proposal.account.status.active
                    }
                  >
                    <ThumbsUp className="w-4 h-4 mr-2" /> Vote Yes
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProposalFeed;
