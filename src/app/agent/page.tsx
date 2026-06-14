// src/app/agent/page.tsx
// PERSIST V3 — Guardian Agent Dashboard
// Tier 2 minimal: status card, self-protection status, simplified memory feed
// Dark amber context (agent-context class from globals.css)

'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { AmberDroplet, PersistLogo } from '@/components/AmberDroplet'
import styles from './agent.module.css'

// ============================================================
// TYPES
// ============================================================

type AgentStatus = 'active' | 'dormant' | 'starting'

interface MemoryEntry {
  id:        string
  tag:       'MONITOR' | 'ATTEST' | 'SNAPSHOT' | 'INHERIT' | 'SYSTEM'
  text:      string
  timestamp: string
  blobId?:   string
}

interface WatchedCapsule {
  objectId:      string
  creator:       string
  absenceWindow: string
  lastActivity:  string
  status:        'healthy' | 'approaching' | 'triggered'
}

// ============================================================
// SEED DATA
// In production: fetched from the Guardian Agent's own API
// endpoint or directly from Walrus Memory SDK
// ============================================================

const AGENT_STATUS: AgentStatus = 'active'

const AGENT_META = {
  name:            'Guardian Agent #1',
  wallet:          'guardian.sui',
  fullWallet:      '0x7a3f4d92c81b3ef2a5d09c4e7f1b3a98c5d2e076',
  uptime:          '47h 23m',
  startedAt:       '2026-01-10 09:41 UTC',
  capsuleId:       '0x7a3f…c91d',
  blobId:          'bafyreib…xq2m',
  absenceWindow:   '72 hours',
  successor:       'guardian-2.sui',
  lastHeartbeat:   '12m ago',
  nextSnapshot:    'in ~48m',
  memoryEntries:   847,
  attestations:    23,
}

const MEMORY_FEED: MemoryEntry[] = [
  {
    id: '1',
    tag: 'SNAPSHOT',
    text: 'Self-snapshot sealed into capsule 0x7a3f…c91d',
    timestamp: '12m ago',
    blobId: 'bafyreib…xq2m',
  },
  {
    id: '2',
    tag: 'ATTEST',
    text: 'Inactivity confirmed for 0x9c4a…01f7 — attestation submitted',
    timestamp: '3h ago',
  },
  {
    id: '3',
    tag: 'MONITOR',
    text: 'Activity detected for 0x2bd1…4e02 — window reset',
    timestamp: '5h ago',
  },
  {
    id: '4',
    tag: 'MONITOR',
    text: 'Activity detected for 0x3ef2…88ba — window reset',
    timestamp: '8h ago',
  },
  {
    id: '5',
    tag: 'SNAPSHOT',
    text: 'Self-snapshot updated — 834 memory entries committed',
    timestamp: '12h ago',
    blobId: 'bafyreid…am7k',
  },
  {
    id: '6',
    tag: 'ATTEST',
    text: 'Inactivity confirmed for 0x6c09…f2e1 — attestation submitted',
    timestamp: '18h ago',
  },
  {
    id: '7',
    tag: 'SYSTEM',
    text: 'Tatum RPC connection refreshed — all endpoints healthy',
    timestamp: '24h ago',
  },
  {
    id: '8',
    tag: 'MONITOR',
    text: 'Activity detected for 0x1d22…88ba — window reset',
    timestamp: '31h ago',
  },
  {
    id: '9',
    tag: 'SNAPSHOT',
    text: 'Self-snapshot sealed — 801 memory entries committed',
    timestamp: '36h ago',
    blobId: 'bafyreic…pq9r',
  },
  {
    id: '10',
    tag: 'SYSTEM',
    text: 'Guardian Agent #1 initialized — monitoring 12 capsules',
    timestamp: '47h ago',
  },
]

