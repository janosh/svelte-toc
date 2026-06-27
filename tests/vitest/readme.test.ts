import src from '$lib/Toc.svelte?raw'
import readme from '$root/readme.md?raw'
import { expect, test } from 'vitest'

const props_block_regex = /}: \{(?<props>[\s\S]*?)\}\s*(?:&\s*[^\n=]+)? = \$props\(\)/
const prop_type_line_regex = /^\s+(?<prop>\w+)\??:/
const readme_prop_line_regex = /^\s+(?<prop>\w+)/

// Extract prop names from Svelte 5 type definition block
const source_props = (props_block_regex.exec(src)?.groups?.props ?? ``)
  .split(`\n`)
  .map((line) => prop_type_line_regex.exec(line)?.groups?.prop)
  .filter((prop) => prop !== undefined)

// Extract prop names from readme (format: "1. ```ts\n   propName:")
const readme_props = readme.split(`\n`).flatMap((line, idx, lines) => {
  if (line.trim() !== `1. \`\`\`ts`) return []
  const prop = readme_prop_line_regex.exec(lines[idx + 1] ?? ``)?.groups?.prop
  return prop === undefined ? [] : [prop]
})

// Extract unique CSS variable names (null coalesce for no matches)
const extract_css_vars = (text: string) => [
  ...new Set(
    [...text.matchAll(/var\((?<css_var>--toc-[\w-]+)/g)].flatMap((match) => {
      const css_var = match.groups?.css_var
      return css_var ? [css_var] : []
    }),
  ),
]

const source_css_vars = extract_css_vars(src)
const readme_css_vars = extract_css_vars(readme)

// Props documented outside the numbered props list.
const separately_documented_props = new Set([
  `openTocIcon`,
  `titleSnippet`,
  `tocItem`,
  `openButtonIconProps`,
])

test.each(source_props.filter((p) => !separately_documented_props.has(p)))(
  `readme documents prop '%s'`,
  (prop) => {
    expect(readme_props).toContain(prop)
  },
)

test.each(readme_props)(`readme prop '%s' exists in Toc.svelte`, (prop) => {
  expect(source_props).toContain(prop)
})

test.each([
  [`asideProps`, `SvelteHTMLElements[\`aside\`]`],
  [`navProps`, `SvelteHTMLElements[\`nav\`]`],
  [`titleProps`, `SvelteHTMLElements[\`h2\`]`],
  [`olProps`, `SvelteHTMLElements[\`ol\`]`],
  [`liProps`, `SvelteHTMLElements[\`li\`]`],
  [`openButtonProps`, `SvelteHTMLElements[\`button\`]`],
])(`types prop bag '%s' with tag-specific Svelte attributes`, (prop, expected_type) => {
  expect(src).toContain(`${prop}?: ${expected_type}`)
  expect(readme).toContain(`${prop}: ${expected_type} = {}`)
})

test.each(source_css_vars)(`readme documents CSS var '%s'`, (css_var) => {
  expect(readme_css_vars).toContain(css_var)
})

test.each(readme_css_vars)(`CSS var '%s' exists in Toc.svelte`, (css_var) => {
  expect(source_css_vars).toContain(css_var)
})

test(`blurParams=null is documented and maps to zero-duration blur`, () => {
  expect(readme).toContain(`blurParams: BlurParams | null | undefined`)
  expect(src).toContain(
    `transition:blur={blurParams === null ? { duration: 0 } : blurParams}`,
  )
})
