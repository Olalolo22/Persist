// src/app/page.tsx
// PERSIST V3 — Landing Page
// App Router, TypeScript, CSS custom properties from globals.css

'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { AmberDroplet, PersistLogo } from '@/components/AmberDroplet'
import styles from './page.module.css'

// ============================================================
// TYPES
// ============================================================

interface LiveStats {
  capsules: number
  blobs: number
  network: string
}

// ============================================================
// STATIC DATA
// ============================================================

const USE_CASES = [
  {
    icon: '🧬',
    track: 'For People',
    headline: 'Leave instructions that outlast you.',
    body: 'Encrypt files, keys, and messages. Set a date or an absence window. Your nominee unlocks everything — automatically, trustlessly, on-chain.',
    cta: 'Seal a Capsule',
    href: '/seal',
    state: 'sealed' as const,
  },
  {
    icon: '🤖',
    track: 'For Agents',
    headline: 'Ensure memory survives when processes stop.',
    body: 'Autonomous agents seal their operational state into Persist capsules. When a Guardian Agent disappears, a successor inherits its memory and resumes without losing context.',
    cta: 'View Guardian Agent',
    href: '/agent',
    state: 'approaching' as const,
  },
  {
    icon: '🏛',
    track: 'For Organizations',
    headline: 'Protect governance when signers disappear.',
    body: 'DAOs and multisig treasuries can seal contingency instructions that unlock only when the organization goes inactive — no single point of failure.',
    cta: 'Roadmap →',
    href: '/docs#roadmap',
    state: 'sealed' as const,
  },
]

const COMPARISON_ROWS = [
  {
    feature: 'Activity monitoring',
    others: 'Manual monthly check-in',
    persist: 'Passive wallet monitoring via Tatum',
  },
  {
    feature: 'What transfers',
    others: 'Tokens only',
    persist: 'Files, keys, messages, agent memory',
  },
  {
    feature: 'Beneficiary UX',
    others: 'Contract address + explorer',
    persist: 'A wallet or .sui name. One button.',
  },
  {
    feature: 'Storage',
    others: 'On-chain or centralised',
    persist: 'Walrus — permanent, decentralised',
  },
  {
    feature: 'Agent continuity',
    others: 'Not supported',
    persist: 'Guardian Agent + Walrus Memory',
  },
  {
    feature: 'Trust model',
    others: 'You trust a server or a company',
    persist: 'Conditions enforced in Move. No gatekeeper.',
  },
]

const TICKER_ITEMS = [
  { type: 'sealed',  addr: '0x7a3f…c91d', time: '4m ago' },
  { type: 'sealed',  addr: '0x2bd1…4e02', time: '11m ago' },
  { type: 'cracked', addr: '0x9c4a…01f7', time: '23m ago' },
  { type: 'sealed',  addr: '0x4fe8…a3c5', time: '31m ago' },
  { type: 'sealed',  addr: '0x1d22…88ba', time: '47m ago' },
  { type: 'cracked', addr: '0x6c09…f2e1', time: '1h ago'  },
  { type: 'sealed',  addr: '0xb301…7d4f', time: '1h ago'  },
  { type: 'sealed',  addr: '0x5a77…c13e', time: '2h ago'  },
]

// ============================================================
// NAV
// ============================================================

function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
      <Link href="/" className="nav__logo">
        <PersistLogo size={22} />
      </Link>

      <ul className="nav__links">
        <li><Link href="/#protocol" className="nav__link">Protocol</Link></li>
        <li><Link href="/seal"      className="nav__link">Seal</Link></li>
        <li><Link href="/vault"     className="nav__link">Vault</Link></li>
        <li><Link href="/agent"     className="nav__link">Agent</Link></li>
        <li><Link href="/docs"      className="nav__link">Docs</Link></li>
      </ul>

      <div className={styles.navRight}>
        <span className={styles.networkBadge}>
          <span className="status-dot status-dot--active" />
          Testnet
        </span>
        <button className="btn btn--primary">Connect Wallet</button>
      </div>
    </nav>
  )
}

// ============================================================
// HERO
// ============================================================

