import { beforeEach } from 'vitest'

beforeEach(() => {
  document.body.innerHTML = ``
  // reset window width
  globalThis.innerWidth = 1024
})

export function doc_query(selector: string): HTMLElement {
  const node = document.querySelector(selector)
  if (!(node instanceof HTMLElement)) throw new Error(`No HTMLElement found: ${selector}`)
  return node
}
