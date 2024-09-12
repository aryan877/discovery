import { AnchorWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { useSolanaConnection } from "../context/solanaConnectionContext";
import { AnchorProvider } from "@coral-xyz/anchor";

export function useAnchorProvider() {
  const connection = useSolanaConnection();
  const wallet = useAnchorWallet();

  return new AnchorProvider(connection, wallet as AnchorWallet, {
    commitment: "confirmed",
  });
}
