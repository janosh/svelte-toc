import type { PlaywrightTestConfig } from '@playwright/test'

export default {
  testDir: `./tests/playwright`,
  webServer: {
    command: `pnpm vite dev --port 3005`,
    port: 3005,
  },
} satisfies PlaywrightTestConfig
