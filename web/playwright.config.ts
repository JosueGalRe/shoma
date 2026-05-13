import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.pw.ts',
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
  projects: [
    {
      name: 'Mobile-360',
      use: {
        hasTouch: true,
        isMobile: true,
        viewport: { width: 360, height: 800 },
      },
    },
    {
      name: 'Mobile-390',
      use: {
        hasTouch: true,
        isMobile: true,
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: 'Mobile',
      use: {
        viewport: { width: 375, height: 812 },
      },
    },
    {
      name: 'Tablet',
      use: {
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: 'Desktop',
      use: {
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
})
