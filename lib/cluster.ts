import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

export type ClusterInfo = {
  name: string;
  cluster: WalletAdapterNetwork;
  chainId: string;
  appUrl?: string;
  url: string;
};

export const clusterList: ClusterInfo[] = [
  {
    name: "Devnet",
    cluster: WalletAdapterNetwork.Devnet,
    chainId: "solana:103",
    url:
      process.env.NEXT_PUBLIC_SOLANA_DEVNET_CLUSTER ||
      "https://api.devnet.solana.com",
  },
  {
    name: "Mainnet",
    cluster: WalletAdapterNetwork.Mainnet,
    chainId: "solana:101",
    appUrl: process.env.NEXT_PUBLIC_SOLANA_MAINNET_CLUSTER,
    url:
      process.env.NEXT_PUBLIC_SOLANA_MAINNET_RPC ||
      "https://api.mainnet-beta.solana.com",
  },
];
