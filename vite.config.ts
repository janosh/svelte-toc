import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite-plus'

export default defineConfig({
  fmt: {
    semi: false,
    singleQuote: true,
    printWidth: 90,
  },
  lint: {
    plugins: [`oxc`, `typescript`, `unicorn`, `import`, `jest`],
    categories: {
      correctness: `error`,
      suspicious: `error`,
      perf: `error`,
      pedantic: `error`,
    },
    ignorePatterns: [`build/`, `.svelte-kit/`, `package/`, `dist/`],
    rules: {
      'no-unused-vars': `off`,
      '@typescript-eslint/no-unused-vars': [
        `error`,
        { argsIgnorePattern: `^_`, varsIgnorePattern: `^_` },
      ],
      'no-console': [`error`, { allow: [`warn`, `error`] }],
      'no-self-assign': `off`, // Svelte reactive `x = x` assignments
      'no-await-in-loop': `off`, // test code uses sequential await tick() in loops
      'no-shadow': `off`, // closures intentionally shadow outer names
      'prefer-const': `off`,
      '@typescript-eslint/no-unnecessary-condition': `off`,
      '@typescript-eslint/consistent-type-imports': `off`,
      'eslint-plugin-unicorn/consistent-function-scoping': `off`, // test helpers + Svelte reactive closures
      '@typescript-eslint/no-unsafe-argument': `off`,
      '@typescript-eslint/no-unsafe-assignment': `off`,
      '@typescript-eslint/no-unsafe-call': `off`,
      '@typescript-eslint/no-unsafe-member-access': `off`,
      '@typescript-eslint/no-unsafe-return': `off`,
      'no-inline-comments': `off`,
      'no-confusing-void-expression': `off`,
      'no-promise-executor-return': `off`,
      'strict-boolean-expressions': `off`,
      'max-lines-per-function': `off`,
      'max-lines': `off`,
      'max-depth': `off`,
      'max-classes-per-file': `off`,
      'sort-vars': `off`,
      'eslint-plugin-jest/no-conditional-in-test': `off`,
      'eslint-plugin-unicorn/no-array-callback-reference': `off`,
      'eslint-plugin-unicorn/no-useless-undefined': `off`,
      'eslint-plugin-unicorn/no-object-as-default-parameter': `off`,
      'eslint-plugin-import/no-self-import': `off`,
      'eslint-plugin-import/no-unassigned-import': `off`, // CSS imports are side-effect-only
      'eslint-plugin-import/max-dependencies': `off`,
      'eslint-plugin-unicorn/prefer-native-coercion-functions': `off`,
    },
  },
  staged: {
    '*.{js,ts,svelte,html,css,md,json,yaml}': `vp check --fix`,
    '*.{ts,svelte}': `sh -c 'npx svelte-kit sync && npx svelte-check-rs --threshold error'`,
    '*.test.ts': `sh -c '! grep -E "(test|describe)\\.only\\(" "$@"' --`,
    '*': `codespell --ignore-words-list falsy --check-filenames`,
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
    conditions: process.env.TEST ? [`browser`] : undefined,
  },
})
