// src/components/WalletConnect.tsx
// Drop-in wallet connect button for nav bars.
// Uses dapp-kit's ConnectButton under the hood but restyled to match
// the amber design system (btn--primary / btn--secondary classes).

'use client'

import { ConnectModal, useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit'
import { useState } from 'react'

// ============================================================
// HELPERS
// ============================================================

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

// ============================================================
// COMPONENT
// ============================================================

export function WalletConnect({ className = '' }: { className?: string }) {
  const account = useCurrentAccount()
  const { mutate: disconnect } = useDisconnectWallet()
  const [modalOpen, setModalOpen] = useState(false)

  if (account) {
    return (
      <button
        className={`btn btn--secondary ${className}`}
        onClick={() => disconnect()}
        title="Click to disconnect"
      >
        <span className="status-dot status-dot--active" />
        {truncateAddress(account.address)}
      </button>
    )
  }

  return (
    <>
      <button
        className={`btn btn--primary ${className}`}
        onClick={() => setModalOpen(true)}
      >
        Connect Wallet
      </button>

      <ConnectModal
        trigger={<></>}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  )
}
