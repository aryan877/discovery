"use client";

import React, { useEffect } from "react";
import useCanvasWallet from "../CanvasWalletProvider";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Navbar: React.FC = () => {
  const {
    client: canvasClient,
    address: walletAddress,
    balance,
    initializeWallet,
    fetchBalance,
    user,
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
    <div className="bg-neutral-800 border-b border-neutral-700">
      <div className="max-w-2xl mx-auto py-4 px-4">
        <div className="flex justify-between items-center">
          <Link href="/">
            <div className=" font-bold text-xl">DSCVRY</div>
          </Link>

          <div className="flex items-center space-x-4">
            {walletAddress ? (
              <>
                <span className="">
                  Balance:{" "}
                  {balance !== null
                    ? `${balance.toFixed(4)} SOL`
                    : "Loading..."}
                </span>
                <span className="">
                  {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
                </span>
                {user && (
                  <Link href={`/profile/${user.username}`}>
                    <Avatar className="h-8 w-8 cursor-pointer">
                      <AvatarImage
                        src={user.avatar || undefined}
                        alt={user.username}
                      />
                      <AvatarFallback className="bg-neutral-700  text-xs">
                        {user.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                )}
                <Button
                  onClick={disconnectWallet}
                  variant="destructive"
                  size="sm"
                >
                  Disconnect
                </Button>
              </>
            ) : (
              <>
                <Avatar className="h-8 w-8 bg-neutral-700">
                  <AvatarFallback className="text-neutral-400 text-xs">
                    ?
                  </AvatarFallback>
                </Avatar>
                <Button onClick={connectWallet} variant="default" size="sm">
                  Connect Wallet
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
