"use client";

import React from 'react';

type CapsuleState = 'locked' | 'unlocked' | 'decrypting' | 'revealed';

export function CapsuleGraphic({ state }: { state: CapsuleState }) {
  if (state === 'locked') {
    return (
      <div style={{ position: 'relative', width: '110px', height: '55px', margin: '0 auto 52px' }}>
        <div style={{ width: '110px', height: '55px', background: 'var(--surface)', borderRadius: '28px', border: '1px solid var(--border)' }}></div>
        <div style={{ position: 'absolute', top: '50%', left: '12px', right: '12px', height: '1px', background: 'var(--border)', transform: 'translateY(-50%)' }}></div>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '18px', height: '18px', borderRadius: '50%', border: '1px solid rgba(196,71,42,0.3)' }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(196,71,42,0.4)' }}></div>
        </div>
      </div>
    );
  }

  if (state === 'unlocked') {
    return (
      <div style={{ position: 'relative', width: '110px', height: '55px', margin: '0 auto 52px' }}>
        <div style={{ width: '110px', height: '55px', background: 'var(--surface)', borderRadius: '28px', border: '1px solid rgba(184,151,74,0.4)', boxShadow: '0 0 28px rgba(184,151,74,0.09)' }}></div>
        <div style={{ position: 'absolute', top: '50%', left: '12px', right: '12px', height: '1px', background: 'var(--gold)', transform: 'translateY(-50%)', animation: 'seam-glow 2.5s ease-in-out infinite', boxShadow: '0 0 6px rgba(184,151,74,0.5)' }}></div>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '55px', height: '55px', background: 'radial-gradient(circle,rgba(184,151,74,0.1) 0%,transparent 70%)', borderRadius: '50%' }}></div>
      </div>
    );
  }

  if (state === 'decrypting') {
    return (
      <div style={{ position: 'relative', width: '110px', height: '55px', margin: '0 auto 52px' }}>
        <div style={{ width: '110px', height: '55px', background: 'var(--surface)', borderRadius: '28px', border: '1px solid rgba(184,151,74,0.35)', animation: 'open-pulse 1.4s ease-in-out infinite' }}></div>
        <div style={{ position: 'absolute', top: '50%', left: '12px', right: '12px', height: '1px', background: 'var(--gold)', transform: 'translateY(-50%)', boxShadow: '0 0 8px rgba(184,151,74,0.6)' }}></div>
      </div>
    );
  }

  if (state === 'revealed') {
    return (
      <div style={{ position: 'relative', width: '110px', height: '55px', margin: '0 auto 52px' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '110px', height: '27px', background: 'var(--surface)', borderRadius: '28px 28px 0 0', border: '1px solid rgba(184,151,74,0.4)', borderBottom: 'none', transformOrigin: 'center bottom', animation: 'lift 0.6s ease forwards' }}></div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '110px', height: '27px', background: 'var(--surface)', borderRadius: '0 0 28px 28px', border: '1px solid rgba(184,151,74,0.4)', borderTop: 'none' }}></div>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '70px', height: '20px', background: 'radial-gradient(ellipse,rgba(184,151,74,0.18) 0%,transparent 70%)', animation: 'light-fade 0.6s ease forwards', opacity: 0 }}></div>
      </div>
    );
  }

  return null;
}
