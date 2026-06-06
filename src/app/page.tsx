"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentAccount, useSuiClient, ConnectButton } from "@mysten/dapp-kit";
import { fetchAllCapsules, CapsuleData } from "@/lib/seal";
import { reconstructDigitalFootprint, DigitalLegacyProfile } from "@/lib/tatum";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { Sidebar } from "@/components/ui/Sidebar";
import { Navbar } from "@/components/ui/Navbar";


export const dynamic = "force-dynamic";

export default function VaultDashboard() {
  const router = useRouter();
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient() as any;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [createdCapsules, setCreatedCapsules] = useState<CapsuleData[]>([]);
  const [incomingCapsules, setIncomingCapsules] = useState<CapsuleData[]>([]);
  const [legacyProfile, setLegacyProfile] = useState<DigitalLegacyProfile | null>(null);
  const [suiNames, setSuiNames] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [greeting, setGreeting] = useState("Good evening.");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning.");
    else if (hour < 17) setGreeting("Good afternoon.");
    else setGreeting("Good evening.");
  }, []);

  useEffect(() => {
    if (!currentAccount) {
      setLoading(false);
      return;
    }

    const currentAddress = currentAccount.address;

    async function loadDashboard() {
      try {
        setLoading(true);
        const allCapsules = await fetchAllCapsules(suiClient);

        const created = allCapsules.filter(
          (c) => c.creator.toLowerCase() === currentAddress.toLowerCase()
        );
        setCreatedCapsules(created);

        const incoming = allCapsules.filter(
          (c) => c.nominee.toLowerCase() === currentAddress.toLowerCase()
        );
        setIncomingCapsules(incoming);

        const profile = await reconstructDigitalFootprint(currentAddress);
        setLegacyProfile(profile);

        const involvedAddresses = Array.from(
          new Set([
            currentAddress,
            ...created.map((c) => c.nominee),
            ...incoming.map((c) => c.creator),
          ])
        );

        const resolvedNames: Record<string, string> = {};
        await Promise.all(
          involvedAddresses.map(async (addr) => {
            try {
              const res = await suiClient.resolveNameServiceNames({
                address: addr,
              });
              if (res.data && res.data.length > 0) {
                resolvedNames[addr.toLowerCase()] = res.data[0];
              }
            } catch (err) {
              console.warn(`SuiNS resolution failed for address ${addr}:`, err);
            }
          })
        );
        setSuiNames(resolvedNames);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [currentAccount, suiClient]);

  const shortenAddress = (addr: string) => {
    return addr.slice(0, 6) + "..." + addr.slice(-4);
  };

  const copyClaimUrl = (e: React.MouseEvent, objectId: string) => {
    e.stopPropagation();
    const url = `${window.location.origin}/claim/${objectId}`;
    navigator.clipboard.writeText(url);
    toast("Claim URL copied to clipboard", "success");
  };

  const getDisplayName = (address: string) => {
    return suiNames[address.toLowerCase()] || shortenAddress(address);
  };

  if (!currentAccount) {
    return (
      <>
        <div className="nav">
          <div className="nav-logo">persist</div>
          <ul className="nav-links">
            <li><a href="#how-it-works">How it works</a></li>
            <li><a href="#epitaph">The Epitaph</a></li>
            <li><Link href="/claim">Claim lookup</Link></li>
          </ul>
          <ConnectButton />
        </div>

        <div className="hero">
          <div className="hero-glow"></div>
          
          <div className="hero-graphic">
            <div className="pulse-ring"></div>
            <div className="pulse-ring-2"></div>
            <div className="capsule-obj">
              <div className="capsule-seam"></div>
              <div className="capsule-dot"></div>
            </div>
          </div>

          <h1 className="h-title">
            Some things should<br/><em>outlast you.</em>
          </h1>
          <p className="h-sub">
            Persist is a trustless digital legacy vault. Encrypt what matters. Seal it on-chain. It opens only when needed — never by accident.
          </p>
          <div className="h-ctas">
            <Link href="/claim">
              <button className="btn-sec">Claim a Capsule</button>
            </Link>
          </div>
        </div>

        <div className="section">
          <div className="problem">
            <div className="eyebrow">The problem</div>
            <div className="p-stat">$68B+</div>
            <p className="p-text">
              in crypto permanently unreachable — not stolen, not hacked.<br/>
              Just sealed behind a key nobody else has.
            </p>
            <div className="p-quote">
              <p>"A family inherited their dad's estate. Grant of probate. Death certificate. Everything legal. They found his Ledger in a drawer. Nobody knew the PIN. Nobody knew the recovery phrase. Legally theirs. Practically gone forever."</p>
              <span>— r/CryptoCurrency</span>
            </div>
          </div>
        </div>

        <div id="how-it-works" className="section">
          <div className="how">
            <div className="eyebrow" style={{marginBottom:'32px'}}>How it works</div>
            <div className="how-grid">
              <div className="how-card">
                <div className="hc-num">01</div>
                <div className="hc-title">Seal</div>
                <div className="hc-text">Add keys, credentials, or final instructions. Everything is encrypted locally using Sui Seal before it ever leaves your device. Your capsule contents are yours alone.</div>
              </div>
              <div className="how-card">
                <div className="hc-num">02</div>
                <div className="hc-title">Persist</div>
                <div className="hc-text">Your capsule is preserved permanently on Walrus — independently of this application. The release conditions are recorded on Sui and cannot be changed after sealing.</div>
              </div>
              <div className="how-card">
                <div className="hc-num">03</div>
                <div className="hc-title">Pass on</div>
                <div className="hc-text">Share a single link with your intended recipient. When the time comes, they connect their wallet and receive what you left for them. No intermediaries. No expiry.</div>
              </div>
            </div>
          </div>
        </div>

        <div className="section" style={{ marginTop: '40px' }}>
          <div className="eyebrow" style={{marginBottom:'32px'}}>Built on infrastructure that doesn't disappear.</div>
          <div className="how-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="how-card" style={{ padding: '24px' }}>
              <div style={{ fontSize: '10px', color: 'var(--aged)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', fontFamily: 'var(--mono)' }}>The Promise</div>
              <div style={{ fontSize: '18px', color: 'var(--ivory)', marginBottom: '12px', fontFamily: 'var(--serif)' }}>Sui</div>
              <div style={{ fontSize: '13px', color: 'var(--aged)', lineHeight: '1.6' }}>Release conditions are recorded on-chain and cannot be changed after sealing.</div>
            </div>
            <div className="how-card" style={{ padding: '24px' }}>
              <div style={{ fontSize: '10px', color: 'var(--aged)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', fontFamily: 'var(--mono)' }}>The Preservation</div>
              <div style={{ fontSize: '18px', color: 'var(--ivory)', marginBottom: '12px', fontFamily: 'var(--serif)' }}>Walrus</div>
              <div style={{ fontSize: '13px', color: 'var(--aged)', lineHeight: '1.6' }}>Capsule contents are stored permanently, independently of this application.</div>
            </div>
            <div className="how-card" style={{ padding: '24px' }}>
              <div style={{ fontSize: '10px', color: 'var(--aged)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', fontFamily: 'var(--mono)' }}>The Key</div>
              <div style={{ fontSize: '18px', color: 'var(--ivory)', marginBottom: '12px', fontFamily: 'var(--serif)' }}>Seal</div>
              <div style={{ fontSize: '13px', color: 'var(--aged)', lineHeight: '1.6' }}>The decryption key is held in distributed custody and released only when conditions are met. Not even Persist can open it early.</div>
            </div>
            <div className="how-card" style={{ padding: '24px' }}>
              <div style={{ fontSize: '10px', color: 'var(--aged)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', fontFamily: 'var(--mono)' }}>The Memory</div>
              <div style={{ fontSize: '18px', color: 'var(--ivory)', marginBottom: '12px', fontFamily: 'var(--serif)' }}>Tatum</div>
              <div style={{ fontSize: '13px', color: 'var(--aged)', lineHeight: '1.6' }}>Reconstructs the creator's public on-chain footprint at the moment a capsule is sealed — preserving historical context alongside the inheritance itself.</div>
            </div>
          </div>
        </div>

        <div id="epitaph" className="epitaph-sec">
          <div className="eyebrow" style={{marginBottom:'48px'}}>The Epitaph</div>
          <div className="epi-obj">
            <div className="epi-seam"></div>
          </div>
          <div className="epi-quote">"Leave more than assets."</div>
          <div className="epi-text">
            Persist lets you record a final message — sealed on-chain, delivered only when your capsule unlocks. Not just keys. Not just tokens. Words that matter.
          </div>
        </div>

        <div className="section">
          <div className="compare">
            <div className="eyebrow" style={{marginBottom:'32px'}}>Why Persist</div>
            <table className="comp-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Most tools</th>
                  <th>Persist</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="td-label">On-chain activity reconstruction</td>
                  <td><span className="bad-badge">Manual monthly check-in</span></td>
                  <td><span className="good-badge">Passive wallet monitoring</span></td>
                </tr>
                <tr>
                  <td className="td-label">What transfers</td>
                  <td><span className="bad-badge">Tokens only</span></td>
                  <td><span className="good-badge">Files, keys, messages</span></td>
                </tr>
                <tr>
                  <td className="td-label">Beneficiary UX</td>
                  <td><span className="bad-badge">Contract address + explorer</span></td>
                  <td><span className="good-badge">A simple link. One button.</span></td>
                </tr>
                <tr>
                  <td className="td-label">Storage</td>
                  <td><span className="bad-badge">On-chain or centralised</span></td>
                  <td><span className="good-badge">Walrus — permanent, decentralised</span></td>
                </tr>
                <tr>
                  <td className="td-label">Final message</td>
                  <td><span className="bad-badge">Not supported</span></td>
                  <td><span className="good-badge">The Epitaph — sealed on-chain</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="close-sec">
          <div className="cs-title">Set it once. It lasts.</div>
          <div className="cs-text">Five minutes. Then forget about it. Persist does the rest.</div>
          <ConnectButton />
          <div className="cs-tech">Built on Sui · Powered by Walrus + Tatum · AGPL-3.0</div>
        </div>

        <div className="footer">
          <div className="f-logo">persist</div>
          <div className="f-note">persist.app/claim — for nominees</div>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
        <p style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--aged)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Retrieving Vault Data...</p>
      </main>
    );
  }

  return (
    <div className="app">
      <div className="sidebar">
        <div className="sidebar-logo">persist</div>
        
        <div className="nav-menu">
          <div className={`nav-item ${activeTab === 'Dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('Dashboard')}>
            <div className="nav-dot"></div>
            Dashboard
          </div>
          <div className={`nav-item ${activeTab === 'My Capsules' ? 'active' : ''}`} onClick={() => setActiveTab('My Capsules')}>
            <div className="nav-dot"></div>
            My Capsules
          </div>
          <div className={`nav-item ${activeTab === 'Nominees' ? 'active' : ''}`} onClick={() => setActiveTab('Nominees')}>
            <div className="nav-dot"></div>
            Nominees
          </div>
          <div className={`nav-item ${activeTab === 'The Epitaph' ? 'active' : ''}`} onClick={() => setActiveTab('The Epitaph')}>
            <div className="nav-dot"></div>
            The Epitaph
          </div>
        </div>
        
        <div className="sb-footer">
          <div className="sb-label">Connected wallet</div>
          <div className="sb-wallet" style={{marginBottom:'16px'}}>{getDisplayName(currentAccount.address)}</div>
          <ConnectButton />
        </div>
      </div>

      <div className="main-content">
        <div className="header">
          <div>
            <div className="greeting">{greeting}</div>
            <div className="sub-greeting">Your capsules are sealed. Everything is in order.</div>
          </div>
          <Link href="/create">
            <button className="btn-new">+ New Capsule</button>
          </Link>
        </div>

        {activeTab === 'Dashboard' && (
          <>
            <div className="stat-card">
              <div className="sc-left">
                <div className="sc-badge">
                  <div className="sc-dot"></div>
                  <div className="sc-status">On-chain status: sealed</div>
                </div>
                
                <div className="sc-title">All capsules verified on Sui.</div>
                <div className="sc-desc">
                  Your capsules are sealed and enforced by smart contract. Their state is determined solely by on-chain conditions — nothing else can trigger or alter them.
                </div>

                <div className="sc-grid">
                  <div>
                    <div className="sc-stat-label">Contract state</div>
                    <div className="sc-stat-val">locked</div>
                  </div>
                  <div>
                    <div className="sc-stat-label">Capsules</div>
                    <div className="sc-stat-val">{createdCapsules.length} sealed</div>
                  </div>
                  <div>
                    <div className="sc-stat-label">Network</div>
                    <div className="sc-stat-val">Sui Testnet</div>
                  </div>
                </div>

                <div className="sc-note">
                  <span>⊕</span>
                  <p>Access is determined solely by Sui smart contract state. Contextual data does not affect security or unlock conditions.</p>
                </div>
              </div>

              <div className="sc-right">
                <div className="sc-capsule">
                  <div className="sc-ring-1"></div>
                  <div className="sc-ring-2"></div>
                  <div className="sc-ring-3"></div>
                  <div className="sc-body">
                    <div className="sc-seam"></div>
                    <div className="sc-center"></div>
                  </div>
                </div>
                <div className="sc-state-label">contract: sealed</div>
              </div>
            </div>

            <div className="sec-title" style={{ marginTop: '48px' }}>Your Legacy Profile</div>
            <div className="sec-sub">On-chain history reconstructed from public blockchain records.</div>
            <div className="stat-card" style={{ marginTop: '16px', background: 'transparent', border: '1px solid var(--border)' }}>
              <div className="sc-left" style={{ borderRight: 'none', padding: '24px' }}>
                {legacyProfile?.reconstructionStatus === 'ERROR' ? (
                  <div style={{ color: 'var(--aged)', fontSize: '13px' }}>Legacy context temporarily unavailable.</div>
                ) : legacyProfile?.reconstructionStatus === 'EMPTY' ? (
                  <div style={{ color: 'var(--aged)', fontSize: '13px' }}>No on-chain history found for this wallet.</div>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: 'var(--aged)', fontSize: '13px', lineHeight: '2' }}>
                    <li><strong style={{ color: 'var(--ivory)' }}>Active on-chain since:</strong> {legacyProfile?.firstActiveMs ? new Date(legacyProfile.firstActiveMs).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "Not available"}</li>
                    <li><strong style={{ color: 'var(--ivory)' }}>Recent activity detected:</strong> {legacyProfile?.lastActiveMs ? `${Math.round((Date.now() - legacyProfile.lastActiveMs) / (1000 * 60 * 60 * 24))} days ago` : "No"}</li>
                    <li><strong style={{ color: 'var(--ivory)' }}>Transactions recorded:</strong> {legacyProfile?.transactionCount || 0}{legacyProfile?.hasMore ? '+' : ''}</li>
                    <li><strong style={{ color: 'var(--ivory)' }}>Context snapshot:</strong> {legacyProfile?.firstActiveMs && legacyProfile?.lastActiveMs && legacyProfile?.transactionCount ? "Available" : "Not available"}</li>
                  </ul>
                )}
                <div style={{ marginTop: '24px', fontSize: '11px', color: 'rgba(140, 133, 120, 0.6)', fontFamily: 'var(--mono)' }}>Powered by Tatum infrastructure</div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'My Capsules' && (
          <>
            <div className="sec-title">My capsules</div>
            <div className="sec-sub">State enforced by Sui smart contract</div>
            
            {createdCapsules.length === 0 ? (
              <div className="empty-state">
                <div className="es-text">You haven't sealed any legacy capsules yet. Get started by sealing something important.</div>
                <Link href="/create">
                  <button className="btn-new">+ Seal Capsule</button>
                </Link>
              </div>
            ) : (
              <div className="grid-2">
                {createdCapsules.map((cap) => (
                  <div key={cap.objectId} className="cap-card">
                    <div>
                      <div className="cc-top">
                        <div className="cc-name">Capsule {shortenAddress(cap.objectId)}</div>
                        <div className={`cc-status ${cap.status === 1 ? 'ready' : 'sealed'}`}>
                          {cap.status === 1 ? 'claimed' : 'sealed'}
                        </div>
                      </div>
                      <div className="cc-details">
                        Nominee: <span>{getDisplayName(cap.nominee)}</span><br/>
                        Release: <span>{new Date(cap.releaseTimeMs).toLocaleDateString()}</span><br/>
                        {cap.walrusBlobId && (
                          <>
                            Walrus: <a href={`https://aggregator.walrus-testnet.walrus.space/v1/${cap.walrusBlobId}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="cc-link">
                              {cap.walrusBlobId.slice(0, 8)}...{cap.walrusBlobId.slice(-8)}
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="cc-bot">
                      <div className="cc-actions">
                        <button className="btn-sm" onClick={(e) => copyClaimUrl(e, cap.objectId)}>Copy URL</button>
                        <button className="btn-sm filled" onClick={(e) => { e.stopPropagation(); router.push(`/claim/${cap.objectId}`); }}>View Status</button>
                      </div>
                      <div className="cc-lock">
                        <div className="cc-lock-dot"></div>
                        <div className="cc-lock-text">contract: locked</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'Nominees' && (
          <>
            <div className="sec-title">Incoming claims nominated to you</div>
            <div className="sec-sub">State enforced by Sui smart contract</div>
            
            {incomingCapsules.length > 0 ? (
              <div className="grid-2">
                {incomingCapsules.map((cap) => {
                  const isReady = Date.now() >= cap.releaseTimeMs;
                  const isClaimed = cap.status === 1;
                  return (
                    <div key={cap.objectId} className="cap-card" onClick={() => router.push(`/claim/${cap.objectId}`)}>
                      <div className="cc-top">
                        <div className="cc-name">Capsule {shortenAddress(cap.objectId)}</div>
                        <div className={`cc-status ${isClaimed ? 'ready' : isReady ? 'ready' : 'sealed'}`}>
                          {isClaimed ? 'CLAIMED' : isReady ? 'READY TO CLAIM' : 'LOCKED'}
                        </div>
                      </div>
                      <div className="cc-details">
                        From: <span>{getDisplayName(cap.creator)}</span><br/>
                        Release: <span>{new Date(cap.releaseTimeMs).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <div className="es-text">You have no incoming capsule claims nominated to your address.</div>
              </div>
            )}
          </>
        )}

        {activeTab === 'The Epitaph' && (
          <>
            <div className="sec-title">The Epitaph</div>
            <div className="sec-sub">Public legacy memorial. Coming soon.</div>
            <div className="empty-state">
              <div className="es-text">The Epitaph allows you to leave a cryptographically verified public message to the world.</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