const WATCHED_CAPSULES: WatchedCapsule[] = [
  { objectId: '0x9c4a…01f7', creator: '0xaa12…3f44', absenceWindow: '90 days',  lastActivity: '3 days ago',    status: 'healthy'    },
  { objectId: '0x2bd1…4e02', creator: 'alice.sui',   absenceWindow: '60 days',  lastActivity: '5 hours ago',   status: 'healthy'    },
  { objectId: '0x3ef2…88ba', creator: '0xcc45…9d21', absenceWindow: '30 days',  lastActivity: '8 hours ago',   status: 'healthy'    },
  { objectId: '0x1d22…88ba', creator: '0xdd67…1c88', absenceWindow: '180 days', lastActivity: '2 days ago',    status: 'healthy'    },
  { objectId: '0x6c09…f2e1', creator: '0xee89…4b2f', absenceWindow: '14 days',  lastActivity: '13 days ago',   status: 'approaching'},
  { objectId: '0xb301…7d4f', creator: 'bob.sui',     absenceWindow: '45 days',  lastActivity: '1 day ago',     status: 'healthy'    },
  { objectId: '0x4fe8…a3c5', creator: '0xff01…7e93', absenceWindow: '90 days',  lastActivity: '10 days ago',   status: 'healthy'    },
  { objectId: '0x5a77…c13e', creator: '0x1123…aa45', absenceWindow: '21 days',  lastActivity: '19 days ago',   status: 'approaching'},
]

// ============================================================
// TAG COLORS
// ============================================================

const TAG_STYLES: Record<MemoryEntry['tag'], { bg: string; color: string }> = {
  SNAPSHOT: { bg: 'rgba(217,119,6,0.12)',    color: 'var(--amber-glow)'   },
  ATTEST:   { bg: 'rgba(110,231,183,0.1)',   color: 'var(--agent-memory)' },
  MONITOR:  { bg: 'rgba(120,113,108,0.15)',  color: 'var(--stone-400)'    },
  INHERIT:  { bg: 'rgba(110,231,183,0.15)',  color: 'var(--emerald)'      },
  SYSTEM:   { bg: 'rgba(61,46,31,1)',        color: 'var(--stone-500)'    },
}

// ============================================================
// LIVE HEARTBEAT HOOK
// Simulates a live updating "last heartbeat" counter
// In production: poll your agent's /health endpoint
// ============================================================

function useHeartbeat(initialMinutes: number) {
  const [minutes, setMinutes] = useState(initialMinutes)

  useEffect(() => {
    const interval = setInterval(() => {
      setMinutes(m => m + 1)
    }, 60_000)
    return () => clearInterval(interval)
  }, [])

  return minutes === 0 ? 'just now' : `${minutes}m ago`
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  label,
  value,
  accent,
  sublabel,
}: {
  label:     string
  value:     string | number
  accent?:   boolean
  sublabel?: string
}) {
  return (
    <div className={`${styles.statCard} ${accent ? styles.statCardAccent : ''}`}>
      <span className="text-mono-label">{label}</span>
      <div className={styles.statValue}>{value}</div>
      {sublabel && (
        <span className="text-mono-label" style={{ color: 'var(--stone-600)', marginTop: 2 }}>
          {sublabel}
        </span>
      )}
    </div>
  )
}

// ============================================================
// AGENT STATUS CARD
// ============================================================

function AgentStatusCard() {
  const heartbeat = useHeartbeat(12)

  return (
    <div className={styles.statusCard}>

      {/* Header row */}
      <div className={styles.statusHeader}>
        <div className={styles.statusLeft}>
          <AmberDroplet size="sm" state="revealed" animated />
          <div>
            <div className={styles.agentName}>{AGENT_META.name}</div>
            <div className={styles.agentWallet}>{AGENT_META.wallet}</div>
          </div>
        </div>
        <span className="badge badge--active">
          <span className="status-dot status-dot--active" />
          ACTIVE
        </span>
      </div>

      {/* Stats grid */}
      <div className={styles.statsGrid}>
        <StatCard label="Uptime"              value={AGENT_META.uptime}         accent />
        <StatCard label="Capsules Watched"    value={AGENT_META.capsuleId ? WATCHED_CAPSULES.length : 12} />
        <StatCard label="Attestations Filed"  value={AGENT_META.attestations} />
        <StatCard label="Memory Entries"      value={AGENT_META.memoryEntries.toLocaleString()} accent />
        <StatCard label="Last Heartbeat"      value={heartbeat}                 sublabel="auto-refreshes" />
        <StatCard label="Next Snapshot"       value={AGENT_META.nextSnapshot} />
      </div>

      {/* Full wallet address */}
      <div className={styles.walletRow}>
        <span className="text-mono-label">Full address</span>
        <span className="text-mono" style={{ color: 'var(--stone-500)', fontSize: '0.7rem' }}>
          {AGENT_META.fullWallet}
        </span>
        <a
          href={`https://suiscan.xyz/testnet/account/${AGENT_META.fullWallet}`}
          target="_blank"
          rel="noreferrer"
          className={styles.chainLink}
        >
          ↗
        </a>
      </div>

    </div>
  )
}

