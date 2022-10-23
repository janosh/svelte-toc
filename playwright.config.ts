import type { PlaywrightTestConfig } from '@playwright/test'

const config: PlaywrightTestConfig = {
  webServer: {
    command: `vite dev --port 3005`,
    port: 3005,
  },
  use: {
    launchOptions: {
      slowMo: Number(process.env.SLOWMO),
    },
  },
}

export default config
