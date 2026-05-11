import * as v from 'valibot'

const EnvSchema = v.object({
  VITE_RIFT_WS_BASE_URL: v.optional(v.string(), ''),
  VITE_RIFT_HTTP_BASE_URL: v.optional(v.string(), ''),
})

export const env = v.parse(EnvSchema, import.meta.env)
