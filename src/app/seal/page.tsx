// src/app/seal/page.tsx
// PERSIST V3 — Seal Page (WIRED)
// "The Ritual" — three-step focused flow
// Now calling real Sui + Seal + Walrus logic via usePersist()
//
// Changes from the unwired version:
// - handleSeal() now calls usePersist().sealCapsule()
// - Wallet must be connected before step 3 can complete
// - Step1 file/message → converted to Uint8Array before sealing
// - StepDone links to the real suiscan testnet explorer

'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { AmberDroplet, PersistLogo } from '@/components/AmberDroplet'
import { WalletConnect } from '@/components/WalletConnect'
import { usePersist, type SealResult } from '@/hooks/usePersist'
import styles from './seal.module.css'

// ============================================================
// TYPES
// ============================================================

type Step = 1 | 2 | 3 | 4

type ConditionType = 'timelock' | 'absence'
type ContentType   = 'message' | 'file'

interface SealFormState {
  contentType:  ContentType
  message:      string
  file:         File | null
  nominee:      string
  condition:    ConditionType
  unlockDate:   string
  absenceDays:  number
}

const DEFAULT_FORM: SealFormState = {
  contentType:  'message',
  message:      '',
  file:         null,
  nominee:      '',
  condition:    'absence',
  unlockDate:   '',
  absenceDays:  90,
}

// ============================================================
// STEP INDICATOR
// ============================================================

