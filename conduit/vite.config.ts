import path from 'node:path'

import stylex from '@stylexjs/unplugin/vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite-plus'

const srcDir = path.resolve('src')

export default defineConfig({
  base: './',
  build: {
    emptyOutDir: true,
    outDir: 'dist',
    rolldownOptions: {
      input: {
        main: path.resolve(import.meta.dirname, 'index.html'),
      },
    },
  },
  plugins: [
    // First, so it compiles @shoma/ui and app styles before the React plugin sees them
    stylex({
      lightningcssOptions: { minify: true },
      unstable_moduleResolution: { rootDir: path.resolve('..'), type: 'commonJS' },
      // Keeps StyleX ahead of Tailwind's layers in dev and build alike; drop with Tailwind
      useCSSLayers: { before: ['theme', 'base', 'components', 'utilities'] },
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': srcDir,
      '~': srcDir,
    },
    tsconfigPaths: true,
  },
  server: {
    host: '127.0.0.1',
    port: 1420,
    strictPort: true,
  },
})
