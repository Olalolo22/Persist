"use client";

import React from 'react';

type CapsuleState = 'locked' | 'unlocked' | 'decrypting' | 'revealed' | 'agent-active' | 'cracked';

export function CapsuleGraphic({ state }: { state: CapsuleState }) {
  if (state === 'locked') {
    return (
      <div style={{ position: 'relative', width: '110px', height: '55px', margin: '0 auto 52px' }}>
        <div style={{ width: '110px', height: '55px', background: 'var(--surface)', borderRadius: '28px', border: '1px solid var(--border)' }}></div>
        <div style={{ position: 'absolute', top: '50%', left: '12px', right: '12px', height: '1px', background: 'var(--border)', transform: 'translateY(-50%)' }}></div>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '18px', height: '18px', borderRadius: '50%', border: '1px solid var(--amber)' }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--amber)' }}></div>
        </div>
      </div>
    );
  }

  if (state === 'unlocked' || state === 'agent-active') {
    const isAgent = state === 'agent-active';
    return (
      <div style={{ position: 'relative', width: '110px', height: '55px', margin: '0 auto 52px' }}>
        <div style={{ width: '110px', height: '55px', background: 'var(--surface)', borderRadius: '28px', border: `1px solid ${isAgent ? 'var(--emerald)' : 'var(--amber)'}`, boxShadow: isAgent ? '0 0 28px var(--emerald)' : '0 0 28px rgba(217,119,6,0.15)' }}></div>
        <div style={{ position: 'absolute', top: '50%', left: '12px', right: '12px', height: '1px', background: isAgent ? 'var(--emerald)' : 'var(--gold)', transform: 'translateY(-50%)', animation: 'seam-glow 2.5s ease-in-out infinite', boxShadow: isAgent ? '0 0 8px var(--emerald)' : '0 0 6px rgba(217,119,6,0.5)' }}></div>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '55px', height: '55px', background: isAgent ? 'radial-gradient(circle,var(--emerald) 0%,transparent 70%)' : 'radial-gradient(circle,rgba(217,119,6,0.12) 0%,transparent 70%)', borderRadius: '50%' }}></div>
      </div>
    );
  }

  if (state === 'decrypting') {
    return (
      <div style={{ position: 'relative', width: '110px', height: '55px', margin: '0 auto 52px' }}>
        <div style={{ width: '110px', height: '55px', background: 'var(--surface)', borderRadius: '28px', border: '1px solid var(--amber)', animation: 'open-pulse 1.4s ease-in-out infinite' }}></div>
        <div style={{ position: 'absolute', top: '50%', left: '12px', right: '12px', height: '1px', background: 'var(--gold)', transform: 'translateY(-50%)', boxShadow: '0 0 8px var(--amber)' }}></div>
      </div>
    );
  }

  if (state === 'revealed' || state === 'cracked') {
    const isCrack = state === 'cracked';
    return (
      <div style={{ position: 'relative', width: '110px', height: '55px', margin: '0 auto 52px' }}>
        {/* Top half lifted */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '110px', height: '27px', background: 'var(--surface)', borderRadius: '28px 28px 0 0', border: '1px solid var(--amber)', borderBottom: 'none', transformOrigin: 'center bottom', animation: 'lift 0.6s ease forwards' }}></div>
        {/* Bottom half */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '110px', height: '27px', background: 'var(--surface)', borderRadius: '0 0 28px 28px', border: '1px solid var(--amber)', borderTop: 'none' }}></div>
        {/* Emerald burst on reveal / crack */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: isCrack ? '90px' : '70px', height: isCrack ? '30px' : '20px', background: 'radial-gradient(ellipse,var(--emerald) 0%, transparent 70%)', animation: 'light-fade 0.6s ease forwards', opacity: isCrack ? 0.9 : 0.7 }}></div>
      </div>
    );
  }

  return null;
}
