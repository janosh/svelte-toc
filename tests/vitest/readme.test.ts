import src from '$lib/Toc.svelte?raw'
import readme from '$root/readme.md?raw'
import { expect, test } from 'vitest'

// Extract prop names from Svelte 5 type definition block
const source_props = (src.match(/}: \{([\s\S]*?)\} & HTMLAttributes/)?.[1] ?? ``)
  .split(`\n`)
  .map((line) => line.match(/^\s+(\w+)\??:/)?.[1])
  .filter((x): x is string => Boolean(x))

// Extract prop names from readme (format: "1. ```ts\n   propName:")
const readme_props = readme
  .split(`\n`)
  .flatMap((line, idx, lines) =>
    line.trim() === `1. \`\`\`ts` ? (lines[idx + 1]?.match(/^\s+(\w+)/)?.[1] ?? []) : [],
  )

// Extract unique CSS variable names (null coalesce for no matches)
const extract_css_vars = (text: string) =>
  [...new Set(text.match(/var\((--toc-[\w-]+)/g) ?? [])].map((match) => match.slice(4)) // remove "var("

const source_css_vars = extract_css_vars(src)
const readme_css_vars = extract_css_vars(readme)

// Props intentionally not documented (snippets/style/class props)
const style_class_props = [
  `aside`,
  `nav`,
  `titleElement`,
  `ol`,
  `li`,
  `openButton`,
].flatMap((el) => [`${el}Style`, `${el}Class`])
const undocumented_props = new Set([
  `openTocIcon`,
  `titleSnippet`,
  `tocItem`,
  `onOpen`,
  ...style_class_props,
  `openButtonIconProps`,
])

test.each(source_props.filter((p) => !undocumented_props.has(p)))(
  `readme documents prop '%s'`,
  (prop) => {
    expect(readme_props).toContain(prop)
  },
)

test.each(readme_props)(`readme prop '%s' exists in Toc.svelte`, (prop) => {
  expect(source_props).toContain(prop)
})

test.each(source_css_vars)(`readme documents CSS var '%s'`, (css_var) => {
  expect(readme_css_vars).toContain(css_var)
})

test.each(readme_css_vars)(`CSS var '%s' exists in Toc.svelte`, (css_var) => {
  expect(source_css_vars).toContain(css_var)
})
