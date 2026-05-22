import type { ReactNode } from 'react'

interface LobbyBackgroundEffectsProps {
  isSearching: boolean
}

export function LobbyBackgroundEffects({ isSearching }: LobbyBackgroundEffectsProps) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Layer 1: Runeterra Cartography Texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg stroke='%23c8aa6e' stroke-width='0.5'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Layer 2: Floating Hextech Shards */}
      <div className="absolute top-[15%] right-[10%] h-32 w-32 animate-[float_25s_ease-in-out_infinite] opacity-[0.06]">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M50 0L93.3 25V75L50 100L6.7 75V25L50 0Z"
            fill="currentColor"
            className="text-primary"
          />
        </svg>
      </div>
      <div className="absolute bottom-[20%] left-[5%] h-24 w-24 animate-[float_30s_ease-in-out_infinite_reverse] opacity-[0.04]">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M50 0L93.3 25V75L50 100L6.7 75V25L50 0Z"
            fill="currentColor"
            className="text-border-gold"
          />
        </svg>
      </div>

      {/* Layer 3: Hextech Particle Dust */}
      <div
        className="absolute inset-0"
        style={{
          boxShadow: `inset 0 0 60px rgba(200,170,110,0.03)`,
        }}
      />
      <div className="absolute inset-0 animate-[drift_20s_linear_infinite]">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className={`absolute h-0.5 w-0.5 rounded-full ${i % 3 === 0 ? 'bg-primary' : i % 3 === 1 ? 'bg-accent' : 'bg-border-gold'}`}
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.15 + 0.05,
              animation: `float ${15 + Math.random() * 20}s linear infinite`,
              animationDelay: `${Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      {/* Layer 4: Queue State Resonance */}
      <div
        className={`absolute bottom-[15%] left-1/2 -translate-x-1/2 h-64 w-64 rounded-full transition-all duration-1000 ${
          isSearching
            ? 'scale-150 opacity-[0.12] animate-[heartbeat_2s_ease-in-out_infinite]'
            : 'scale-100 opacity-[0.04]'
        }`}
        style={{
          background: 'radial-gradient(circle, rgba(200,170,110,0.4) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes drift {
          0% { transform: translateY(0); }
          100% { transform: translateY(-100px); }
        }
        @keyframes heartbeat {
          0%, 100% { transform: translateX(-50%) scale(1.5); opacity: 0.12; }
          50% { transform: translateX(-50%) scale(1.8); opacity: 0.18; }
        }
      `}</style>
    </div>
  )
}
