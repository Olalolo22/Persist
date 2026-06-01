# Persist

**Encrypt a message, document, or crypto instruction. Set a date or a dead man's switch. It unlocks automatically on Walrus — forever.**

Built for the [Tatum x Walrus Hackathon](https://tatum.io) · June 2026

---

## The Problem

An estimated **$68B+ in crypto is permanently inaccessible** because holders die without passing on their keys. Hardware wallets found in drawers. Seed phrases that died with their owners. Estates taxed on assets the family can't even access.

> *"A family inherited their dad's estate. Grant of probate. Death certificate. Everything legal. They found his Ledger in a drawer. Nobody knew the PIN. Nobody knew the recovery phrase. Legally theirs. Practically gone forever."*
> — r/CryptoCurrency

The existing solutions are broken — paper seed phrases in envelopes, complex multisig setups, or centralised KYC services that can go offline. **Nothing trustless. Nothing on Sui.**

---

## The Solution

Persist is the first trustless, decentralised crypto inheritance protocol on Sui.

- **You encrypt a file or message** — AES-256-GCM, client-side. Nothing leaves your device unencrypted.
- **It lives on Walrus forever** — immutable, decentralised, permanent.
- **A condition unlocks it** — a fixed date, or a dead man's switch powered by Tatum Data API.
- **Your nominee claims it** — one click, in-browser decrypt, download.
- **You leave an Epitaph** — a final on-chain message, permanently readable after unlock.

---

## Demo

> 📹 [Watch the 2-minute demo](#) ← *(link added at submission)*

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart contract | Sui Move — `PersistCapsule` with time-lock + dead man's switch |
| Storage | Walrus — permanent decentralised blob storage |
| RPC | Tatum RPC — all Sui transactions |
| Activity check | Tatum Data API — wallet activity monitoring for dead man's switch |
| Frontend | Next.js + TypeScript |
| Encryption | Web Crypto API — AES-256-GCM, client-side |

---

## How It Works

```
1. Creator uploads file → encrypts client-side (AES-256-GCM)
2. Encrypted blob stored on Walrus → returns Blob ID
3. Sui Move contract created:
   - Stores Blob ID + encrypted AES key + nominee address
   - Sets unlock condition (fixed date OR dead man's switch)
4. Dead man's switch: Tatum Data API checks creator wallet activity
   - If wallet inactive past the defined window → nominee can claim
5. Nominee claims → Move contract releases encrypted AES key
6. Nominee decrypts AES key → decrypts Walrus blob → downloads file
```

---

## Running Locally

```bash
# Clone the repo
git clone https://github.com/yourusername/persist
cd persist

# Install dependencies
npm install

# Add environment variables
cp .env.example .env.local
# Fill in: NEXT_PUBLIC_TATUM_API_KEY, NEXT_PUBLIC_SUI_NETWORK

# Run dev server
npm run dev
```

---

## Repo Structure

```
persist/
├── README.md
├── ROADMAP.md                # Full technical roadmap
├── src/
│   ├── contracts/
│   │   └── persist.move      # PersistCapsule Move contract
│   ├── app/                  # Next.js pages
│   │   ├── page.tsx          # Dashboard
│   │   ├── create/           # Create capsule flow
│   │   └── claim/            # Nominee claim flow
│   ├── components/           # UI components
│   └── lib/
│       ├── crypto.ts         # AES-256-GCM encryption utilities
│       ├── walrus.ts         # Walrus upload / fetch
│       └── tatum.ts          # Tatum RPC + Data API
└── .env.example
```

---

## Roadmap

**Phase 0 (June 2026):** Hackathon MVP — dead man's switch + epitaph + nominee claim flow

**Phase 1 (July 2026):** Mainnet launch, security hardening (Ed25519 verification, ECIES key wrapping), mobile UX

**Phase 2 (Q3 2026):** Sui Seal integration, multiple nominees, expand to time-locked announcements + vesting vaults

**Phase 3 (2027):** Freemium SaaS (free capsules, Pro tier), protocol fees at scale

**Long-term:** Become the standard decentralised digital notary for crypto inheritance on Sui — and eventually multi-chain.

See [ROADMAP.md](./ROADMAP.md) for the full technical breakdown.

---

## License

[AGPL-3.0](./LICENSE) — Open source. Any derivative work must also be open source.