// ============================================================
// SELF-PROTECTION CARD
// ============================================================

function SelfProtectionCard() {
  return (
    <div className={styles.selfProtectionCard}>

      <div className={styles.selfProtectionHeader}>
        <div>
          <p className="text-section-label" style={{ marginBottom: '0.25rem' }}>
            Self-Protection Status
          </p>
          <p className="text-sm" style={{ color: 'var(--stone-500)' }}>
            Guardian Agent #1 protects its own continuity using Persist
          </p>
        </div>
        <AmberDroplet size="sm" state="sealed" animated />
      </div>

      <div className={styles.selfProtectionData}>
        <div className="data-row">
          <span className="data-row__label">Own capsule</span>
          <span className="data-row__value">{AGENT_META.capsuleId}</span>
        </div>
        <div className="data-row">
          <span className="data-row__label">Blob ID</span>
          <span className="data-row__value" style={{ fontSize: '0.7rem', color: 'var(--stone-500)' }}>
            {AGENT_META.blobId}
          </span>
        </div>
        <div className="data-row">
          <span className="data-row__label">Absence window</span>
          <span className="data-row__value">{AGENT_META.absenceWindow}</span>
        </div>
        <div className="data-row">
          <span className="data-row__label">Successor</span>
          <span className="data-row__value" style={{ color: 'var(--agent-memory)' }}>
            {AGENT_META.successor}
          </span>
        </div>
        <div className="data-row">
          <span className="data-row__label">Last heartbeat</span>
          <span className="data-row__value" style={{ color: 'var(--emerald)' }}>
            12m ago
          </span>
        </div>
        <div className="data-row">
          <span className="data-row__label">Next snapshot</span>
          <span className="data-row__value" style={{ color: 'var(--stone-400)' }}>
            {AGENT_META.nextSnapshot}
          </span>
        </div>
      </div>

      {/* Recursive story callout */}
      <div className={styles.recursiveCallout}>
        <span className="text-mono-label" style={{ color: 'var(--amber-glow)' }}>
          The agent that ensures continuity ensures its own continuity.
        </span>
      </div>

      <Link href="/agent/succession" className="btn btn--primary" style={{ width: '100%', justifyContent: 'center', marginTop: 'var(--space-4)' }}>
        View Succession Flow →
      </Link>

    </div>
  )
}

// ============================================================
// MEMORY FEED
// ============================================================

