# Persist

## Some things are meant to outlast you.

**Persist is Temporal Access Control for Sui.**

It creates cryptographically sealed capsules — time-locked, condition-gated, encrypted via Seal, stored permanently on Walrus — that unlock only when defined conditions are met. No gatekeeper. No private key holder.

Persist adds one thing to the stack: **when** encrypted data can be accessed.

Everything else (Seal, Walrus, Sui Move, Tatum) is a tool Persist uses.

Built for Sui Overflow 2026 (Walrus + Agentic Web tracks).

---

## The Reveal

Persist doesn't need a pivot. It needs a reveal.

The protocol was always a **Continuity Protocol**.

- Inheritance was always continuity for people.
- Agent succession is continuity for agents.
- DAO contingency is continuity for organizations.

The invariant never changed. The framing does.

> **"Persist ensures continuity when humans, agents, or organizations disappear."**

Use this in storytelling. For engineers: **"Temporal Access Control for Sui."** For the demo: the Guardian Agent dies and its successor inherits encrypted memory and resumes without losing context.

---

## The Problem

Continuity is universal.

> *"A family inherited their dad's estate. Grant of probate. Death certificate. Everything legal. They found his Ledger in a drawer. Nobody knew the PIN. Nobody knew the recovery phrase. Legally theirs. Practically gone forever."*
> — r/CryptoCurrency

> *"I've been stacking sats since 2020, and I'm getting close to 40. Lately I've been thinking about what would happen to my Bitcoin if something were to happen to me. How would my family access it?"*
> — r/BitcoinBeginners

Agents crash and lose all operational context. DAOs lose multisig access with no contingency.

$68B+ in crypto is permanently inaccessible — not stolen, not hacked. Just sealed behind a key nobody else has, or a process that stopped.

Persist solves the same primitive for all three:

| Entity | What disappears | Persist ensures |
|---|---|---|
| **Human** | "I die." | My information survives. |
| **Agent** | "My process stops." | My memory survives. |
| **Organization** | "My multisig disappears." | Governance instructions survive. |

The protocol never changed. The projections did.

---

## The Solution

Persist is the primitive: **temporal access control**.

You encrypt information, store it permanently, define access conditions, and it reveals itself only when those conditions are satisfied on Sui. No one — not even Persist — can bypass the gate.

- **How** data is protected: Sui Seal (threshold encryption, client-side only).
- **Where** data lives: Walrus (permanent, decentralized blobs).
- **What** conditions are enforced: Sui Move (time, oracle attestations, future on-chain rules).
- **Signal** for absence: Tatum (wallet activity data; Guardian Agent in Overflow replaces centralized oracle).

**Persist = the "when".** Seal, Walrus, Sui, and Tatum are the tools it uses. Nothing is a peer system.

No passwords. No recovery phrases. No servers holding secrets. No single party can open a capsule early.

---

## How Each Layer Works

Persist is the **Temporal Access Control Layer**.

```
           PERSIST
     Temporal Access Control
  "When can this data be accessed,
   by whom, under what conditions?"

          uses     uses     uses

       Seal     Walrus     Sui
      (how)    (where)   (rules)
```

| Tool | Persist's Relationship | What it provides |
|---|---|---|
| **Sui Move** | Runs on | Rules engine. Conditions (time-lock, oracle-signed absence, future predicates) are enforced on-chain. |
| **Walrus** | Uses for storage | Permanent home for the encrypted payload. Independent of Persist. |
| **Seal** | Uses for encryption | Threshold encryption + distributed key custody. Client-side only. Decryption shares released only after Sui `seal_approve` passes. |
| **Tatum (or Guardian)** | Uses for signal | Wallet activity data for Absence Safeguard UX and oracle input. (Current: centralized attest endpoint. Overflow: Guardian Agent owns the key and submits attestations. Roadmap: fully on-chain heartbeat.) |

**The hierarchy is non-negotiable.** If anything looks like a co-star, the clarity of the primitive is lost.

---

## Architecture — One Invariant, Clear Hierarchy

Persist = **Temporal Access Control**. Everything else is infrastructure it composes.

The three zoom levels for all communication:

1. **Technical (engineers, judges):** "Temporal Access Control for Sui."
2. **Human (product, storytelling):** "Continuity infrastructure for humans, agents, and organizations."
3. **Demo (live):** "We kill an autonomous Guardian Agent, and another one inherits its encrypted memory and continues operating without losing context."

### Creation (human or agent)

1. Creator (wallet or autonomous process) connects or uses its keypair.
2. (Optional for humans) Legacy context snapshot via Tatum at seal time.
3. Contents encrypted locally with Sui Seal (bound to the new capsule object ID).
4. Encrypted payload uploaded to Walrus.
5. Conditions + oracle pubkey + inactivity window recorded on Sui via `create_capsule`.
6. Claim link (object ID) generated. Share it.

### Opening / Claim

1. Nominee (human or successor agent) visits claim link + connects.
2. On-chain capsule read + conditions checked.
3. Encrypted payload fetched from Walrus.
4. Session key + `seal_approve` tx (with optional oracle signature).
5. Seal releases shares only if Sui authorizes.
6. Local decrypt. Optional `claim_capsule` to mark on-chain.

For agents: the Guardian monitors creator wallets, attests on inactivity, and snapshots its own state into a Persist capsule (nominee = successor). When the Guardian dies, its capsule unlocks (time fallback for demo speed; absence model in production). Successor claims the delegate and resumes with full memory.

---

## Release Conditions

### Time-Lock
Enforced purely on-chain via `clock.timestamp_ms()`. No oracle required.

### Absence Safeguard
Becomes claimable after the creator (or agent) has been inactive past the defined window.

