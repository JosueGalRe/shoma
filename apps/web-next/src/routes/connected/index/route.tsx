import { createFileRoute } from '@tanstack/react-router'

function ConnectedIndexRouteComponent() {
  return <div>Hello Mimic</div>
}

export const Route = createFileRoute('/connected/')({
  component: ConnectedIndexRouteComponent,
})
