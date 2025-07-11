import DefaultExport, { Toc as NamedExport } from '$lib'
import Toc from '$lib/Toc.svelte'
import { expect, test } from 'vitest'

test(`src/lib/index.ts has default and named export of Toc component`, () => {
  expect(DefaultExport).toBe(Toc)
  expect(NamedExport).toBe(Toc)
})
