import path from 'node:path'

import { i18nextVitePlugin } from '@i18next-selector/vite-plugin'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { defineConfig } from 'vite-plus'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    forwardConsole: true,
  },
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) {
            return 'react'
          }
          if (/node_modules\/\@tanstack\//.test(id)) {
            return 'tanstack'
          }
          if (/node_modules\/(i18next|react-i18next)\//.test(id)) {
            return 'i18n'
          }
          if (/node_modules\//.test(id)) {
            return 'vendor'
          }
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
