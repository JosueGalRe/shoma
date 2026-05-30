import { createFileRoute } from '@tanstack/react-router'
import { number, object, optional, pipe, string, toString, union } from 'valibot'

import { IndexRouteComponent } from './-route-component'

const searchSchema = object({
  code: optional(pipe(union([string(), number()]), toString())),
})

export const Route = createFileRoute('/')({
  component: IndexRouteComponent,
  validateSearch: searchSchema,
})
