"use client";

import React, { useState } from "react";
import { useCanvasClient } from "../hooks/useCanvasClient";
import { useWalletBalance } from "../hooks/useWalletBalance";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Navbar: React.FC = () => {
  const { client: canvasClient } = useCanvasClient();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const balance = useWalletBalance(walletAddress);

  const connectWallet = async () => {
    if (!canvasClient) return;

    try {
      const response = await canvasClient.connectWallet("solana:101");
      if (response.untrusted.success) {
        setWalletAddress(response.untrusted.address);
      } else {
        console.error("Failed to connect wallet:", response.untrusted.error);
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
  };

  return (
    <Card className="bg-card">
      <CardContent className="py-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-foreground font-bold text-xl">My Solana App</div>
          <div className="flex items-center">
            {walletAddress ? (
              <>
                <span className="text-foreground mr-4">
                  Balance: {balance !== null ? `${balance} SOL` : "Loading..."}
                </span>
                <span className="text-foreground mr-4">
                  {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
                </span>
                <Button onClick={disconnectWallet} variant="destructive">
                  Disconnect
                </Button>
              </>
            ) : (
              <Button onClick={connectWallet} variant="default">
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
