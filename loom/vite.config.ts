import childProcess from 'node:child_process'
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

function getGitCommitShort(): string {
  try {
    return childProcess.execSync('git rev-parse --short HEAD', { cwd: path.resolve('..'), encoding: 'utf8' }).trim()
  } catch {
    return 'unknown'
  }
}

function getGitCommitFull(): string {
  try {
    return childProcess.execSync('git rev-parse HEAD', { cwd: path.resolve('..'), encoding: 'utf8' }).trim()
  } catch {
    return 'unknown'
  }
}

function getGitCommitUrl(): string {
  const fullCommit = getGitCommitFull()

  if (fullCommit === 'unknown') {
    return '#'
  }

  return `https://github.com/JosueGalRe/shoma/commit/${fullCommit}`
}

export default defineConfig(({ mode }) => {
  return {
    build: {
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name: 'react',
                test: /node_modules\/(?<pkg>react|react-dom|scheduler)\//,
              },
              {
                name: 'tanstack',
                test: /node_modules\/@tanstack\//,
              },
              {
                name: 'i18n',
                test: /node_modules\/(?<pkg>i18next|react-i18next)\//,
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
    define: {
      __GIT_COMMIT_SHORT__: JSON.stringify(getGitCommitShort()),
      __GIT_COMMIT_URL__: JSON.stringify(getGitCommitUrl()),
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
        registerType: 'prompt',
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
