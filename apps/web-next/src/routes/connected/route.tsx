import { Link, Outlet, createFileRoute } from '@tanstack/react-router'

import { readConnectedNavItems } from './-connected-layout-utils'

export const Route = createFileRoute('/connected')({
  component: ConnectedLayoutRoute,
})

function ConnectedLayoutRoute() {
  const navItems = readConnectedNavItems()

  return (
    <main className='min-h-screen bg-slate-950 p-4 text-slate-100 sm:p-6'>
      <div className='mx-auto flex w-full max-w-6xl flex-col gap-4'>
        <nav className='rounded-xl border border-slate-800 bg-slate-900/80 p-3'>
          <ul className='flex flex-wrap items-center gap-2'>
            {navItems.map((item) => (
              <li key={item.to}>
                <Link
                  activeProps={{ className: 'bg-sky-600 text-white' }}
                  className='inline-flex h-9 items-center rounded-lg bg-slate-800 px-3 text-sm text-slate-200'
                  inactiveProps={{ className: 'bg-slate-800 text-slate-200' }}
                  to={item.to}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Outlet />
      </div>
    </main>
  )
}
