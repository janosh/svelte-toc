import { sveltekit } from '@sveltejs/kit/vite'
import mdsvexamples from 'mdsvexamples/vite'
import { defineConfig } from 'vitest/config'

export default defineConfig(({ mode }) => ({
  plugins: [sveltekit(), mdsvexamples],

  test: {
    environment: `jsdom`,
    css: true,
    include: [`tests/vitest/**/*.test.ts`],
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
    conditions: mode === `test` ? [`browser`] : undefined,
  },
}))
