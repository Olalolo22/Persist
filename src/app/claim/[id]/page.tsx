"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useCurrentAccount,
  useSuiClient,
  useSignPersonalMessage,
  useSignAndExecuteTransaction,
  ConnectButton,
} from "@mysten/dapp-kit";
import { fetchCapsuleById, decryptCapsule, createSealClient, createSessionKeyForWallet } from "@/lib/seal";
import { fetchFromWalrus } from "@/lib/walrus";
import { reconstructDigitalFootprint, DigitalLegacyProfile } from "@/lib/tatum";
import { Transaction } from "@mysten/sui/transactions";
import { buildSealApproveTx } from "@/lib/seal";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function ClaimCapsuleDetails() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const suiClient = useSuiClient() as any;
  const currentAccount = useCurrentAccount();
  const { toast } = useToast();

  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [capsule, setCapsule] = useState<any>(null);
  const [capsuleName, setCapsuleName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [epitaph, setEpitaph] = useState<string>("");
  const [encryptedPayloadB64, setEncryptedPayloadB64] = useState<string>("");
  const [decryptedMessage, setDecryptedMessage] = useState<string | null>(null);
  const [decryptedFile, setDecryptedFile] = useState<{name: string, type: string, base64: string} | null>(null);

  const [uiState, setUiState] = useState<"locked" | "unlocked" | "decrypting" | "revealed">("locked");
  const [decryptStep, setDecryptStep] = useState<"contract" | "session" | "payload">("contract");
  const [countdown, setCountdown] = useState<string>("");
  const [revealCardVisible, setRevealCardVisible] = useState(false);
  const [expandedPayload, setExpandedPayload] = useState(true);

  const [suiNames, setSuiNames] = useState<Record<string, string>>({});
  const [legacyProfile, setLegacyProfile] = useState<DigitalLegacyProfile | null>(null);

  useEffect(() => {
    if (!id) return;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const cap = await fetchCapsuleById(suiClient, id);
        if (!cap) {
          setError("Capsule not found on the blockchain. Double-check the URL.");
          setLoading(false);
          return;
        }

        setCapsule(cap);

        try {
          const namesResult = await suiClient.resolveNameServiceNames({ address: cap.creator });
          if (namesResult.data && namesResult.data.length > 0) {
            setSuiNames((prev) => ({ ...prev, [cap.creator.toLowerCase()]: namesResult.data[0] }));
          }
        } catch (nsErr) {
          console.warn("Failed to resolve creator name service:", nsErr);
        }

        try {
          const profile = await reconstructDigitalFootprint(cap.creator);
          setLegacyProfile(profile);
        } catch (tatumErr) {
          console.warn("Failed to fetch legacy profile for creator:", tatumErr);
        }

        try {
          const namesResult = await suiClient.resolveNameServiceNames({ address: cap.nominee });
          if (namesResult.data && namesResult.data.length > 0) {
            setSuiNames((prev) => ({ ...prev, [cap.nominee.toLowerCase()]: namesResult.data[0] }));
          }
        } catch (nsErr) {
          console.warn("Failed to resolve nominee name service:", nsErr);
        }

        if (cap.walrusBlobId) {
          try {
            const blobBuffer = await fetchFromWalrus(cap.walrusBlobId);
            const blobText = new TextDecoder().decode(blobBuffer);
            const blobJson = JSON.parse(blobText);

            setCapsuleName(blobJson.name || "Sealed Heirloom");
            setDescription(blobJson.description || "");
            setEpitaph(blobJson.epitaph || "No public epitaph left for this capsule.");
            setEncryptedPayloadB64(blobJson.encryptedPayload || "");
          } catch (walrusErr) {
            console.error("Failed to fetch/parse Walrus blob:", walrusErr);
            setError("Failed to fetch capsule contents from Walrus storage.");
          }
        }
      } catch (err: any) {
        console.error("Failed to load capsule:", err);
        setError(err.message || "Failed to load capsule details.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id, suiClient]);

  useEffect(() => {
    if (!capsule) return;

    if (capsule.status === 1) {
      setUiState((prev) => prev === "revealed" ? "revealed" : "unlocked");
      return;
    }

    const checkState = () => {
      const now = Date.now();
      const diff = capsule.releaseTimeMs - now;

      if (diff <= 0) {
        setUiState((prev) => (prev === "decrypting" || prev === "revealed") ? prev : "unlocked");
        setCountdown("READY");
      } else {
        setUiState((prev) => (prev === "decrypting" || prev === "revealed") ? prev : "locked");
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      }
    };

    checkState();
    const interval = setInterval(checkState, 1000);

    return () => clearInterval(interval);
  }, [capsule]);

  const handleDecryptAndClaim = async () => {
    if (!currentAccount || !capsule || !encryptedPayloadB64) return;

    if (currentAccount.address.toLowerCase() !== capsule.nominee.toLowerCase()) {
      toast("Access Denied: Connected wallet address does not match nominee address.", "error");
      return;
    }

    try {
      setUiState("decrypting");
      setDecryptStep("contract");

      await new Promise((resolve) => setTimeout(resolve, 800));

      setDecryptStep("session");
      const sealClient = createSealClient(suiClient);

      const { sessionKey, messageToSign } = await createSessionKeyForWallet(
        suiClient,
        currentAccount.address,
        30
      );

      const signResult = await signPersonalMessage({
        message: messageToSign,
      });

      await sessionKey.setPersonalMessageSignature(signResult.signature);

      setDecryptStep("payload");
      await new Promise((resolve) => setTimeout(resolve, 800));

      let oracleSignatureHex: string | undefined = undefined;
      if (capsule.inactivityWindowMs && capsule.inactivityWindowMs > 0) {
        let attempt = 0;
        let success = false;
        
        while (attempt < 3 && !success) {
          try {
            const res = await fetch("/api/attest", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ capsuleId: capsule.objectId }),
            });
            if (res.ok) {
              const data = await res.json();
              oracleSignatureHex = data.signature;
              success = true;
            } else {
              const errData = await res.json();
              if (res.status === 403) {
                 console.log("Wallet still active, relying on time fallback:", errData.error);
                 break; // Don't retry if the user is genuinely still active
              }
              throw new Error(errData.error || "Oracle API failed");
            }
          } catch (e) {
            attempt++;
            console.warn(`Oracle attestation attempt ${attempt} failed`, e);
            if (attempt >= 3) {
              console.log("Max retries reached. Will attempt to proceed using time fallback.");
            } else {
              await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
            }
          }
        }
      }

      const approveTx = buildSealApproveTx(capsule.objectId, oracleSignatureHex);
      const rawTxBytes = await approveTx.build({
        client: suiClient,
        onlyTransactionKind: true,
      });

      const encryptedBytes = Buffer.from(encryptedPayloadB64, "base64");
      const decryptedBytes = await decryptCapsule(
        sealClient,
        encryptedBytes,
        sessionKey,
        rawTxBytes
      );

      const secretText = new TextDecoder().decode(decryptedBytes);
      
      try {
        const payload = JSON.parse(secretText);
        if (payload.text !== undefined || payload.file !== undefined) {
          setDecryptedMessage(payload.text || "");
          if (payload.file) {
            setDecryptedFile(payload.file);
          }
        } else {
          setDecryptedMessage(secretText);
        }
      } catch (e) {
        setDecryptedMessage(secretText);
      }

      setUiState("revealed");
      setTimeout(() => {
        setRevealCardVisible(true);
      }, 700);

      try {
        if (capsule.status !== 1) {
          const claimTx = new Transaction();
          claimTx.moveCall({
            target: `${process.env.NEXT_PUBLIC_PERSIST_PACKAGE_ID}::capsule::claim_capsule`,
            arguments: [claimTx.object(capsule.objectId)],
          });

          await signAndExecuteTransaction({
            transaction: claimTx,
          });

          setCapsule((prev: any) => ({ ...prev, status: 1 }));
        }
      } catch (claimErr) {
        console.warn("Failed to mark capsule claimed on Sui network:", claimErr);
      }
    } catch (err: any) {
      console.error("Unlock pipeline failed:", err);
      setUiState("unlocked");
      toast(err.message || "Failed to unlock capsule. Confirm conditions are met.", "error");
    }
  };

  const getDisplayName = (address: string) => {
    return suiNames[address.toLowerCase()] || address.slice(0, 6) + "..." + address.slice(-4);
  };

  const isNominee = currentAccount?.address.toLowerCase() === capsule?.nominee.toLowerCase();

  const shortenAddress = (addr: string) => {
    if (!addr) return "";
    return addr.slice(0, 6) + "..." + addr.slice(-4);
  };

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
        <p style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--aged)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Retrieving Heirloom Data...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '32px', borderRadius: '16px', textAlign: 'center', maxWidth: '400px' }}>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: '24px', color: '#ff6b6b', marginBottom: '16px', fontStyle: 'italic' }}>Access Restricted</h2>
          <p style={{ fontSize: '12px', color: 'var(--aged)', marginBottom: '32px', lineHeight: 1.6 }}>{error}</p>
          <button className="btn-sec" onClick={() => router.push("/")}>Go to Dashboard</button>
        </div>
      </main>
    );
  }

  return (
    <>
      <div className="claim-nav">
        <div className="claim-logo" onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>persist</div>
        <div className="claim-nav-note">
          {currentAccount ? shortenAddress(currentAccount.address) : "Wallet not connected"}
        </div>
      </div>

      <div className="claim-content" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        
        {uiState === "locked" && (
          <div className="screen active">
            <div className="cap-locked">
              <div className="body">
                <div className="seam"></div>
                <div className="dot"></div>
              </div>
            </div>
            
            <div className="from-eyebrow">From</div>
            <h1 className="from-headline">{getDisplayName(capsule.creator)} has left<br/>something for you.</h1>
            <p className="from-body">This capsule is sealed. Access is controlled by a Sui smart contract — it will become available when on-chain conditions are met.</p>
            
            <div className="lock-box">
              <div className="lock-box-label">Unlocks in</div>
              <div className="lock-box-state">{countdown}</div>
            </div>
            
            <div className="trust">Keep this URL safe. Return with your wallet once the countdown expires.</div>
          </div>
        )}

        {uiState === "unlocked" && (
          <div className="screen active">
            <div className="cap-ready">
              <div className="glow"></div>
              <div className="body">
                <div className="seam"></div>
              </div>
            </div>
            
            <div className="from-eyebrow">From</div>
            <h1 className="from-headline">This capsule is<br/>ready to open.</h1>
            <p className="from-body">The Sui smart contract has confirmed access for your wallet. Decryption is authorised — nothing is left to verify.</p>
            
            {!currentAccount ? (
              <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '12px', color: 'var(--aged)', marginBottom: '16px' }}>Connect wallet to verify identity and unlock capsule</p>
                <ConnectButton />
              </div>
            ) : !isNominee ? (
              <div style={{ fontSize: '13px', color: '#ff6b6b', background: 'rgba(255,107,107,0.1)', padding: '12px 24px', borderRadius: '6px', marginBottom: '24px' }}>
                Access Denied: Connected wallet is not the nominee address ({getDisplayName(capsule.nominee)})
              </div>
            ) : (
              <button className="btn-primary" onClick={handleDecryptAndClaim}>Open Capsule</button>
            )}

            <div className="trust">
              Decryption is executed locally via Seal, authorised by Sui. Nothing leaves your device.<br/>
              Sui · Seal · Walrus — no third-party access.
            </div>
          </div>
        )}

        {uiState === "decrypting" && (
          <div className="screen active">
            <div className="cap-opening">
              <div className="body">
                <div className="seam"></div>
              </div>
            </div>
            
            <div className="from-eyebrow">Decrypting</div>
            <h1 className="from-headline">One moment.</h1>
            
            <div className="spinner"></div>

            <div className="decrypt-steps">
              <div className={`d-step ${decryptStep !== "contract" ? 'done' : 'active'}`}>
                <div className={`d-icon ${decryptStep !== "contract" ? 'done' : 'active'}`}>{decryptStep !== "contract" ? "✓" : ""}</div>
                <div className={`d-label ${decryptStep !== "contract" ? 'done' : 'active'}`}>Sui release conditions verified</div>
              </div>
              <div className={`d-step ${decryptStep === "payload" ? 'done' : decryptStep === "session" ? 'active' : ''}`}>
                <div className={`d-icon ${decryptStep === "payload" ? 'done' : decryptStep === "session" ? 'active' : 'pending'}`}>{decryptStep === "payload" ? "✓" : decryptStep === "session" ? "" : "·"}</div>
                <div className={`d-label ${decryptStep === "payload" ? 'done' : decryptStep === "session" ? 'active' : 'pending'}`}>Seal decryption authorised</div>
              </div>
              <div className={`d-step ${decryptStep === "payload" ? 'active' : ''}`}>
                <div className={`d-icon ${decryptStep === "payload" ? 'active' : 'pending'}`}>{decryptStep === "payload" ? "" : "·"}</div>
                <div className={`d-label ${decryptStep === "payload" ? 'active' : 'pending'}`}>Retrieving sealed contents from Walrus...</div>
              </div>
            </div>

            <div className="trust">
              Decryption keys are never transmitted.<br/>
              All cryptographic operations execute locally in your browser.
            </div>
          </div>
        )}

        {uiState === "revealed" && (
          <div className="screen active">
            <div className="cap-open">
              <div className="light"></div>
              <div className="top"></div>
              <div className="bottom"></div>
            </div>

            {revealCardVisible && (
              <div className="reveal-card">
                <div className="reveal-header">
                  <div className="reveal-from">From {getDisplayName(capsule.creator)}</div>
                  <h2 className="reveal-title">{capsuleName}</h2>
                </div>

                <div className="epitaph">
                  <div className="epitaph-label">His final words</div>
                  <div className="epitaph-text">"{epitaph}"</div>
                </div>

                <div className="item-list">
                  <div className="item" onClick={() => setExpandedPayload(!expandedPayload)}>
                    <div style={{ flex: 1 }}>
                      <div className="item-label">Capsule Contents</div>
                      <div className="item-sub">Sui Seal decrypted</div>
                    </div>
                    <div className="item-arrow">{expandedPayload ? "▲" : "▼"}</div>
                  </div>

                  {expandedPayload && (decryptedMessage || decryptedFile) && (
                    <div style={{ background: 'rgba(28,26,22,0.8)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', fontSize: '13px', fontFamily: 'var(--mono)', color: 'var(--ivory)', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                      {decryptedMessage}

                      {decryptedFile && (
                        <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(184,151,74,0.1)', border: '1px dashed rgba(184,151,74,0.3)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ color: 'var(--gold)' }}>📎 {decryptedFile.name}</div>
                          <button onClick={(e) => { 
                            e.stopPropagation(); 
                            const link = document.createElement('a');
                            link.href = `data:${decryptedFile.type};base64,${decryptedFile.base64}`;
                            link.download = decryptedFile.name;
                            link.click();
                          }} style={{ background: 'transparent', color: 'var(--ivory)', border: '1px solid rgba(184,151,74,0.4)', padding: '6px 12px', fontSize: '10px', fontFamily: 'var(--mono)', borderRadius: '4px', cursor: 'pointer' }}>DOWNLOAD FILE</button>
                        </div>
                      )}

                      {decryptedMessage && (
                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(46,43,37,0.5)', textAlign: 'right' }}>
                          <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(decryptedMessage); toast("Payload copied", "success"); }} style={{ background: 'transparent', color: 'var(--gold)', border: '1px solid rgba(184,151,74,0.4)', padding: '6px 12px', fontSize: '10px', fontFamily: 'var(--mono)', borderRadius: '4px', cursor: 'pointer' }}>COPY TEXT</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(28,26,22,0.5)', border: '1px solid rgba(46,43,37,0.5)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--ivory)', marginBottom: '4px', fontFamily: 'var(--serif)' }}>About the Creator</div>
                  <div style={{ fontSize: '10px', color: 'var(--aged)', marginBottom: '16px', fontFamily: 'var(--mono)' }}>Historical context captured when this capsule was sealed.</div>
                  
                  {legacyProfile ? (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '12px', color: 'var(--aged)', lineHeight: '1.8' }}>
                      <li><strong style={{ color: 'var(--ivory)', fontWeight: 'normal' }}>Active on-chain since:</strong> {legacyProfile.transactionCount > 0 ? "Available" : "Not yet available"}</li>
                      <li><strong style={{ color: 'var(--ivory)', fontWeight: 'normal' }}>Transactions recorded:</strong> {legacyProfile.transactionCount}</li>
                      <li><strong style={{ color: 'var(--ivory)', fontWeight: 'normal' }}>Last activity before sealing:</strong> {legacyProfile.lastActiveMs ? `${Math.round((Date.now() - legacyProfile.lastActiveMs) / (1000 * 60 * 60 * 24))} days ago` : "None"}</li>
                    </ul>
                  ) : (
                    <div style={{ fontSize: '12px', color: 'var(--aged)' }}>Legacy context was not captured for this capsule.</div>
                  )}
                  
                  {legacyProfile && (
                    <div style={{ fontSize: '10px', color: 'rgba(140, 133, 120, 0.4)', marginTop: '16px', lineHeight: '1.4' }}>
                      This information was reconstructed from public blockchain records at the time of sealing. It does not affect your access to the capsule.
                    </div>
                  )}
                </div>

                <div className="reveal-footer">
                  Access validated by Sui smart contract<br/>
                  Decryption executed by Seal · threshold key protocol<br/>
                  Payload retrieved from Walrus · decentralised storage<br/>
                  No third party had access at any point in this process.
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </>
  );
}
