import { config } from '@janosh/vite-config'
import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite-plus'

export default defineConfig({
  ...config, // shared lint/fmt/build from @janosh/vite-config (dotfiles)
  staged: {
    '*.{js,ts,svelte,html,css,md,json,yaml}': `vp check --fix`,
    '*.{ts,svelte}': `sh -c 'npx svelte-kit sync && npx svelte-check --threshold error'`,
  },
  plugins: [sveltekit()],

  test: {
    include: [`tests/vitest/**/*.test.ts`],
    environment: `jsdom`,
    css: true,
    coverage: {
      reporter: [`text`, `json-summary`],
    },
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
})
