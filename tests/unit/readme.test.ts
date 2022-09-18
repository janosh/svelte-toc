import { readFileSync } from 'fs'
import { describe, expect, test } from 'vitest'

const readme = readFileSync(`readme.md`, `utf8`)
const toc_src = readFileSync(`src/lib/Toc.svelte`, `utf8`)

describe(`readme`, () => {
  test(`readme documents all props and their correct types and defaults`, () => {
    for (let line of toc_src.split(`\n`)) {
      if (line.trim().startsWith(`export let `)) {
        line = line.replace(`export let `, ``).trim()
        line = `1. \`\`\`ts\n   ${line}`

        expect(readme, `${line} not in readme.md`).to.contain(line)
      }
    }
  })

  test(`documents all CSS variables`, () => {
    for (let line of toc_src.split(`\n`)) {
      if (line.includes(`var(--`)) {
        line = line.trim().replace(`;`, ``)
        line = `- \`${line}\``
        expect(readme, `${line} not in readme.md`).to.contain(line)
      }
    }
  })

  test(`documents no non-existent CSS variables`, () => {
    for (let line of readme.split(`\n`)) {
      if (line.includes(`: var(--`)) {
        line = line.split(`:`)[0].split(`- \``)[1]
        expect(toc_src, `${line} not in Toc.svelte`).to.contain(line)
      }
    }
  })
})
