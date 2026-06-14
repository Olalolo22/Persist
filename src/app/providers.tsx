// src/app/providers.tsx
// Wraps the entire app with:
// - QueryClientProvider (react-query, required by dapp-kit)
// - SuiClientProvider (network config)
// - WalletProvider (wallet connection state)
//
// Drop this into src/app/layout.tsx as <Providers>{children}</Providers>
//
// Install:
//   npm i @mysten/dapp-kit @mysten/sui @mysten/seal @mysten/walrus @tanstack/react-query

'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createNetworkConfig,
  SuiClientProvider,
  WalletProvider,
} from '@mysten/dapp-kit'

// Import dapp-kit base styles — required for ConnectModal rendering
import '@mysten/dapp-kit/dist/index.css'

// ============================================================
// NETWORK CONFIG
// Testnet is the primary network for Sui Overflow submission.
// Mainnet config is included and ready — just swap defaultNetwork.
// ============================================================

const { networkConfig } = createNetworkConfig({
  testnet: {
    url: 'https://fullnode.testnet.sui.io:443',
  },
  mainnet: {
    url: 'https://fullnode.mainnet.sui.io:443',
  },
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Reasonable defaults — avoids hammering RPC on every focus
      staleTime:        30_000,   // 30s
      refetchOnWindowFocus: false,
    },
  },
})

// ============================================================
// PROVIDERS
// ============================================================

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <WalletProvider autoConnect>
          {children}
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  )
}
