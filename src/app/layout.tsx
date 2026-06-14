// src/app/layout.tsx
// Add <Providers> here. This is the only change to layout.tsx.
// Everything else in your existing layout stays as-is.

import type { Metadata } from 'next'
import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title:       'Persist — The Continuity Layer for the Agentic Web',
  description: 'Temporal Access Control for Sui. Seal encrypted data, set conditions, walk away.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
