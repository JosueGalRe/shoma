import { Link, Outlet, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { AppShell } from '@/components/layout'
import { useRiftStore } from '@/core/state/rift-store'
import { readConnectedNavItems } from '@/lib/connected-layout-utils'

function ConnectedRouteComponent() {
  const { t } = useTranslation()
  const status = useRiftStore((state) => state.status)
  const navItems = readConnectedNavItems()
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

  const header = (
    <header className="flex flex-col gap-2 border-b border-gray-800 bg-gray-900 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">MIMIC</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">{t('champSelect.phase')}:</span>
          <span
            className={`text-sm font-medium ${
              status === 'connected'
                ? 'text-green-500'
                : status === 'error'
                  ? 'text-red-500'
                  : 'text-yellow-500'
            }`}
          >
            {statusLabel}
          </span>
        </div>
      </div>
      <nav className="flex overflow-x-auto pb-1">
        <ul className="flex gap-2">
          {navItems.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
                activeProps={{
                  className: 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 hover:text-blue-300',
                }}
              >
                {t(item.labelKey)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )

  return (
    <AppShell className="mx-auto max-w-md sm:max-w-xl md:max-w-3xl">
      {header}
      <div className="p-4">
        <Outlet />
      </div>
    </AppShell>
  )
}

export const Route = createFileRoute('/connected')({
  component: ConnectedRouteComponent,
})
