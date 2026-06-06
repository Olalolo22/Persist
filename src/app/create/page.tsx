"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useCurrentAccount,
  useSuiClient,
  useSignAndExecuteTransaction,
  ConnectButton,
} from "@mysten/dapp-kit";
import { encryptForCapsule, createSealClient } from "@/lib/seal";
import { uploadToWalrus } from "@/lib/walrus";
import { reconstructDigitalFootprint, DigitalLegacyProfile } from "@/lib/tatum";
import { Transaction } from "@mysten/sui/transactions";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { useEffect } from "react";

export const dynamic = "force-dynamic";

export default function CreateCapsule() {
  const router = useRouter();
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient() as any;
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const { toast } = useToast();

  const shortenAddress = (addr: string) => {
    if (!addr) return "";
    return addr.slice(0, 6) + "..." + addr.slice(-4);
  };

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [sealingStep, setSealingStep] = useState<"encrypting" | "uploading" | "deploying" | "finalizing" | "success" | "idle">("idle");
  const [createdCapsuleId, setCreatedCapsuleId] = useState<string | null>(null);

  const [capsuleName, setCapsuleName] = useState("");
  const [description, setDescription] = useState("");
  const [secretMessage, setSecretMessage] = useState("");
  const [epitaph, setEpitaph] = useState("");
  const [selectedFile, setSelectedFile] = useState<{name: string, type: string, base64: string} | null>(null);
  
  const [nomineeName, setNomineeName] = useState("");
  const [nomineeInput, setNomineeInput] = useState("");
  const [nomineeAddress, setNomineeAddress] = useState("");
  const [resolvingName, setResolvingName] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [resolutionError, setResolutionError] = useState<string | null>(null);

  const [triggerType, setTriggerType] = useState<"inactivity" | "date" | "manual">("inactivity");
  const [inactivityDays, setInactivityDays] = useState(90);
  const [releaseDate, setReleaseDate] = useState("");
  const [releaseTime, setReleaseTime] = useState("");

  const [legacyProfile, setLegacyProfile] = useState<DigitalLegacyProfile | null>(null);
  const [fetchingProfile, setFetchingProfile] = useState(false);

  useEffect(() => {
    if (currentAccount) {
      setFetchingProfile(true);
      reconstructDigitalFootprint(currentAccount.address).then(profile => {
        setLegacyProfile(profile);
        setFetchingProfile(false);
      });
    }
  }, [currentAccount]);

  const [selectedTypes, setSelectedTypes] = useState<string[]>(["Wallet Recovery"]);

  const contentTypesList = [
    { label: "Wallet Recovery", sub: "Seed phrase, private key, or keystore" },
    { label: "Account Recovery", sub: "Passwords, PINs, or 2FA backups" },
    { label: "Document", sub: "PDF, image, or text file" },
    { label: "Instructions", sub: "Steps for your nominee to follow" },
    { label: "Personal Letter", sub: "A message for your intended recipient" }
  ];

  const handleNomineeChange = async (value: string) => {
    setNomineeInput(value);
    setResolutionError(null);
    setResolvedAddress(null);

    if (value.endsWith(".sui")) {
      setResolvingName(true);
      try {
        const resolved = await suiClient.resolveNameServiceAddress({
          name: value,
        });
        if (resolved) {
          setResolvedAddress(resolved);
          setNomineeAddress(resolved);
        } else {
          setResolutionError("SuiNS name could not be resolved.");
        }
      } catch (err) {
        console.error("SuiNS resolution failed:", err);
        setResolutionError("Name resolution error.");
      } finally {
        setResolvingName(false);
      }
    } else {
      setNomineeAddress(value);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast("File size exceeds 5MB limit", "error");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        const base64 = result.split(',')[1];
        setSelectedFile({
          name: file.name,
          type: file.type || "application/octet-stream",
          base64,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleContentType = (typeLabel: string) => {
    if (selectedTypes.includes(typeLabel)) {
      setSelectedTypes(selectedTypes.filter((t) => t !== typeLabel));
    } else {
      setSelectedTypes([...selectedTypes, typeLabel]);
    }
  };

  const getReleaseTimeMs = () => {
    if (triggerType === "inactivity") {
      return Date.now() + inactivityDays * 24 * 60 * 60 * 1000;
    } else if (triggerType === "date") {
      const releaseDateTimeStr = `${releaseDate}T${releaseTime}`;
      return new Date(releaseDateTimeStr).getTime();
    } else {
      return Date.now() + 100 * 365 * 24 * 60 * 60 * 1000;
    }
  };

  const handleSeal = async () => {
    if (!currentAccount) {
      toast("Please connect your wallet first.", "error");
      return;
    }

    if (!capsuleName.trim()) {
      toast("Capsule name is required.", "error");
      return;
    }

    if (!secretMessage.trim()) {
      toast("Please enter the secret content to encrypt.", "error");
      return;
    }

    if (!nomineeAddress.trim() || !nomineeAddress.startsWith("0x") || nomineeAddress.length !== 66) {
      toast("A valid 64-character Sui nominee address is required.", "error");
      return;
    }

    const releaseTimeMs = getReleaseTimeMs();
    if (isNaN(releaseTimeMs) || releaseTimeMs <= Date.now()) {
      toast("Release date and time must be in the future.", "error");
      return;
    }

    if (nomineeAddress.toLowerCase() === currentAccount.address.toLowerCase()) {
      toast("Nominee address cannot match the creator's address.", "error");
      return;
    }

    try {
      setLoading(true);
      setSealingStep("encrypting");
      setLoadingStatus("Creating draft capsule on Sui...");

      let oraclePubKeyBytes: number[] = [];
      let inactivityWindowMs = 0;

      if (triggerType === "inactivity") {
        inactivityWindowMs = inactivityDays * 24 * 60 * 60 * 1000;
        try {
          const res = await fetch("/api/oracle/pubkey");
          if (res.ok) {
            const data = await res.json();
            if (data.pubKeyHex) {
               const { fromHex } = await import("@mysten/sui/utils");
               oraclePubKeyBytes = Array.from(fromHex(data.pubKeyHex));
            }
          }
        } catch (e) {
          console.warn("Could not fetch oracle pubkey", e);
        }
      }

      const createTx = new Transaction();
      createTx.moveCall({
        target: `${process.env.NEXT_PUBLIC_PERSIST_PACKAGE_ID}::capsule::create_capsule`,
        arguments: [
          createTx.pure.vector("u8", []),
          createTx.pure.address(nomineeAddress),
          createTx.pure.u64(releaseTimeMs),
          createTx.pure.vector("u8", oraclePubKeyBytes),
          createTx.pure.u64(inactivityWindowMs),
          createTx.object("0x6"),
        ],
      });

      const createResult = await signAndExecuteTransaction({
        transaction: createTx,
      });

      setLoadingStatus("Awaiting transaction indexing...");

      const txData = (await suiClient.waitForTransaction({
        digest: createResult.digest,
        options: { showObjectChanges: true },
      })) as any;

      const capsuleId = txData.objectChanges?.find(
        (change: any) => change.type === "created" && change.objectType?.includes("PersistCapsule")
      )?.objectId;

      if (!capsuleId) {
        throw new Error("Sui transaction completed, but Capsule ID could not be resolved.");
      }

      setSealingStep("encrypting");
      setLoadingStatus("Performing local threshold encryption via Sui Seal...");

      const sealClient = createSealClient(suiClient);
      const secretPayload = {
        text: secretMessage,
        file: selectedFile
      };
      const plaintextBytes = new TextEncoder().encode(JSON.stringify(secretPayload));
      const encryptedBytes = await encryptForCapsule(sealClient, capsuleId, plaintextBytes);

      setSealingStep("uploading");
      setLoadingStatus("Uploading encrypted payload to Walrus...");

      const payloadObj = {
        name: capsuleName,
        description,
        epitaph,
        encryptedPayload: Buffer.from(encryptedBytes).toString("base64"),
      };

      const payloadBuffer = Buffer.from(JSON.stringify(payloadObj));
      const blobId = await uploadToWalrus(payloadBuffer);

      setSealingStep("deploying");
      setLoadingStatus("Locking capsule and finalizing on Sui blockchain...");

      const updateTx = new Transaction();
      updateTx.moveCall({
        target: `${process.env.NEXT_PUBLIC_PERSIST_PACKAGE_ID}::capsule::update_blob_id`,
        arguments: [
          updateTx.object(capsuleId),
          updateTx.pure.vector("u8", Array.from(Buffer.from(blobId))),
        ],
      });

      await signAndExecuteTransaction({
        transaction: updateTx,
      });

      setCreatedCapsuleId(capsuleId);
      setSealingStep("success");
    } catch (err: any) {
      console.error("Sealing flow failed:", err);
      toast(err.message || "Sealing failed. Verify your SUI balance and nominee details.", "error");
      setSealingStep("idle");
      setLoading(false);
    }
  };

  const getClaimUrl = () => {
    if (!createdCapsuleId) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/claim/${createdCapsuleId}`;
  };

  // SUCCESS SCREEN
  if (sealingStep === "success") {
    return (
      <div className="layout" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <div className="cap-open">
            <div className="top"></div>
            <div className="bottom"></div>
            <div className="light"></div>
          </div>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: '32px', color: 'var(--gold)', marginBottom: '8px' }}>Safely Sealed & Stored</h2>
          <p style={{ fontSize: '12px', color: 'var(--aged)', marginBottom: '40px' }}>Your digital heirloom is written to Walrus permanent storage and enforced by an immutable Sui smart contract.</p>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '24px', borderRadius: '12px', textAlign: 'left', marginBottom: '40px' }}>
            <span style={{ fontSize: '10px', color: 'var(--gold)', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'var(--mono)', display: 'block', marginBottom: '8px' }}>Shareable claim link (wallet protected)</span>
            <p style={{ fontSize: '12px', color: 'var(--aged)', marginBottom: '16px', lineHeight: 1.6 }}>Persist is fully serverless. Share this private Claim URL with your nominee. Decryption is authorised exclusively by their wallet.</p>
            <div style={{ display: 'flex', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', padding: '12px' }}>
              <input type="text" readOnly value={getClaimUrl()} style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--ivory)', fontSize: '12px', fontFamily: 'var(--mono)', outline: 'none' }} />
              <button onClick={() => { navigator.clipboard.writeText(getClaimUrl()); toast("Claim URL copied", "success"); }} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '12px', cursor: 'pointer', fontWeight: 500 }}>Copy</button>
            </div>
          </div>
          <button className="btn-next" style={{ width: '100%' }} onClick={() => router.push('/')}>Return to Vault</button>
        </div>
      </div>
    );
  }

  // SEALING OVERLAY
  if (loading) {
    return (
      <div className="sealing-screen active">
        <div className="seal-capsule">
          <div className="sc-body">
            <div className="sc-seam"></div>
          </div>
        </div>
        <div style={{ fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(140,133,120,0.7)', marginBottom: '12px', fontFamily: 'var(--mono)' }}>Sealing capsule on-chain</div>
        <div style={{ fontFamily: 'var(--serif)', fontSize: '32px', fontStyle: 'italic', marginBottom: '32px', color: 'var(--ivory)' }}>One moment.</div>

        <div className="seal-steps">
          <div className={`ss ${sealingStep !== "idle" ? 'active' : ''}`}>
            <div className="ss-icon">✓</div>
            <div className="ss-text">Content encrypted locally using Sui Seal</div>
          </div>
          <div className={`ss ${sealingStep === "uploading" || sealingStep === "deploying" || sealingStep === "finalizing" ? 'active' : 'pending'}`}>
            <div className="ss-icon">{sealingStep === "uploading" || sealingStep === "deploying" || sealingStep === "finalizing" ? "✓" : "·"}</div>
            <div className="ss-text">Preserving contents permanently on Walrus</div>
          </div>
          <div className={`ss ${sealingStep === "deploying" ? 'active' : sealingStep === "finalizing" ? 'done' : 'pending'}`}>
            <div className="ss-icon">{sealingStep === "deploying" ? <span className="mini-spinner"></span> : sealingStep === "finalizing" ? "✓" : "·"}</div>
            <div className="ss-text">Enforcing release rules on Sui...</div>
          </div>
          <div className={`ss ${sealingStep === "finalizing" ? 'active' : 'pending'}`}>
            <div className="ss-icon">{sealingStep === "finalizing" ? <span className="mini-spinner"></span> : "·"}</div>
            <div className="ss-text">Finalizing credentials & locks</div>
          </div>
        </div>

        <p style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'rgba(140,133,120,0.3)', lineHeight: 1.7 }}>Do not close this tab.<br/>Contract deployment requires on-chain confirmation.</p>
      </div>
    );
  }

  return (
    <>
      <div className="nav">
        <div className="nav-logo" onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>persist</div>
        <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'rgba(140,133,120,0.4)' }}>
            {currentAccount ? shortenAddress(currentAccount.address) : "Wallet not connected"}
          </span>
          <button style={{ background: 'none', border: 'none', color: 'var(--aged)', fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--sans)' }} onClick={() => router.push('/')}>
            ← Dashboard
          </button>
        </div>
      </div>

      <div className="layout">
        <div className="form-area">
          <div className="progress">
            {[1, 2, 3, 4, 5].map((num, i) => (
              <React.Fragment key={num}>
                <div className="prog-step" onClick={() => step > num && setStep(num)}>
                  <div className={`prog-num ${step > num ? 'done' : step === num ? 'active' : 'pending'}`}>
                    {step > num ? '✓' : num}
                  </div>
                  <div className={`prog-label ${step > num ? 'done' : step === num ? 'active' : 'pending'}`}>
                    {["Name", "Contents", "Trigger", "Nominee", "Review"][num - 1]}
                  </div>
                </div>
                {i < 4 && <div className={`prog-line ${step > num + 1 ? 'done' : ''}`}></div>}
              </React.Fragment>
            ))}
          </div>

          <div className={`step ${step === 1 ? 'active' : ''}`}>
            <div className="step-eyebrow">Step 1 of 5</div>
            <div className="step-title">What are you preserving?</div>
            <div className="step-sub">Give it a name you'll recognize. Your intended recipient will see this when the capsule unlocks.</div>

            <div className="field">
              <label>Capsule Name</label>
              <input type="text" placeholder="e.g. For Amara, Estate Keys, My Final Letter" value={capsuleName} onChange={e => setCapsuleName(e.target.value)} />
              <div className="hint">This is display-only. It is not stored on-chain.</div>
            </div>
            <div className="field">
              <label>Description (optional)</label>
              <textarea placeholder="A short note about what this capsule contains — for your reference only." rows={3} value={description} onChange={e => setDescription(e.target.value)}></textarea>
              <div className="hint">Private metadata. Never shown to the intended recipient before opening.</div>
            </div>

            <div className="step-nav">
              <div></div>
              <button className="btn-next" onClick={() => capsuleName.trim() ? setStep(2) : toast("Capsule name is required", "error")}>Continue →</button>
            </div>
          </div>

          <div className={`step ${step === 2 ? 'active' : ''}`}>
            <div className="step-eyebrow">Step 2 of 5</div>
            <div className="step-title">What are you sealing inside?</div>
            <div className="step-sub">Choose what to add to this capsule. Everything is encrypted in your browser before it leaves your device.</div>

            <div className="encrypt-bar">
              <div className="encrypt-dot"></div>
              <p>Sui Seal encryption · keys generated locally · payload sealed before upload to Walrus</p>
            </div>

            <div className="content-types">
              {contentTypesList.map(ct => (
                <div key={ct.label} className={`content-type ${selectedTypes.includes(ct.label) ? 'selected' : ''}`} onClick={() => toggleContentType(ct.label)}>
                  <div>
                    <div className="ct-label">{ct.label}</div>
                    <div className="ct-sub">{ct.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="field">
              <label>Seal your assets or instructions</label>
              <div style={{ padding: '16px', background: 'rgba(28,26,22,0.5)', border: '1px solid rgba(184,151,74,0.3)', borderRadius: '6px', marginBottom: '16px', display: 'flex', gap: '12px' }}>
                <span style={{ color: 'var(--gold)' }}>🔒</span>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--ivory)', marginBottom: '4px', fontFamily: 'var(--serif)' }}>Local Encryption Only</div>
                  <p style={{ fontSize: '12px', color: 'var(--aged)', margin: 0, lineHeight: 1.5 }}>This text is encrypted entirely within your browser using Sui Seal. Persist cannot read it, scan it, or retrieve it.</p>
                </div>
              </div>
              <textarea placeholder="Paste your recovery data, account credentials, or write your message here…" rows={5} style={{fontFamily:'var(--mono)', fontSize:'12px'}} value={secretMessage} onChange={e => setSecretMessage(e.target.value)}></textarea>
              
              <div style={{ marginTop: '16px', background: 'rgba(28,26,22,0.5)', border: '1px dashed rgba(184,151,74,0.3)', padding: '16px', borderRadius: '6px' }}>
                <div style={{ fontSize: '12px', color: 'var(--aged)', marginBottom: '8px', fontFamily: 'var(--serif)' }}>Attach a secure file</div>
                <input type="file" onChange={handleFileChange} style={{ fontSize: '12px', color: 'var(--ivory)', fontFamily: 'var(--mono)', width: '100%' }} />
                {selectedFile && (
                  <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{flex: 1, fontFamily: 'var(--mono)'}}>{selectedFile.name} ({(selectedFile.base64.length * 0.75 / 1024).toFixed(1)} KB)</span>
                    <button onClick={() => { setSelectedFile(null); const input = document.querySelector('input[type="file"]') as HTMLInputElement; if(input) input.value = ''; }} style={{ background: 'transparent', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '12px' }}>Remove</button>
                  </div>
                )}
              </div>

              <div className="hint">Encrypted locally. Decrypted only by intended recipient after release. Max file size 5MB.</div>
            </div>

            <div className="step-nav">
              <button className="btn-back-step" onClick={() => setStep(1)}>← Back</button>
              <button className="btn-next" onClick={() => (secretMessage.trim() || selectedFile) ? setStep(3) : toast("Content or a file is required", "error")}>Continue →</button>
            </div>
          </div>

          <div className={`step ${step === 3 ? 'active' : ''}`}>
            <div className="step-eyebrow">Step 3 of 5</div>
            <div className="step-title">When should this capsule unlock?</div>
            <div className="step-sub">Choose what condition triggers access. The Sui smart contract enforces this — nothing else can alter it.</div>

            <div className="trigger-grid">
              <div className={`trigger-card ${triggerType === 'inactivity' ? 'selected' : ''}`} onClick={() => setTriggerType('inactivity')}>
                <div className="t-icon">◉</div>
                <div className="t-label">Absence Safeguard</div>
                <div className="t-desc">Unlocks if your wallet goes quiet</div>
              </div>
              <div className={`trigger-card ${triggerType === 'date' ? 'selected' : ''}`} onClick={() => setTriggerType('date')}>
                <div className="t-icon">◎</div>
                <div className="t-label">Date</div>
                <div className="t-desc">Unlocks on a specific date</div>
              </div>
              <div className={`trigger-card ${triggerType === 'manual' ? 'selected' : ''}`} onClick={() => setTriggerType('manual')}>
                <div className="t-icon">○</div>
                <div className="t-label">Manual</div>
                <div className="t-desc">You release it when you choose</div>
              </div>
            </div>

            {triggerType === 'inactivity' && (
              <div className="field">
                <label>Silence window</label>
                <div className="window-options">
                  {[30, 90, 180, 365].map(days => (
                    <div key={days} className={`window-opt ${inactivityDays === days ? 'selected' : ''}`} onClick={() => setInactivityDays(days)}>{days} days</div>
                  ))}
                </div>
                <div className="hint">If your wallet goes silent beyond the defined window, your intended recipient can open the capsule. Tatum indexes wallet activity but does not control security logic.</div>
              </div>
            )}

            {triggerType === 'date' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>Unlock date</label>
                  <input type="date" style={{ colorScheme: 'dark' }} value={releaseDate} onChange={e => setReleaseDate(e.target.value)} />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>Unlock time</label>
                  <input type="time" style={{ colorScheme: 'dark' }} value={releaseTime} onChange={e => setReleaseTime(e.target.value)} />
                </div>
                <div className="hint" style={{ gridColumn: 'span 2' }}>The Sui contract will release key servers on or after this date. This is immutable once sealed.</div>
              </div>
            )}

            {triggerType === 'manual' && (
              <div className="field">
                <div className="hint" style={{ padding: '16px', background: 'rgba(28,26,22,0.5)', border: '1px solid var(--border)', borderRadius: '6px' }}>Manual release means <strong>only you can trigger the unlock</strong> directly from your connected wallet. This is designed for alive-gifts or private vesting.</div>
              </div>
            )}

            <div className="step-nav">
              <button className="btn-back-step" onClick={() => setStep(2)}>← Back</button>
              <button className="btn-next" onClick={() => setStep(4)}>Continue →</button>
            </div>
          </div>

          <div className={`step ${step === 4 ? 'active' : ''}`}>
            <div className="step-eyebrow">Step 4 of 5</div>
            <div className="step-title">Who receives this capsule?</div>
            <div className="step-sub">This person will receive access when your capsule's conditions are met.</div>

            <div className="nominee-note">
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--gold)' }}>⊕</span>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--ivory)', marginBottom: '4px', fontFamily: 'var(--mono)' }}>Identity Resolution Layer</div>
                  <p>We support SuiNS names for readability. All permissions are verified strictly using immutable wallet addresses on-chain. Access control does not depend on NFT or name ownership.</p>
                </div>
              </div>
            </div>

            <div className="field">
              <label>Intended recipient name</label>
              <input type="text" placeholder="e.g. Amara Okafor" value={nomineeName} onChange={e => setNomineeName(e.target.value)} />
              <div className="hint">For reference and display in the claim screen greeting.</div>
            </div>

            <div className="field">
              <label>Intended recipient (Sui Address or SuiNS name)</label>
              <div style={{ position: 'relative' }}>
                <input type="text" placeholder="e.g. amara.sui or 0x4f2a..." style={{ fontFamily: 'var(--mono)' }} value={nomineeInput} onChange={e => handleNomineeChange(e.target.value)} />
                {resolvingName && <div className="mini-spinner" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' }}></div>}
              </div>
              
              {resolvedAddress && (
                <div style={{ background: 'rgba(74,103,65,0.05)', border: '1px solid rgba(74,103,65,0.2)', padding: '12px', borderRadius: '6px', marginTop: '12px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--moss)', fontFamily: 'var(--mono)', wordBreak: 'break-all' }}>✓ {nomineeInput} resolved → {shortenAddress(resolvedAddress)}</div>
                </div>
              )}
            </div>

            <div className="step-nav">
              <button className="btn-back-step" onClick={() => setStep(3)}>← Back</button>
              <button className="btn-next" onClick={() => {
                if (!nomineeAddress || !nomineeAddress.startsWith("0x") || nomineeAddress.length !== 66) {
                  toast("Provide a valid Sui address or resolvable SuiNS domain.", "error");
                  return;
                }
                setStep(5);
              }}>Review capsule →</button>
            </div>
          </div>

          <div className={`step ${step === 5 ? 'active' : ''}`}>
            <div className="step-eyebrow">Step 5 of 5</div>
            <div className="step-title">Review before sealing.</div>
            <div className="step-sub">Once sealed, the capsule is written to Walrus and the Sui contract is deployed. This cannot be undone.</div>

            <div className="review-section">
              <div className="r-label">How Your Capsule Is Protected</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: 'var(--ivory)', fontSize: '13px', lineHeight: '2' }}>
                <li>✓ Contents encrypted locally using Sui Seal before leaving your browser</li>
                <li>✓ Persist cannot decrypt your capsule</li>
                <li>✓ Preserved permanently on Walrus</li>
                <li>✓ Release conditions enforced on Sui — immutable</li>
                <li>✓ Decryption controlled by distributed key custody</li>
                <li>✓ Legacy context preserved through Tatum</li>
              </ul>
            </div>

            <div className="review-section">
              <div className="r-label">Legacy Snapshot <span style={{fontSize:'10px', color:'var(--aged)', fontWeight:'normal'}}>Source: Tatum</span></div>
              <p style={{ fontSize: '12px', color: 'var(--aged)', marginBottom: '16px', lineHeight: '1.5' }}>
                A snapshot of your public on-chain activity will be attached to this capsule at the moment of sealing. This context does not affect access or decryption — it becomes part of the permanent record of who created this capsule and when.
              </p>
              {currentAccount ? (
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: 'var(--ivory)', fontSize: '13px', lineHeight: '2' }}>
                    <li><span style={{ color: 'var(--aged)' }}>Active on-chain since:</span> {fetchingProfile ? "Fetching..." : (legacyProfile && legacyProfile.transactionCount > 0 ? "Available" : "Not yet available")}</li>
                    <li><span style={{ color: 'var(--aged)' }}>Transactions recorded:</span> {fetchingProfile ? "Fetching..." : (legacyProfile ? legacyProfile.transactionCount : "0")}</li>
                    <li><span style={{ color: 'var(--aged)' }}>Last activity before sealing:</span> {fetchingProfile ? "Fetching..." : (legacyProfile && legacyProfile.lastActiveMs ? `${Math.round((Date.now() - legacyProfile.lastActiveMs) / (1000 * 60 * 60 * 24))} days ago` : "None")}</li>
                    <li><span style={{ color: 'var(--aged)' }}>Reconstruction status:</span> {fetchingProfile ? "Fetching..." : (legacyProfile ? (legacyProfile.reconstructionStatus === 'EMPTY' ? "Pending" : "Complete") : "Pending")}</li>
                  </ul>
                </div>
              ) : (
                <div style={{ fontSize: '13px', color: 'var(--aged)' }}>On-chain history is not yet available for this wallet. The capsule can still be sealed.</div>
              )}
            </div>

            <div className="review-section">
              <div className="r-label">Capsule</div>
              <div className="review-row"><div className="rk">Name</div><div className="rv">{capsuleName}</div></div>
              <div className="review-row"><div className="rk">Contents</div><div className="rv">{selectedTypes.join(", ")}</div></div>
              <div className="review-row"><div className="rk">Encryption</div><div className="rv">Sui Seal (Threshold)</div></div>
              <div className="review-row"><div className="rk">Storage</div><div className="rv">Walrus Permanent</div></div>
            </div>

            <div className="review-section">
              <div className="r-label">Unlock Condition</div>
              <div className="review-row"><div className="rk">Trigger</div><div className="rv highlight">{triggerType === "inactivity" ? `Inactivity · ${inactivityDays} days` : triggerType === "date" ? `Date · ${new Date(`${releaseDate}T${releaseTime}`).toLocaleString()}` : "Manual release"}</div></div>
              <div className="review-row"><div className="rk">Enforced by</div><div className="rv">Sui smart contract</div></div>
              <div className="review-row"><div className="rk">Wallet context</div><div className="rv" style={{color:'var(--aged)'}}>Tatum · read-only enrichment</div></div>
            </div>

            <div className="review-section" style={{ borderBottom: 'none', marginBottom: '24px' }}>
              <div className="r-label">Intended Recipient & Identity</div>
              <div className="review-row"><div className="rk">Name</div><div className="rv">{nomineeName || "Untitled"}</div></div>
              {nomineeInput.endsWith(".sui") && <div className="review-row"><div className="rk">SuiNS name</div><div className="rv highlight">{nomineeInput}</div></div>}
              <div className="review-row"><div className="rk">Resolved address</div><div className="rv" style={{maxWidth:'200px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{nomineeAddress}</div></div>
              <div className="review-row"><div className="rk">Notified via</div><div className="rv" style={{color:'var(--aged)'}}>Shareable claim link (wallet protected)</div></div>
            </div>

            <div className="seal-warning">
              <p>Sealing deploys a Sui Move contract and writes your encrypted payload to Walrus. Both are permanent and irreversible. Confirm parameters before proceeding.</p>
            </div>

            <div className="step-nav">
              <button className="btn-back-step" onClick={() => setStep(4)}>← Back</button>
              <button className="btn-seal" onClick={handleSeal}>Seal Capsule →</button>
            </div>
          </div>
        </div>

        <div className="sidebar-preview">
          <div className="preview-label">Capsule preview</div>
          <div className="preview-capsule">
            <div className="p-capsule-obj">
              <div className="p-cap-body">
                <div className="p-cap-seam"></div>
                <div className="p-cap-dot"></div>
              </div>
            </div>
            <div className="preview-name">{capsuleName || "Untitled capsule"}</div>
            <div className="preview-state">draft · not yet sealed</div>
          </div>

          <div className="preview-detail">
            <div className="pd-item">
              <div className="pd-label">Trigger</div>
              <div className="pd-value mono">{triggerType === "inactivity" ? `Inactivity · ${inactivityDays} days` : triggerType === "date" && releaseDate ? `Date · ${new Date(`${releaseDate}T${releaseTime}`).toLocaleDateString()}` : "Manual release"}</div>
            </div>
            <div className="pd-item">
              <div className="pd-label">Nominee</div>
              <div className={`pd-value mono ${!nomineeInput ? 'empty' : ''}`} style={{wordBreak: 'break-all'}}>{nomineeInput || "Not set"}</div>
            </div>
            <div className="pd-item">
              <div className="pd-label">Contents</div>
              <div className={`pd-value ${selectedTypes.length === 0 ? 'empty' : ''}`}>{selectedTypes.length > 0 ? selectedTypes.join(", ") : "Not added"}</div>
            </div>
            <div className="pd-item">
              <div className="pd-label">Encryption</div>
              <div className="pd-value mono" style={{color:'rgba(140,133,120,0.4)'}}>Sui Seal (Threshold)</div>
            </div>
            <div className="pd-item">
              <div className="pd-label">Storage</div>
              <div className="pd-value mono" style={{color:'rgba(140,133,120,0.4)'}}>Walrus</div>
            </div>
            <div className="pd-item">
              <div className="pd-label">Contract</div>
              <div className="pd-value mono" style={{color:'rgba(140,133,120,0.4)'}}>Sui Move · pending deploy</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
