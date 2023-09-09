import Toc from '$lib'
import { tick } from 'svelte'
import { describe, expect, test, vi } from 'vitest'
import { doc_query } from '.'

describe(`Toc`, () => {
  test(`renders custom title`, async () => {
    const toc = new Toc({
      target: document.body,
      props: { title: `Custom title` },
    })

    expect(toc).toBeTruthy()

    expect(doc_query(`h2`)?.textContent).toBe(`Custom title`)
  })

  test(`renders custom title`, async () => {
    const toc = new Toc({
      target: document.body,
      props: { title: `Another custom title`, titleTag: `strong` },
    })

    expect(toc).toBeTruthy()

    expect(doc_query(`strong`).textContent).toBe(`Another custom title`)
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
      await tick()

      const toc_ul = doc_query(`aside.toc ol`)
      expect(toc_ul.children.length).toBe(expected_lis)
      expect(toc_ul.textContent?.trim()).toBe(expected_text?.join(` `))
    },
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
        await tick()

        const node = doc_query(`aside.toc`)
        expect(node).toBeInstanceOf(HTMLElement)
        if (autoHide) {
          expect(node.getAttribute(`aria-hidden`)).toBe(`true`)
          expect(node.className).toContain(`hidden`)
          expect(node.getAttribute(`hidden`)).toBe(``)
        } else {
          expect(node.className).not.toContain(`hidden`)
          expect(node.getAttribute(`aria-hidden`)).toBe(`false`)
          expect(node.getAttribute(`hidden`)).toBe(null)
        }
      },
    )
  })

  test.each([true, false])(
    `console.warns if empty (i.e. no headings found) and warnOnEmpty=%s`,
    async (warnOnEmpty) => {
      console.warn = vi.fn()

      new Toc({ target: document.body, props: { warnOnEmpty } })

      if (warnOnEmpty) {
        await tick() // don't move this sleep() outside, seems to cause console.calls
        //  to pollute the other test if applied to warnOnEmpty=false
        const msg = `svelte-toc found no headings for headingSelector=':is(h2, h3, h4):not(.toc-exclude)'. Hiding table of contents.`
        expect(console.warn).toHaveBeenCalledWith(msg)
      } else {
        expect(console.warn).not.toHaveBeenCalled()
      }
    },
  )

  test(`subheadings are indented`, async () => {
    document.body.innerHTML = `
      <main>
        <h1>Heading 1</h1>
        <h2>Heading 2</h2>
        <h3>Heading 3</h3>
        <h4>Heading 4</h4>
      </main>
    `

    new Toc({ target: document.body })
    await tick()

    const toc_ul = doc_query(`aside.toc > nav > ol`)
    expect(toc_ul.children.length).toBe(3)

    const lis = [...toc_ul.children] as HTMLLIElement[]
    expect(lis[0].style.marginLeft).toBe(`0em`)
    expect(lis[1].style.marginLeft).toBe(`1em`)
    expect(lis[2].style.marginLeft).toBe(`2em`)
  })

  describe.each([
    [
      [1, 2, 3, 4],
      [1, 5, 6],
    ],
  ])(`minItems`, (headings) => {
    test.each([[1], [2], [3], [4]])(
      `only renders TOC when there are more than minItems headings matching the selector`,
      async (minItems) => {
        document.body.innerHTML = headings
          .map((h) => `<h${h}>Heading ${h}</h${h}>`)
          .join(``)

        new Toc({
          target: document.body,
          props: { headingSelector: `:is(h2, h3, h4)`, minItems },
        })
        await tick()

        // count the number of headings that match the selector
        const matches = headings.filter((h) => h >= 2 && h <= 4).length
        if (matches >= minItems) {
          const toc_ul = doc_query(`aside.toc ol`)
          expect(
            toc_ul.children.length,
            `headings=${headings}, minItems=${minItems}`,
          ).toBe(matches)
        } else {
          const nav = document.querySelector(`aside.toc nav`)
          expect(nav).toBeNull()
        }
      },
    )
  })
})

test.each([
  [400, 500, 600],
  [700, 800, 900],
  [999, 1000, 1001],
])(
  `ToC should handle custom breakpoint with small=%i, breakpoint=%i, large=%i`,
  async (smaller, breakpoint, larger) => {
    const set_window_width = (width: number) => {
      window.innerWidth = width
      window.dispatchEvent(new Event(`resize`))
    }

    new Toc({
      target: document.body,
      props: { breakpoint },
    })

    set_window_width(larger)
    await tick()

    const node = doc_query(`aside.toc`)
    expect(node.className).toContain(`desktop`)
    expect(node.className).not.toContain(`mobile`)

    set_window_width(smaller)
    await tick()

    expect(node.className).not.toContain(`desktop`)
    expect(node.className).toContain(`mobile`)
  },
)