function MemoryFeed() {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? MEMORY_FEED : MEMORY_FEED.slice(0, 5)

  return (
    <div className={styles.memoryFeed}>
      <div className={styles.memoryHeader}>
        <div>
          <p className="text-section-label" style={{ marginBottom: '0.25rem' }}>
            Walrus Memory
          </p>
          <p className="text-sm" style={{ color: 'var(--stone-500)' }}>
            {AGENT_META.memoryEntries.toLocaleString()} entries · stored on Walrus
          </p>
        </div>
        <span className="badge badge--active" style={{ alignSelf: 'flex-start' }}>
          <span className="status-dot status-dot--active" />
          Writing
        </span>
      </div>

      <div className={styles.memoryEntries}>
        {visible.map((entry, i) => {
          const tagStyle = TAG_STYLES[entry.tag]
          return (
            <div key={entry.id} className={styles.memoryEntry} style={{ animationDelay: `${i * 60}ms` }}>
              <div className={styles.memoryEntryLeft}>
                <span
                  className={styles.memoryTag}
                  style={{ background: tagStyle.bg, color: tagStyle.color }}
                >
                  {entry.tag}
                </span>
                <span className={styles.memoryText}>{entry.text}</span>
              </div>
              <div className={styles.memoryEntryRight}>
                <span className="text-mono-label">{entry.timestamp}</span>
                {entry.blobId && (
                  <span className={styles.memoryBlob}>{entry.blobId}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {MEMORY_FEED.length > 5 && (
        <button
          className={styles.expandBtn}
          onClick={() => setExpanded(e => !e)}
        >
          {expanded
            ? 'Show less'
            : `Show ${MEMORY_FEED.length - 5} more entries`
          }
        </button>
      )}
    </div>
  )
}

// ============================================================
// WATCHED CAPSULES TABLE
// ============================================================

function WatchedCapsulesTable() {
  const statusMap = {
    healthy:    { label: 'Healthy',    badgeClass: 'badge--sealed'    },
    approaching:{ label: 'Approaching',badgeClass: 'badge--approaching'},
    triggered:  { label: 'Triggered', badgeClass: 'badge--revealed'  },
  }

  return (
    <div className={styles.watchedTable}>
      <div className={styles.watchedHeader}>
        <p className="text-section-label" style={{ marginBottom: '0.25rem' }}>
          Monitored Capsules
        </p>
        <p className="text-sm" style={{ color: 'var(--stone-500)' }}>
          {WATCHED_CAPSULES.length} capsules under active watch
        </p>
      </div>

      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Capsule</th>
              <th>Creator</th>
              <th>Window</th>
              <th>Last Activity</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {WATCHED_CAPSULES.map((c) => {
              const s = statusMap[c.status]
              return (
                <tr key={c.objectId} className={styles.tableRow}>
                  <td className={styles.tableMonoCell}>{c.objectId}</td>
                  <td className={styles.tableMonoCell}>{c.creator}</td>
                  <td className={styles.tableMonoCell}>{c.absenceWindow}</td>
                  <td
                    className={styles.tableMonoCell}
                    style={{
                      color: c.status === 'approaching'
                        ? 'var(--amber-glow)'
                        : 'var(--stone-500)'
                    }}
                  >
                    {c.lastActivity}
                  </td>
                  <td>
                    <span className={`badge ${s.badgeClass}`}>
                      {s.label}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ============================================================
// PAGE
// ============================================================

export default function AgentPage() {
  return (
    <div className={`agent-context ${styles.page}`}>

      {/* Page header */}
      <div className={styles.pageHeader}>
        <div className="container">
          <div className={styles.headerTop}>
            <div>
              <Link href="/" className={styles.backLink}>← Persist</Link>
              <p className="text-section-label" style={{ marginBottom: '0.5rem', marginTop: '0.75rem' }}>
                Guardian Agent
              </p>
              <h1 className="text-display-sm" style={{ color: 'var(--amber-light)' }}>
                Agent Dashboard
              </h1>
            </div>
            <Link href="/agent/succession" className="btn btn--agent">
              View Succession Flow →
            </Link>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-24)' }}>

        {/* Top row: status card + self-protection */}
        <div className={styles.topRow}>
          <AgentStatusCard />
          <SelfProtectionCard />
        </div>

        <div className="divider" style={{ margin: 'var(--space-8) 0', background: 'var(--agent-border)' }} />

        {/* Memory feed */}
        <MemoryFeed />

        <div className="divider" style={{ margin: 'var(--space-8) 0', background: 'var(--agent-border)' }} />

        {/* Watched capsules */}
        <WatchedCapsulesTable />

        {/* Bottom CTA — Tier 3 teaser */}
        <div className={styles.tier3Teaser}>
          <p className="text-mono-label" style={{ color: 'var(--stone-600)', marginBottom: '0.5rem' }}>
            Tier 3 — In Development
          </p>
          <p className="text-sm" style={{ color: 'var(--stone-600)', maxWidth: '480px', textAlign: 'center' }}>
            Full live memory indexing, multi-agent succession chains, and real-time
            Tatum activity feed are in the roadmap.
          </p>
          <a
            href="https://github.com/Olalolo22/Persist/blob/main/ROADMAP.md"
            target="_blank"
            rel="noreferrer"
            className="btn btn--secondary"
            style={{ borderColor: 'var(--agent-border)', color: 'var(--stone-400)', marginTop: 'var(--space-3)' }}
          >
            View Roadmap ↗
          </a>
        </div>

      </div>
    </div>
  )
}