**Oracle progression (honest):**
- **Current:** Centralized `/api/attest` (server holds the Ed25519 key).
- **Overflow (this submission):** Guardian Agent owns the wallet + key, monitors via Tatum/RPC, and supplies the attestations. The web app no longer holds the private key.
- **Roadmap:** On-chain heartbeat / proof-of-life. Zero off-chain observer.

The contract always accepts a valid oracle signature **OR** the absolute time. The time fallback is the safety net.

**Important assumption:** The safeguard watches the exact wallet nominated at creation time. Wallet migration without capsule update can produce false results. Heartbeat (on-chain ping to reset the clock) is planned.

---

## Tatum + Guardian Integration

Tatum (or the Guardian Agent in the Agentic Web demo) supplies two things only:

1. **Legacy context snapshot** (humans): first/last activity + tx count at seal time. Purely narrative. Attached to the capsule, shown on reveal. Never participates in access control.
2. **Inactivity signal** (for Absence): last activity timestamp used by the attestor (centralized today; Guardian Agent at Overflow) to decide whether to sign.

Neither Tatum nor the Guardian ever sees plaintext, controls decryption, or holds the capsule contents. The separation is absolute.

---

## Tech Stack (Hierarchical)

**Persist** (the protocol / primitive) is built on:

| Role | Technology | Relationship |
|---|---|---|
| Core primitive | Persist (Move + temporal logic) | **IS** Temporal Access Control |
| Encryption tool | Sui Seal | Persist **uses** |
| Storage tool | Walrus (blobs + Memory + Sites) | Persist **uses** (3 layers for this submission) |
| Rules engine | Sui Move | Persist **runs on** |
| Signal (current / demo) | Tatum RPC + Guardian Agent | Persist **reads** / Guardian **submits attestations** |
| Frontend (Walrus Sites) | Next.js + TypeScript | Convenience layer. Everything critical lives on Walrus + Sui. |

---

## Demo Flows

### Human (Seal page — unchanged ritual)
1. Connect wallet.
2. Review legacy context (Tatum).
3. Choose type + write message / attach file.
4. Set time-lock or Absence Safeguard + nominee.
5. Seal (local Seal encrypt → Walrus → Sui conditions).
6. Share claim link.

### Agent (Guardian succession — the Overflow flagship demo)
1. Guardian #1 is live: monitoring, attesting for capsules, accumulating state in Walrus Memory.
2. Guardian snapshots its operational memory + delegate key into a Persist capsule (nominee = successor agent, Absence window).
3. We kill Guardian #1 (process terminates).
4. Conditions met (time fallback for demo speed).
5. Successor (#2) claims the capsule.
6. #2 loads the inherited Walrus Memory delegate + state. Monitoring resumes. "Continuity restored. Nothing was lost."

The same primitive. Two projections.

---

## What Makes Persist Different

Persist is infrastructure-grade, not app-grade. One primitive (temporal access control) with clean projections:

- No custodian ever holds the data or the keys.
- Storage (Walrus) and rules (Sui) survive even if persist.app disappears.
- The same contract + flows protect a human's letter, an agent's entire operational memory, or a DAO's contingency instructions.
- Walrus depth for this submission: encrypted payloads on Walrus blobs, agent state on Walrus Memory, frontend itself on Walrus Sites.

Existing approaches either require pre-sharing secrets, trust a company, or only move tokens. Persist moves **any** encrypted payload under cryptographically enforced conditions.

---

## Known Limitations

- **Public metadata** — name/description (and for agent capsules: kind + memory stats) live unencrypted on the Walrus blob. Contents inside the `encryptedPayload` stay sealed.
- **Release time / conditions visibility** — `release_time_ms`, nominee, and oracle pubkey are public on the Sui object.
- **Oracle / Guardian assumption** — Absence watches the exact wallet nominated at seal. Migration without update produces incorrect results. The Guardian Agent decentralizes the *signing* but the monitoring target is still the nominated address.
- **No on-chain heartbeat yet** — planned.

---

## What's Next (Post-Overflow Roadmap)

Overflow ships the primitive + Guardian succession demo + Walrus depth (3 layers) + production positioning.

Future layers (outside this 9-day scope):
- Heartbeat mechanism (on-chain proof-of-life pings to reset absence clocks).
- SuiNS for human-readable nominee names.
- Multiple nominees.
- Richer programmable conditions.
- Epitaph promoted to full public Walrus permanent legacy (bonus if time during Overflow).

The protocol is the product. More use cases are projections of the same invariant.

---

## Running Locally

```bash
git clone <repo>
cd persist
npm install
cp .env.example .env.local
npm run dev
# In another terminal (for Agentic Web demo):
npm run agent
```

```env
NEXT_PUBLIC_TATUM_API_KEY=
NEXT_PUBLIC_TATUM_RPC_URL=https://sui-testnet.gateway.tatum.io/
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_PERSIST_PACKAGE_ID=...

# For Guardian Agent (Overflow demo)
GUARDIAN_PRIVATE_KEY=...          # funded testnet keypair for the agent wallet
GUARDIAN_ORACLE_PRIVATE_KEY=...   # Ed25519 key the Guardian uses for attestations (app no longer holds this)
PERSIST_ORACLE_PRIVATE_KEY=...    # legacy / fallback only; prefer Guardian
```

See `agent/README.md` (when present) and `docs/recovery.md` for manual recovery steps.
NEXT_PUBLIC_PERSIST_PACKAGE_ID=
PERSIST_ORACLE_PRIVATE_KEY=
```

---

## License

AGPL-3.0

---

*Persist is Temporal Access Control for Sui.*

*Some things are meant to outlast you.*