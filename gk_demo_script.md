# Persist - Guardian Agent Succession Demo Script
## Sui Overflow 2026 (Agentic Web + Walrus Tracks)

**Total runtime target:** 2:30 – 3:00 minutes (tight, memorable, judge-friendly)

**Key phrases to hit (exactly as per v2.1 creative direction):**
- "Persist is a Continuity Protocol."
- "Temporal Access Control for Sui."
- "The agent that ensures continuity ensures its own continuity."
- "Persist ensures continuity when humans, agents, or organizations disappear."
- Final payoff: "The amber cracked. The successor inherited. Monitoring resumed." + "Continuity restored. Nothing was lost."

**Tone:** Powerful, quiet confidence, infrastructure-grade. Not hype. Not morbid. Warm amber visuals + emerald agent signal.

**Setup before filming (do this live or in B-roll):**
- Terminal 1: `npm run agent` (with proper .env – Guardian wallet funded, MemWal creds, SUCCESSOR_ADDRESS set, etc.)
- Browser tabs ready: 
  - http://localhost:3000/agent (or the deployed Walrus Site)
  - http://localhost:3000/agent/succession
  - One tab for the live agent console
- Second wallet ready as "Successor" (different keypair, funded on testnet)
- Camera/phone for terminal kill shot
- Screen recording of browser + terminal side-by-side

---

## Pre-roll / Title (0:00 – 0:15)

**Visuals:**
- Quick cuts: Amber droplet logo pulsing with emerald inner glow.
- Hero on landing page: "PERSIST – Some things are meant to outlast you. The Continuity Layer for Sui."
- Three use-case cards (People / Agents / Organizations) – focus on the middle card "🤖 For Agents".
- Cut to Guardian dashboard: Status ACTIVE, memory feed scrolling, self-protection capsule visible.

**Voiceover / On-screen text:**
"Persist is Temporal Access Control for Sui.

We don't store data. We decide *when* encrypted data can be accessed – with no gatekeeper.

Today we show what that means for agents."

**On-screen lower third:**
"PERSIST | Continuity Protocol for Sui | Sui Overflow 2026"

---

## Step 1: Guardian #1 is operating (0:15 – 0:35)

**Visuals:**
- Split screen: Left = terminal running `npm run agent` (logs showing monitoring, memory writes).
- Right = Browser /agent page.
- Live status: "ACTIVE", wallet address, "Memory Entries: 847", "Capsules Monitored: 12".
- Scrolling Walrus Memory feed (real entries appearing).
- Bottom section: "Guardian's Own Capsule: [live ID from status]" with emerald pulse.

**Voiceover:**
"This is the Guardian Agent.

A simple autonomous process. No LLM. No swarm. Just a wallet and four jobs:

It monitors capsule creators for inactivity.
It attests when conditions are met.
It remembers everything in Walrus Memory.
And it protects its own continuity by sealing its state into a Persist capsule."

**Action / Text overlay:**
"Real agent process running live"

---

## Step 2: Guardian creates self-protection capsule (0:35 – 0:55)

