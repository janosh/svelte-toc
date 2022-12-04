import Toc from '$lib'
import { beforeEach, describe, expect, test, vi } from 'vitest'

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
      expect(toc_ul?.textContent?.trim()).toBe(expected_text?.join(` `))
    }
  )

  describe.each([true, false])(`with autoHide=%s`, (autoHide) => {
    // all these selectors should have no matches
    test.each([undefined, `foobar`, `h2:not(.toc-exclude)`, `h4`])(
      `ToC is hidden if no headings match selector '%s'`,
      async (headingSelector) => {
        document.body.innerHTML = `
      <h1>Heading 1</h1>
      <h2 class="toc-exclude">Heading 2</h2>
      <h5>Heading 5</h5>
      <h6>Heading 6</h6>
    `

        const toc = new Toc({
          target: document.body,
          props: { headingSelector, autoHide },
        })
        expect(toc).toBeTruthy()
        await sleep()

        const node = document.querySelector(`aside.toc`)
        expect(node).toBeInstanceOf(HTMLElement)
        if (autoHide) {
          expect(node?.getAttribute(`aria-hidden`)).toBe(`true`)
          expect(node?.className).toContain(`hidden`)
          expect(node?.getAttribute(`hidden`)).toBe(``)
        } else {
          expect(node?.className).not.toContain(`hidden`)
          expect(node?.getAttribute(`aria-hidden`)).toBe(`false`)
          expect(node?.getAttribute(`hidden`)).toBe(null)
        }
      }
    )
  })

  test.each([true, false])(
    `console.warns if empty and warnOnEmpty=%s`,
    async (warnOnEmpty) => {
      console.warn = vi.fn()

      new Toc({ target: document.body, props: { warnOnEmpty } })

      if (warnOnEmpty) {
        await sleep() // don't move this sleep() outside, seems to cause console.calls
        //  to pollute the other test if applied to warnOnEmpty=false
        const msg = `svelte-toc found no headings for headingSelector=':is(h2, h3, h4):not(.toc-exclude)'. Hiding table of contents.`
        expect(console.warn).toHaveBeenCalledWith(msg)
      } else {
        expect(console.warn).not.toHaveBeenCalled()
      }
    }
  )
})
