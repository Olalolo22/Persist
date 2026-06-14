"use client";

import React from 'react';
import Link from 'next/link';

export function Navbar({ address, showBack = false, backUrl = "/dashboard", backText = "← Dashboard" }: { address?: string | null, showBack?: boolean, backUrl?: string, backText?: string }) {
  return (
    <div style={{
      padding: '20px 40px',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <span style={{
        fontFamily: 'var(--serif-hero, var(--serif))',
        fontSize: '18px',
        fontWeight: 300,
        color: 'var(--aged)',
        letterSpacing: '0.04em'
      }}>PERSIST</span>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {address ? (
          <span style={{
            fontFamily: 'var(--mono)',
            fontSize: '11px',
            color: 'rgba(140,133,120,0.4)'
          }}>
            {address}
          </span>
        ) : (
          <span style={{
            fontFamily: 'var(--mono)',
            fontSize: '11px',
            color: 'rgba(140,133,120,0.35)'
          }}>
            persist.app
          </span>
        )}
        
        {showBack && (
          <Link href={backUrl} style={{
            fontSize: '13px',
            color: 'var(--aged)',
            cursor: 'pointer',
            transition: 'color 0.2s',
            background: 'none',
            border: 'none',
            fontFamily: 'var(--sans)',
            textDecoration: 'none'
          }}>
            {backText}
          </Link>
        )}
      </div>
    </div>
  );
}
