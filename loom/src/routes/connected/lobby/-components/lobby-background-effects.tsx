/* eslint-disable react-doctor/no-inline-exhaustive-style, react-doctor/no-large-animated-blur -- Background particles use random initial positions/sizes for organic motion; styles are dynamic per particle; blur(40px) is intentional for depth-of-field effect */

import { lobbyStyles } from '../-styles'

import type { CustomCSSProperties, LobbyBackgroundEffectsProps } from './lobby-background-effects-types'

const BG_PARTICLE_KEYS = ['bg-a', 'bg-b', 'bg-c', 'bg-d', 'bg-e', 'bg-f', 'bg-g', 'bg-h', 'bg-i', 'bg-j', 'bg-k', 'bg-l']

const PARTICLES = BG_PARTICLE_KEYS.map((key) => {
  const startX = Math.random() * 100
  const startY = Math.random() * 100
  const endX = (startX + 30 + Math.random() * 40) % 100
  const endY = (startY + 20 + Math.random() * 40) % 100

  return {
    key,
    style: {
      '--end-x': `${endX}%`,
      '--end-y': `${endY}%`,
      '--start-x': `${startX}%`,
      '--start-y': `${startY}%`,
      animationDelay: `${Math.random() * 30}s`,
      animationDuration: `${25 + Math.random() * 20}s`,
      height: `${20 + Math.random() * 40}px`,
      left: `${startX}%`,
      top: `${startY}%`,
      width: `${20 + Math.random() * 40}px`,
    } as CustomCSSProperties,
  }
})

export function LobbyBackgroundEffects({ isSearching }: LobbyBackgroundEffectsProps) {

  return (
    <div className={lobbyStyles.backgroundEffects.container}>
      <div
        className={lobbyStyles.backgroundEffects.pattern}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg stroke='%23c8aa6e' stroke-width='0.8'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px',
        }}
      />

      {PARTICLES.map((particle, i) => {
        return (
          <div key={particle.key} className={lobbyStyles.backgroundEffects.particle} style={particle.style}>
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M50 0L93.3 25V75L50 100L6.7 75V25L50 0Z"
                fill="currentColor"
                className={i % 2 === 0 ? 'text-primary' : 'text-border-gold'}
              />
            </svg>
          </div>
        )
      })}

      <div
        className={`${lobbyStyles.backgroundEffects.glow} ${
          isSearching ? 'scale-150 animate-[heartbeat_2s_ease-in-out_infinite] opacity-10' : 'scale-100 opacity-5'
        }`}
        style={{
          background: 'radial-gradient(circle, color-mix(in srgb, rgb(200,170,110) 40%, transparent) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      <style>{`
        @keyframes drift-around {
          0% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(10px, -15px) rotate(90deg); }
          50% { transform: translate(-5px, -25px) rotate(180deg); }
          75% { transform: translate(15px, -10px) rotate(270deg); }
          100% { transform: translate(0, 0) rotate(360deg); }
        }
        @keyframes heartbeat {
          0%, 100% { transform: translateX(-50%) scale(1.5); opacity: 0.12; }
          50% { transform: translateX(-50%) scale(1.8); opacity: 0.18; }
        }
        @keyframes queue-wave {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.02, 1.08); opacity: 0; }
        }
        @keyframes member-glow {
          0%, 100% { box-shadow: 0 0 0 0 transparent; }
          50% { box-shadow: 0 0 15px 2px color-mix(in srgb, rgb(200,170,110) 15%, transparent); }
        }
      `}</style>
    </div>
  )
}
