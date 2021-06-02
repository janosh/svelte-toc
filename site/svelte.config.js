import adapter from '@sveltejs/adapter-static'
import { mdsvex } from 'mdsvex'
import headingSlugs from 'rehype-slug'
import linkHeadings from 'rehype-autolink-headings'

export default {
  extensions: [`.svelte`, `.svx`],
  preprocess: mdsvex({
    rehypePlugins: [headingSlugs, [linkHeadings, { behavior: `append` }]],
  }),
  kit: {
    adapter: adapter(),

    // hydrate the <body> element in src/app.html
    target: `body`,
  },
}
