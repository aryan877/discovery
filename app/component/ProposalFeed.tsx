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
import ReactMarkdown from "react-markdown";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  deserializeProposal,
  Proposal,
  ProposalStatus,
} from "@/lib/proposalUtils";
import Link from "next/link";
import VoteButtons from "./VoteButtons";

dayjs.extend(relativeTime);
dayjs.extend(advancedFormat);
dayjs.extend(duration);

const PROGRAM_ID = new PublicKey(PROGRAM_ID_STRING);

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
};

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
      const programAccounts = await connection.getProgramAccounts(PROGRAM_ID);

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
    startTime: number,
    endTime: number
  ) => {
    const now = currentTime.unix();
    if (status.active && now >= startTime && now < endTime) {
      return <Badge>Active</Badge>;
    }
    if (status.passed) return <Badge>Passed</Badge>;
    if (status.rejected) return <Badge className="bg-red-500">Rejected</Badge>;
    if (now < startTime) return <Badge>Upcoming</Badge>;
    if (now >= endTime) return <Badge>Ended</Badge>;
    return <Badge>Unknown</Badge>;
  };

  const getTimeRemaining = (endTime: number) => {
    const end = dayjs.unix(endTime);
    const diff = end.diff(currentTime);
    if (diff <= 0) return "Ended";

    const duration = dayjs.duration(diff);
    return `${duration.days()}d ${duration.hours()}h ${duration.minutes()}m ${duration.seconds()}s`;
  };

  const calculateProgress = (yesVotes: bigint, noVotes: bigint) => {
    const total = Number(yesVotes) + Number(noVotes);
    return total === 0 ? 0 : (Number(yesVotes) / total) * 100;
  };

  const isActive = (startTime: number, endTime: number): boolean => {
    const now = currentTime.unix();
    return now >= startTime && now < endTime;
  };

  const handleVoteSuccess = () => {
    fetchProposals();
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-10 bg-neutral-800">
      <div className="flex flex-row items-center justify-between space-y-0 pb-6">
        <h1 className="text-2xl font-bold ">Proposals</h1>
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

      {proposals.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-lg text-muted-foreground">
            There are no proposals yet.
          </p>
        </div>
      ) : (
        proposals.map((proposal) => (
          <div
            key={proposal.publicKey}
            className="mb-6 p-4 bg-neutral-800 border border-neutral-600 rounded-md"
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
                    Created by:{" "}
                    {proposal.account.creator.toBase58().slice(0, 4)}
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
            <div className="mb-2">
              <ReactMarkdown>
                {truncateText(proposal.account.description, 200)}
              </ReactMarkdown>
            </div>
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
              <VoteButtons
                proposal={proposal}
                onVoteSuccess={handleVoteSuccess}
              />
              <span className="font-medium">
                {isActive(proposal.account.startTime, proposal.account.endTime)
                  ? `Ends in: ${getTimeRemaining(proposal.account.endTime)}`
                  : `Ended ${dayjs.unix(proposal.account.endTime).fromNow()}`}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ProposalFeed;
