import adapter from '@sveltejs/adapter-static'
import { mdsvex } from 'mdsvex'
import mdsvexamples from 'mdsvexamples'
import { heading_ids } from 'svelte-multiselect/heading-anchors'
import preprocess from 'svelte-preprocess'

const { default: pkg } = await import(`./package.json`, {
  with: { type: `json` },
})
const defaults = {
  Wrapper: [`svelte-multiselect`, `CodeExample`],
  pkg: pkg.name,
  repo: pkg.repository,
}
const remarkPlugins = [[mdsvexamples, { defaults }]]

/** @type {import('@sveltejs/kit').Config} */
export default {
  extensions: [`.svelte`, `.md`],

  preprocess: [
    preprocess(),
    mdsvex({ remarkPlugins, extensions: [`.md`] }),
    heading_ids(),
  ],

  kit: {
    adapter: adapter(),

    alias: { $root: `.` },
  },
}
