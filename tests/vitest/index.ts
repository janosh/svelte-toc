import { beforeEach } from 'vitest'

beforeEach(() => {
  document.body.innerHTML = ``
  // reset window width
  globalThis.innerWidth = 1024
})

export function doc_query<T extends HTMLElement>(selector: string): T {
  const node = document.querySelector(selector)
  if (!node) throw new Error(`No element found for selector: ${selector}`)
  return node as T
}
