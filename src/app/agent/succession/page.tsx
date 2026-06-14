// src/app/agent/succession/page.tsx
// PERSIST V3 — Agent Succession Page
// The demo-critical page. Three panels: dormant agent | crack | active successor
// This is the moment judges remember.

'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { AmberDroplet, PersistLogo } from '@/components/AmberDroplet'
import styles from './succession.module.css'

// ============================================================
// TYPES
// ============================================================

type SuccessionPhase =
  | 'idle'         // Page loaded, capsule sealed, waiting
  | 'claiming'     // Successor wallet connected, tx in flight
  | 'cracking'     // Amber crack animation playing
  | 'flowing'      // Emerald light flowing right
  | 'complete'     // Succession done, log filling in

interface LogEntry {
  type:    'inherited' | 'resumed' | 'system'
  text:    string
  delay:   number   // ms delay before appearing
}

interface AgentSnapshot {
  name:          string
  wallet:        string
  status:        'dormant' | 'active'
  uptime?:       string
  lastHeartbeat: string
  memoryEntries: number
  capsulesWatched: number
  lastAttestation: string
  capsuleId:     string
  blobId:        string
}

// ============================================================
// DATA
// Replace capsuleId / blobId with real on-chain values at deploy
// ============================================================

const AGENT_1: AgentSnapshot = {
  name:            'Guardian Agent #1',
  wallet:          'guardian.sui',
  status:          'dormant',
  lastHeartbeat:   '73h ago',
  memoryEntries:   847,
  capsulesWatched: 12,
  lastAttestation: '3 days ago',
  capsuleId:       '0x7a3f…c91d',
  blobId:          'bafyreib…xq2m',
}

const AGENT_2: AgentSnapshot = {
  name:            'Guardian Agent #2',
  wallet:          'guardian-2.sui',
  status:          'active',
  uptime:          'just now',
  lastHeartbeat:   'just now',
  memoryEntries:   847,
  capsulesWatched: 12,
  lastAttestation: 'inherited',
  capsuleId:       '0x2bd1…4e02',
  blobId:          'bafyreid…am7k',
}

const LOG_ENTRIES: LogEntry[] = [
  { type: 'system',    text: 'Capsule 0x7a3f…c91d — conditions verified on-chain',  delay: 200  },
  { type: 'system',    text: 'Seal key released to guardian-2.sui',                  delay: 600  },
  { type: 'system',    text: 'Walrus blob decrypted — payload verified',              delay: 1000 },
  { type: 'inherited', text: 'Capsule 0x9c4a…01f7 — monitored since 14d ago',        delay: 1500 },
  { type: 'inherited', text: 'Capsule 0x3ef2…88ba — monitored since 7d ago',         delay: 1900 },
  { type: 'inherited', text: 'Capsule 0x1d22…f3c1 — monitored since 3d ago',         delay: 2300 },
  { type: 'inherited', text: 'Capsule 0x6c09…e2b4 — monitored since 1d ago',         delay: 2700 },
  { type: 'inherited', text: 'Last attestation context loaded',                       delay: 3100 },
  { type: 'inherited', text: `${AGENT_1.memoryEntries} Walrus Memory entries loaded`, delay: 3500 },
  { type: 'resumed',   text: 'Tatum RPC connection established',                      delay: 4000 },
  { type: 'resumed',   text: `Monitoring active — ${AGENT_1.capsulesWatched} capsules under watch`, delay: 4400 },
  { type: 'resumed',   text: 'Self-snapshot capsule created — guardian-3.sui designated', delay: 4900 },
]

// ============================================================
// AGENT PANEL — Left (dormant) and Right (active)
// ============================================================

