"use client";

import React from 'react';
import { ConnectButton } from '@mysten/dapp-kit';

export function Sidebar({ currentAddress, resolvedName, onDisconnect }: { currentAddress: string | null, resolvedName: string | null, onDisconnect: () => void }) {
  return (
    <div style={{
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      padding: '24px 0',
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>
      <div style={{
        fontFamily: 'var(--serif)',
        fontSize: '20px',
        fontWeight: 300,
        padding: '0 24px 32px',
        borderBottom: '1px solid var(--border)',
        color: 'var(--aged)',
        letterSpacing: '0.04em'
      }}>persist</div>

      <div style={{ padding: '32px 24px', flex: 1 }}>
        <div style={{ fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--aged)', opacity: 0.4, marginBottom: '16px', fontFamily: 'var(--mono)' }}>Identity</div>
        
        <div style={{
          background: 'rgba(28,26,22,0.5)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '32px'
        }}>
          {currentAddress ? (
            <>
              <div style={{ fontSize: '14px', color: 'var(--ivory)', fontWeight: 400, marginBottom: '4px' }}>
                {resolvedName || `${currentAddress.slice(0, 6)}…${currentAddress.slice(-4)}`}
              </div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--mono)', color: 'rgba(140,133,120,0.5)' }}>
                {resolvedName ? `${currentAddress.slice(0, 6)}…${currentAddress.slice(-4)}` : 'Sui Wallet Connected'}
              </div>
              <button onClick={onDisconnect} style={{
                marginTop: '12px',
                fontSize: '11px',
                color: 'var(--seal)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--sans)'
              }}>Disconnect</button>
            </>
          ) : (
            <ConnectButton />
          )}
        </div>

        <div style={{ fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--aged)', opacity: 0.4, marginBottom: '16px', fontFamily: 'var(--mono)' }}>Menu</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ padding: '8px 12px', color: 'var(--ivory)', background: 'rgba(240,237,230,0.03)', borderRadius: '5px', fontSize: '13px', cursor: 'pointer' }}>My Capsules</div>
          <div style={{ padding: '8px 12px', color: 'var(--aged)', fontSize: '13px', cursor: 'not-allowed', opacity: 0.5 }}>Nominees</div>
          <div style={{ padding: '8px 12px', color: 'var(--aged)', fontSize: '13px', cursor: 'not-allowed', opacity: 0.5 }}>The Epitaph</div>
        </div>
      </div>
      
      <div style={{ padding: '0 24px', fontSize: '10px', color: 'rgba(140,133,120,0.3)', fontFamily: 'var(--mono)', lineHeight: 1.6 }}>
        Connected to Sui testnet<br/>Walrus integration active
      </div>
    </div>
  );
}
