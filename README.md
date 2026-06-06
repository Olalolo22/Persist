# Persist

## Some things matter too much to disappear with you.

Persist is a trustless digital inheritance protocol built on Sui.

Place sensitive records, final instructions, credentials, recovery information, personal messages, or file attachments inside a cryptographically sealed capsule. The capsule remains inaccessible until predefined release conditions are met.

No custodian. No administrator. No trusted third party. Not even Persist can open it early.

Built for the Tatum × Walrus Hackathon 2026.

---

## The Problem

> *"A family inherited their dad's estate. Grant of probate. Death certificate. Everything legal. They found his Ledger in a drawer. Nobody knew the PIN. Nobody knew the recovery phrase. Legally theirs. Practically gone forever."*
> — r/CryptoCurrency

This is not an edge case. Across every crypto community, the same question surfaces:

> *"I've been stacking sats since 2020, and I'm getting close to 40. Lately I've been thinking about what would happen to my Bitcoin if something were to happen to me. How would my family access it?"*
> — r/BitcoinBeginners

The answers point to the same solution that has never existed — until now:

> *"In the future, solutions like Bitcoin Vaults and covenants will allow more complicated smart contracts — dead man's switches, time delays, conditions that must be met. Thus you can mathematically enforce your wishes after you pass away."*
> — Top comment, r/BitcoinBeginners

And one project came close to naming the vision exactly:

> *"The wallet gets locked, will reject any future deposit and 'answer' with an epitaph... your last words recorded on-chain that you can configure when you create the wallet."*
> — r/smartcontracts

Persist builds this. On Sui. Today.

---

## The Solution

Persist creates a cryptographically sealed capsule that can only be opened by an intended recipient after predefined release conditions are satisfied.

- Contents are **encrypted locally in the browser** using Sui Seal — nothing leaves your device unencrypted.
- The encrypted capsule is **preserved permanently on Walrus** — independent of Persist.
- Release conditions are **recorded on Sui** — enforced by the chain, not by us.
- Decryption is **authorized by Seal's distributed key servers** — shares only release when the on-chain check passes.
- A **legacy context snapshot** reconstructed via Tatum is attached to the capsule and shown to the recipient when it opens.

No passwords. No recovery phrases. No servers holding secrets. No human intermediary required.

---

## How Each Layer Works

| Layer | Role | What it does |
|---|---|---|
| **Sui** | Enforcement | Records release conditions permanently. Verifies recipient and timing on-chain. Cannot be altered after sealing. |
| **Walrus** | Preservation | Stores the encrypted capsule independently of Persist. Survives if this application disappears. |
| **Seal** | Protection | Distributes decryption authority across key servers. Releases shares only when Sui authorization passes. Not even Persist can decrypt early. |
| **Tatum** | Memory | Reconstructs the creator's on-chain history at seal time. Attached to the capsule narrative. Does not affect access or decryption. |

**Tatum enriches. Sui enforces. Seal protects. Walrus preserves.**

---

## Architecture

```
Creator → Encrypt locally with Seal → Preserve on Walrus → Record conditions on Sui → Recipient connects → Seal validates authorization → Contents decrypted in browser
```

### Creation

1. Creator connects a Sui wallet.
2. Tatum reconstructs a legacy context snapshot from on-chain history.
3. Capsule contents (text and optional file attachment) are encrypted locally via Sui Seal — bound to the capsule's object ID.
4. Encrypted bytes are uploaded to Walrus. The blob ID is stored in the Move contract.
5. Release conditions (recipient address + release trigger) are recorded on Sui via `create_capsule`.
6. A shareable claim link containing the capsule object ID is generated.

### Opening

1. Recipient visits the claim link and connects their wallet.
2. The app fetches the capsule from Sui and verifies the release condition.
3. The encrypted payload is retrieved from Walrus.
4. The frontend generates an ephemeral SessionKey and calls Seal to decrypt.
5. Seal's key servers dry-run `seal_approve` on Sui. If the caller matches the nominee address and the release condition is satisfied, decryption shares are released.
6. Contents are decrypted locally in the browser.

---

## Release Conditions

### Time-Lock
The capsule becomes claimable after a fixed date. Enforced by `clock.timestamp_ms()` in the Move contract.

### Absence Safeguard (Dead Man's Switch)
The capsule becomes claimable if the creator's wallet has been inactive past a defined window.

The Absence Safeguard is implemented as a time-lock with a creator-defined window. Tatum's transaction history data provides the UX context — showing the creator's last active date — but the unlock itself is enforced by the absolute release time recorded on Sui. The oracle attestation model is an active area of development toward a fully trustless inactivity trigger.
When the nominee requests to claim, the oracle queries Tatum's `suix_queryTransactionBlocks` to verify inactivity. If confirmed, the oracle signs an Ed25519 attestation of the capsule ID. The Move contract verifies this signature via `sui::ed25519::ed25519_verify` and authorizes decryption.

