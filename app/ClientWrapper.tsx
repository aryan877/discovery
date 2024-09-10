"use client";

import React, { useEffect, useState } from "react";
import { useCanvasClient } from "./hooks/useCanvasClient";
import { registerCanvasWallet } from "@dscvr-one/canvas-wallet-adapter";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

export function ClientWrapper({ children }: { children: React.ReactNode }) {
  const { isReady: isCanvasReady, client: canvasClient } = useCanvasClient();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (canvasClient) {
      registerCanvasWallet(canvasClient);
      console.log("Canvas wallet registered");
    }
  }, [canvasClient]);

  const handleConnect = async () => {
    if (canvasClient) {
      try {
        const chainId = WalletAdapterNetwork.Devnet;
        await canvasClient.connectWallet(chainId);
        setIsConnected(true);
        console.log("Wallet connected successfully to Solana devnet");
      } catch (error) {
        console.error("Failed to connect wallet:", error);
      }
    }
  };

  if (!isCanvasReady) {
    return <div>Loading Canvas...</div>;
  }

  return (
    <div>
      <div
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          zIndex: 1000,
        }}
      >
        <button
          onClick={handleConnect}
          disabled={isConnected}
          style={{
            padding: "10px 20px",
            backgroundColor: isConnected ? "#4CAF50" : "#008CBA",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: isConnected ? "default" : "pointer",
          }}
        >
          {isConnected ? "Connected to Devnet" : "Connect to Devnet"}
        </button>
      </div>
      {children}
    </div>
  );
}
