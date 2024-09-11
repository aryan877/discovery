"use client";

import { useState, useEffect } from "react";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useSolanaConnection } from "../context/solanaConnectionContext";

export const useWalletBalance = (address: string | null) => {
  const [balance, setBalance] = useState<number | null>(null);
  const connection = useSolanaConnection();

  useEffect(() => {
    if (!address) {
      setBalance(null);
      return;
    }

    const publicKey = new PublicKey(address);

    const fetchBalance = async () => {
      try {
        const balanceInLamports = await connection.getBalance(publicKey);
        setBalance(balanceInLamports / LAMPORTS_PER_SOL);
      } catch (error) {
        console.error("Error fetching balance:", error);
        setBalance(null);
      }
    };

    fetchBalance();
    const intervalId = setInterval(fetchBalance, 30000);

    return () => clearInterval(intervalId);
  }, [address, connection]);

  return balance;
};