function AgentPanel({
  agent,
  side,
  phase,
}: {
  agent:  AgentSnapshot
  side:   'left' | 'right'
  phase:  SuccessionPhase
}) {
  const isDormant  = agent.status === 'dormant'
  const isRevealed = side === 'right' && (phase === 'complete' || phase === 'flowing')
  const isVisible  = side === 'left' || phase !== 'idle'

  return (
    <div
      className={`
        ${styles.agentPanel}
        ${isDormant ? styles.agentPanelDormant : styles.agentPanelActive}
        ${side === 'right' && phase === 'idle' ? styles.agentPanelHidden : ''}
        ${isRevealed ? styles.agentPanelRevealed : ''}
      `}
    >
      {/* Panel header */}
      <div className={styles.panelHeader}>
        <div className={styles.panelHeaderLeft}>
          <AmberDroplet
            size="sm"
            state={isDormant ? 'dormant' : 'revealed'}
            animated={!isDormant}
          />
          <div>
            <div className={styles.panelName}>{agent.name}</div>
            <div className={styles.panelWallet}>{agent.wallet}</div>
          </div>
        </div>

        <div className={styles.panelStatus}>
          {isDormant ? (
            <span className="badge badge--dormant">
              <span className="status-dot status-dot--dormant" />
              DORMANT
            </span>
          ) : (
            <span className="badge badge--active">
              <span className="status-dot status-dot--active" />
              ACTIVE
            </span>
          )}
        </div>
      </div>

      {/* Data rows */}
      <div className={styles.panelData}>
        <div className="data-row">
          <span className="data-row__label">Last heartbeat</span>
          <span
            className="data-row__value"
            style={{ color: isDormant ? 'var(--stone-500)' : 'var(--emerald-deep)' }}
          >
            {agent.lastHeartbeat}
          </span>
        </div>

        <div className="data-row">
          <span className="data-row__label">Memory entries</span>
          <span
            className="data-row__value"
            style={{ color: isDormant ? 'var(--stone-600)' : 'var(--emerald-deep)' }}
          >
            {agent.memoryEntries.toLocaleString()}
            {!isDormant && phase === 'complete' && (
              <span className={styles.inheritedTag}>inherited</span>
            )}
          </span>
        </div>

        <div className="data-row">
          <span className="data-row__label">Capsules watched</span>
          <span className="data-row__value">
            {agent.capsulesWatched}
          </span>
        </div>

        <div className="data-row">
          <span className="data-row__label">Last attestation</span>
          <span
            className="data-row__value"
            style={{ color: isDormant ? 'var(--stone-500)' : 'var(--stone-700)' }}
          >
            {agent.lastAttestation}
          </span>
        </div>

        <div className="data-row">
          <span className="data-row__label">Own capsule</span>
          <span className="data-row__value" style={{ fontSize: '0.7rem' }}>
            {agent.capsuleId}
          </span>
        </div>

        <div className="data-row">
          <span className="data-row__label">Blob ID</span>
          <span className="data-row__value" style={{ fontSize: '0.65rem', color: 'var(--stone-500)' }}>
            {agent.blobId}
          </span>
        </div>
      </div>

      {/* Active agent: uptime indicator */}
      {!isDormant && phase === 'complete' && (
        <div className={styles.panelUptime}>
          <span className="status-dot status-dot--active" />
          <span className="text-mono-label" style={{ color: 'var(--emerald-deep)' }}>
            Online — monitoring active
          </span>
        </div>
      )}

      {/* Dormant agent: final state note */}
      {isDormant && (
        <div className={styles.panelFinal}>
          <span className="text-mono-label">
            Process terminated · State preserved in capsule
          </span>
        </div>
      )}
    </div>
  )
}

// ============================================================
// CENTER CRACK PANEL
// ============================================================

