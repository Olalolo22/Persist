# Persist — Roadmap

> The standard decentralised digital notary for crypto inheritance on Sui.

---

## Why This Exists

An estimated **$68B+ in crypto is permanently inaccessible** because holders die without passing on their keys (Chainalysis). Hardware wallets are found in drawers. Seed phrases die with their owners. Estates owe inheritance tax on assets they cannot access.

The current solutions — paper phrases in envelopes, technical multisig setups, centralised KYC services — fail the people who need them most. There is no trustless, decentralised, user-friendly inheritance protocol on Sui.

Persist fixes this.

---

## Phase 0 — Hackathon MVP
**June 2026**

The core protocol, proven in a working demo:

- **Sui Seal threshold encryption** — Capsule contents are encrypted locally in the browser using Sui Seal's distributed key custody system. Nothing leaves the device unencrypted. Not even Persist can read a sealed capsule.
- **Permanent decentralised storage** — Encrypted payloads stored on Walrus. Immutable. Independent of this application.
- **Time-Lock** — Set a fixed release date. The Move contract enforces `clock.timestamp_ms() >= release_time_ms` on-chain. No backend required.
- **Absence Safeguard** — A creator-defined inactivity window. Powered by a Tatum RPC oracle that checks the creator's last on-chain transaction. If inactivity is confirmed, the oracle generates an Ed25519 attestation verified by the Move contract. The absolute time-lock is always preserved as a hard fallback — no capsule can be permanently bricked.
- **File attachments** — Text messages and binary files (PDF, image, up to 5MB) bundled into a single encrypted payload via Sui Seal.
- **Tatum legacy context** — At seal time, Persist reconstructs the creator's on-chain history (first activity, last activity, transaction count) via Tatum RPC. This snapshot is attached to the capsule and shown to the recipient when it opens. Tatum never participates in access control or decryption.
- **Creator flow** — Connect wallet → encrypt contents → preserve on Walrus → record conditions on Sui → share claim link.
- **Recipient flow** — Connect wallet → verify conditions → retrieve from Walrus → Seal authorises decryption → contents revealed in browser.
- **Passive discovery** — Connected wallets can find capsules waiting for them via the "Capsules Waiting For You" dashboard, which filters `CapsuleCreated` events by nominee address.
- **The Epitaph (UI)** — A dedicated tab for the public legacy message feature. The vision is established in the product; the full backend implementation ships in Phase 1.

---

## Phase 1 — Production-Grade Protocol
**July – August 2026**

Making Persist safe and complete enough for real assets:

- **Mainnet launch** — Move from Testnet to Sui Mainnet. (we will be moving all of thes features to mainnet)
- **SUIns -  Instead of sharing a raw wallet address, creators can nominate recipients by their SuiNS domain name (e.g. suleiman2.sui). Human-readable, harder to mistype, and significantly reduces the risk of sealing a capsule to the wrong address — which on a trustless system is irreversible
- **The Epitaph (full)** — A public legacy message preserved on Walrus and recorded on Sui. While capsules are private and intended for a specific recipient, the Epitaph is meant for everyone. Readable by anyone with the link, permanently, without a server. Write the words you want them to keep forever.
- **Heartbeat mechanism** — Creators ping the contract periodically to reset the inactivity clock. Provides an on-chain proof of life independent of general wallet activity, making the Absence Safeguard more robust against false positives.
- **Nominee notifications** — When a capsule is sealed, the nominated wallet receives an on-chain signal that a capsule exists for them. The first time someone hears about Persist may be the day they're told something is waiting.
- **Multiple nominees** — Assign up to 5 recipients, each with their own access share.
- **Mobile-responsive UX**

---

## Phase 2 — Expanding the Protocol
**Q3–Q4 2026**

The inheritance capsule is the foundation. The protocol is broader:

| Use Case | Unlock Condition |
|---|---|
| Crypto inheritance | Wallet inactivity (Absence Safeguard) |
| Time-locked announcements | Fixed date |
| Whistleblower dead drops | Manual trigger or date |
| Startup vesting vaults | Date + on-chain condition |
| Digital letters and memories | Fixed date |
| Legal document escrow | Multi-party approval | 

All use cases run on the same contract. The interface adapts to the context.

Agent-native data layer — As AI agents become primary consumers of on-chain data, Persist's Walrus + Tatum architecture positions the protocol as infrastructure for agent-readable encrypted state. Trustless key handoff, time-locked disclosure, and conditional access are primitives agents need. This is the long-term expansion surface that Persist will be exploring and building around.

Agent memory succession — Walrus Memory gives agents persistent, verifiable context. Persist gives that memory a successor. When an agent goes silent — detected via Tatum's activity monitoring — its Walrus Memory and credentials seal into a capsule and transfer trustlessly to a designated operator or successor agent, enforced on Sui.

**Programmable access conditions** — Extending the Move contract to support richer unlock logic: multi-party approval, on-chain event triggers, and composable condition chains.

---

## Phase 3 — Sustainable Protocol
**2027**

- **Freemium SaaS** — Free tier (3 capsules, 10MB, 1 nominee). Pro tier for unlimited capsules, 1GB storage, 10 nominees, and priority notifications.
- **Protocol fee** — Small percentage on crypto disbursed through capsule claims at scale.
- **Enterprise** — White-label for legal firms, crypto funds, and DAOs needing treasury succession planning.

---

## Long-Term Vision

Persist is not a SaaS product. It is a protocol.

The end state is the standard decentralised digital notary layer for Sui — the infrastructure anyone uses to handle inheritance, time-locked disclosure, and conditional data release.

Permanent storage on Walrus. Programmable conditions in Move. Cryptographic enforcement via Seal. No intermediaries. No single points of failure. No expiry.

Built on Sui first because Walrus + Seal + Move is the ideal stack for trustless inheritance. Multi-chain expansion follows after achieving product-market fit on Sui.

---

## Technical Architecture

```
persist/
├── contracts/
│   └── persist.move              # PersistCapsule: time-lock + absence safeguard + seal_approve
├── src/
│   ├── lib/
│   │   ├── seal.ts               # Sui Seal threshold encryption + decryption
│   │   ├── walrus.ts             # Walrus blob upload / fetch
│   │   └── tatum.ts              # Tatum RPC — legacy context + inactivity oracle
│   ├── app/
│   │   ├── api/attest/           # Oracle attestation endpoint
│   │   ├── api/oracle/pubkey/    # Oracle public key endpoint
│   │   ├── create/               # Create capsule flow
│   │   ├── claim/                # Recipient claim flow
│   │   └── page.tsx              # Dashboard + Epitaph tab
│   └── components/
└── ROADMAP.md
```

---

## License

AGPL-3.0 — Open source. Any derivative work must also be open source.