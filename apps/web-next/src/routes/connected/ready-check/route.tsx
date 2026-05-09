import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/connected/ready-check')({
  beforeLoad: () => {
    throw redirect({ to: '/connected/lobby' })
  },
})
