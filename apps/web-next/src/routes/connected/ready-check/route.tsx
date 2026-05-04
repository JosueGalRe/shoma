import { createFileRoute } from '@tanstack/react-router'

function ReadyCheckRouteComponent() {
  return <div>Hello Mimic</div>
}

export const Route = createFileRoute('/connected/ready-check')({
  component: ReadyCheckRouteComponent,
})
