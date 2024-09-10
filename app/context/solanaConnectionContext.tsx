"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { Connection, clusterApiUrl } from "@solana/web3.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

const SolanaConnectionContext = createContext<Connection | null>(null);

export const useSolanaConnection = (): Connection => {
  const context = useContext(SolanaConnectionContext);
  if (!context) {
    throw new Error(
      "useSolanaConnection must be used within a SolanaConnectionProvider"
    );
  }
  return context;
};

interface SolanaConnectionProviderProps {
  children: ReactNode;
}

export const SolanaConnectionProvider: React.FC<
  SolanaConnectionProviderProps
> = ({ children }) => {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = clusterApiUrl(network);
  const connection = new Connection(endpoint);

  return (
    <SolanaConnectionContext.Provider value={connection}>
      {children}
    </SolanaConnectionContext.Provider>
  );
};
