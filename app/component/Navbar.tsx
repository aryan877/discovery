"use client";

import React, { useEffect } from "react";
import useCanvasWallet from "../CanvasWalletProvider";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const Navbar: React.FC = () => {
  const {
    client: canvasClient,
    address: walletAddress,
    balance,
    initializeWallet,
    fetchBalance,
  } = useCanvasWallet();

  const connectWallet = async () => {
    if (!canvasClient) {
      console.error("Canvas client not initialized");
      return;
    }

    try {
      await initializeWallet();
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  const disconnectWallet = () => {
    console.log("Wallet disconnect functionality not implemented");
  };

  useEffect(() => {
    if (walletAddress) {
      fetchBalance();
    }
  }, [walletAddress]);

  return (
    <div className="bg-neutral-800 border-b">
      <div className="max-w-2xl mx-auto py-4 px-4">
        <div className="flex justify-between items-center">
          <Link href="/">
            {" "}
            <div className="text-white font-bold text-xl">DSCVRY</div>
          </Link>

          <div className="flex items-center">
            {walletAddress ? (
              <>
                <span className="text-white mr-4">
                  Balance:{" "}
                  {balance !== null
                    ? `${balance.toFixed(4)} SOL`
                    : "Loading..."}
                </span>
                <span className="text-white mr-4">
                  {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
                </span>
                <Button onClick={disconnectWallet} variant="destructive">
                  Disconnect
                </Button>
              </>
            ) : (
              <Button onClick={connectWallet} variant="outline">
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
