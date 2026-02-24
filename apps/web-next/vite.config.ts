import path from 'node:path'

import { i18nextVitePlugin } from '@i18next-selector/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  build: {
    rolldownOptions: {
      output: {
        advancedChunks: {
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
    tanstackRouter(),
    tsconfigPaths(),
    react({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
    tailwindcss(),
    i18nextVitePlugin({
      sourceDir: path.join(path.resolve(), 'src', 'i18n'),
      silent: true,
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