function Hero({ stats }: { stats: LiveStats | null }) {
  const [capsuleHovered, setCapsuleHovered] = useState(false)

  return (
    <section className={styles.hero}>
      <div className={`container ${styles.heroInner}`}>

        {/* Left: copy */}
        <div className={styles.heroCopy}>
          <p className="text-section-label animate-fade-up" style={{ marginBottom: '1.25rem' }}>
            The Continuity Layer for the Agentic Web
          </p>

          <h1 className={`text-display animate-fade-up animate-fade-up--delay-1 ${styles.heroHeadline}`}>
            Some things are meant to outlast you.
          </h1>

          <p className={`text-hero-sub animate-fade-up animate-fade-up--delay-2 ${styles.heroSub}`}>
            Temporal Access Control for Sui. Seal encrypted data, set conditions,
            walk away. Persist ensures it survives — for people, agents, and organizations.
          </p>

          <div className={`${styles.heroCtas} animate-fade-up animate-fade-up--delay-3`}>
            <Link href="/seal" className="btn btn--primary">
              Seal a Capsule
            </Link>
            <Link href="/#protocol" className="btn btn--secondary">
              How It Works →
            </Link>
          </div>

          {/* Live stats */}
          {stats && (
            <div className={`${styles.heroStats} animate-fade-up animate-fade-up--delay-3`}>
              <div className={styles.heroStat}>
                <span className="text-mono-label">Capsules Sealed</span>
                <span className={styles.heroStatValue}>{stats.capsules.toLocaleString()}</span>
              </div>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStat}>
                <span className="text-mono-label">Walrus Blobs</span>
                <span className={styles.heroStatValue}>{stats.blobs.toLocaleString()}</span>
              </div>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStat}>
                <span className="text-mono-label">Avg Cost</span>
                <span className={styles.heroStatValue}>~$0.01 + storage</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: interactive amber capsule */}
        <div
          className={styles.heroVisual}
          onMouseEnter={() => setCapsuleHovered(true)}
          onMouseLeave={() => setCapsuleHovered(false)}
        >
          <div className={styles.heroCapsuleWrap}>
            <AmberDroplet
              size="hero"
              state={capsuleHovered ? 'approaching' : 'sealed'}
              showCracks={capsuleHovered}
              animated
            />
            <div className={styles.heroCapsuleLabel}>
              <span className="text-mono-label">Live capsule</span>
              <span className="text-mono" style={{ color: 'var(--amber-deep)' }}>
                0x9c4a…01f7
              </span>
              <span className="text-mono-label">Walrus blob</span>
              <span className="text-mono" style={{ color: 'var(--stone-600)', fontSize: '0.65rem' }}>
                bafyreib…xq2m
              </span>
            </div>
          </div>
          <p className={styles.heroCapsuleHint}>
            hover to reveal
          </p>
        </div>

      </div>
    </section>
  )
}

// ============================================================
// TICKER
// ============================================================