The original time-lock is always preserved as a hard fallback. Even if the oracle goes permanently offline, the capsule becomes claimable after the absolute release date. No capsule can be permanently bricked.

**A note on the oracle model:** The Absence Safeguard monitors the creator's nominated Sui wallet. Creators should treat this wallet as their primary on-chain identity for the duration of the capsule. If a creator migrates to a new wallet without updating their capsule, the oracle may incorrectly register inactivity. A heartbeat mechanism — allowing creators to ping the contract and reset the inactivity clock — is the next architectural layer.

---

## Tatum Integration

Tatum serves as Persist's memory layer and powers the Absence Safeguard oracle.

**Legacy context** — when a capsule is sealed, Persist executes two parallel `suix_queryTransactionBlocks` calls via the Tatum RPC Gateway:
- A descending query (limit 100) — total transaction count and most recent activity timestamp.
- An ascending query (limit 1) — the creator's first on-chain interaction.

This data is assembled into a Legacy Snapshot displayed to the recipient when the capsule opens.

**Inactivity oracle** — when a nominee attempts to claim via the Absence Safeguard, the `/api/attest` route queries Tatum for the creator's most recent transaction. If the time elapsed exceeds the defined inactivity window, the oracle generates a signed attestation authorizing decryption.

Tatum never controls access permissions, release timing, decryption, or ownership. The separation is intentional.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart contract | Sui Move — `PersistCapsule` shared object with `seal_approve` access gate |
| Cryptography | Sui Seal — threshold encryption, distributed key custody |
| Storage | Walrus — permanent decentralised blob storage |
| RPC + Oracle | Tatum Sui RPC Gateway — transaction history and inactivity verification |
| Frontend | Next.js + TypeScript |

---

## Demo Flow

### Creator
1. Connect wallet.
2. Review legacy context snapshot reconstructed via Tatum.
3. Choose content type (Wallet Recovery, Personal Letter, Document, etc.).
4. Write message and optionally attach a file (PDF, image, or text — up to 5MB).
5. Set release condition: fixed date or Absence Safeguard.
6. Choose recipient wallet address.
7. Seal capsule. Share claim link.

### Recipient
1. Visit claim link and connect wallet.
2. View creator's legacy context.
3. Once release condition is met — open capsule.
4. Message and file attachment decrypted locally in browser.

---

## What Makes Persist Different

Every existing approach breaks under pressure:

- **Paper envelopes and multisig setups** require someone to hold secrets in advance. If that person is the problem, the solution fails.
- **Password-protected archives** mean the password must be shared in advance. If it's known, the lock is meaningless. If it's unknown, the contents are gone.
- **Centralized dead-man switch services** put a company between the creator and recipient. If the company disappears, so does the capsule.

Persist separates preservation, authorization, decryption, and historical context across independent infrastructure layers. No single party controls the outcome. Not even Persist.

---

## Known Limitations

- **Public metadata** — capsule name and description are stored unencrypted on Walrus. Anyone who discovers the blob ID can read this metadata before the capsule unlocks. Only the contents are encrypted.
- **Release time visibility** — `release_time_ms` is a public field on the Sui object. Anyone can see when a capsule is scheduled to unlock.
- **Oracle wallet assumption** — the Absence Safeguard monitors a specific nominated wallet. Creators who migrate wallets without updating their capsule may trigger false inactivity readings.

---

## What's Next

The time-lock and Absence Safeguard primitives are live. The next layers:

- **Heartbeat mechanism** — creators ping the contract periodically to reset the inactivity clock, providing an on-chain proof of life independent of general wallet activity.
- **Nominee notification** — when a capsule is sealed, the nominated wallet receives an on-chain signal that a capsule exists for them. The first time someone hears about Persist may be the day they're told a capsule is waiting.
- **The Epitaph** — a public legacy message preserved on Walrus and recorded on Sui. While capsules are private and intended for a specific recipient, the Epitaph is meant for "everlasting". Write the words you want them to keep forever.
- **Multiple nominees** — distribute capsule access across more than one recipient.

---

## Running Locally

```bash
git clone <repo>
cd persist
npm install
cp .env.example .env.local
npm run dev
```

```env
NEXT_PUBLIC_TATUM_API_KEY=
NEXT_PUBLIC_TATUM_RPC_URL=
NEXT_PUBLIC_PERSIST_PACKAGE_ID=
PERSIST_ORACLE_PRIVATE_KEY=
```

---

## License

AGPL-3.0

---

*Because some things should survive the people who created them.*