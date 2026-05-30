import { useEffect, useRef, useState } from 'react'

import { Button, Icon } from '@shoma/design-system'
import QRCode from 'qrcode'

import { AccessCodeDisplay } from './access-code-display'
import { GeneratingState } from './generating-state'

import type { TranslationKey } from '../app-utils'

interface AccessCodeSectionProps {
  accessCode: string | null
  isGeneratingCode: boolean
  copied: boolean
  url: string | null
  webUrl: string | null
  t: (key: TranslationKey) => string
  onCopyCode: () => void
}

export function AccessCodeSection({
  accessCode,
  isGeneratingCode,
  copied,
  url: _url,
  webUrl,
  t,
  onCopyCode,
}: AccessCodeSectionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [showQR, setShowQR] = useState(false)

  useEffect(() => {
    const trimmedUrl = webUrl?.trim()

    if (showQR && accessCode && trimmedUrl && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        `${trimmedUrl.replace(/\/$/, '')}/?code=${accessCode}`,
        {
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
          margin: 2,
          width: 160,
        },
        (error) => {
          if (error) {
            console.error(error)
          }
        },
      )
    } else if (canvasRef.current) {
      const context = canvasRef.current.getContext('2d')

      context?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
  }, [accessCode, showQR, webUrl])

  return (
    <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', flexShrink: 0, gap: '24px', width: '100%' }}>
      {isGeneratingCode ? (
        <GeneratingState label={t('status.generating')} />
      ) : (
        <>
          {showQR ? (
            <div className="qr-container">
              <canvas ref={canvasRef} className="qr-canvas" width={160} height={160} />
            </div>
          ) : (
            <AccessCodeDisplay accessCode={accessCode} />
          )}

          <div className="access-code-actions">
            {!showQR && (
              <Button
                className="copy-button"
                onClick={onCopyCode}
                disabled={!accessCode || copied}
                title={t('button.copy')}
                variant="primary"
              >
                <Icon name={copied ? 'check' : 'copy'} size="sm" tone="primary" />

                {copied ? t('button.copied') : t('button.copy')}
              </Button>
            )}

            <Button
              variant="secondary"
              onClick={() => {
                return setShowQR(!showQR)
              }}
              className="qr-toggle-button"
            >
              <Icon name={showQR ? 'hash' : 'qr-code'} size="sm" />

              {showQR ? t('button.showCode') : t('button.showQR')}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
