import { defineConfig } from 'playwright/test'

export default defineConfig({
  expect: {
    toHaveScreenshot: {
      pathTemplate: '{testDir}/{arg}',
    },
  },
  projects: [
    {
      name: 'Mobile-360',
      use: {
        hasTouch: true,
        isMobile: true,
        viewport: { height: 800, width: 360 },
      },
    },
    {
      name: 'Mobile-390',
      use: {
        hasTouch: true,
        isMobile: true,
        viewport: { height: 844, width: 390 },
      },
    },
    {
      name: 'Mobile',
      use: {
        viewport: { height: 812, width: 375 },
      },
    },
    {
      name: 'Tablet',
      use: {
        viewport: { height: 1024, width: 768 },
      },
    },
    {
      name: 'Desktop',
      use: {
        viewport: { height: 720, width: 1280 },
      },
    },
  ],
  testDir: './tests/e2e',
  testMatch: '**/*.pw.ts',
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'pnpm run dev',
    reuseExistingServer: true,
    url: 'http://localhost:5173',
  },
})
