import IndexToc from '$lib'
import Toc from '$lib/Toc.svelte'
import { expect, test } from 'vitest'

test(`src/lib/index.ts default export is Toc component`, () => {
  expect(IndexToc).toBe(Toc)
})
