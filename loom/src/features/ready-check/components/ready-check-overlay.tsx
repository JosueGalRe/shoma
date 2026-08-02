/* eslint-disable react-doctor/no-long-transition-duration -- All transitions are intentional cinematic animations (2s–20s) for the ready-check overlay */
import { useEffect, useRef } from 'react'

import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { createLcuQueryOptions, gameflowPhaseDescriptor } from '@/core/lcu/queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'

import { useReadyCheck } from '../hooks/use-ready-check'
import { readyCheckOverlayStyles } from '../ready-check-styles'
import { formatTimer } from '../ready-check-utils'

import { ReadyCheckBackdrop } from './ready-check-backdrop'
// eslint-disable-next-line import/no-unassigned-import -- Component keyframes side effect.
import './ready-check-keyframes.css'

export function ReadyCheckOverlay() {
  const { accept, decline, error, isLoading, status, timer } = useReadyCheck()
  const { t } = useTranslation()
  const transport = useSharedLCUTransport()
  const gameflowQuery = useQuery(createLcuQueryOptions(gameflowPhaseDescriptor, transport))
  const previousBodyOverflowRef = useRef<string | null>(null)
  const isVisible = status === 'pending' && gameflowQuery.data === 'ReadyCheck'
  const isUrgent = timer <= 5
  const hasResponded = status !== 'pending'
  const styles = readyCheckOverlayStyles({ blocked: hasResponded || isLoading, urgent: isUrgent })

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

  return (
    // eslint-disable-next-line react-doctor/prefer-tag-over-role
    <div
      role="dialog"
      className={styles.overlay()}
      data-testid="ready-check-overlay"
      aria-modal="true"
      aria-label={t('readyCheck.title')}
    >
      <div className={styles.scrim()} />

      <ReadyCheckBackdrop />

      <div className={styles.content()} style={{ animation: 'modal-entrance 400ms ease-out forwards' }}>
        <div className={styles.headingGroup()}>
          <h2
            className={styles.title()}
            style={{
              animation: isUrgent ? 'urgent-text-flash 0.8s infinite linear' : undefined,
              filter: isUrgent ? undefined : 'drop-shadow(0 0 15px rgba(200,170,110,0.4))',
            }}
          >
            {t('readyCheck.matchFound')}
          </h2>

          <div
            className={styles.subtitle()}
            style={{
              color: isUrgent ? undefined : 'rgba(200,170,110,0.7)',
              ...(isUrgent
                ? {
                    animationDelay: '200ms, 0s',
                    animationDuration: '400ms, 0.8s',
                    animationFillMode: 'forwards, none',
                    animationIterationCount: '1, infinite',
                    animationName: 'subtitle-entrance, urgent-text-flash',
                    animationTimingFunction: 'ease-out, linear',
                  }
                : {
                    animation: 'subtitle-entrance 400ms ease-out 200ms forwards',
                  }),
            }}
          >
            <span>{t('readyCheck.map')}</span>

            <span className={styles.subtitleDot()} />

            <span>{t('readyCheck.ranked')}</span>

            <span className={styles.subtitleDot()} />

            <span>{t('readyCheck.teamFormat')}</span>
          </div>
        </div>

        <div className={styles.timerWrap()}>
          <div className={styles.timerFrame()}>
            <div className={styles.timerOuter()} style={{ animation: 'timer-ring-pulse 3s infinite ease-in-out' }} />

            <div className={styles.timerMid()} style={{ animation: 'timer-ring-pulse 3s infinite ease-in-out 0.5s' }} />

            <div className={styles.timerInner()} style={{ animation: 'timer-ring-pulse 3s infinite ease-in-out 1s' }} />

            <span
              className={styles.timerText()}
              style={{
                animation: isUrgent
                  ? 'urgent-text-flash 0.8s infinite linear, timer-glow 2s infinite ease-in-out'
                  : 'timer-glow 2s infinite ease-in-out',
                filter: isUrgent ? undefined : 'drop-shadow(0 0 30px rgba(200,170,110,1))',
              }}
            >
              {formatTimer(timer)}
            </span>
          </div>
        </div>

        <div className={styles.actions()}>
          <div className={styles.actionWrap()} style={{ animation: 'button-breathe 3s infinite ease-in-out' }}>
            <div className={styles.actionTopBorder()} style={{ animation: 'border-travel 2s linear infinite' }} />

            <div className={styles.actionBottomBorder()} style={{ animation: 'border-travel 2s linear infinite reverse' }} />

            <button
              className={styles.acceptButton()}
              style={{ animation: isUrgent ? 'urgent-btn-flash 0.8s infinite linear' : undefined }}
              onClick={() => {
                return void accept()
              }}
              disabled={isLoading || hasResponded}
              type="button"
            >
              <div className={styles.acceptShimmer()} style={{ animation: 'shimmer-continuous 2s infinite' }} />

              <span
                className={styles.acceptLabel()}
                style={{
                  animation: isUrgent ? 'urgent-text-flash 0.8s infinite linear' : undefined,
                  filter: 'drop-shadow(0 0 10px rgba(200,170,110,0.8))',
                }}
              >
                {t('readyCheck.accept')}
              </span>
            </button>
          </div>

          <button
            className={styles.declineButton()}
            style={{
              animation: isUrgent ? 'urgent-text-flash 0.8s infinite linear' : undefined,
              opacity: isUrgent ? 0.6 : undefined,
            }}
            onClick={() => {
              return void decline()
            }}
            disabled={isLoading || hasResponded}
            type="button"
          >
            {t('readyCheck.decline')}
          </button>
        </div>

        {error ? <p className={styles.error()}>{error.message}</p> : null}
      </div>
    </div>
  )
}
