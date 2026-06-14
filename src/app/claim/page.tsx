// src/app/claim/page.tsx
// PERSIST V3 — Claim Page (WIRED)
// Now calling real Sui + Seal + Walrus logic via usePersist()
//
// Changes from the unwired version:
// - handleSearch() calls suiClient.getObject() directly via usePersist
// - handleScan() calls usePersist().getClaimableCapsules()
// - handleDecrypt() calls usePersist().claimCapsule() — full Seal decrypt flow
// - Wallet connection uses real dapp-kit ConnectModal via WalletConnect
// - Content type detection: tries UTF-8 decode first, falls back to file blob

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit'
import { AmberDroplet, PersistLogo } from '@/components/AmberDroplet'
import { WalletConnect } from '@/components/WalletConnect'
import { usePersist, type CapsuleData } from '@/hooks/usePersist'
import styles from './claim.module.css'

// ============================================================
// TYPES
// ============================================================

type ClaimPhase =
  | 'idle'
  | 'searching'
  | 'found'
  | 'ready'
  | 'decrypting'
  | 'revealed'
  | 'not-found'
  | 'not-ready'

interface RevealedData {
  content?:    string
  fileBlob?:   Blob
  fileName?:   string
  contentType: 'message' | 'file'
}

// ============================================================
// CONDITION CHECK HELPERS
// Determines if a capsule's conditions are currently met.
// ============================================================

async function checkConditionMet(
  capsule: CapsuleData,
  suiClient: ReturnType<typeof useSuiClient>,
): Promise<{ met: boolean; detail: string }> {
  if (capsule.condition === 'timelock') {
    if (!capsule.unlockEpoch) return { met: false, detail: 'No unlock epoch set' }
    const { epoch } = await suiClient.getLatestSuiSystemState()
    const currentEpoch = Number(epoch)
    const met = currentEpoch >= capsule.unlockEpoch
    return {
      met,
      detail: met
        ? 'Time lock elapsed'
        : `Unlocks at epoch ${capsule.unlockEpoch} (current: ${currentEpoch})`,
    }
  }

  // Absence safeguard — conditionMet flag is set by the Guardian Agent's
  // on-chain attestation. The Move contract itself tracks this via
  // attestation events; we just read the flag from the object.
  return {
    met: capsule.conditionMet,
    detail: capsule.conditionMet
      ? 'Absence confirmed by Guardian Agent attestation'
      : 'Absence safeguard — creator still active',
  }
}

// ============================================================
// CONTENT DETECTION
// Try to decode as UTF-8 text; if it contains invalid sequences
// or binary markers, treat as a file blob instead.
// ============================================================

function detectContent(bytes: Uint8Array): RevealedData {
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true })
    const text = decoder.decode(bytes)
    return { content: text, contentType: 'message' }
  } catch {
    // Not valid UTF-8 — treat as binary file
    const blob = new Blob([bytes as any], { type: 'application/octet-stream' })
    return { fileBlob: blob, fileName: 'decrypted-file', contentType: 'file' }
  }
}

// ============================================================
// REVEALED CONTENT
// ============================================================

