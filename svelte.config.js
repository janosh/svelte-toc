import adapter from '@sveltejs/adapter-static'
import { mdsvex } from 'mdsvex'
import { heading_ids } from 'svelte-multiselect/heading-anchors'
import {
  mdsvex_transform,
  starry_night_highlighter,
  sveltePreprocess,
} from 'svelte-multiselect/live-examples'

const { default: pkg } = await import(`./package.json`, {
  with: { type: `json` },
})
const defaults = {
  Wrapper: [`svelte-multiselect`, `CodeExample`],
  repo: pkg.repository,
  hideStyle: true,
}
const remarkPlugins = [[mdsvex_transform, { defaults }]]

/** @type {import('@sveltejs/kit').Config} */
export default {
  extensions: [`.svelte`, `.md`],

  preprocess: [
    sveltePreprocess(),
    mdsvex({
      remarkPlugins,
      extensions: [`.md`],
      highlight: { highlighter: starry_night_highlighter },
    }),
    heading_ids(),
  ],

  kit: {
    adapter: adapter(),

    alias: { $root: `.` },
  },
}
