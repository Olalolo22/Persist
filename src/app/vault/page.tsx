// src/app/vault/page.tsx
// PERSIST V3 — Vault Page
// Shows all capsules belonging to the connected wallet
// Filter: All | Human | Agent

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AmberDroplet, PersistLogo } from '@/components/AmberDroplet'
import styles from './vault.module.css'

// ============================================================
// TYPES
// ============================================================

type CapsuleState = 'sealed' | 'approaching' | 'revealed' | 'dormant'
type CapsuleType  = 'human' | 'agent'
type FilterTab    = 'all' | 'human' | 'agent'

interface Capsule {
  id:          string
  objectId:    string
  blobId:      string
  type:        CapsuleType
  state:       CapsuleState
  condition:   'timelock' | 'absence'
  nominee:     string
  createdAt:   string
  // Time-lock specific
  unlockAt?:   string
  timeRemaining?: string
  // Absence specific
  absenceWindow?: string
  lastActivity?:  string
  // Agent specific
  memoryEntries?: number
  successor?:     string
}

// ============================================================
// SEED DATA
// Replace with real on-chain fetch via Tatum / Sui RPC
// Query: suix_getOwnedObjects filtered by PersistCapsule type
// ============================================================

const MOCK_CAPSULES: Capsule[] = [
  {
    id: '1',
    objectId:  '0x9c4a…01f7',
    blobId:    'bafyreib…xq2m',
    type:      'human',
    state:     'sealed',
    condition: 'absence',
    nominee:   '0x2bd1…4e02',
    createdAt: '2025-12-01',
    absenceWindow: '90 days',
    lastActivity:  '3 days ago',
  },
  {
    id: '2',
    objectId:  '0x3ef2…88ba',
    blobId:    'bafyreid…am7k',
    type:      'human',
    state:     'approaching',
    condition: 'timelock',
    nominee:   'alice.sui',
    createdAt: '2025-11-14',
    unlockAt:  '2026-02-14',
    timeRemaining: '3 days',
  },
  {
    id: '3',
    objectId:  '0x7a3f…c91d',
    blobId:    'bafyreic…pq9r',
    type:      'agent',
    state:     'sealed',
    condition: 'absence',
    nominee:   'guardian-2.sui',
    createdAt: '2026-01-08',
    absenceWindow: '72 hours',
    lastActivity:  '12 minutes ago',
    memoryEntries: 847,
    successor: 'guardian-2.sui',
  },
  {
    id: '4',
    objectId:  '0x1d22…88ba',
    blobId:    'bafyreie…wr3x',
    type:      'human',
    state:     'revealed',
    condition: 'timelock',
    nominee:   '0x5a77…c13e',
    createdAt: '2025-06-01',
    unlockAt:  '2026-01-01',
  },
  {
    id: '5',
    objectId:  '0x6c09…f2e1',
    blobId:    'bafyreif…zk4t',
    type:      'human',
    state:     'dormant',
    condition: 'absence',
    nominee:   '0x4fe8…a3c5',
    createdAt: '2025-03-15',
    absenceWindow: '180 days',
  },
  {
    id: '6',
    objectId:  '0xb301…7d4f',
    blobId:    'bafyreig…yb2n',
    type:      'agent',
    state:     'approaching',
    condition: 'absence',
    nominee:   'guardian-3.sui',
    createdAt: '2026-01-20',
    absenceWindow: '48 hours',
    lastActivity:  '41 hours ago',
    memoryEntries: 312,
    successor: 'guardian-3.sui',
  },
]

// ============================================================
// HELPERS
// ============================================================

function stateLabel(state: CapsuleState): string {
  return {
    sealed:     'Sealed',
    approaching:'Approaching',
    revealed:   'Revealed',
    dormant:    'Claimed',
  }[state]
}

function conditionLabel(c: Capsule): string {
  if (c.condition === 'timelock') {
    return c.state === 'revealed'
      ? `Unlocked ${c.unlockAt}`
      : `Unlocks ${c.timeRemaining ? `in ${c.timeRemaining}` : c.unlockAt}`
  }
  return c.state === 'approaching'
    ? `Inactive ${c.lastActivity} — window: ${c.absenceWindow}`
    : `Last active ${c.lastActivity ?? 'unknown'}`
}

// ============================================================
// EMPTY STATE
// ============================================================

