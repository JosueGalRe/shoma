import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { relayStoreSelectors, useRelayStore } from '@/core/state/relay-store'

interface PageHeaderProps {
  title: string
  subtitle?: string
  badges?: Array<{ label: string; icon?: ReactNode }>
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, badges, actions }: PageHeaderProps) {
  const { t } = useTranslation()
  const status = useRelayStore(relayStoreSelectors.status)

  const statusColor = status === 'connected' ? 'bg-[rgb(200,170,110)]' : status === 'error' ? 'bg-destructive' : 'bg-accent'

  const statusLabel =
    status === 'connected'
      ? t('connection.status.connected')
      : status === 'connecting'
        ? t('connection.status.connecting')
        : status === 'disconnected'
          ? t('connection.status.disconnected')
          : status === 'error'
            ? t('connection.status.error')
            : t('connection.status.idle')

  return (
    <header className='flex shrink-0 items-center gap-3 px-4 pt-3 pb-2'>
      <div className='flex min-w-0 flex-1 items-center gap-2'>
        <span className='relative flex h-2 w-2 shrink-0'>
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-40 ${statusColor}`} />
          <span className={`relative inline-flex h-2 w-2 rounded-full ${statusColor}`} />
        </span>
        <div className='flex min-w-0 flex-col'>
          <h2 className='font-display truncate text-base font-bold tracking-widest text-[rgb(200,170,110)] uppercase'>
            {title}
          </h2>
          {subtitle ? (
            <span className='truncate text-[10px] font-bold tracking-wider text-[rgba(200,170,110,0.6)] uppercase'>
              {subtitle}
            </span>
          ) : null}
          {status !== 'connected' ? (
            <span className='text-accent text-[10px] font-bold tracking-wider uppercase'>{statusLabel}</span>
          ) : null}
        </div>
      </div>

      <div className='flex shrink-0 items-center gap-2'>
        {badges?.map((badge) => (
          <span
            key={badge.label}
            className='flex items-center gap-1 rounded-full border border-[rgba(200,170,110,0.4)] bg-[rgba(10,20,40,0.6)] px-2 py-0.5 text-[10px] font-bold tracking-wider text-[rgba(200,170,110,0.8)] uppercase'
          >
            {badge.icon}
            {badge.label}
          </span>
        ))}
        {actions}
      </div>
    </header>
  )
}
