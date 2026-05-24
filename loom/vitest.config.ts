import type { ConfigEnv, UserConfig } from 'vite'
import { defineConfig, mergeConfig } from 'vitest/config'

import viteConfig from './vite.config'

function resolveViteConfig(configEnv: ConfigEnv): UserConfig {
  if (typeof viteConfig === 'function') {
    const resolved = viteConfig(configEnv)

    return resolved
  }

  return viteConfig
}

export default defineConfig((configEnv) => {
  return mergeConfig(resolveViteConfig(configEnv), {
    test: {
      environment: 'jsdom',
      include: ['**/*.test.{ts,tsx}', '**/*-test.{ts,tsx}'],
    },
  })
})
