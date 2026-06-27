import { config } from '@janosh/vite-config'
import { sveltekit } from '@sveltejs/kit/vite'
import type { UserConfig } from 'vite-plus'

const options = {
  test: {
    include: [`tests/vitest/**/*.test.ts`],
    environment: `jsdom`,
    css: true,
  },

  server: {
    fs: { allow: [`..`] }, // needed to import from $root
    port: 3000,
  },

  preview: {
    port: 3000,
  },

  resolve: {
    // Vitest component tests need Svelte's browser build for mount().
    conditions: [`browser`],
  },
} satisfies UserConfig

export default {
  ...config, // shared lint/fmt/build from @janosh/vite-config (dotfiles)
  plugins: [sveltekit()],
  ...options,
}