function EmptyState({ filter }: { filter: FilterTab }) {
  const copy = {
    all:   { headline: 'Nothing sealed yet.', sub: 'Seal your first capsule and it will appear here.' },
    human: { headline: 'No human capsules yet.', sub: 'Seal a message, file, or instruction for a nominee.' },
    agent: { headline: 'No agent capsules yet.', sub: 'The Guardian Agent will appear here once deployed.' },
  }[filter]

  return (
    <div className={styles.emptyState}>
      {/* Glow without a character — the motif, not a mascot */}
      <div className={styles.emptyGlow}>
        <AmberDroplet size="lg" state="sealed" animated />
      </div>
      <h3 className={styles.emptyHeadline}>{copy.headline}</h3>
      <p className="text-body" style={{ color: 'var(--stone-500)', marginBottom: '1.5rem' }}>
        {copy.sub}
      </p>
      <Link href="/seal" className="btn btn--primary">
        Seal a Capsule
      </Link>
    </div>
  )
}

// ============================================================
// CAPSULE CARD
// ============================================================

function CapsuleCard({ capsule }: { capsule: Capsule }) {
  const isAgent = capsule.type === 'agent'

  return (
    <div className={`${styles.capsuleCard} ${styles[`capsuleCard--${capsule.state}`]}`}>

      {/* Top row: visual + badges */}
      <div className={styles.cardTop}>
        <AmberDroplet
          size="sm"
          state={capsule.state}
          showCracks={capsule.state === 'approaching' || capsule.state === 'revealed'}
          animated
        />
        <div className={styles.cardBadges}>
          <span className={`badge badge--${capsule.state}`}>
            <span className={`status-dot status-dot--${capsule.state}`} />
            {stateLabel(capsule.state)}
          </span>
          {isAgent && (
            <span className={styles.agentBadge}>🤖 Agent</span>
          )}
        </div>
      </div>

      {/* Data rows */}
      <div className={styles.cardData}>
        <div className="data-row">
          <span className="data-row__label">Object</span>
          <span className="data-row__value">{capsule.objectId}</span>
        </div>
        <div className="data-row">
          <span className="data-row__label">Blob</span>
          <span className="data-row__value" style={{ color: 'var(--stone-500)', fontSize: '0.7rem' }}>
            {capsule.blobId}
          </span>
        </div>
        <div className="data-row">
          <span className="data-row__label">Nominee</span>
          <span className="data-row__value">{capsule.nominee}</span>
        </div>
        <div className="data-row">
          <span className="data-row__label">Condition</span>
          <span className="data-row__value" style={{ color: 'var(--stone-600)' }}>
            {conditionLabel(capsule)}
          </span>
        </div>
        {isAgent && capsule.memoryEntries !== undefined && (
          <div className="data-row">
            <span className="data-row__label">Memory</span>
            <span className="data-row__value" style={{ color: 'var(--emerald-deep)' }}>
              {capsule.memoryEntries.toLocaleString()} entries
            </span>
          </div>
        )}
      </div>

      {/* Approaching state — urgency indicator */}
      {capsule.state === 'approaching' && (
        <div className={styles.approachingBar}>
          <div className={styles.approachingBarFill} />
          <span className="text-mono-label" style={{ color: 'var(--amber-deep)' }}>
            {capsule.condition === 'timelock'
              ? `Opens in ${capsule.timeRemaining}`
              : `Absence window closing`
            }
          </span>
        </div>
      )}

      {/* Card footer: actions */}
      <div className={styles.cardFooter}>
        <span className="text-mono-label">
          Created {capsule.createdAt}
        </span>
        <div className={styles.cardActions}>
          {capsule.state === 'revealed' && (
            <Link href={`/claim?id=${capsule.objectId}`} className="btn btn--agent" style={{ fontSize: '0.8rem', padding: '0.4rem 0.875rem' }}>
              View Contents
            </Link>
          )}
          {isAgent && capsule.state === 'approaching' && (
            <Link href="/agent/succession" className="btn btn--primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.875rem' }}>
              View Succession
            </Link>
          )}
          {(capsule.state === 'sealed' || capsule.state === 'approaching') && (
            <button
              className="btn btn--secondary"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.875rem' }}
              onClick={() => window.open(`https://suiscan.xyz/testnet/object/${capsule.objectId}`, '_blank')}
            >
              View on Chain ↗
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// FILTER TABS
// ============================================================

function FilterTabs({
  active,
  counts,
  onChange,
}: {
  active: FilterTab
  counts: Record<FilterTab, number>
  onChange: (f: FilterTab) => void
}) {
  const tabs: FilterTab[] = ['all', 'human', 'agent']

  return (
    <div className={styles.filterTabs}>
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`${styles.filterTab} ${active === tab ? styles.filterTabActive : ''}`}
        >
          {tab === 'human' && '🧬 '}
          {tab === 'agent' && '🤖 '}
          {tab.charAt(0).toUpperCase() + tab.slice(1)}
          <span className={styles.filterCount}>{counts[tab]}</span>
        </button>
      ))}
    </div>
  )
}

