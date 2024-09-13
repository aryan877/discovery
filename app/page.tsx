"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ProposalFeed from "./component/ProposalFeed";

function Home() {
  return (
    <div className="bg-neutral-800 text-white">
      <div className="max-w-2xl mx-auto py-4 px-4">
        <div className="flex justify-end space-x-4 mb-6">
          <Link href="/create-proposal" passHref>
            <Button variant="outline">Create Proposal</Button>
          </Link>
          <Link href="/canvas-transfer" passHref>
            <Button variant="outline">Transfer SOL</Button>
          </Link>
        </div>
        <div>
          <ProposalFeed />
        </div>
      </div>
    </div>
  );
}

export default Home;
