"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import "@mysten/dapp-kit/dist/index.css";

const queryClient = new QueryClient();

const network = (process.env.NEXT_PUBLIC_SUI_NETWORK ?? "testnet") as
  | "testnet"
  | "mainnet"
  | "devnet"
  | "localnet";

// Use Tatum RPC for testnet if configured, fall back to public fullnode.
const testnetUrl =
  process.env.NEXT_PUBLIC_TATUM_RPC_URL ?? getJsonRpcFullnodeUrl("testnet");

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

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork={network}>
        <WalletProvider autoConnect>{children}</WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
