"use client";

import React, { useState } from "react";
import { useCanvasClient } from "../hooks/useCanvasClient";
import { useWalletBalance } from "../hooks/useWalletBalance";

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
    <nav className="bg-gray-800 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-white font-bold text-xl">My Solana App</div>
        <div className="flex items-center">
          {walletAddress ? (
            <>
              <span className="text-white mr-4">
                Balance: {balance !== null ? `${balance} SOL` : "Loading..."}
              </span>
              <span className="text-white mr-4">
                {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
              </span>
              <button
                onClick={disconnectWallet}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={connectWallet}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
