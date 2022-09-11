import { sveltekit } from '@sveltejs/kit/vite'

export default {
  plugins: [sveltekit()],

  server: {
    fs: { allow: [`..`] }, // needed to import readme.md
    port: 3000,
  },

  preview: {
    port: 3000,
  },

  test: {
    environment: `jsdom`,
  },
}
