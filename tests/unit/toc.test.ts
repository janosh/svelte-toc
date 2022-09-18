import Toc from '$lib'
import { beforeEach, describe, expect, test } from 'vitest'

beforeEach(() => {
  document.body.innerHTML = ``
})

describe(`Toc`, () => {
  test(`renders custom title`, async () => {
    const toc = new Toc({
      target: document.body,
      props: { title: `Custom title` },
    })

    expect(toc).toBeTruthy()

    expect(document.querySelector(`h2`)?.textContent).toBe(`Custom title`)
  })

  test(`renders custom title`, async () => {
    const toc = new Toc({
      target: document.body,
      props: { title: `Another custom title`, titleTag: `strong` },
    })

    expect(toc).toBeTruthy()

    expect(document.querySelector(`strong`)?.textContent).toBe(
      `Another custom title`
    )
  })
})
