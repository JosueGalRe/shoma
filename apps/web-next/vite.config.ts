import path from 'node:path'

import { i18nextVitePlugin } from '@i18next-selector/vite-plugin'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { consoleForwardPlugin } from 'vite-console-forward-plugin'
import { defineConfig } from 'vite-plus'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {},
  resolve: {
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
              test: /node_modules\/\@tanstack\//,
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
    tanstackRouter(),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    i18nextVitePlugin({
      sourceDir: path.join(path.resolve(), 'src', 'i18n'),
      silent: true,
    }),
    consoleForwardPlugin({
      enabled: true,
      levels: ['log', 'warn', 'error', 'info', 'debug'],
    }),
    VitePWA({
      injectRegister: 'auto',
      manifest: false,
      filename: 'pwa-sw.js',
      registerType: 'autoUpdate',
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
})
