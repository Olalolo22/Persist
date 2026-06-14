// src/components/AmberDroplet.tsx
// The core visual motif — amber capsule with inner glow and crack lines
// Used as logo mark, capsule cards, hero visual

import React from 'react'

interface AmberDropletProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero'
  state?: 'sealed' | 'approaching' | 'revealed' | 'dormant'
  showCracks?: boolean
  animated?: boolean
  className?: string
}

const sizes = {
  xs:   { width: 24,  height: 30  },
  sm:   { width: 40,  height: 50  },
  md:   { width: 64,  height: 80  },
  lg:   { width: 96,  height: 120 },
  xl:   { width: 160, height: 200 },
  hero: { width: 220, height: 280 },
}

export function AmberDroplet({
  size = 'md',
  state = 'sealed',
  showCracks = false,
  animated = true,
  className = '',
}: AmberDropletProps) {
  const { width, height } = sizes[size]

  const gradients = {
    sealed: {
      stop1: '#FBBF24',
      stop2: '#D97706',
      stop3: '#92400E',
    },
    approaching: {
      stop1: '#FDE68A',
      stop2: '#FBBF24',
      stop3: '#D97706',
    },
    revealed: {
      stop1: 'rgba(110,231,183,0.8)',
      stop2: 'rgba(5,150,105,0.5)',
      stop3: 'transparent',
    },
    dormant: {
      stop1: '#A8A29E',
      stop2: '#78716C',
      stop3: '#57534E',
    },
  }

  const glowColors = {
    sealed:     '#6EE7B7',
    approaching: '#FBBF24',
    revealed:   '#6EE7B7',
    dormant:    'none',
  }

  const g = gradients[state]
  const glowColor = glowColors[state]
  const uid = `droplet-${size}-${state}`

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 64 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Main amber gradient */}
        <radialGradient
          id={`${uid}-shell`}
          cx="35%"
          cy="32%"
          r="70%"
          gradientUnits="objectBoundingBox"
        >
          <stop offset="0%"   stopColor={g.stop1} />
          <stop offset="45%"  stopColor={g.stop2} />
          <stop offset="100%" stopColor={g.stop3} />
        </radialGradient>

        {/* Specular highlight */}
        <radialGradient
          id={`${uid}-highlight`}
          cx="28%"
          cy="22%"
          r="30%"
          gradientUnits="objectBoundingBox"
        >
          <stop offset="0%"   stopColor="rgba(255,255,255,0.45)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>

        {/* Inner glow */}
        <radialGradient
          id={`${uid}-glow`}
          cx="50%"
          cy="50%"
          r="50%"
          gradientUnits="objectBoundingBox"
        >
          <stop offset="0%"   stopColor={glowColor} stopOpacity="0.9" />
          <stop offset="60%"  stopColor={glowColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={glowColor} stopOpacity="0" />
        </radialGradient>

        {/* Shadow */}
        <filter id={`${uid}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="3"
            stdDeviation="4"
            floodColor={state === 'revealed' ? '#059669' : '#92400E'}
            floodOpacity="0.25"
          />
        </filter>
      </defs>

      {/* Capsule shape — teardrop/egg form */}
      <ellipse
        cx="32"
        cy="44"
        rx="22"
        ry="30"
        fill={`url(#${uid}-shell)`}
        filter={`url(#${uid}-shadow)`}
      />

      {/* Specular highlight (top-left) */}
      <ellipse
        cx="32"
        cy="44"
        rx="22"
        ry="30"
        fill={`url(#${uid}-highlight)`}
      />

      {/* Inner glow — the data waiting inside */}
      {state !== 'dormant' && (
        <ellipse
          cx="32"
          cy="46"
          rx="10"
          ry="12"
          fill={`url(#${uid}-glow)`}
          style={
            animated
              ? {
                  animation: 'sealedPulse 2.8s ease-in-out infinite',
                  transformOrigin: '32px 46px',
                }
              : undefined
          }
        />
      )}

      {/* Crack lines — hairline fractures */}
      {(showCracks || state === 'approaching' || state === 'revealed') && (
        <g
          stroke={state === 'revealed' ? '#6EE7B7' : '#92400E'}
          strokeWidth="0.75"
          strokeLinecap="round"
          opacity={state === 'revealed' ? 0.8 : 0.45}
        >
          {/* Main vertical crack */}
          <path
            d="M32 22 L30 32 L33 38 L29 48 L32 58"
            fill="none"
            strokeDasharray="40"
            strokeDashoffset="40"
            style={{
              animation: showCracks || state !== 'sealed'
                ? 'crackReveal 0.6s ease forwards'
                : undefined,
            }}
          />
          {/* Branch cracks */}
          <path
            d="M30 32 L24 35"
            fill="none"
            strokeDasharray="10"
            strokeDashoffset="10"
            style={{
              animation: showCracks || state !== 'sealed'
                ? 'crackReveal 0.6s 0.2s ease forwards'
                : undefined,
            }}
          />
          <path
            d="M33 38 L40 36"
            fill="none"
            strokeDasharray="10"
            strokeDashoffset="10"
            style={{
              animation: showCracks || state !== 'sealed'
                ? 'crackReveal 0.6s 0.3s ease forwards'
                : undefined,
            }}
          />
        </g>
      )}

      {/* Revealed state: emerald light escaping */}
      {state === 'revealed' && (
        <g opacity="0.6">
          <line x1="32" y1="14" x2="32" y2="8" stroke="#6EE7B7" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="20" y1="20" x2="15" y2="15" stroke="#6EE7B7" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="44" y1="20" x2="49" y2="15" stroke="#6EE7B7" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="14" y1="44" x2="8"  y2="44" stroke="#6EE7B7" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="50" y1="44" x2="56" y2="44" stroke="#6EE7B7" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      )}
    </svg>
  )
}

// ============================================================
// Logo mark variant — for nav and favicon context
// ============================================================

export function PersistLogo({ size = 28 }: { size?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <AmberDroplet size="xs" state="sealed" animated={false} />
      <span
        style={{
          fontFamily: "'DM Serif Display', Georgia, serif",
          fontSize: `${size}px`,
          letterSpacing: '-0.01em',
          color: 'var(--stone-900)',
          lineHeight: 1,
        }}
      >
        PERSIST
      </span>
    </div>
  )
}
