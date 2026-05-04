import { Link, Outlet, createFileRoute } from '@tanstack/react-router'
import { AppShell } from '@/components/layout'
import { useRiftStore } from '@/core/state/rift-store'
import { readConnectedNavItems } from './-connected-layout-utils'

function ConnectedRouteComponent() {
  const status = useRiftStore((state) => state.status)
  const navItems = readConnectedNavItems()

  const header = (
    <header className="flex flex-col gap-2 border-b border-gray-800 bg-gray-900 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">MIMIC</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Status:</span>
          <span
            className={`text-sm font-medium ${
              status === 'connected'
                ? 'text-green-500'
                : status === 'error'
                  ? 'text-red-500'
                  : 'text-yellow-500'
            }`}
          >
            {status}
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
                {item.label}
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
