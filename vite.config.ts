import { config } from '@janosh/vite-config'
import { sveltekit } from '@sveltejs/kit/vite'
import type { UserConfig } from 'vite-plus'

const options = {
  test: {
    include: [`tests/vitest/**/*.test.ts`],
    environment: `jsdom`,
    css: true,
    coverage: { include: [`src/lib/*`] },
  },

  server: {
    fs: { allow: [`..`] }, // needed to import from $root
    port: 3000,
  },

  resolve: {
    // Vitest component tests need Svelte's browser build for mount().
    conditions: [`browser`],
  },

  // the shared config's pre-commit hook runs svelte-check-rs, which this repo doesn't
  // install and whose @typescript/native-preview peer is absent. use svelte-check, the
  // same checker .github/workflows/lint.yml runs.
  staged: {
    '*.{js,ts,svelte,html,css,scss,less,md,json,yaml,graphql,gql}': `vp check --fix`,
    '*.{ts,svelte}': `sh -c 'npx svelte-kit sync && npx svelte-check --threshold error'`,
  },
} satisfies UserConfig

export default {
  ...config, // shared lint/fmt/build from @janosh/vite-config (dotfiles)
  plugins: [sveltekit()],
  ...options,
}
