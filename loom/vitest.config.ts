import type { ConfigEnv, UserConfig } from 'vite'
import { defineConfig, mergeConfig } from 'vitest/config'

import viteConfig from './vite.config'

function resolveViteConfig(configEnv: ConfigEnv): UserConfig {
  if (typeof viteConfig === 'function') {
    return viteConfig(configEnv) as UserConfig
  }

  return viteConfig as UserConfig
}

export default defineConfig((configEnv) =>
  mergeConfig(resolveViteConfig(configEnv), {
    test: {
      environment: 'jsdom',
      include: ['**/*.test.{ts,tsx}', '**/*-test.{ts,tsx}'],
    },
  }),
)
