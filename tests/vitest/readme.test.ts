import src from '$lib/Toc.svelte?raw'
import readme from '$root/readme.md?raw'
import { expect, test } from 'vitest'

// Extract prop names from Svelte 5 type definition block
const source_props = (src.match(/}: \{([\s\S]*?)\} & HTMLAttributes/)?.[1] ?? ``)
  .split(`\n`)
  .map((line) => line.match(/^\s+(\w+)\??:/)?.[1])
  .filter(Boolean) as string[]

// Extract prop names from readme (format: "1. ```ts\n   propName:")
const readme_props = readme.split(`\n`).flatMap((line, idx, lines) =>
  line.trim() === `1. \`\`\`ts` ? lines[idx + 1]?.match(/^\s+(\w+)/)?.[1] ?? [] : []
)

// Extract unique CSS variable names (null coalesce for no matches)
const extract_css_vars = (text: string) =>
  [...new Set(text.match(/var\((--toc-[\w-]+)/g) ?? [])]
    .map((match) => match.slice(4)) // remove "var("

const source_css_vars = extract_css_vars(src)
const readme_css_vars = extract_css_vars(readme)

// Props intentionally not documented (snippets/style/class props)
const style_class_props = [`aside`, `nav`, `titleElement`, `ol`, `li`, `openButton`]
  .flatMap((el) => [`${el}Style`, `${el}Class`])
const undocumented_props = new Set([
  `openTocIcon`,
  `titleSnippet`,
  `tocItem`,
  `onOpen`,
  ...style_class_props,
  `openButtonIconProps`,
])

test(`readme documents all props`, () => {
  for (const prop of source_props.filter((p) => !undocumented_props.has(p))) {
    expect(readme_props, `Toc.svelte prop '${prop}' not in readme`).toContain(prop)
  }
})

test(`readme documents no non-existent props`, () => {
  for (const prop of readme_props) {
    expect(source_props, `readme prop '${prop}' not in Toc.svelte`).toContain(prop)
  }
})

test(`readme documents all CSS variables`, () => {
  for (const css_var of source_css_vars) {
    expect(readme_css_vars, `Toc.svelte CSS var '${css_var}' not in readme`).toContain(
      css_var,
    )
  }
})

test(`readme documents no non-existent CSS variables`, () => {
  for (const css_var of readme_css_vars) {
    expect(source_css_vars, `readme CSS var '${css_var}' not in Toc.svelte`).toContain(
      css_var,
    )
  }
})
