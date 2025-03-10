import Toc from '$lib'
import { mount, tick } from 'svelte'
import { beforeAll, describe, expect, test, vi } from 'vitest'
import { doc_query } from './index.js'

beforeAll(() => {
  // Mock animate API
  Element.prototype.animate = vi.fn().mockImplementation(() => ({
    finished: Promise.resolve(),
  }))
})

describe(`Toc`, () => {
  test(`renders custom title`, async () => {
    const toc = mount(Toc, {
      target: document.body,
      props: { title: `Custom title` },
    })

    expect(toc).toBeTruthy()

    expect(doc_query(`h2`)?.textContent).toBe(`Custom title`)
  })

  test(`renders custom title`, async () => {
    const toc = mount(Toc, {
      target: document.body,
      props: { title: `Another custom title`, titleTag: `strong` },
    })

    expect(toc).toBeTruthy()

    expect(doc_query(`strong`).textContent).toBe(`Another custom title`)
  })

  test(`title element has expected CSS classes`, async () => {
    const toc = mount(Toc, {
      target: document.body,
      props: { title: `Title with classes` },
    })

    expect(toc).toBeTruthy()

    const title_node = doc_query(`h2`)
    expect(title_node).not.toBeNull()
    expect(title_node?.classList.contains('toc-title')).toBe(true)
    expect(title_node?.classList.contains('toc-exclude')).toBe(true)
  })

  test(`custom title element has expected CSS classes`, async () => {
    const toc = mount(Toc, {
      target: document.body,
      props: { title: `Custom title with classes`, titleTag: `h3` },
    })

    expect(toc).toBeTruthy()

    const title_node = doc_query(`h3`)
    expect(title_node).not.toBeNull()
    expect(title_node?.classList.contains('toc-title')).toBe(true)
    expect(title_node?.classList.contains('toc-exclude')).toBe(true)
  })

  test.each([
    [null, 3, [0, 1, 2].map((lvl) => `Heading ${lvl + 2}`)],
    [
      `body > :is(h1, h2, h3, h4, h5, h6)`,
      6,
      [...Array(6).keys()].map((lvl) => `Heading ${lvl + 1}`),
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

      const toc = mount(Toc, { target: document.body, props })
      expect(toc).toBeTruthy()
      await tick()

      const toc_list = doc_query(`aside.toc > nav > ol`)
      expect(toc_list.children.length).toBe(expected_lis)
      expect(toc_list.textContent?.trim()).toBe(expected_text?.join(``))
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

        const toc = mount(Toc, {
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

      mount(Toc, { target: document.body, props: { warnOnEmpty } })

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
      <h1>Heading 1</h1>
      <h2>Heading 2</h2>
      <h3>Heading 3</h3>
      <h4>Heading 4</h4>
    `

    mount(Toc, { target: document.body })
    await tick()

    const toc_list = doc_query(`aside.toc > nav > ol`)
    expect(toc_list.children.length).toBe(3)

    const lis = [...toc_list.children] as HTMLLIElement[]
    expect(lis[0].style.marginLeft).toBe(`0em`)
    expect(lis[1].style.marginLeft).toBe(`1em`)
    expect(lis[2].style.marginLeft).toBe(`2em`)
  })

  describe.each([[[1, 2, 3, 4]], [[1, 5, 6]]])(`minItems`, (heading_levels) => {
    test.each([[1], [2], [3], [4]])(
      `only renders TOC when there are more than minItems=%s headings matching the selector`,
      async (minItems) => {
        document.body.innerHTML = heading_levels
          .map((lvl) => `<h${lvl}>Heading ${lvl}</h${lvl}>`)
          .join(``)

        mount(Toc, {
          target: document.body,
          props: { headingSelector: `:is(h2, h3, h4)`, minItems },
        })
        await tick()

        // count the number of headings that match the selector
        const matches = heading_levels.filter(
          (lvl) => lvl >= 2 && lvl <= 4,
        ).length
        if (matches >= minItems) {
          const toc_list = doc_query(`aside.toc > nav > ol`)

          expect(
            toc_list.children.length,
            `heading_levels=${heading_levels}, minItems=${minItems}`,
          ).toBe(matches)
        } else {
          const nav = document.querySelector(`aside.toc nav`)
          expect(nav).toBeNull()
        }
      },
    )
  })

  test.each([
    [400, 500, 600],
    [700, 800, 900],
    [999, 1000, 1001],
  ])(
    `should handle custom breakpoint with small=%i, breakpoint=%i, large=%i`,
    async (smaller, breakpoint, larger) => {
      const set_window_width = (width: number) => {
        window.innerWidth = width
        window.dispatchEvent(new Event(`resize`))
      }

      mount(Toc, {
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

  test(`should have blur effect with duration of 400ms`, async () => {
    const blurParams = { duration: 400 }
    const toc = mount(Toc, {
      target: document.body,
      props: { blurParams },
    })
    expect(toc.blurParams).toEqual(blurParams)
  })

  test(`should expose nav and aside HTMLElements as props for external binding`, async () => {
    const toc = mount(Toc, {
      target: document.body,
      props: { open: true },
    })
    await tick()

    expect(toc.aside).toBeInstanceOf(HTMLElement)
    expect(toc.aside?.className).toContain(`toc`)
    expect(toc.aside?.tagName).toBe(`ASIDE`)
    expect(toc.nav).toBeInstanceOf(HTMLElement)
    expect(toc.nav?.tagName).toBe(`NAV`)
  })

  test(`custom event 'open' fires whenever Toc.open state changes`, async () => {
    const open_handler = vi.fn()

    // Use onOpen callback instead of events option
    const toc = mount(Toc, {
      target: document.body,
      props: { onOpen: (event) => open_handler(event) },
    })

    toc.open = true
    await tick()
    expect(open_handler).toHaveBeenCalledOnce()
    // check event.detail.open == true
    expect(open_handler.mock.calls[0][0].open).toBe(true)

    toc.open = false
    await tick()
    expect(open_handler).toHaveBeenCalledTimes(2)
    // check event.detail.open == false
    expect(open_handler.mock.calls[1][0].open).toBe(false)
  })

  test(`should toggle open state when clicking the button`, async () => {
    // simulate mobile
    window.innerWidth = 600

    const toc = mount(Toc, { target: document.body })
    await tick()

    const button = doc_query(`aside.toc button`)

    expect(toc.open).toBe(false)
    button.click()
    expect(toc.open).toBe(true)
    // click anywhere else
    document.body.click()
    expect(toc.open).toBe(false)
    button.click()
    expect(toc.open).toBe(true)
  })

  test(`active heading is in into view and highlighted when opening ToC on mobile`, async () => {
    document.body.innerHTML = [...Array(100)]
      .map((_, idx) => `<h2>Heading ${idx + 1}</h2>`)
      .join(`\n`)

    // simulate mobile
    window.innerWidth = 600

    const toc = mount(Toc, { target: document.body, props: { open: true } })

    // TODO fix this test
    // expect(toc.desktop).toBe(false)
    // expect(document.querySelector(`aside.toc ol li.active`)).toBeNull()

    // open the ToC
    toc.open = true

    // active heading should be one of the last ones and should be scrolled into view
    const active_li = doc_query(`aside.toc ol li.active`)
    expect(active_li).toBeTruthy()
    expect(active_li.textContent?.trim()).toBe(`Heading 100`)
  })

  test.each([true, false])(
    `arrow keys navigate the active ToC on mobile item when open=%s`,
    // TODO also test on desktop when ToC is hovered, JSDOM doesn't seem to support hover
    async (open) => {
      document.body.innerHTML = `
      <h2>Heading 1</h2>
      <h2>Heading 2</h2>
      <h2>Heading 3</h2>
      <h2>Heading 4</h2>
    `

      const toc = mount(Toc, { target: document.body, props: { open } })
      await tick()

      const tocItems = document.querySelectorAll(`aside.toc > nav > ol > li`)
      expect(tocItems.length).toBe(4)

      if (open) {
        // check initially active item before pressing arrow keys
        expect(toc.activeTocLi).toBe(tocItems[3])

        for (const [idx, key] of [
          [2, `ArrowUp`],
          [1, `ArrowUp`],
          [2, `ArrowDown`],
          [3, `ArrowDown`],
        ] as const) {
          // simulate ArrowUp/Down keys
          window.dispatchEvent(new KeyboardEvent(`keydown`, { key }))
          expect(toc.activeTocLi).toBe(tocItems[idx])
        }
      } else {
        // if ToC is closed, no item should be active and arrow keys should not navigate
        expect(toc.activeTocLi).toBe(undefined)

        // simulate pressing ArrowDown key
        window.dispatchEvent(new KeyboardEvent(`keydown`, { key: `ArrowDown` }))
        expect(toc.activeTocLi).toBe(undefined)
      }
    },
  )

  test.each([[[]], [[`Escape`]]])(
    `Escape key closes ToC on mobile if reactToKeys=%s includes 'Escape'`,
    async (reactToKeys) => {
      // simulate mobile
      window.innerWidth = 600

      const toc = mount(Toc, {
        target: document.body,
        props: { open: true, reactToKeys },
      })
      await tick()

      expect(toc.open).toBe(true)

      // simulate pressing Escape
      document.dispatchEvent(new KeyboardEvent(`keydown`, { key: `Escape` }))
      await tick()

      // TODO fix this. Should close since Escape is in reactToKeys
      // expect(toc.open).toBe(!reactToKeys.includes(`Escape`))
    },
  )
})