function CrackPanel({
  phase,
  onClaim,
}: {
  phase:   SuccessionPhase
  onClaim: () => void
}) {
  return (
    <div className={styles.crackPanel}>

      {/* The capsule that holds Agent #1's state */}
      <div className={styles.crackCapsuleWrap}>
        <div
          className={`
            ${styles.crackCapsule}
            ${phase === 'cracking' || phase === 'flowing' || phase === 'complete'
              ? styles.crackCapsuleOpen
              : ''}
          `}
        >
          <AmberDroplet
            size="lg"
            state={
              phase === 'idle'     ? 'sealed'    :
              phase === 'claiming' ? 'approaching':
              'revealed'
            }
            showCracks={phase === 'claiming' || phase === 'cracking' || phase === 'flowing' || phase === 'complete'}
            animated
          />
        </div>

        {/* Emerald flow — plays during flowing phase */}
        {(phase === 'flowing' || phase === 'complete') && (
          <div className={styles.emeraldFlow}>
            <div className={styles.emeraldFlowLine} />
            <div className={styles.emeraldParticles}>
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className={styles.particle}
                  style={{ animationDelay: `${i * 80}ms` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Capsule metadata */}
      <div className={styles.crackMeta}>
        <div className="text-mono-label" style={{ marginBottom: '0.25rem' }}>
          Agent Succession Capsule
        </div>
        <div className="text-mono" style={{ color: 'var(--stone-600)' }}>
          {AGENT_1.capsuleId}
        </div>
        <div className="text-mono" style={{ color: 'var(--stone-400)', fontSize: '0.65rem' }}>
          {AGENT_1.blobId}
        </div>
      </div>

      {/* Action button — changes with phase */}
      <div className={styles.crackAction}>
        {phase === 'idle' && (
          <>
            <p className={styles.crackInstructions}>
              Guardian Agent #1 has been inactive for 73 hours.<br />
              Absence window exceeded. Capsule conditions met.
            </p>
            <button className="btn btn--primary" onClick={onClaim}>
              Connect Successor Wallet
            </button>
            <p className="text-mono-label" style={{ marginTop: '0.75rem', color: 'var(--stone-400)' }}>
              Connect as guardian-2.sui to claim
            </p>
          </>
        )}

        {phase === 'claiming' && (
          <div className={styles.claimingState}>
            <div className={styles.claimingSpinner} />
            <span className="text-mono-label">
              Verifying on-chain conditions…
            </span>
          </div>
        )}

        {phase === 'cracking' && (
          <div className={styles.claimingState}>
            <div className={styles.claimingSpinner} style={{ borderTopColor: 'var(--amber-glow)' }} />
            <span className="text-mono-label">
              Seal key released · Decrypting payload…
            </span>
          </div>
        )}

        {(phase === 'flowing' || phase === 'complete') && (
          <div className={styles.completeState}>
            <span className={styles.completeCheck}>✓</span>
            <span className="text-mono-label" style={{ color: 'var(--emerald-deep)' }}>
              Succession complete
            </span>
          </div>
        )}
      </div>

    </div>
  )
}

// ============================================================
// INHERITANCE LOG
// ============================================================

function InheritanceLog({ phase }: { phase: SuccessionPhase }) {
  const [visibleEntries, setVisibleEntries] = useState<LogEntry[]>([])
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (phase !== 'complete') {
      setVisibleEntries([])
      return
    }

    // Reveal each log line with its delay
    const timers = LOG_ENTRIES.map(entry =>
      setTimeout(() => {
        setVisibleEntries(prev => [...prev, entry])
        // Auto-scroll log
        if (logRef.current) {
          logRef.current.scrollTop = logRef.current.scrollHeight
        }
      }, entry.delay)
    )

    return () => timers.forEach(clearTimeout)
  }, [phase])

  if (phase !== 'complete' && visibleEntries.length === 0) return null

  return (
    <div className={styles.log} ref={logRef}>
      <div className={styles.logHeader}>
        <span className="text-mono-label">Succession Log</span>
        <span className={styles.logLive}>
          <span className="status-dot status-dot--active" />
          Live
        </span>
      </div>

      <div className={styles.logEntries}>
        {visibleEntries.map((entry, i) => (
          <div
            key={i}
            className={`${styles.logEntry} ${styles[`logEntry--${entry.type}`]} animate-log-line`}
          >
            <span className={styles.logTag}>
              {entry.type === 'inherited' && '[INHERITED]'}
              {entry.type === 'resumed'   && '[RESUMED]  '}
              {entry.type === 'system'    && '[SYSTEM]   '}
            </span>
            <span className={styles.logText}>{entry.text}</span>
          </div>
        ))}

        {/* Blinking cursor while log is filling */}
        {phase === 'complete' && visibleEntries.length < LOG_ENTRIES.length && (
          <div className={styles.logCursor}>_</div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// PAGE
// ============================================================

export default function SuccessionPage() {
  const [phase, setPhase] = useState<SuccessionPhase>('idle')

  // Orchestrate the phase transitions when "Claim" is pressed
  function handleClaim() {
    setPhase('claiming')

    setTimeout(() => setPhase('cracking'),  1800)
    setTimeout(() => setPhase('flowing'),   3200)
    setTimeout(() => setPhase('complete'),  4200)
  }

  // Reset for demo purposes
  function handleReset() {
    setPhase('idle')
  }

  const isComplete = phase === 'complete'

  return (
    <div className={`agent-context ${styles.page}`}>

      {/* Header */}
      <div className={styles.pageHeader}>
        <div className="container">
          <div className={styles.headerTop}>
            <div>
              <Link href="/agent" className={styles.backLink}>
                ← Guardian Agent
              </Link>
              <p className="text-section-label" style={{ marginBottom: '0.5rem', marginTop: '0.75rem' }}>
                Agent Succession
              </p>
              <h1
                className="text-display-sm"
                style={{ color: 'var(--amber-light)' }}
              >
                {isComplete
                  ? 'Continuity restored. Nothing was lost.'
                  : 'Succession Protocol'
                }
              </h1>
            </div>

            {isComplete && (
              <button
                className="btn btn--secondary"
                onClick={handleReset}
                style={{ borderColor: 'var(--agent-border)', color: 'var(--stone-400)' }}
              >
                Reset Demo
              </button>
            )}
          </div>

          {/* Step indicator */}
          <div className={styles.steps}>
            {[
              { label: 'Agent inactive',    active: true },
              { label: 'Capsule conditions met', active: phase !== 'idle' },
              { label: 'Successor claims',  active: phase === 'cracking' || phase === 'flowing' || phase === 'complete' },
              { label: 'Memory inherited',  active: phase === 'flowing'  || phase === 'complete' },
              { label: 'Monitoring resumed',active: phase === 'complete' },
            ].map((step, i) => (
              <div key={i} className={`${styles.step} ${step.active ? styles.stepActive : ''}`}>
                <div className={styles.stepDot} />
                <span className="text-mono-label">{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Three-panel layout */}
      <div className="container">
        <div className={styles.panels}>

          {/* LEFT — dormant agent */}
          <AgentPanel agent={AGENT_1} side="left" phase={phase} />

          {/* CENTER — crack + claim */}
          <CrackPanel phase={phase} onClaim={handleClaim} />

          {/* RIGHT — active successor */}
          <AgentPanel agent={AGENT_2} side="right" phase={phase} />

        </div>

        {/* Inheritance log — appears after succession */}
        <InheritanceLog phase={phase} />

        {/* Post-succession: link to agent dashboard */}
        {isComplete && (
          <div className={styles.postSuccession}>
            <Link href="/agent" className="btn btn--agent">
              View Agent Dashboard →
            </Link>
            <Link href="/vault" className="btn btn--secondary" style={{ borderColor: 'var(--agent-border)', color: 'var(--stone-400)' }}>
              View Vault
            </Link>
          </div>
        )}
      </div>

    </div>
  )
}
