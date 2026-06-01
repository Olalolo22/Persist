# Persist — Roadmap

> The standard decentralized digital notary for crypto inheritance on Sui.

---

## Why This Exists

An estimated **$68B+ in crypto is permanently inaccessible** because holders die without passing on their keys (Chainalysis). Hardware wallets are found in drawers. Seed phrases die with their owners. Estates owe inheritance tax on assets they cannot access.

The current "solutions" — paper phrases in envelopes, technical multisig setups, or centralised KYC services — fail the people who need them most. There is no trustless, decentralised, user-friendly inheritance protocol on Sui.

Persist fixes this.

---

## Phase 0 — Hackathon MVP
**June 2026**

The core protocol, proven in a working demo:

- **Client-side encryption** — AES-256-GCM. Your files never leave your device unencrypted.
- **Permanent decentralised storage** — Encrypted blobs stored on Walrus. Immutable. Permanent.
- **The Dead Man's Switch** — Tatum Data API monitors wallet activity. If the creator's wallet goes silent past a defined window, the nominee can claim.
- **Fixed Date Unlock** — Set a specific date. The capsule opens automatically.
- **The Epitaph** — A final on-chain message from the creator, permanently visible after unlock.
- **Nominee Claim Flow** — One-click in-browser decrypt and download for the recipient.

---

## Phase 1 — Production-Grade Protocol
**July 2026**

Making Persist safe enough for real assets:

- **Mainnet launch** — Move from Testnet to Sui Mainnet (Target: July 2026)
- **Ed25519 signature verification** — Full cryptographic proof in the Move contract before any claim is processed
- **ECIES key wrapping** — AES key encrypted to the nominee's Sui wallet public key; no claim link required
- **Multiple nominees** — Assign up to 5 nominees, each with their own share
- **Manual check-in** — One-click "I'm still alive" to reset the dead man's switch
- **Capsule dashboard** — View all active capsules, expiry dates, and claim status
- **Mobile-responsive UX**
- **Nominee notifications** — Wallet and email alerts when a capsule becomes claimable

---

## Phase 2 — Expanding the Protocol
**Q3–Q4 2026**

The inheritance contract is the foundation. The protocol is broader:

| Use Case | Unlock Condition |
|---|---|
| Crypto inheritance | Wallet inactivity (dead man's switch) |
| Time-locked announcements | Fixed date |
| Whistleblower dead drops | Manual trigger or date |
| Startup vesting vaults | Date + on-chain condition |
| Digital letters / memories | Fixed date |
| Legal document escrow | Multi-party approval |

All use cases run on the same contract. The UI adapts to the context.

**Sui Seal integration** — Migrating key management to Mysten Labs' Seal protocol for fully programmable, on-chain access conditions. This is the technical moat.

---

## Phase 3 — Sustainable Protocol
**2027**

- **Freemium SaaS** — Free tier (3 capsules, 10MB, 1 nominee). Pro tier (~$5/mo) for unlimited capsules, 1GB storage, 10 nominees, AI will-writing, legal document templates, and priority notifications.
- **Protocol fee** — Small percentage on crypto disbursed through capsule claims, at scale.
- **Enterprise** — White-label for legal firms, crypto funds, and DAOs needing treasury succession planning.

---

## Long-Term Vision

Persist is not a SaaS product. It is a protocol.

The end state is the **standard decentralised digital notary layer for Sui** — the infrastructure anyone uses to handle inheritance, time-locked disclosure, and conditional data release.

Permanent storage on Walrus. Programmable conditions in Move. No intermediaries. No single points of failure. No expiry.

Built on Sui first because Walrus + Move is the ideal stack for trustless inheritance. Multi-chain expansion follows after achieving product-market fit on Sui.

---

## Technical Architecture

```
persist/
├── contracts/
│   └── persist.move          # PersistCapsule: time-lock + dead man's switch
├── src/
│   ├── lib/
│   │   ├── crypto.ts         # AES-256-GCM client-side encryption
│   │   ├── walrus.ts         # Walrus blob upload / fetch
│   │   └── tatum.ts          # Tatum RPC + Data API integration
│   ├── app/
│   │   ├── create/           # Create capsule flow
│   │   ├── claim/            # Nominee claim flow
│   │   └── dashboard/        # Capsule management
│   └── components/
└── ROADMAP.md
```

---

## License

AGPL-3.0 — Open source. Any derivative work must also be open source.
