import { defineConfig, devices } from '@playwright/test'

/**
 * Runs against a freshly built app on an ephemeral port (4173) — never
 * 3000, which is the live production port bound by nebula-nextjs.service
 * on this host. Assumes `next build` already ran (npm run ci runs build
 * before this).
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: 'line',
  use: {
    baseURL: 'http://localhost:4173',
  },
  webServer: {
    command: 'npx next start -p 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: false,
    timeout: 60_000,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } },
    { name: 'mobile', use: { ...devices['Desktop Chrome'], viewport: { width: 375, height: 812 } } },
  ],
})
