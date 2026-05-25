import { object, optional, parse, string } from 'valibot'

const EnvSchema = object({
  VITE_LEYLINE_HTTP_BASE_URL: optional(string(), ''),
  VITE_LEYLINE_WS_BASE_URL: optional(string(), ''),
})

export const env = parse(EnvSchema, import.meta.env)
