import path from 'node:path'

import { i18nextVitePlugin } from '@i18next-selector/vite-plugin'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { consoleForwardPlugin } from 'vite-console-forward-plugin'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite-plus'

const srcDir = path.resolve('src')

export default defineConfig(({ mode }) => {
  return {
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
        silent: true,
        sourceDir: path.join(path.resolve('src'), 'i18n', 'generated'),
      }),
      consoleForwardPlugin({
        enabled: mode !== 'production',
        levels: ['log', 'warn', 'error', 'info', 'debug'],
      }),
      VitePWA({
        filename: 'pwa-sw.ts',
        injectRegister: 'auto',
        manifest: false,
        registerType: 'autoUpdate',
        srcDir: 'src',
        strategies: 'injectManifest',
      }),
    ],
    resolve: {
      alias: {
        '@': srcDir,
        '~': srcDir,
      },
      tsconfigPaths: true,
    },
    server: {
      allowedHosts: true,
      host: '0.0.0.0',
    },
  }
})
