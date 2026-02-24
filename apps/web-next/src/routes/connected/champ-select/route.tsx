import { Link, createFileRoute } from '@tanstack/react-router'

import { readChampSelectRouteCopy } from './-champ-select-utils'

export const Route = createFileRoute('/connected/champ-select')({
  component: ConnectedChampSelectRoute,
})

function ConnectedChampSelectRoute() {
  const copy = readChampSelectRouteCopy()

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
