import { createFileRoute } from '@tanstack/react-router'

function ChampSelectRouteComponent() {
  return <div>Hello Mimic</div>
}

export const Route = createFileRoute('/connected/champ-select')({
  component: ChampSelectRouteComponent,
})
