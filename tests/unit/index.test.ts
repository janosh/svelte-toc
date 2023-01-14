import IndexToc, { Toc as NamedToc } from '$lib'
import Toc from '$lib/Toc.svelte'
import { expect, test } from 'vitest'

test(`src/lib/index.ts has default and named export of Toc component`, () => {
  expect(IndexToc).toBe(Toc)
  expect(NamedToc).toBe(Toc)
})
