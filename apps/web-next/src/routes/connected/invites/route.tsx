import { Link, createFileRoute } from '@tanstack/react-router'

import { readInvitesRouteCopy } from './-invites-utils'

export const Route = createFileRoute('/connected/invites')({
  component: ConnectedInvitesRoute,
})

function ConnectedInvitesRoute() {
  const copy = readInvitesRouteCopy()

  return (
    <section className='rounded-xl border border-slate-800 bg-slate-900/80 p-4'>
      <h1 className='text-lg font-semibold text-white'>{copy.title}</h1>
      <p className='mt-2 text-sm text-slate-300'>{copy.body}</p>
      <Link className='mt-3 inline-flex rounded-lg bg-sky-600 px-3 py-2 text-sm text-white' to='/connected/lobby'>
        {copy.cta}
      </Link>
    </section>
  )
}
