"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentAccount, useSuiClient, ConnectButton } from "@mysten/dapp-kit";
import { fetchAllCapsules, CapsuleData } from "@/lib/seal";

export const dynamic = "force-dynamic";

export default function ClaimLanding() {
  const router = useRouter();
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient() as any;

  // State
  const [capsuleIdInput, setCapsuleIdInput] = useState("");
  const [nominatedCapsules, setNominatedCapsules] = useState<CapsuleData[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [suiNames, setSuiNames] = useState<Record<string, string>>({});

  // Fetch nominated capsules
  useEffect(() => {
    if (!currentAccount) {
      setNominatedCapsules([]);
      return;
    }

    const currentAddress = currentAccount.address;

    async function loadNominated() {
      try {
        setLoadingList(true);
        const allCapsules = await fetchAllCapsules(suiClient);

        // Filter capsules nominated to current user that are not claimed yet
        const nominated = allCapsules.filter(
          (c) =>
            c.nominee.toLowerCase() === currentAddress.toLowerCase() &&
            c.status === 0
        );
        setNominatedCapsules(nominated);

        // Resolve SuiNS names for creators
        const creatorAddresses = Array.from(new Set(nominated.map((c) => c.creator)));
        const resolvedNames: Record<string, string> = {};
        await Promise.all(
          creatorAddresses.map(async (addr) => {
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
        console.error("Failed to load nominated capsules:", err);
      } finally {
        setLoadingList(false);
      }
    }

    loadNominated();
  }, [currentAccount, suiClient]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const input = capsuleIdInput.trim();
    if (!input) return;
    
    // If the user pasted a full URL, extract the last part (the object ID)
    const idToSearch = input.includes('/claim/') ? input.split('/claim/').pop() : input;
    
    router.push(`/claim/${idToSearch}`);
  };

  const shortenAddress = (addr: string) => {
    return addr.slice(0, 6) + "..." + addr.slice(-4);
  };

  const getDisplayName = (address: string) => {
    return suiNames[address.toLowerCase()] || shortenAddress(address);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div className="claim-nav">
        <div className="claim-logo" onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>persist</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button className="btn-nav" onClick={() => router.push("/")}>← Dashboard</button>
          <ConnectButton />
        </div>
      </div>

      <div className="hero" style={{ flex: 1, minHeight: 0, padding: '40px 24px', justifyContent: 'flex-start' }}>
        <h1 className="h-title" style={{ fontSize: 'clamp(32px, 5vw, 48px)', marginBottom: '16px' }}>
          Claim a Capsule
        </h1>
        <p className="h-sub" style={{ marginBottom: '40px' }}>
          A capsule was left for you. Enter the Capsule ID below, or connect your wallet to find capsules waiting in your name.
        </p>

        <form onSubmit={handleManualSearch} style={{ width: '100%', maxWidth: '440px', background: 'var(--surface)', border: '1px solid var(--border)', padding: '32px', borderRadius: '16px', marginBottom: '40px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
          <label style={{ display: 'block', fontSize: '10px', color: 'var(--aged)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '12px', fontFamily: 'var(--mono)', textAlign: 'left' }}>Enter Capsule ID</label>
          <input
            type="text"
            value={capsuleIdInput}
            onChange={(e) => setCapsuleIdInput(e.target.value)}
            placeholder="e.g. 0xabc123..."
            style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px 16px', color: 'var(--ivory)', fontFamily: 'var(--mono)', fontSize: '13px', outline: 'none', marginBottom: '24px', transition: 'border-color 0.2s', textAlign: 'center' }}
            onFocus={(e) => e.target.style.borderColor = 'var(--gold)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
          />
          <button
            type="submit"
            disabled={!capsuleIdInput.trim()}
            className="btn-sec"
            style={{ width: '100%', color: 'var(--gold)', borderColor: 'rgba(184,151,74,0.4)', opacity: !capsuleIdInput.trim() ? 0.4 : 1, pointerEvents: !capsuleIdInput.trim() ? 'none' : 'auto' }}
          >
            Open Capsule
          </button>
        </form>

        <div style={{ width: '100%', maxWidth: '440px' }}>
          <div style={{ fontSize: '10px', color: 'var(--aged)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px', fontFamily: 'var(--mono)' }}>Capsules Left For You</div>

          {!currentAccount ? (
            <div style={{ padding: '24px', background: 'rgba(28,26,22,0.5)', border: '1px solid rgba(46,43,37,0.5)', borderRadius: '12px', fontSize: '12px', color: 'rgba(140,133,120,0.6)', fontStyle: 'italic' }}>
              Connect your wallet to scan the blockchain for capsules nominated to your address.
            </div>
          ) : loadingList ? (
            <div style={{ padding: '24px', fontSize: '12px', color: 'rgba(140,133,120,0.6)', fontFamily: 'var(--mono)' }}>
              Scanning Sui Testnet...
            </div>
          ) : nominatedCapsules.length === 0 ? (
            <div style={{ padding: '24px', background: 'rgba(28,26,22,0.5)', border: '1px solid rgba(46,43,37,0.5)', borderRadius: '12px', fontSize: '12px', color: 'rgba(140,133,120,0.6)' }}>
              No locked capsules found nominated to your address ({shortenAddress(currentAccount.address)}).
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {nominatedCapsules.map((capsule) => {
                const isReady = Date.now() >= capsule.releaseTimeMs;
                return (
                  <div
                    key={capsule.objectId}
                    onClick={() => router.push(`/claim/${capsule.objectId}`)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', border: '1px solid var(--border)', padding: '16px 20px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(184,151,74,0.45)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'rgba(240,237,230,0.8)', marginBottom: '4px' }}>
                        Capsule {shortenAddress(capsule.objectId)}
                      </div>
                      <div style={{ fontSize: '11px', color: 'rgba(140,133,120,0.6)' }}>
                        From: {getDisplayName(capsule.creator)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '4px', fontFamily: 'var(--mono)', background: isReady ? 'rgba(74,103,65,0.15)' : 'rgba(184,151,74,0.1)', color: isReady ? 'var(--moss)' : 'var(--gold)' }}>
                        {isReady ? 'READY' : 'LOCKED'}
                      </span>
                      <div style={{ fontSize: '10px', color: 'rgba(140,133,120,0.4)', marginTop: '6px', fontFamily: 'var(--mono)' }}>
                        {new Date(capsule.releaseTimeMs).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