function RevealedContent({
  data,
  capsule,
}: {
  data:    RevealedData
  capsule: CapsuleData
}) {
  const [copied, setCopied] = useState(false)
  const [fileUrl, setFileUrl] = useState<string | null>(null)

  useEffect(() => {
    if (data.fileBlob) {
      const url = URL.createObjectURL(data.fileBlob)
      setFileUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [data.fileBlob])

  function copy() {
    if (data.content) {
      navigator.clipboard.writeText(data.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className={styles.revealedWrap}>

      <div className={styles.revealedVisual}>
        <AmberDroplet size="md" state="revealed" showCracks animated={false} />
      </div>

      <p className="text-section-label" style={{ marginBottom: '0.25rem' }}>
        Someone preserved this for you.
      </p>
      <p className="text-mono-label" style={{ color: 'var(--stone-400)', marginBottom: 'var(--space-6)' }}>
        From {capsule.sealerAddr.slice(0, 6)}…{capsule.sealerAddr.slice(-4)} · {capsule.objectId.slice(0, 8)}…
      </p>

      {data.contentType === 'message' && data.content && (
        <>
          <div className={styles.messageContent}>
            <pre className={styles.messageText}>{data.content}</pre>
          </div>
          <div className={styles.revealedActions}>
            <button className="btn btn--secondary" onClick={copy}>
              {copied ? '✓ Copied' : 'Copy Message'}
            </button>
          </div>
        </>
      )}

      {data.contentType === 'file' && fileUrl && (
        <div className={styles.fileReveal}>
          <span className={styles.fileIcon}>📄</span>
          <div>
            <div className={styles.fileName}>{data.fileName ?? 'decrypted-file'}</div>
            <p className="text-mono-label" style={{ color: 'var(--stone-500)' }}>
              Decrypted · {((data.fileBlob?.size ?? 0) / 1024).toFixed(1)} KB
            </p>
          </div>
          <a
            href={fileUrl}
            download={data.fileName ?? 'decrypted-file'}
            className="btn btn--primary"
          >
            Download File
          </a>
        </div>
      )}

      <div className={styles.revealedMeta}>
        <div className="data-row">
          <span className="data-row__label">Capsule</span>
          <span className="data-row__value">{capsule.objectId}</span>
        </div>
        <div className="data-row">
          <span className="data-row__label">Walrus blob</span>
          <span className="data-row__value" style={{ fontSize: '0.7rem', color: 'var(--stone-500)' }}>
            {capsule.blobId}
          </span>
        </div>
        <div className="data-row">
          <span className="data-row__label">Condition</span>
          <span className="data-row__value" style={{ color: 'var(--emerald-deep)' }}>
            {capsule.condition === 'absence' ? 'Absence safeguard — met' : 'Time lock — elapsed'}
          </span>
        </div>
      </div>

    </div>
  )
}

// ============================================================
// NOT READY STATE
// ============================================================

function NotReadyState({ capsule, detail }: { capsule: CapsuleData; detail: string }) {
  return (
    <div className={styles.notReadyWrap}>
      <AmberDroplet size="md" state="sealed" animated />
      <h3 className={styles.notReadyHeadline}>Not yet.</h3>
      <p className="text-body" style={{ color: 'var(--stone-600)', textAlign: 'center', maxWidth: 400 }}>
        This capsule exists and is addressed to you. But the conditions
        haven't been met yet.
      </p>
      <div className={styles.notReadyMeta}>
        <div className="data-row">
          <span className="data-row__label">Capsule</span>
          <span className="data-row__value">{capsule.objectId}</span>
        </div>
        <div className="data-row">
          <span className="data-row__label">Status</span>
          <span className="data-row__value" style={{ color: 'var(--amber-deep)' }}>
            {detail}
          </span>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// CAPSULE READY STATE
// ============================================================

function CapsuleReadyState({
  capsule,
  onClaim,
  decrypting,
  decryptError,
}: {
  capsule:      CapsuleData
  onClaim:      () => void
  decrypting:   boolean
  decryptError: string | null
}) {
  return (
    <div className={styles.capsuleReadyWrap}>

      <div className={styles.capsuleReadyVisual}>
        <AmberDroplet size="lg" state="approaching" showCracks animated />
      </div>

      <p className="text-section-label" style={{ marginBottom: '0.5rem' }}>
        A capsule is waiting for you
      </p>
      <h3 className={styles.capsuleReadyHeadline}>
        Conditions met. Ready to open.
      </h3>
      <p className="text-body" style={{ color: 'var(--stone-600)', textAlign: 'center', maxWidth: 400, marginBottom: 'var(--space-6)' }}>
        This capsule was sealed for your address. The conditions have been
        verified on-chain. You can decrypt it now.
      </p>

      <div className={styles.capsuleReadyMeta}>
        <div className="data-row">
          <span className="data-row__label">From</span>
          <span className="data-row__value">
            {capsule.sealerAddr.slice(0, 10)}…{capsule.sealerAddr.slice(-6)}
          </span>
        </div>
        <div className="data-row">
          <span className="data-row__label">Capsule</span>
          <span className="data-row__value">{capsule.objectId}</span>
        </div>
        <div className="data-row">
          <span className="data-row__label">Blob</span>
          <span className="data-row__value" style={{ fontSize: '0.7rem', color: 'var(--stone-500)' }}>
            {capsule.blobId}
          </span>
        </div>
        <div className="data-row">
          <span className="data-row__label">Condition</span>
          <span className="data-row__value" style={{ color: 'var(--emerald-deep)' }}>
            ✓ Verified on-chain
          </span>
        </div>
      </div>

      {decryptError && (
        <div className={styles.decryptError}>
          <span className="text-mono-label" style={{ color: '#B91C1C' }}>
            ✕ {decryptError}
          </span>
        </div>
      )}

      <button
        className={`btn btn--primary ${styles.openBtn}`}
        onClick={onClaim}
        disabled={decrypting}
      >
        {decrypting ? (
          <>
            <span className={styles.claimSpinner} />
            Decrypting…
          </>
        ) : (
          'Open Capsule'
        )}
      </button>

      <p className="text-mono-label" style={{ color: 'var(--stone-400)', marginTop: 'var(--space-2)' }}>
        This will prompt your wallet to sign a session key (no gas cost)
      </p>

    </div>
  )
}

// ============================================================
// ID LOOKUP
// ============================================================

function IdLookup({
  onSearch,
  searching,
}: {
  onSearch:  (id: string) => void
  searching: boolean
}) {
  const [id, setId] = useState('')

  return (
    <div className={styles.idLookup}>
      <label className="text-mono-label" htmlFor="capsuleId">
        Capsule ID
      </label>
      <div className={styles.idRow}>
        <input
          id="capsuleId"
          type="text"
          className={styles.idInput}
          placeholder="0x9c4a… or paste the full capsule object ID"
          value={id}
          onChange={e => setId(e.target.value.trim())}
          onKeyDown={e => { if (e.key === 'Enter' && id) onSearch(id) }}
        />
        <button
          className="btn btn--primary"
          onClick={() => onSearch(id)}
          disabled={!id || searching}
        >
          {searching ? <span className={styles.claimSpinner} /> : 'Search'}
        </button>
      </div>
    </div>
  )
}

// ============================================================
// WALLET SCAN SECTION
// ============================================================

function WalletScan({
  phase,
  onScan,
  scanning,
}: {
  phase:    ClaimPhase
  onScan:   () => void
  scanning: boolean
}) {
  const account = useCurrentAccount()

  if (!account) {
    return (
      <div className={styles.walletPrompt}>
        <AmberDroplet size="sm" state="sealed" animated />
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>
            Capsules left for you
          </div>
          <p className="text-sm" style={{ color: 'var(--stone-500)' }}>
            Connect your wallet to scan the blockchain for capsules
            nominated to your address.
          </p>
        </div>
        <WalletConnect />
      </div>
    )
  }

  if (phase === 'not-found') {
    return (
      <div className={styles.walletPrompt}>
        <AmberDroplet size="sm" state="dormant" animated={false} />
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>No capsules found</div>
          <p className="text-sm" style={{ color: 'var(--stone-500)' }}>
            No capsules are addressed to {account.address.slice(0, 6)}…{account.address.slice(-4)}
            {' '}on this network.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.walletPrompt}>
      <AmberDroplet size="sm" state="sealed" animated />
      <div>
        <div style={{ fontWeight: 500, marginBottom: 4 }}>
          Wallet connected
        </div>
        <p className="text-sm" style={{ color: 'var(--stone-500)' }}>
          {account.address.slice(0, 6)}…{account.address.slice(-4)} · scan for capsules addressed to you
        </p>
      </div>
      <button className="btn btn--secondary" onClick={onScan} disabled={scanning}>
        {scanning ? (
          <>
            <span className={styles.claimSpinner} style={{ borderTopColor: 'var(--amber)' }} />
            Scanning…
          </>
        ) : (
          'Scan for Capsules'
        )}
      </button>
    </div>
  )
}

// ============================================================
// INNER PAGE
// ============================================================

function ClaimInner() {
  const searchParams = useSearchParams()
  const prefilledId  = searchParams.get('id') ?? ''

  const suiClient = useSuiClient()
  const { claimCapsule, getClaimableCapsules } = usePersist()

  const [phase,        setPhase]        = useState<ClaimPhase>('idle')
  const [capsule,      setCapsule]      = useState<CapsuleData | null>(null)
  const [revealedData, setRevealedData] = useState<RevealedData | null>(null)
  const [decrypting,   setDecrypting]   = useState(false)
  const [searching,    setSearching]    = useState(false)
  const [statusDetail, setStatusDetail] = useState('')
  const [decryptError, setDecryptError] = useState<string | null>(null)

  useEffect(() => {
    if (prefilledId) {
      handleSearch(prefilledId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefilledId])

  // ============================================================
  // SEARCH BY CAPSULE ID
  // ============================================================
  async function handleSearch(id: string) {
    setSearching(true)
    setPhase('searching')
    setDecryptError(null)

    try {
      const obj = await suiClient.getObject({
        id,
        options: { showContent: true },
      })

      const fields = (obj.data?.content as any)?.fields
      if (!fields) {
        setPhase('not-found')
        return
      }

      const capsuleData: CapsuleData = {
        objectId:     id,
        blobId:       fields.blob_id ?? '',
        sealerAddr:   fields.creator ?? '',
        nominee:      fields.nominee ?? '',
        condition:    fields.condition_type === 'timelock' ? 'timelock' : 'absence',
        conditionMet: Boolean(fields.condition_met),
        unlockEpoch:  fields.unlock_epoch ? Number(fields.unlock_epoch) : undefined,
        absenceDays:  fields.absence_days  ? Number(fields.absence_days)  : undefined,
        createdAt:    Number(fields.created_at ?? 0),
      }

      const { met, detail } = await checkConditionMet(capsuleData, suiClient)
      setCapsule(capsuleData)
      setStatusDetail(detail)
      setPhase(met ? 'ready' : 'not-ready')
    } catch (err) {
      console.error('Search failed:', err)
      setPhase('not-found')
    } finally {
      setSearching(false)
    }
  }

  // ============================================================
  // SCAN WALLET FOR CLAIMABLE CAPSULES
  // ============================================================
  async function handleScan() {
    setSearching(true)
    setPhase('searching')
    setDecryptError(null)

    try {
      const capsules = await getClaimableCapsules()

      if (capsules.length === 0) {
        setPhase('not-found')
        return
      }

      // Show the first claimable capsule
      // (Production: show a list and let user pick if multiple)
      const first = capsules[0]
      const { met, detail } = await checkConditionMet(first, suiClient)
      setCapsule(first)
      setStatusDetail(detail)
      setPhase(met ? 'ready' : 'not-ready')
    } catch (err) {
      console.error('Scan failed:', err)
      setPhase('not-found')
    } finally {
      setSearching(false)
    }
  }

  // ============================================================
  // DECRYPT — full Seal claim flow via usePersist
  // ============================================================
  async function handleDecrypt() {
    if (!capsule) return
    setDecrypting(true)
    setDecryptError(null)

    try {
      const plaintext = await claimCapsule(capsule.objectId)
      const data = detectContent(plaintext)
      setRevealedData(data)
      setPhase('revealed')
    } catch (err) {
      console.error('Decrypt failed:', err)
      setDecryptError(
        err instanceof Error ? err.message : 'Decryption failed — please try again'
      )
    } finally {
      setDecrypting(false)
    }
  }

  return (
    <div className={styles.page}>

      <nav className="nav">
        <Link href="/" className="nav__logo">
          <PersistLogo size={20} />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <Link href="/" className={styles.navBack}>← Back</Link>
          <WalletConnect />
        </div>
      </nav>

      <div className={styles.layout}>

        <div className={styles.pageHeader}>
          {phase !== 'revealed' && (
            <>
              <h1 className={styles.pageHeadline}>Claim a Capsule</h1>
              <p className="text-body" style={{ color: 'var(--stone-600)', maxWidth: 480 }}>
                A capsule was sealed for you. Enter the capsule ID, or connect
                your wallet to find capsules waiting in your name.
              </p>
            </>
          )}
        </div>

        <div className={styles.content}>

          {phase === 'revealed' && capsule && revealedData && (
            <RevealedContent data={revealedData} capsule={capsule} />
          )}

          {phase === 'not-ready' && capsule && (
            <NotReadyState capsule={capsule} detail={statusDetail} />
          )}

          {phase === 'ready' && capsule && (
            <CapsuleReadyState
              capsule={capsule}
              onClaim={handleDecrypt}
              decrypting={decrypting}
              decryptError={decryptError}
            />
          )}

          {phase === 'searching' && (
            <div className={styles.searchingState}>
              <AmberDroplet size="md" state="approaching" animated />
              <span className="text-mono-label" style={{ color: 'var(--stone-500)' }}>
                Querying Sui…
              </span>
            </div>
          )}

          {(phase === 'idle' || phase === 'not-found') && (
            <div className={styles.lookupMethods}>

              <div className={styles.lookupCard}>
                <p className="text-section-label" style={{ marginBottom: '0.75rem' }}>
                  Have a capsule ID?
                </p>
                <IdLookup onSearch={handleSearch} searching={searching} />
              </div>

              <div className={styles.orDivider}>
                <span className="text-mono-label">or</span>
              </div>

              <div className={styles.lookupCard}>
                <p className="text-section-label" style={{ marginBottom: '0.75rem' }}>
                  Find by wallet
                </p>
                <WalletScan phase={phase} onScan={handleScan} scanning={searching} />
              </div>

            </div>
          )}

        </div>

        {phase !== 'revealed' && (
          <p className={styles.networkNote}>
            <span className="status-dot status-dot--active" />
            Connected to Testnet
          </p>
        )}

      </div>
    </div>
  )
}

// ============================================================
// PAGE
// ============================================================

export default function ClaimPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--amber-white)' }}>
        <AmberDroplet size="md" state="sealed" animated />
      </div>
    }>
      <ClaimInner />
    </Suspense>
  )
}
