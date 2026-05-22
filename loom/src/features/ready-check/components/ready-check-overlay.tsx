import { useQuery } from '@tanstack/react-query'
import { Crown } from 'lucide-react'
import { useEffect, useRef } from 'react'

import { Button } from '@/components/ui/button'
import { createLcuQueryOptions, gameflowPhaseDescriptor } from '@/core/lcu/lcu-queries'
import { useSharedLCUTransport } from '@/core/relay/relay-client-provider'

import { READY_CHECK_DURATION_SECONDS } from '../constants'
import { useReadyCheck } from '../hooks/use-ready-check'
import type { ReadyCheckStatus } from '../ready-check-store'

function formatTimer(seconds: number): string {
  const safeSeconds = Math.max(0, seconds)
  return safeSeconds.toString()
}

export function ReadyCheckOverlay() {
  const { accept, decline, error, isLoading, status, timer } = useReadyCheck()
  const transport = useSharedLCUTransport()
  const gameflowQuery = useQuery(createLcuQueryOptions(gameflowPhaseDescriptor, transport))
  const previousBodyOverflowRef = useRef<string | null>(null)
  const readyCheckStatus: ReadyCheckStatus = status
  const isVisible = readyCheckStatus === 'pending' && gameflowQuery.data === 'ReadyCheck'
  const isUrgent = timer <= 5

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined
    }

    if (!isVisible) {
      return undefined
    }

    previousBodyOverflowRef.current = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousBodyOverflowRef.current ?? ''
    }
  }, [isVisible])

  if (!isVisible) {
    return null
  }

  const progressValue = Math.max(0, Math.min(100, (timer / READY_CHECK_DURATION_SECONDS) * 100))
  const hasResponded = readyCheckStatus !== 'pending'

  return (
    <div
      className='fixed inset-0 z-[100] flex items-center justify-center overflow-hidden'
      data-testid='ready-check-overlay'
      role='dialog'
      aria-modal='true'
    >
      <div className='absolute inset-0 bg-black/80 backdrop-blur-xl' />

      <style>{`
        @keyframes modal-entrance {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes subtitle-entrance {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scrim-entrance {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes ring-pulse-outer {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.02); }
        }
        @keyframes ring-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes ring-pulse-inner {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes timer-glow {
          0%, 100% { filter: drop-shadow(0 0 20px rgba(200,170,110,0.3)); }
          50% { filter: drop-shadow(0 0 40px rgba(200,170,110,0.6)); }
        }
        @keyframes button-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        @keyframes border-travel {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes shimmer-continuous {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes particle-drift-1 {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(20px, -30px); }
          50% { transform: translate(-10px, -50px); }
          75% { transform: translate(30px, -20px); }
        }
        @keyframes particle-drift-2 {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(-25px, -40px); }
          66% { transform: translate(15px, -60px); }
        }
        @keyframes particle-drift-3 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, -40px); }
        }
        @keyframes particle-drift-4 {
          0%, 100% { transform: translate(0, 0); }
          20% { transform: translate(-20px, -25px); }
          40% { transform: translate(10px, -45px); }
          60% { transform: translate(-30px, -30px); }
          80% { transform: translate(20px, -50px); }
        }
        @keyframes urgent-text-flash {
          0%, 100% {
            color: rgba(200,170,110,1);
            filter: drop-shadow(0 0 15px rgba(200,170,110,0.4));
          }
          50% {
            color: rgba(230,200,130,1);
            filter: drop-shadow(0 0 20px rgba(230,200,130,0.6));
          }
        }
        @keyframes urgent-btn-flash {
          0%, 100% {
            color: rgba(200,170,110,1);
            background-color: rgba(200,170,110,0.1);
            border-color: rgba(200,170,110,0.3);
            filter: drop-shadow(0 0 15px rgba(200,170,110,0.4));
          }
          50% {
            color: rgba(230,200,130,1);
            background-color: rgba(230,200,130,0.1);
            border-color: rgba(230,200,130,0.4);
            filter: drop-shadow(0 0 20px rgba(230,200,130,0.6));
          }
        }
        @keyframes timer-ring-pulse {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.02); }
        }
      `}</style>

      <div className='pointer-events-none absolute inset-0 overflow-hidden'>
        <div
          className='bg-primary/40 absolute top-[30%] left-[20%] h-1 w-1 rounded-full'
          style={{ animation: 'particle-drift-1 8s infinite ease-in-out, pulse 2s infinite' }}
        />
        <div
          className='bg-primary/30 absolute top-[60%] left-[70%] h-1.5 w-1.5 rounded-full'
          style={{ animation: 'particle-drift-2 12s infinite ease-in-out, pulse 3s infinite' }}
        />
        <div
          className='bg-primary/20 absolute top-[20%] left-[60%] h-2 w-2 rounded-full'
          style={{ animation: 'particle-drift-3 10s infinite ease-in-out, pulse 4s infinite' }}
        />
        <div
          className='bg-primary/50 absolute top-[70%] left-[30%] h-1 w-1 rounded-full'
          style={{ animation: 'particle-drift-4 9s infinite ease-in-out, pulse 2.5s infinite' }}
        />
      </div>

      <div className='pointer-events-none absolute inset-0 flex items-center justify-center'>
        <div
          className='border-border-gold/10 absolute h-[600px] w-[600px] rounded-full border'
          style={{ animation: 'ring-pulse-outer 4s infinite ease-in-out' }}
        />
        <div
          className='border-border-gold/20 absolute h-[400px] w-[400px] rounded-full border border-dashed'
          style={{ animation: 'ring-rotate 20s linear infinite' }}
        />
      </div>

      <div
        className='relative z-10 flex w-full flex-col items-center gap-10 px-4 text-center'
        style={{ animation: 'modal-entrance 400ms ease-out forwards' }}
      >
        <div className='space-y-4'>
          <h2
            className={`font-display text-5xl font-black tracking-[0.15em] uppercase md:text-6xl ${isUrgent ? '' : 'text-primary'}`}
            style={{
              filter: isUrgent ? undefined : 'drop-shadow(0 0 15px rgba(200,170,110,0.4))',
              animation: isUrgent ? 'urgent-text-flash 0.8s infinite linear' : undefined,
            }}
          >
            Partida encontrada
          </h2>
          <div
            className='flex items-center justify-center gap-3 text-sm font-bold tracking-[0.3em] uppercase opacity-0'
            style={{
              color: isUrgent ? undefined : 'rgba(200,170,110,0.7)',
              ...(isUrgent
                ? {
                    animationName: 'subtitle-entrance, urgent-text-flash',
                    animationDuration: '400ms, 0.8s',
                    animationDelay: '200ms, 0s',
                    animationTimingFunction: 'ease-out, linear',
                    animationIterationCount: '1, infinite',
                    animationFillMode: 'forwards, none',
                  }
                : {
                    animation: 'subtitle-entrance 400ms ease-out 200ms forwards',
                  }),
            }}
          >
            <span>Summoner's Rift</span>
            <span className='bg-primary/50 h-1 w-1 rounded-full' />
            <span>Ranked</span>
            <span className='bg-primary/50 h-1 w-1 rounded-full' />
            <span>5 vs 5</span>
          </div>
        </div>

        <div className='flex items-center justify-center'>
          <div className='relative flex h-40 w-40 items-center justify-center'>
            <div
              className='border-border-gold/10 absolute h-40 w-40 rounded-full border'
              style={{ animation: 'timer-ring-pulse 3s infinite ease-in-out' }}
            />
            <div
              className='border-border-gold/20 absolute h-32 w-32 rounded-full border'
              style={{ animation: 'timer-ring-pulse 3s infinite ease-in-out 0.5s' }}
            />
            <div
              className='border-border-gold/30 absolute h-24 w-24 rounded-full border'
              style={{ animation: 'timer-ring-pulse 3s infinite ease-in-out 1s' }}
            />
            <span
              className={`font-display relative text-7xl font-black ${isUrgent ? '' : 'text-primary'}`}
              style={{
                filter: isUrgent ? undefined : 'drop-shadow(0 0 30px rgba(200,170,110,1))',
                animation: isUrgent
                  ? 'urgent-text-flash 0.8s infinite linear, timer-glow 2s infinite ease-in-out'
                  : 'timer-glow 2s infinite ease-in-out',
              }}
            >
              {formatTimer(timer)}
            </span>
          </div>
        </div>

        <div className='mt-8 flex w-full max-w-md flex-col gap-6'>
          <div className='relative w-full' style={{ animation: 'button-breathe 3s infinite ease-in-out' }}>
            <div
              className='absolute inset-x-0 top-0 h-[2px] bg-[linear-gradient(90deg,transparent,rgba(200,170,110,1),transparent)] bg-[length:200%_100%]'
              style={{ animation: 'border-travel 2s linear infinite' }}
            />
            <div
              className='absolute inset-x-0 bottom-0 h-[2px] bg-[linear-gradient(90deg,transparent,rgba(200,170,110,1),transparent)] bg-[length:200%_100%]'
              style={{ animation: 'border-travel 2s linear infinite reverse' }}
            />
            <button
              className={`group relative h-20 w-full overflow-hidden border-y-2 transition-all hover:shadow-[0_0_40px_rgba(200,170,110,0.4)] active:scale-[0.98] ${isUrgent ? '' : 'bg-primary/10 border-primary/30 hover:bg-primary/20'} ${hasResponded || isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
              style={{
                animation: isUrgent ? 'urgent-btn-flash 0.8s infinite linear' : undefined,
              }}
              onClick={() => void accept()}
              disabled={isLoading || hasResponded}
              type='button'
            >
              <div
                className='via-primary/20 absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent to-transparent'
                style={{ animation: 'shimmer-continuous 2s infinite' }}
              />
              <span
                className={`font-display relative text-3xl font-black tracking-[0.2em] uppercase ${isUrgent ? '' : 'text-primary'}`}
                style={{
                  filter: 'drop-shadow(0 0 10px rgba(200,170,110,0.8))',
                  animation: isUrgent ? 'urgent-text-flash 0.8s infinite linear' : undefined,
                }}
              >
                Aceptar
              </span>
            </button>
          </div>

          <button
            className={`text-sm font-bold tracking-[0.2em] uppercase transition-colors ${isUrgent ? '' : 'text-muted hover:text-primary'}`}
            style={{
              animation: isUrgent ? 'urgent-text-flash 0.8s infinite linear' : undefined,
              opacity: isUrgent ? 0.6 : undefined,
            }}
            onClick={() => void decline()}
            disabled={isLoading || hasResponded}
            type='button'
          >
            Declinar
          </button>
        </div>

        {error ? <p className='text-destructive text-sm'>{error.message}</p> : null}
      </div>
    </div>
  )
}
