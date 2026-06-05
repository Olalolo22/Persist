"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import "@mysten/dapp-kit/dist/index.css";

import { useEffect, useState } from "react";

const queryClient = new QueryClient();

const network = (process.env.NEXT_PUBLIC_SUI_NETWORK ?? "testnet") as
  | "testnet"
  | "mainnet"
  | "devnet"
  | "localnet";

// Force a stable public testnet fullnode to bypass aggressive rate-limiting or Tatum CORS issues.
const testnetUrl = "https://testnet.sui.rpcpool.com/";

const networks = {
  testnet: new SuiJsonRpcClient({ url: testnetUrl, network: "testnet" }),
  mainnet: new SuiJsonRpcClient({
    url: getJsonRpcFullnodeUrl("mainnet"),
    network: "mainnet",
  }),
  devnet: new SuiJsonRpcClient({
    url: getJsonRpcFullnodeUrl("devnet"),
    network: "devnet",
  }),
  localnet: new SuiJsonRpcClient({
    url: getJsonRpcFullnodeUrl("localnet"),
    network: "localnet",
  }),
};

import { ToastProvider } from "@/components/ui/Toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork={network}>
        <WalletProvider autoConnect={typeof window !== "undefined"}>
          <ToastProvider>
            {children}
          </ToastProvider>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
