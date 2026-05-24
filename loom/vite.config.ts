import path from 'node:path'

import { i18nextVitePlugin } from '@i18next-selector/vite-plugin'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { consoleForwardPlugin } from 'vite-console-forward-plugin'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite-plus'

import rootConfig from '../vite.config'

const srcDir = path.resolve('src')

const baseConfig = rootConfig

const resolvedBaseConfig = await baseConfig

export default defineConfig(({ mode }) => {
  return {
    ...resolvedBaseConfig,
    server: {
      host: '0.0.0.0',
      allowedHosts: true,
    },
    resolve: {
      alias: {
        '@': srcDir,
        '~': srcDir,
      },
      tsconfigPaths: true,
    },
    build: {
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name: 'react',
                test: /node_modules\/(react|react-dom|scheduler)\//,
              },
              {
                name: 'tanstack',
                test: /node_modules\/@tanstack\//,
              },
              {
                name: 'i18n',
                test: /node_modules\/(i18next|react-i18next)\//,
              },
              {
                name: 'vendor',
                test: /node_modules\//,
              },
            ],
          },
        },
      },
    },
    plugins: [
      tanstackRouter({
        autoCodeSplitting: true,
      }),
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      tailwindcss(),
      i18nextVitePlugin({
        sourceDir: path.join(srcDir, 'i18n', 'generated'),
        silent: true,
      }),
      consoleForwardPlugin({
        enabled: mode !== 'production',
        levels: ['log', 'warn', 'error', 'info', 'debug'],
      }),
      VitePWA({
        strategies: 'injectManifest',
        injectRegister: 'auto',
        manifest: false,
        filename: 'pwa-sw.ts',
        srcDir: 'src',
        registerType: 'autoUpdate',
      }),
    ],
  }
})
