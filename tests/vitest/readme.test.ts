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

// Extract each CSS variable's first occurrence together with its fallback value, so the
// readme is checked to document the actual defaults rather than just the variable names.
// The inner alternation allows one nesting level, e.g. var(--toc-x, calc(2 * var(--toc-y))).
const css_var_regex =
  /var\(\s*(?<css_var>--toc-[\w-]+)\s*(?:,\s*(?<fallback>(?:[^()]|\([^()]*\))*?)\s*)?\)/g

const extract_css_vars = (text: string): Map<string, string | null> => {
  const css_vars = new Map<string, string | null>()
  for (const { groups } of text.matchAll(css_var_regex)) {
    const css_var = groups?.css_var
    if (css_var && !css_vars.has(css_var)) css_vars.set(css_var, groups?.fallback ?? null)
  }
  return css_vars
}

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

test.each([...source_css_vars])(
  `readme documents CSS var '%s' with its source default`,
  (css_var, fallback) => {
    expect(readme_css_vars.has(css_var)).toBe(true)
    expect(readme_css_vars.get(css_var)).toBe(fallback)
  },
)

test.each([...readme_css_vars.keys()])(`CSS var '%s' exists in Toc.svelte`, (css_var) => {
  expect(source_css_vars.has(css_var)).toBe(true)
})

test(`blurParams=null is documented and maps to zero-duration blur`, () => {
  expect(readme).toContain(`blurParams: BlurParams | null | undefined`)
  expect(src).toContain(
    `transition:blur={blurParams === null ? { duration: 0 } : blurParams}`,
  )
})
