import { Link, Outlet, createFileRoute } from '@tanstack/react-router'

import { readConnectedNavItems } from './-connected-layout-utils'

export const Route = createFileRoute('/connected')({
  component: ConnectedLayoutRoute,
})

function ConnectedLayoutRoute() {
  const navItems = readConnectedNavItems()

  return (
      <main className='relative min-h-screen overflow-hidden text-foreground'>
      {/* Animated background layers */}
      <div className='pointer-events-none fixed inset-0 z-0'>
        <div className='absolute inset-0 bg-gradient-to-b from-background via-card to-background' />
        <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(200,169,110,0.08)_0%,_transparent_60%)]' />
        <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(10,200,185,0.05)_0%,_transparent_50%)]' />
        <div
          className='absolute inset-0 opacity-[0.03]'
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c8a96e' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Content */}
      <div className='relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 p-4 sm:p-6 animate-page-enter'>
        {/* Header / Navigation */}
          <header className='relative overflow-hidden rounded-xl border border-secondary bg-card/80 shadow-2xl shadow-black/50 backdrop-blur-md'>
        <div className='absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent' />
          <div className='flex items-center justify-between px-4 py-3 sm:px-6'>
            <div className='flex items-center gap-3'>
              <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-[#785a28] shadow-lg'>
              <span className='font-display text-sm font-bold text-background'>M</span>
              </div>
              <h1 className='font-display text-lg font-bold tracking-wider text-primary'>MIMIC</h1>
            </div>

            <nav>
              <ul className='flex flex-wrap items-center gap-1'>
                {navItems.map((item) => (
                  <li key={item.to}>
                    <Link
                      activeProps={{
                        className:
              'bg-gradient-to-b from-primary/20 to-[#785a28]/10 text-foreground border-b-2 border-primary',
                      }}
              className='inline-flex h-9 items-center rounded-t-lg px-4 text-sm font-medium text-muted-foreground transition-all hover:text-foreground'
              inactiveProps={{ className: 'hover:bg-primary/5' }}
                      to={item.to}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </header>

        <Outlet />
      </div>
    </main>
  )
}
