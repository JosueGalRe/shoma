import type { ConfigEnv, UserConfigExport } from 'vite'
import { defineConfig, mergeConfig } from 'vitest/config'

import viteConfig from './vite.config'

function resolveViteConfig(configEnv: ConfigEnv): UserConfigExport {
  if (typeof viteConfig === 'function') {
    return viteConfig(configEnv)
  }

  return viteConfig
}

export default defineConfig((configEnv) =>
  mergeConfig(resolveViteConfig(configEnv), {
    test: {
      environment: 'jsdom',
      include: ['**/*.test.{ts,tsx}', '**/*-test.{ts,tsx}'],
    },
  }),
)
