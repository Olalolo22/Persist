# Sui Overflow 2026 — Special Walrus Track Submission

**Project:** Persist

**One-liner:**  
Persist ensures continuity when humans, agents, or organizations disappear. Three layers of Walrus integration.

**Core truth:**  
"Temporal Access Control for Sui."  
Persist adds only one thing: **when** encrypted data becomes accessible.

## Three Layers of Walrus (the depth story)
1. **Core storage** — Seal-encrypted capsule payloads are stored as permanent Walrus blobs. The blob ID is recorded on-chain in the Move object. Data survives even if persist.app disappears.
2. **Agent memory extension** — The Guardian Agent (for the Agentic Web demo) stores its operational context (monitoring logs, capsule registry, attestation history) in Walrus Memory (MemWal). When the agent dies, Persist unlocks a capsule containing the delegate key so a successor can inherit the exact memory space.
3. **Decentralized frontend** — The entire Persist app is deployed as a Walrus Site. The UI itself lives on Walrus.

This is not "Walrus as IPFS." This is Walrus as the cryptographic trust layer for temporal access control.

## What Persist Is
A continuity protocol on Sui.

It creates time-locked, condition-gated capsules:
- Encrypted client-side with Sui Seal.
- Stored permanently on Walrus.
- Access conditions enforced on Sui Move (time or oracle-signed absence).
- No gatekeeper, no private key holder who can open early.

## The Guardian Agent Demo (why agents need this)
A simple autonomous process:
- Runs its own Sui wallet.
- Monitors creators via RPC.
- Submits Ed25519 attestations (decentralizing the old oracle).
- Remembers everything in Walrus Memory.
- Snapshots its own state into a Persist capsule.

When we kill it, the successor claims the capsule, inherits the memory, and continues with zero loss.

Real on-chain capsule. Real Walrus Memory inheritance. Real continuity.

## Technical Stack (Walrus-heavy)
- Walrus blobs for payloads
- Walrus Memory (MemWal) for agent state
- Walrus Sites for the frontend
- Sui Seal for encryption
- Sui Move for conditions
- (Tatum/Guardian for signals)

## Submission Assets
- Live app on Walrus Site (see deploy/walrus-sites.md)
- Real 6-step Guardian succession demo (run `npm run agent`, kill it, claim as successor)
- Manual recovery guide (`docs/recovery.md` + `scripts/recover-capsule.ts`) — prove you can recover from raw Walrus + Sui alone.
- Full source + Move contract on GitHub.

## Why This Wins Walrus
Most entries treat Walrus as "decentralized blob storage."

Persist treats Walrus as the permanence layer for *intent that must survive disappearance* — for people, for agents, and eventually for organizations.

Deep integration at every layer. Cryptographic enforcement on top. Production-grade for the $30K track.

**The sentence:**  
"The amber cracked. The successor inherited the memory. Monitoring resumed. All of it lived on Walrus."

Repository + deployed site: [to be filled after final Walrus Site upload]