// ============================================================
// VAULT SUMMARY BAR
// ============================================================

function VaultSummary({ capsules }: { capsules: Capsule[] }) {
  const sealed     = capsules.filter(c => c.state === 'sealed').length
  const approaching = capsules.filter(c => c.state === 'approaching').length
  const revealed   = capsules.filter(c => c.state === 'revealed').length

  return (
    <div className={styles.summaryBar}>
      <div className={styles.summaryItem}>
        <span className={`status-dot status-dot--sealed`} />
        <span className="text-mono-label">Sealed</span>
        <span className={styles.summaryCount}>{sealed}</span>
      </div>
      <div className={styles.summaryDivider} />
      <div className={styles.summaryItem}>
        <span className="status-dot" style={{ background: 'var(--amber-glow)' }} />
        <span className="text-mono-label">Approaching</span>
        <span className={styles.summaryCount}>{approaching}</span>
      </div>
      <div className={styles.summaryDivider} />
      <div className={styles.summaryItem}>
        <span className={`status-dot status-dot--revealed`} />
        <span className="text-mono-label">Revealed</span>
        <span className={styles.summaryCount}>{revealed}</span>
      </div>
    </div>
  )
}

// ============================================================
// PAGE
// ============================================================

export default function VaultPage() {
  const [filter, setFilter]     = useState<FilterTab>('all')
  const [capsules, setCapsules] = useState<Capsule[]>([])
  const [loading, setLoading]   = useState(true)

  // In production: fetch from Sui RPC via Tatum
  // suix_getOwnedObjects with filter on PersistCapsule Move type
  useEffect(() => {
    const t = setTimeout(() => {
      setCapsules(MOCK_CAPSULES)
      setLoading(false)
    }, 600)
    return () => clearTimeout(t)
  }, [])

  const filtered = capsules.filter(c => {
    if (filter === 'all')   return true
    if (filter === 'human') return c.type === 'human'
    if (filter === 'agent') return c.type === 'agent'
    return true
  })

  const counts: Record<FilterTab, number> = {
    all:   capsules.length,
    human: capsules.filter(c => c.type === 'human').length,
    agent: capsules.filter(c => c.type === 'agent').length,
  }

  return (
    <div className={styles.page}>

      {/* Page header */}
      <div className={styles.pageHeader}>
        <div className="container">
          <div className={styles.headerTop}>
            <div>
              <p className="text-section-label" style={{ marginBottom: '0.5rem' }}>
                Your Capsules
              </p>
              <h1 className="text-display-sm">Vault</h1>
            </div>
            <Link href="/seal" className="btn btn--primary">
              + Seal New Capsule
            </Link>
          </div>

          {!loading && capsules.length > 0 && (
            <VaultSummary capsules={capsules} />
          )}
        </div>
      </div>

      <div className="container" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-24)' }}>

        {/* Filter tabs */}
        {!loading && capsules.length > 0 && (
          <FilterTabs active={filter} counts={counts} onChange={setFilter} />
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className={styles.grid}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={styles.skeletonCard}>
                <div className="skeleton" style={{ width: 40, height: 50, borderRadius: 8 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  <div className="skeleton" style={{ height: 14, width: '60%' }} />
                  <div className="skeleton" style={{ height: 12, width: '80%' }} />
                  <div className="skeleton" style={{ height: 12, width: '50%' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Capsule grid */}
        {!loading && filtered.length > 0 && (
          <div className={styles.grid}>
            {filtered.map(capsule => (
              <CapsuleCard key={capsule.id} capsule={capsule} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <EmptyState filter={filter} />
        )}

      </div>
    </div>
  )
}
