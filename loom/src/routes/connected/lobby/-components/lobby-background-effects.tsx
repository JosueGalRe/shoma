interface LobbyBackgroundEffectsProps {
  isSearching: boolean
}

export function LobbyBackgroundEffects({ isSearching }: LobbyBackgroundEffectsProps) {
  return (
    <div className='pointer-events-none absolute inset-0 overflow-hidden'>
      <div
        className='absolute inset-0 opacity-[0.05]'
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg stroke='%23c8aa6e' stroke-width='0.8'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px',
        }}
      />

      {[...Array(12)].map((_, i) => {
        const startX = Math.random() * 100
        const startY = Math.random() * 100
        const endX = (startX + 30 + Math.random() * 40) % 100
        const endY = (startY + 20 + Math.random() * 40) % 100

        return (
          <div
            key={i}
            className='absolute animate-[drift-around_30s_ease-in-out_infinite] opacity-[0.04]'
            style={{
              left: `${startX}%`,
              top: `${startY}%`,
              width: `${20 + Math.random() * 40}px`,
              height: `${20 + Math.random() * 40}px`,
              animationDelay: `${Math.random() * 30}s`,
              animationDuration: `${25 + Math.random() * 20}s`,
              ['--start-x' as string]: `${startX}%`,
              ['--start-y' as string]: `${startY}%`,
              ['--end-x' as string]: `${endX}%`,
              ['--end-y' as string]: `${endY}%`,
            }}
          >
            <svg viewBox='0 0 100 100' fill='none' xmlns='http://www.w3.org/2000/svg'>
              <path
                d='M50 0L93.3 25V75L50 100L6.7 75V25L50 0Z'
                fill='currentColor'
                className={i % 2 === 0 ? 'text-primary' : 'text-border-gold'}
              />
            </svg>
          </div>
        )
      })}

      <div
        className={`absolute bottom-[15%] left-1/2 h-64 w-64 -translate-x-1/2 rounded-full transition-all duration-1000 ${
          isSearching ? 'scale-150 animate-[heartbeat_2s_ease-in-out_infinite] opacity-[0.12]' : 'scale-100 opacity-[0.04]'
        }`}
        style={{
          background: 'radial-gradient(circle, rgba(200,170,110,0.4) 0%, transparent 70%)',
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
      `}</style>
    </div>
  )
}
