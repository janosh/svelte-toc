import Toc from '$lib'
import { readFileSync } from 'fs'
import { expect, test } from 'vitest'

test(`readme documents all props`, () => {
  const readme = readFileSync(`readme.md`, `utf8`)

  const instance = new Toc({
    target: document.body,
  })

  for (const prop of Object.keys(instance.$$.props)) {
    expect(readme).to.contain(`- \`${prop}\` `)
  }
})
