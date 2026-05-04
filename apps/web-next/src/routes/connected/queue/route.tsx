import { createFileRoute } from '@tanstack/react-router'

function QueueRouteComponent() {
  return <div>Hello Mimic</div>
}

export const Route = createFileRoute('/connected/queue')({
  component: QueueRouteComponent,
})