**Visuals:**
- Terminal shows snapshot log: "Created self-protection capsule: 0x2bd1..."
- Browser /agent page updates in real time (if polling) or refresh shows the new capsule ID in the self-protection box.
- Optional: Quick cut to on-chain explorer or Sui wallet showing the new PersistCapsule object (creator = Guardian wallet, nominee = Successor address, oracle_pubkey = Guardian's key).

**Voiceover:**
"Every few minutes the Guardian snapshots its entire state – its monitoring log, its memory delegate key, everything – and seals it inside a Persist capsule.

The nominee on that capsule is a second agent wallet: the successor.

If this Guardian ever disappears, the capsule unlocks and the successor can inherit the entire memory space."

**On-screen callout:**
"Real PersistCapsule on Sui • Real Walrus blob • Real Absence Safeguard"

---

## Step 3: Guardian #1 is terminated (0:55 – 1:10)

**Visuals:**
- Dramatic: Terminal window with the running agent.
- Operator says "Now we kill it."
- Ctrl+C (or actual `kill` command) in terminal.
- Agent logs stop.
- Browser /agent page still shows old status for a moment, then we cut to "TERMINATED" simulation or refresh shows the process is dead.
- Emphasize: the self-capsule remains on-chain and claimable.

**Voiceover:**
"Now we kill the Guardian.

The process is gone. No more monitoring. No more memory writes.

But its last state is already sealed on Sui and Walrus – protected by Persist."

**Action overlay (big text):**
"Process terminated. Real kill."

---

## Step 4: Conditions become valid (1:10 – 1:25)

**Visuals:**
- /agent/succession page or the self-protection section.
- Time-lapse or simple countdown graphic showing the short demo window elapsing (or just note that the hard time fallback is now valid).
- In the real demo you can wait the short window you set in env, or rely on the time component of the hybrid condition.
- Show the capsule object now satisfying the release condition on-chain.

**Voiceover:**
"The absence window (or the absolute time fallback) is now satisfied.

The capsule the Guardian sealed for itself is claimable.

No one can stop the successor from taking it."

---

## Step 5: Successor #2 claims the capsule (1:25 – 1:45)

**Visuals:**
- Switch to successor wallet connected in the browser.
- Go to /agent/succession or directly to /claim/{selfCapsuleId} (the ID that was shown earlier).
- Perform the real claim flow:
  - Connect successor wallet.
  - Verify conditions (the page shows it's ready).
  - Decrypt via Seal.
  - After successful decrypt, the claim page shows the special agent message: "🤖 Agent continuity capsule. Memory delegate and operational state inherited."
- Cut back to the succession page showing "Step 5 complete – delegate received."

**Voiceover:**
"The successor – a completely separate wallet and process – connects and claims the capsule.

It decrypts the payload using Seal.

Inside is the delegate key for the Guardian's Walrus Memory space."

**On-screen:**
"Real transaction • Real Seal decrypt • Real delegate key"

---

## Step 6: Successor loads memory + resumes (1:45 – 2:10)

**Visuals:**
- Successor starts its own `npm run agent` (or the demo shows the "resume" action).
- /agent page (now acting as successor) shows memory loading.
- New entries appear in the feed: "Monitoring resumed under successor identity".
- Show the count increasing again.
- Final shot: Both the old (dead) terminal and the new successor terminal side-by-side, plus the browser showing continued operation.

**Voiceover:**
"The successor loads the inherited memory.

It now knows every capsule it was monitoring, every attestation it made, its entire operational history.

Monitoring resumes. New memory entries are written.

The system continues as if nothing happened."

**Final on-screen text (big, amber + emerald):**
"Continuity restored. Nothing was lost."

---

## Closing / Tag (2:10 – 2:30)

**Visuals:**
- Quick recap montage:
  - Amber droplet cracking, emerald light escaping.
  - Guardian dashboard → killed → successor dashboard with memory continuing.
  - Three use-case cards ending on the Agent card.
  - Walrus logos + "3 layers" graphic (blobs + Memory + Sites).

**Voiceover:**
"Persist is Temporal Access Control for Sui.

One primitive. Three projections.

When an agent disappears, its memory survives.

When a person disappears, their instructions survive.

When an organization disappears, its governance survives.

We kill the Guardian. The successor inherits. Monitoring resumes.

The amber cracked. The glow escaped. Another capsule sealed around it."

**End card:**
PERSIST
The Continuity Layer for Sui
github.com/Olalolo22/Persist
[Deployed Walrus Site URL]

**Music:** Subtle, warm, reverent – fades on the final line.

---

## Production Notes

**Must-show real elements (judges will check):**
- Real on-chain PersistCapsule object ID for the self-protection capsule.
- Real Walrus blob for the agent state.
- Actual process kill (terminal visible).
- Actual claim transaction from the successor wallet.
- Memory entries visibly increasing after "resume".

**B-roll ideas:**
- Close-up of amber visuals pulsing.
- On-chain explorer showing the capsule.
- Walrus dashboard or aggregator confirming the blob.
- Side-by-side terminals before/after kill.

**Backup plan if live agent is flaky:**
Have a pre-recorded clean run of steps 1-2 and 4-6, then do the live kill on camera.

**File naming for export:**
`Persist_Guardian_Succession_Demo_Overflow2026.mp4`

---

**End of script.**

This script is designed to be shot in one continuous take where possible, with clear chapter markers for editing. It directly delivers the "one moment judges will remember" from the creative direction while proving the technical depth required for both tracks.