function Ticker() {
  // Double the array so the scroll loop is seamless
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS]

  return (
    <div className="ticker">
      <div className="ticker__track">
        {items.map((item, i) => (
          <div
            key={i}
            className={`ticker__item ticker__item--${item.type}`}
          >
            <span>
              {item.type === 'sealed' ? 'SEALED' : 'CRACKED'}
            </span>
            <span className="text-mono">{item.addr}</span>
            <span style={{ color: 'var(--stone-400)' }}>·</span>
            <span>{item.time}</span>
            <span style={{ color: 'var(--stone-300)', margin: '0 1rem' }}>|</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// USE CASE CARDS
// ============================================================

function UseCaseCards() {
  return (
    <section className={`section ${styles.useCases}`} id="use-cases">
      <div className="container">
        <div className={styles.sectionHeader}>
          <p className="text-section-label">What Persist enables</p>
          <h2 className="text-display-sm">
            One protocol. Three continuity problems solved.
          </h2>
        </div>

        <div className={styles.useCaseGrid}>
          {USE_CASES.map((uc) => (
            <div key={uc.track} className={`card card--amber ${styles.useCaseCard}`}>
              <div className={styles.useCaseTop}>
                <span className={styles.useCaseIcon}>{uc.icon}</span>
                <AmberDroplet size="sm" state={uc.state} animated />
              </div>
              <p className="text-section-label" style={{ marginBottom: '0.5rem' }}>
                {uc.track}
              </p>
              <h3 className={styles.useCaseHeadline}>{uc.headline}</h3>
              <p className="text-body" style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                {uc.body}
              </p>
              <Link href={uc.href} className="btn btn--secondary" style={{ fontSize: '0.875rem' }}>
                {uc.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================================
// PROTOCOL SECTION
// ============================================================

function ProtocolSection() {
  return (
    <section className={`section ${styles.protocol}`} id="protocol">
      <div className="container container--narrow">
        <p className="text-section-label" style={{ marginBottom: '1rem' }}>
          The Primitive
        </p>
        <h2 className="text-display-sm" style={{ marginBottom: '1.5rem' }}>
          Temporal Access Control for Sui.
        </h2>
        <p className="text-body" style={{ marginBottom: '3rem', maxWidth: '560px' }}>
          Persist does one thing: encrypted data that cannot be accessed until defined
          conditions are met. No gatekeeper. No private key holder. Conditions are
          enforced in Move. The chain decides when the amber cracks.
        </p>

        {/* Three-step visual */}
        <div className={styles.threeStep}>
          {[
            {
              step: '01',
              label: 'Seal',
              desc: 'Content encrypted client-side via Sui Seal. AES key wrapped. Payload stored permanently on Walrus.',
              state: 'sealed' as const,
            },
            {
              step: '02',
              label: 'Persist',
              desc: 'The Move contract holds the conditions. Time-lock or absence safeguard. Immutable. No override.',
              state: 'approaching' as const,
            },
            {
              step: '03',
              label: 'Reveal',
              desc: 'Conditions met on-chain. Nominee decrypts locally. The amber cracks. Nothing is lost.',
              state: 'revealed' as const,
            },
          ].map((s, i) => (
            <div key={s.step} className={styles.stepItem}>
              <div className={styles.stepVisual}>
                <AmberDroplet size="md" state={s.state} animated />
                {i < 2 && <div className={styles.stepConnector} />}
              </div>
              <span className="text-mono-label">{s.step} — {s.label}</span>
              <p className="text-sm" style={{ marginTop: '0.5rem', lineHeight: 1.55 }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================================
// ARCHITECTURE SECTION (oracle trust — honest)
// ============================================================

function ArchitectureSection() {
  return (
    <section className={`section ${styles.architecture}`} id="architecture">
      <div className="container">
        <div className={styles.sectionHeader}>
          <p className="text-section-label">Architecture</p>
          <h2 className="text-display-sm">
            One primitive. Three tools.
          </h2>
        </div>

        {/* Hierarchy diagram */}
        <div className={styles.archDiagram}>
          <div className={styles.archCore}>
            <span className="text-mono-label">Core Primitive</span>
            <div className={styles.archCoreBox}>
              <AmberDroplet size="sm" state="sealed" animated />
              <div>
                <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>
                  PERSIST
                </div>
                <div className="text-sm">Temporal Access Control Layer</div>
              </div>
            </div>
          </div>

          <div className={styles.archTools}>
            {[
              { name: 'Seal',       role: 'Encryption',   desc: 'How data is protected' },
              { name: 'Walrus',     role: 'Storage',      desc: 'Where data lives' },
              { name: 'Sui Move',   role: 'Rules Engine', desc: 'What conditions are enforced' },
            ].map((tool) => (
              <div key={tool.name} className={`card ${styles.archToolCard}`}>
                <span className="text-mono-label">{tool.role}</span>
                <div style={{ fontWeight: 600, margin: '0.25rem 0' }}>{tool.name}</div>
                <div className="text-sm">{tool.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Oracle trust — honest three-state */}
        <div className={`card card--amber ${styles.oracleState}`}>
          <p className="text-section-label" style={{ marginBottom: '1rem' }}>
            Oracle Trust — Transparent Roadmap
          </p>
          <div className={styles.oracleSteps}>
            {[
              {
                status: 'Live',
                color: 'var(--amber)',
                title: 'Centralized oracle',
                desc: '/api/attest — server-held Ed25519 key. Transparent, documented, functional.',
              },
              {
                status: 'In Progress',
                color: 'var(--amber-glow)',
                title: 'Guardian Agent',
                desc: 'Autonomous agent with its own Sui wallet replaces the server key. Attestations submitted on-chain.',
              },
              {
                status: 'Roadmap',
                color: 'var(--emerald-deep)',
                title: 'On-chain heartbeat',
                desc: 'Fully trustless — Sui epoch timestamps verify inactivity natively. No off-chain process.',
              },
            ].map((step) => (
              <div key={step.status} className={styles.oracleStep}>
                <span
                  className="badge"
                  style={{
                    background: `${step.color}18`,
                    color: step.color,
                    border: `1px solid ${step.color}40`,
                    marginBottom: '0.5rem',
                  }}
                >
                  {step.status}
                </span>
                <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>{step.title}</div>
                <p className="text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================================
// COMPARISON TABLE
// ============================================================

function ComparisonTable() {
  return (
    <section className={`section ${styles.comparison}`}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <p className="text-section-label">Why Persist</p>
          <h2 className="text-display-sm">Built differently.</h2>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.tableFeature}>Feature</th>
                <th className={styles.tableOthers}>Most tools</th>
                <th className={styles.tablePersist}>
                  <AmberDroplet size="xs" state="sealed" animated={false} />
                  Persist
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.feature} className={styles.tableRow}>
                  <td className={styles.tableFeature}>{row.feature}</td>
                  <td className={styles.tableOthers}>
                    <span className={styles.crossMark}>✕</span> {row.others}
                  </td>
                  <td className={styles.tablePersist}>
                    <span className={styles.checkMark}>✓</span> {row.persist}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

// ============================================================
// FINAL CTA
// ============================================================

function FinalCTA() {
  return (
    <section className={`section ${styles.finalCta}`}>
      <div className="container container--narrow" style={{ textAlign: 'center' }}>
        <div style={{ margin: '0 auto 2rem' }}>
          <AmberDroplet size="lg" state="approaching" animated />
        </div>
        <h2 className="text-display-sm" style={{ marginBottom: '1rem' }}>
          What's worth preserving?
        </h2>
        <p className="text-body" style={{ marginBottom: '2rem', color: 'var(--stone-600)' }}>
          Seal your first capsule in under two minutes. No signup. No central server.
          Just your wallet, a condition, and the chain.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/seal" className="btn btn--primary" style={{ fontSize: '1rem', padding: '0.875rem 2rem' }}>
            Seal a Capsule
          </Link>
          <Link href="/agent" className="btn btn--secondary">
            View Guardian Agent
          </Link>
        </div>
      </div>
    </section>
  )
}

// ============================================================
// FOOTER
// ============================================================

function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.footerInner}`}>
        <PersistLogo size={18} />
        <div className={styles.footerLinks}>
          <a href="https://github.com/Olalolo22/Persist" className={styles.footerLink} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href="/docs" className={styles.footerLink}>Docs</a>
          <a href="/docs#roadmap" className={styles.footerLink}>Roadmap</a>
        </div>
        <div className={styles.footerPowered}>
          <span className="text-mono-label">Built with</span>
          {['Walrus', 'Sui Seal', 'Tatum'].map((tech) => (
            <span key={tech} className={styles.techPill}>{tech}</span>
          ))}
        </div>
      </div>
    </footer>
  )
}

// ============================================================
// PAGE
// ============================================================

export default function HomePage() {
  const [stats, setStats] = useState<LiveStats | null>(null)

  // In production: fetch from your own API route that queries Sui
  // For now: seed with placeholder that looks real
  useEffect(() => {
    setStats({ capsules: 47, blobs: 47, network: 'Testnet' })
  }, [])

  return (
    <>
      <Nav />
      <main>
        <Hero stats={stats} />
        <Ticker />
        <UseCaseCards />
        <div className="divider--crack" style={{ margin: '0 auto', maxWidth: '900px' }} />
        <ProtocolSection />
        <ArchitectureSection />
        <ComparisonTable />
        <FinalCTA />
      </main>
      <Footer />
    </>
  )
}
