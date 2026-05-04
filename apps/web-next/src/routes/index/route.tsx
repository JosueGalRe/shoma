import { createFileRoute } from '@tanstack/react-router'

function IndexRouteComponent() {
  return <div>Hello Mimic</div>
}

export const Route = createFileRoute('/')({
  component: IndexRouteComponent,
})
