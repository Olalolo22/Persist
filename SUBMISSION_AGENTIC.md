# Sui Overflow 2026 — Agentic Web Track Submission

**Project:** Persist

**One-liner (social / form):**  
Persist ensures continuity when humans, agents, or organizations disappear.

**Technical truth (for engineers):**  
"Temporal Access Control for Sui."

**Demo truth (the moment judges will remember):**  
"We kill an autonomous Guardian Agent, and another one inherits its encrypted memory and continues operating without losing context."

## The Story
Persist is the Continuity Protocol for Sui.

It adds one primitive to the stack: **when** encrypted data can be accessed. Not what is stored. Not how it is encrypted. Not where it lives. Just when, and under what conditions.

The Guardian Agent demo proves the agent projection:
- A simple autonomous process with its own wallet.
- It monitors capsule creators via Tatum/Sui RPC.
- It attests on inactivity (replacing the old centralized oracle).
- It stores operational context in Walrus Memory.
- It periodically snapshots its own state into a Persist capsule with an Absence Safeguard, nominating a successor.
- When the Guardian is killed, the capsule unlocks. The successor claims it, receives the Walrus Memory delegate, and resumes monitoring with zero context loss.

"The agent that ensures continuity ensures its own continuity."

## Walrus Integration (for this track)
- Encrypted capsule payloads stored as Walrus blobs (via Seal).
- Guardian Agent operational state stored in Walrus Memory (MemWal).
- Frontend itself deployed on Walrus Sites (see separate Walrus track submission for depth).

## Technical Details
- Move contract: `PersistCapsule` (time-lock + hybrid oracle/time Absence Safeguard + `seal_approve` gate).
- Encryption: Sui Seal (threshold 2, client-side only).
- Storage: Walrus (permanent blobs + Memory for agents).
- Oracle: Now decentralized via the Guardian Agent (Ed25519 attestations served from the agent process).
- Agent runtime: Pure Node.js/TypeScript process with @mysten/sui keypair + @mysten-incubation/memwal. No LLM, no framework, no swarm.

## Live Demo (6 exact steps)
1. Guardian #1 is running (status, memory feed, self-protection capsule visible).
2. It creates its self-protection Persist capsule (real on-chain object + Walrus blob).
3. We kill the Guardian process.
4. Conditions met (time fallback for speed; Absence model in production).
5. Successor wallet claims the capsule.
6. Successor loads the Walrus Memory delegate and resumes operation. New entries appear. "Continuity restored. Nothing was lost."

See `/agent` and `/agent/succession` in the live app (and the real agent at `npm run agent`).

## Why This Wins the Agentic Web Track
- Nobody else is building infrastructure for *agent* continuity.
- The recursive story is memorable and technically deep.
- Real on-chain + real Walrus Memory inheritance, not a toy simulation.
- Honest architecture (current centralized → Guardian in this submission → future on-chain heartbeat).

**The sentence judges will remember:**  
"The amber cracked. The successor inherited. Monitoring resumed."

Repository: https://github.com/Olalolo22/Persist (or the deployed Walrus Site URL)
