import type { Config } from '@sveltejs/kit'
import adapter from '@sveltejs/adapter-static'
import { mdsvex } from 'mdsvex'
import pkg from './package.json' with { type: 'json' }
import { heading_ids } from 'svelte-multiselect/heading-anchors'
import {
  mdsvex_transform,
  starry_night_highlighter as highlighter,
} from 'svelte-multiselect/live-examples'

if (!pkg.repository) throw new Error(`package.json missing "repository" field`)

const defaults = {
  Wrapper: [`svelte-multiselect`, `CodeExample`],
  repo: pkg.repository,
  hideStyle: true,
}
const remarkPlugins = [[mdsvex_transform, { defaults }]]

export default {
  extensions: [`.svelte`, `.md`],

  preprocess: [
    mdsvex({
      remarkPlugins,
      extensions: [`.md`],
      highlight: { highlighter },
    }),
    heading_ids(),
  ],

  kit: {
    adapter: adapter(),
    alias: { $root: `.` },
  },
} satisfies Config