function StepIndicator({ current }: { current: Step }) {
  const steps = [
    { n: 1 as Step, label: 'What to preserve' },
    { n: 2 as Step, label: 'Who receives it'  },
    { n: 3 as Step, label: 'What opens it'    },
  ]

  return (
    <div className={styles.stepIndicator}>
      {steps.map((s, i) => (
        <div key={s.n} className={styles.stepRow}>
          <div className={styles.stepItem}>
            <div
              className={`
                ${styles.stepCircle}
                ${current === s.n ? styles.stepCircleActive   : ''}
                ${current  >  s.n ? styles.stepCircleComplete : ''}
              `}
            >
              {current > s.n ? '✓' : s.n}
            </div>
            <span
              className={`${styles.stepLabel} ${current === s.n ? styles.stepLabelActive : ''}`}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`${styles.stepConnector} ${current > s.n ? styles.stepConnectorDone : ''}`}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ============================================================
// STEP 1 — What are you preserving?
// ============================================================

function Step1({
  form,
  onChange,
  onNext,
}: {
  form:     SealFormState
  onChange: (patch: Partial<SealFormState>) => void
  onNext:   () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = useCallback((f: File) => {
    onChange({ file: f, contentType: 'file' })
  }, [onChange])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const canProceed = form.contentType === 'message'
    ? form.message.trim().length > 0
    : form.file !== null

  return (
    <div className={styles.stepBody}>
      <div className={styles.stepHeader}>
        <p className="text-section-label">Step 01</p>
        <h2 className={styles.stepHeadline}>What are you preserving?</h2>
        <p className="text-body" style={{ color: 'var(--stone-600)' }}>
          Everything is encrypted on your device before it leaves. Nobody sees this — not even Persist.
        </p>
      </div>

      <div className={styles.typeToggle}>
        <button
          className={`${styles.typeBtn} ${form.contentType === 'message' ? styles.typeBtnActive : ''}`}
          onClick={() => onChange({ contentType: 'message' })}
        >
          ✉️ Message
        </button>
        <button
          className={`${styles.typeBtn} ${form.contentType === 'file' ? styles.typeBtnActive : ''}`}
          onClick={() => onChange({ contentType: 'file' })}
        >
          📄 File
        </button>
      </div>

      {form.contentType === 'message' && (
        <div className={styles.field}>
          <label className="text-mono-label" htmlFor="message">
            Your message
          </label>
          <textarea
            id="message"
            className={styles.textarea}
            placeholder="Write what you want to preserve — instructions, credentials, final words, anything that matters."
            value={form.message}
            onChange={e => onChange({ message: e.target.value })}
            rows={8}
          />
          <span className="text-mono-label" style={{ color: 'var(--stone-400)', marginTop: '0.25rem' }}>
            {form.message.length} characters · will be encrypted client-side via Sui Seal
          </span>
        </div>
      )}

      {form.contentType === 'file' && (
        <div
          className={`${styles.dropZone} ${dragOver ? styles.dropZoneOver : ''} ${form.file ? styles.dropZoneHasFile : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true)  }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />

          {form.file ? (
            <div className={styles.fileSelected}>
              <span className={styles.fileIcon}>📄</span>
              <div>
                <div className={styles.fileName}>{form.file.name}</div>
                <div className="text-mono-label" style={{ color: 'var(--stone-500)' }}>
                  {(form.file.size / 1024).toFixed(1)} KB
                  · will be AES-256 encrypted before upload
                </div>
              </div>
              <button
                className={styles.fileRemove}
                onClick={e => { e.stopPropagation(); onChange({ file: null, contentType: 'message' }) }}
              >
                ✕
              </button>
            </div>
          ) : (
            <>
              <AmberDroplet size="sm" state="sealed" animated />
              <div className={styles.dropZoneText}>
                <span className={styles.dropZoneHeadline}>Drop a file here</span>
                <span className="text-mono-label" style={{ color: 'var(--stone-400)' }}>
                  or click to browse · any file type · max 10MB
                </span>
              </div>
            </>
          )}
        </div>
      )}

      <div className={styles.stepFooter}>
        <div />
        <button
          className="btn btn--primary"
          onClick={onNext}
          disabled={!canProceed}
        >
          Next: Who receives this →
        </button>
      </div>
    </div>
  )
}

// ============================================================
// STEP 2 — Who will find this?
// ============================================================

function Step2({
  form,
  onChange,
  onNext,
  onBack,
}: {
  form:     SealFormState
  onChange: (patch: Partial<SealFormState>) => void
  onNext:   () => void
  onBack:   () => void
}) {
  const isSuiName   = form.nominee.endsWith('.sui')
  const isAddress   = form.nominee.startsWith('0x') && form.nominee.length >= 10
  const canProceed  = isSuiName || isAddress

  return (
    <div className={styles.stepBody}>
      <div className={styles.stepHeader}>
        <p className="text-section-label">Step 02</p>
        <h2 className={styles.stepHeadline}>Who will find this?</h2>
        <p className="text-body" style={{ color: 'var(--stone-600)' }}>
          When conditions are met, this address will be able to crack the amber.
          Only they can decrypt. Not even you can override this.
        </p>
      </div>

      <div className={styles.field}>
        <label className="text-mono-label" htmlFor="nominee">
          Nominee address
        </label>
        <div className={styles.inputWrap}>
          <input
            id="nominee"
            type="text"
            className={`${styles.input} ${canProceed && form.nominee ? styles.inputValid : ''}`}
            placeholder="alice.sui or 0x2bd1…4e02"
            value={form.nominee}
            onChange={e => onChange({ nominee: e.target.value.trim() })}
          />
          {canProceed && form.nominee && (
            <span className={styles.inputCheck}>✓</span>
          )}
        </div>
        <span className="text-mono-label" style={{ color: 'var(--stone-400)', marginTop: '0.25rem' }}>
          Accepts Sui wallet addresses (0x…) and SuiNS names (.sui)
        </span>
      </div>

      {canProceed && form.nominee && (
        <div className={styles.nomineeConfirm}>
          <AmberDroplet size="xs" state="sealed" animated={false} />
          <div>
            <div className="text-mono-label">Nominee set</div>
            <div className="text-mono" style={{ color: 'var(--amber-deep)', marginTop: '2px' }}>
              {form.nominee}
            </div>
          </div>
        </div>
      )}

      {/* Note about SuiNS resolution */}
      {isSuiName && (
        <p className="text-mono-label" style={{ color: 'var(--amber-deep)' }}>
          ⓘ .sui names are resolved to addresses automatically when sealing
        </p>
      )}

      <div className={styles.stepFooter}>
        <button className="btn btn--ghost" onClick={onBack}>← Back</button>
        <button
          className="btn btn--primary"
          onClick={onNext}
          disabled={!canProceed}
        >
          Next: Set conditions →
        </button>
      </div>
    </div>
  )
}

// ============================================================
// STEP 3 — What opens it?
// ============================================================

function Step3({
  form,
  onChange,
  onSeal,
  onBack,
  sealing,
  sealError,
  walletConnected,
}: {
  form:            SealFormState
  onChange:        (patch: Partial<SealFormState>) => void
  onSeal:          () => void
  onBack:          () => void
  sealing:         boolean
  sealError:       string | null
  walletConnected: boolean
}) {
  const today = new Date().toISOString().split('T')[0]

  const canProceed = form.condition === 'absence'
    ? form.absenceDays > 0
    : form.unlockDate.length > 0 && form.unlockDate > today

  return (
    <div className={styles.stepBody}>
      <div className={styles.stepHeader}>
        <p className="text-section-label">Step 03</p>
        <h2 className={styles.stepHeadline}>What opens it?</h2>
        <p className="text-body" style={{ color: 'var(--stone-600)' }}>
          Once sealed, even you cannot open this early. Conditions are
          enforced in Move — immutable, on-chain, no override.
        </p>
      </div>

      <div className={styles.conditionSelector}>
        <button
          className={`${styles.conditionBtn} ${form.condition === 'absence' ? styles.conditionBtnActive : ''}`}
          onClick={() => onChange({ condition: 'absence' })}
        >
          <div className={styles.conditionBtnHeader}>
            <span className={styles.conditionIcon}>⏱</span>
            <span className={styles.conditionTitle}>Absence Safeguard</span>
            {form.condition === 'absence' && (
              <span className={styles.conditionCheck}>✓</span>
            )}
          </div>
          <p className={styles.conditionDesc}>
            Opens if your wallet shows no activity for a set period.
            The Guardian Agent monitors and attests on-chain.
          </p>
        </button>

        <button
          className={`${styles.conditionBtn} ${form.condition === 'timelock' ? styles.conditionBtnActive : ''}`}
          onClick={() => onChange({ condition: 'timelock' })}
        >
          <div className={styles.conditionBtnHeader}>
            <span className={styles.conditionIcon}>📅</span>
            <span className={styles.conditionTitle}>Time Lock</span>
            {form.condition === 'timelock' && (
              <span className={styles.conditionCheck}>✓</span>
            )}
          </div>
          <p className={styles.conditionDesc}>
            Opens on a specific date. No activity monitoring required.
            Enforced by Sui epoch timestamps.
          </p>
        </button>
      </div>

      {form.condition === 'absence' && (
        <div className={styles.field}>
          <label className="text-mono-label" htmlFor="absenceDays">
            Inactivity window
          </label>
          <div className={styles.absenceSelector}>
            {[30, 60, 90, 180, 365].map(days => (
              <button
                key={days}
                className={`${styles.absenceOption} ${form.absenceDays === days ? styles.absenceOptionActive : ''}`}
                onClick={() => onChange({ absenceDays: days })}
              >
                {days}d
              </button>
            ))}
            <div className={styles.absenceCustom}>
              <input
                id="absenceDays"
                type="number"
                className={styles.inputSmall}
                value={form.absenceDays}
                min={1}
                max={3650}
                onChange={e => onChange({ absenceDays: parseInt(e.target.value) || 0 })}
              />
              <span className="text-mono-label">days</span>
            </div>
          </div>
          <span className="text-mono-label" style={{ color: 'var(--stone-400)', marginTop: '0.25rem' }}>
            Opens if no wallet activity is detected for {form.absenceDays} consecutive days
          </span>
        </div>
      )}

      {form.condition === 'timelock' && (
        <div className={styles.field}>
          <label className="text-mono-label" htmlFor="unlockDate">
            Unlock date
          </label>
          <input
            id="unlockDate"
            type="date"
            className={styles.input}
            min={today}
            value={form.unlockDate}
            onChange={e => onChange({ unlockDate: e.target.value })}
          />
          {form.unlockDate && (
            <span className="text-mono-label" style={{ color: 'var(--stone-400)', marginTop: '0.25rem' }}>
              Opens on {new Date(form.unlockDate).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric'
              })}
            </span>
          )}
        </div>
      )}

      {/* Cost estimate */}
      <div className={styles.costEstimate}>
        <span className="text-mono-label">Estimated cost</span>
        <div className={styles.costBreakdown}>
          <div className={styles.costRow}>
            <span className="text-mono">Sui gas (2 transactions)</span>
            <span className="text-mono" style={{ color: 'var(--stone-700)' }}>~0.006 SUI</span>
          </div>
          <div className={styles.costRow}>
            <span className="text-mono">Walrus storage</span>
            <span className="text-mono" style={{ color: 'var(--stone-700)' }}>
              {form.file
                ? `~${(form.file.size / (1024 * 1024) * 0.023).toFixed(4)} USD/mo`
                : '~$0.0001/mo (message)'
              }
            </span>
          </div>
        </div>
      </div>

      {/* Wallet connection gate */}
      {!walletConnected && (
        <div className={styles.walletGate}>
          <span className="text-mono-label" style={{ color: 'var(--amber-deep)' }}>
            ⓘ Connect your wallet to seal this capsule
          </span>
        </div>
      )}

      {/* Error message */}
      {sealError && (
        <div className={styles.sealError}>
          <span className="text-mono-label" style={{ color: '#B91C1C' }}>
            ✕ {sealError}
          </span>
        </div>
      )}

      <div className={styles.stepFooter}>
        <button className="btn btn--ghost" onClick={onBack} disabled={sealing}>
          ← Back
        </button>
        <button
          className={`btn btn--primary ${styles.sealBtn}`}
          onClick={onSeal}
          disabled={!canProceed || sealing || !walletConnected}
        >
          {sealing ? (
            <>
              <span className={styles.sealSpinner} />
              Sealing…
            </>
          ) : (
            'Seal Capsule'
          )}
        </button>
      </div>
    </div>
  )
}

// ============================================================
// STEP 4 — Confirmation / Done
// ============================================================

function StepDone({ result, form }: { result: SealResult; form: SealFormState }) {
  const [copied, setCopied] = useState(false)

  function copyLink() {
    navigator.clipboard.writeText(
      `${window.location.origin}/claim?id=${result.objectId}`
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={styles.doneState}>
      <div className={styles.doneVisual}>
        <AmberDroplet size="lg" state="revealed" showCracks animated />
      </div>

      <h2 className={styles.doneHeadline}>Sealed.</h2>
      <p className="text-body" style={{ color: 'var(--stone-600)', marginBottom: 'var(--space-6)', textAlign: 'center' }}>
        Your capsule is permanently stored on Walrus and recorded on Sui.
        {form.nominee && (
          <> When conditions are met, <strong>{form.nominee}</strong> can claim it.</>
        )}
      </p>

      <div className={styles.resultCard}>
        <div className="data-row">
          <span className="data-row__label">Capsule ID</span>
          <span className="data-row__value">{result.objectId}</span>
        </div>
        <div className="data-row">
          <span className="data-row__label">Walrus Blob</span>
          <span className="data-row__value" style={{ fontSize: '0.7rem', color: 'var(--stone-500)' }}>
            {result.blobId}
          </span>
        </div>
        <div className="data-row">
          <span className="data-row__label">Transaction</span>
          <a
            href={`https://suiscan.xyz/testnet/tx/${result.txDigest}`}
            target="_blank"
            rel="noreferrer"
            className={styles.txLink}
          >
            {result.txDigest} ↗
          </a>
        </div>
      </div>

      <div className={styles.shareRow}>
        <button className="btn btn--primary" onClick={copyLink} style={{ flex: 1 }}>
          {copied ? '✓ Copied!' : 'Copy Claim Link'}
        </button>
        <Link href="/vault" className="btn btn--secondary">
          View Vault
        </Link>
      </div>

      <p className="text-mono-label" style={{ color: 'var(--stone-400)', marginTop: 'var(--space-4)', textAlign: 'center' }}>
        Share the claim link with {form.nominee || 'your nominee'} when the time is right.
      </p>
    </div>
  )
}

// ============================================================
// AMBIENT CAPSULE VISUAL
// ============================================================

function AmbientCapsule({ step }: { step: Step }) {
  const state = step === 4 ? 'revealed'
    : step === 3 ? 'approaching'
    : 'sealed'

  return (
    <div className={styles.ambient}>
      <div className={styles.ambientCapsule}>
        <AmberDroplet size="xl" state={state} showCracks={step >= 3} animated />
      </div>

      <div className={styles.ambientLabels}>
        <div className={`${styles.ambientLabel} ${step >= 1 ? styles.ambientLabelActive : ''}`}>
          <span className="status-dot" style={{ background: step >= 1 ? 'var(--amber)' : 'var(--stone-300)' }} />
          <span className="text-mono-label">Content ready</span>
        </div>
        <div className={`${styles.ambientLabel} ${step >= 2 ? styles.ambientLabelActive : ''}`}>
          <span className="status-dot" style={{ background: step >= 2 ? 'var(--amber)' : 'var(--stone-300)' }} />
          <span className="text-mono-label">Nominee set</span>
        </div>
        <div className={`${styles.ambientLabel} ${step >= 3 ? styles.ambientLabelActive : ''}`}>
          <span className="status-dot" style={{ background: step >= 3 ? 'var(--amber-glow)' : 'var(--stone-300)' }} />
          <span className="text-mono-label">Conditions defined</span>
        </div>
        <div className={`${styles.ambientLabel} ${step === 4 ? styles.ambientLabelActive : ''}`}>
          <span className="status-dot" style={{ background: step === 4 ? 'var(--emerald)' : 'var(--stone-300)' }} />
          <span className="text-mono-label">Sealed on-chain</span>
        </div>
      </div>

      <div className={styles.ambientNote}>
        <span className="text-mono-label" style={{ color: 'var(--stone-400)' }}>
          🔒 AES-256-GCM · Sealed via Sui Seal · Stored on Walrus
        </span>
      </div>
    </div>
  )
}

// ============================================================
// PAGE
// ============================================================

export default function SealPage() {
  const account = useCurrentAccount()
  const { sealCapsule } = usePersist()

  const [step,      setStep]      = useState<Step>(1)
  const [form,      setForm]      = useState<SealFormState>(DEFAULT_FORM)
  const [sealing,   setSealing]   = useState(false)
  const [sealError, setSealError] = useState<string | null>(null)
  const [result,    setResult]    = useState<SealResult | null>(null)

  function patch(p: Partial<SealFormState>) {
    setForm(f => ({ ...f, ...p }))
    setSealError(null)
  }

  // ============================================================
  // SEAL HANDLER — wired to usePersist().sealCapsule()
  // ============================================================
  async function handleSeal() {
    setSealing(true)
    setSealError(null)

    try {
      // 1. Convert content to bytes
      let contentBytes: Uint8Array
      if (form.contentType === 'message') {
        contentBytes = new TextEncoder().encode(form.message)
      } else if (form.file) {
        const buffer = await form.file.arrayBuffer()
        contentBytes = new Uint8Array(buffer)
      } else {
        throw new Error('No content to seal')
      }

      // 2. Resolve nominee — if .sui name, resolve to address
      // NOTE: SuiNS resolution requires @mysten/sui's SuinsClient.
      // For now, pass the raw nominee string; the Move contract
      // stores it as-is. Resolve .sui → 0x address before the
      // create_capsule call if your contract requires raw addresses:
      //
      //   import { SuinsClient } from '@mysten/suins'
      //   const suins = new SuinsClient({ client: suiClient, network: 'testnet' })
      //   const resolved = await suins.getNameRecord(form.nominee)
      //   const nomineeAddress = resolved?.targetAddress ?? form.nominee
      const nominee = form.nominee

      // 3. Calculate unlock epoch for timelock
      let unlockEpoch: number | undefined
      if (form.condition === 'timelock' && form.unlockDate) {
        const targetDate = new Date(form.unlockDate)
        const now        = new Date()
        const daysUntil  = Math.ceil((targetDate.getTime() - now.getTime()) / 86_400_000)
        // Sui testnet epochs are ~24h — adjust if your network differs
        unlockEpoch = daysUntil
      }

      // 4. Call the real seal flow
      const sealResult = await sealCapsule({
        contentBytes,
        nominee,
        condition:    form.condition,
        unlockEpoch,
        absenceDays:  form.absenceDays,
      })

      setResult(sealResult)
      setStep(4)
    } catch (err) {
      console.error('Seal failed:', err)
      setSealError(
        err instanceof Error ? err.message : 'Sealing failed — please try again'
      )
    } finally {
      setSealing(false)
    }
  }

  return (
    <div className={styles.page}>

      <nav className={`nav ${styles.sealNav}`}>
        <Link href="/" className="nav__logo">
          <PersistLogo size={20} />
        </Link>
        {step < 4 ? (
          <StepIndicator current={step} />
        ) : (
          <div />
        )}
        <WalletConnect />
      </nav>

      <div className={styles.layout}>

        <div className={styles.formCol}>
          {step === 1 && (
            <Step1 form={form} onChange={patch} onNext={() => setStep(2)} />
          )}
          {step === 2 && (
            <Step2
              form={form}
              onChange={patch}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <Step3
              form={form}
              onChange={patch}
              onSeal={handleSeal}
              onBack={() => setStep(2)}
              sealing={sealing}
              sealError={sealError}
              walletConnected={Boolean(account)}
            />
          )}
          {step === 4 && result && (
            <StepDone result={result} form={form} />
          )}
        </div>

        {step < 4 && (
          <div className={styles.ambientCol}>
            <AmbientCapsule step={step} />
          </div>
        )}
      </div>

    </div>
  )
}