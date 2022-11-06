import Toc from '$lib'
import { beforeEach, describe, expect, test } from 'vitest'

beforeEach(() => {
  document.body.innerHTML = ``
})

function sleep(ms: number = 1) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

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

  test.each([
    [null, 3, [...Array(3).keys()].map((idx) => `Heading ${idx + 2}`)],
    [
      `body > :is(h1, h2, h3, h4, h5, h6)`,
      6,
      [...Array(6).keys()].map((idx) => `Heading ${idx + 1}`),
    ],
    [`h1:not(.toc-exclude)`, 0, []],
  ])(
    `ToC lists expected headings for headingSelector='%s'`,
    async (headingSelector, expected_lis, expected_text) => {
      document.body.innerHTML = `
      <h1 class="toc-exclude">Heading 1</h1>
      <h2>Heading 2</h2>
      <h3>Heading 3</h3>
      <h4>Heading 4</h4>
      <h5>Heading 5</h5>
      <h6>Heading 6</h6>
    `
      let props = {}
      if (headingSelector) props = { headingSelector }

      const toc = new Toc({ target: document.body, props })
      expect(toc).toBeTruthy()
      await sleep()

      const toc_ul = document.querySelector(`aside.toc ul`)
      expect(toc_ul?.children.length).toBe(expected_lis)
      expect(toc_ul?.textContent?.trim()).toBe(expected_text.join(` `))
    }
  )
})
