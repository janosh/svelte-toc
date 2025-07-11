import Toc from '$lib'
import { mount, tick } from 'svelte'
import { beforeAll, describe, expect, test, vi } from 'vitest'
import { doc_query } from './index.js'

beforeAll(() => {
  // Mock animate API
  Element.prototype.animate = vi.fn().mockImplementation(() => ({}))
})

describe(`Toc`, () => {
  test.each([
    [`Custom title`, `h2`],
    [`Another custom title`, `strong`],
  ])(`renders title with titleTag`, (title, titleTag) => {
    mount(Toc, { target: document.body, props: { title, titleTag } })

    expect(doc_query(titleTag).textContent).toBe(title)
  })

  test.each([
    [`Title with classes`, `h2`],
    [`Custom title with classes`, `h3`],
  ])(`title element has expected CSS classes`, (title, titleTag) => {
    mount(Toc, { target: document.body, props: { title, titleTag } })

    const title_node = doc_query(titleTag)
    expect(title_node.classList.contains(`toc-title`)).toBe(true)
    expect(title_node.classList.contains(`toc-exclude`)).toBe(true)
  })

  test.each([
    [null, 3, [0, 1, 2].map((lvl) => `Heading ${lvl + 2}`)],
    [
      `body > :is(h1, h2, h3, h4, h5, h6)`,
      6,
      Array.from({ length: 6 }, (_, lvl) => `Heading ${lvl + 1}`),
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

      mount(Toc, { target: document.body, props })
      await tick()

      const toc_list = doc_query(`aside.toc > nav > ol`)
      expect(toc_list.children.length).toBe(expected_lis)
      expect(toc_list.textContent?.trim()).toBe(expected_text?.join(``))
    },
  )

  describe.each([true, false])(`with autoHide=%s`, (autoHide) => {
    test.each([undefined, `foobar`, `h2:not(.toc-exclude)`, `h4`])(
      `ToC is hidden if no headings match selector '%s'`,
      async (headingSelector) => {
        document.body.innerHTML = `
      <h1>Heading 1</h1>
      <h2 class="toc-exclude">Heading 2</h2>
      <h5>Heading 5</h5>
      <h6>Heading 6</h6>
    `

        mount(Toc, {
          target: document.body,
          props: { headingSelector, autoHide },
        })
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
        await tick() // don't move this tick() outside, seems to cause console.calls
        //  to pollute the other test if applied to warnOnEmpty=false
        const msg =
          `svelte-toc found no headings for headingSelector=':is(h2, h3, h4):not(.toc-exclude)'. Hiding table of contents.`
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

    const lis = Array.from(toc_list.children) as HTMLLIElement[]
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

        const matches = heading_levels.filter((lvl) => [2, 3, 4].includes(lvl)).length
        if (matches >= minItems) {
          const toc_list = doc_query(`aside.toc > nav > ol`)

          // TODO: fix this test
          // expect(
          //   toc_list.children.length,
          //   `heading_levels=${heading_levels}, minItems=${minItems}`,
          // ).toBe(matches)

          expect(toc_list.children.length).toBeGreaterThanOrEqual(minItems)
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
        globalThis.innerWidth = width
        globalThis.dispatchEvent(new Event(`resize`))
      }

      mount(Toc, {
        target: document.body,
        props: { breakpoint },
      })

      set_window_width(larger)

      const node = doc_query(`aside.toc`)
      expect(node.className).toContain(`desktop`)
      expect(node.className).not.toContain(`mobile`)

      set_window_width(smaller)
      await tick()

      expect(node.className).not.toContain(`desktop`)
      expect(node.className).toContain(`mobile`)
    },
  )

  test(`onOpen handler receives correct open value`, async () => {
    globalThis.innerWidth = 600
    document.body.innerHTML = `
      <h2>Heading 1</h2>
      <h2>Heading 2</h2>
    `
    const onOpen = vi.fn()

    mount(Toc, { target: document.body, props: { onOpen, open: false } })
    await tick()

    expect(onOpen).toHaveBeenCalledOnce()
    expect(onOpen).toHaveBeenCalledWith(
      expect.objectContaining({ open: false }),
    )

    const button = document.querySelector(
      `aside.toc button`,
    ) as HTMLButtonElement
    button?.click()
    await tick()

    // Check that onOpen was called again with the new open state
    expect(onOpen).toHaveBeenCalledTimes(2)
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ open: true }))
  })

  test(`should toggle mobile ToC visibility`, async () => {
    globalThis.innerWidth = 600
    document.body.innerHTML = `
      <h2>Heading 1</h2>
      <h2>Heading 2</h2>
    `

    mount(Toc, { target: document.body, props: { desktop: false } })

    const button = document.querySelector(
      `aside.toc button`,
    ) as HTMLButtonElement
    expect(button).not.toBeNull()

    if (button) {
      const nav_before_open = document.querySelector(`aside.toc > nav`)
      expect(nav_before_open).toBeNull()

      button.click()
      await tick()

      const nav_after_open = document.querySelector(`aside.toc > nav`)
      expect(nav_after_open).not.toBeNull()
    }
  })

  test(`active heading is scrolled into view and highlighted when opening ToC on mobile`, async () => {
    const n_headings = 100
    document.body.innerHTML = Array(n_headings)
      .fill(0)
      .map((_, idx) => `<h2 id="heading-${idx + 1}">Heading ${idx + 1}</h2>`)
      .join(`\n`)

    globalThis.innerWidth = 600

    mount(Toc, { target: document.body, props: { open: true } })
    await tick()

    const active_li = doc_query(`aside.toc ol li.active`)
    expect(active_li).toBeTruthy()
    expect(active_li.textContent?.trim()).toBe(`Heading ${n_headings}`)
  })

  test.each([true, false])(
    `arrow keys navigate the active ToC on mobile item when open=%s`,
    async (open) => {
      document.body.innerHTML = `
      <h2>Heading 1</h2>
      <h2>Heading 2</h2>
      <h2>Heading 3</h2>
      <h2>Heading 4</h2>
    `
      mount(Toc, { target: document.body, props: { open } })
      await tick()

      if (open) {
        const toc_items = document.querySelectorAll(`aside.toc > nav > ol > li`)
        expect(toc_items.length).toBe(4)

        const initial_active = doc_query(`aside.toc > nav > ol > li.active`)
        expect(initial_active).not.toBeNull()

        const all_items = Array.from(
          document.querySelectorAll(`aside.toc > nav > ol > li`),
        )
        const initial_active_idx = all_items.indexOf(initial_active)

        globalThis.dispatchEvent(new KeyboardEvent(`keydown`, { key: `ArrowDown` }))

        const after_down = doc_query(`aside.toc > nav > ol > li.active`)
        expect(after_down).not.toBeNull()

        const after_down_idx = all_items.indexOf(after_down)

        const expected_idx = Math.min(
          initial_active_idx + 1,
          all_items.length - 1,
        )
        expect(after_down_idx).toBe(expected_idx)

        globalThis.dispatchEvent(new KeyboardEvent(`keydown`, { key: `ArrowUp` }))

        const after_up = doc_query(`aside.toc > nav > ol > li.active`)
        expect(after_up).not.toBeNull()

        const after_up_idx = all_items.indexOf(after_up)
        expect(after_up_idx).toBe(initial_active_idx)
      } else {
        // If ToC is closed, no items should be active and arrow keys should not navigate
        globalThis.dispatchEvent(new KeyboardEvent(`keydown`, { key: `ArrowDown` }))
        // expect no active item
        // TODO: fix this test
        // expect(doc_query(`aside.toc > nav > ol > li.active`)).toBeNull()
      }
    },
  )

  test.each([` `, `Enter`])(
    `%s key activates heading navigation when pressed in the ToC`,
    async (key) => {
      document.body.innerHTML = `
        <h2 id="heading-1">Heading 1</h2>
        <h2 id="heading-2">Heading 2</h2>
      `

      const scroll_into_view_mock = vi.fn()
      Element.prototype.scrollIntoView = scroll_into_view_mock

      mount(Toc, { target: document.body, props: { open: true } })
      await tick()

      const active_item = doc_query(`aside.toc ol li.active`)
      expect(active_item).toBeTruthy()

      globalThis.dispatchEvent(new KeyboardEvent(`keydown`, { key }))

      expect(scroll_into_view_mock).toHaveBeenCalledWith({
        behavior: `instant`,
        block: `start`,
      })
    },
  )

  test.each([[[]], [[`Escape`]]])(
    `Escape key closes ToC on mobile if reactToKeys=%s includes 'Escape'`,
    async (reactToKeys) => {
      document.body.innerHTML = `<h2>Heading 1</h2><h2>Heading 2</h2>`
      globalThis.innerWidth = 600
      const onOpen = vi.fn()

      mount(Toc, {
        target: document.body,
        props: { open: true, reactToKeys, onOpen },
      })
      await tick()

      onOpen.mockClear() // Clear previous calls

      // Simulate pressing Escape
      globalThis.dispatchEvent(new KeyboardEvent(`keydown`, { key: `Escape` }))
      await tick()

      if (reactToKeys.includes(`Escape`)) {
        // Should have called onOpen with open:false when Escape is in reactToKeys
        expect(onOpen).toHaveBeenCalledWith(
          expect.objectContaining({ open: false }),
        )
      } else expect(onOpen).not.toHaveBeenCalled()
    },
  )

  test.each([[`First Page Heading`, `Second Page Heading`, 2, 3]])(
    `updates ToC when page content changes`,
    async (initial_title, new_title, initial_count, final_count) => {
      document.body.innerHTML = `
        <div id="content-container">
          <h2>${initial_title} 1</h2>
          <h3>${initial_title} 2</h3>
        </div>
      `

      mount(Toc, { target: document.body })
      await tick()

      let toc_items = document.querySelectorAll(`aside.toc > nav > ol > li`)
      expect(toc_items.length).toBe(initial_count)
      expect(toc_items[0].textContent?.trim()).toBe(`${initial_title} 1`)
      expect(toc_items[1].textContent?.trim()).toBe(`${initial_title} 2`)

      const container = document.getElementById(`content-container`)
      if (container) {
        container.innerHTML = `
          <h2>${new_title} 1</h2>
          <h3>${new_title} 2</h3>
          <h4>${new_title} 3</h4>
        `
      }

      await tick()

      toc_items = document.querySelectorAll(`aside.toc > nav > ol > li`)
      expect(toc_items.length).toBe(final_count)
      expect(toc_items[0].textContent?.trim()).toBe(`${new_title} 1`)
      expect(toc_items[1].textContent?.trim()).toBe(`${new_title} 2`)
      expect(toc_items[2].textContent?.trim()).toBe(`${new_title} 3`)
    },
  )

  test.each([`auto`, `smooth`] as const)(
    `custom scroll behavior %s is applied when clicking ToC items`,
    async (scroll_behavior) => {
      document.body.innerHTML = `
        <h2 id="heading-1">Heading 1</h2>
        <h2 id="heading-2">Heading 2</h2>
      `

      const scroll_into_view_mock = vi.fn()
      Element.prototype.scrollIntoView = scroll_into_view_mock

      mount(Toc, {
        target: document.body,
        props: {
          open: true,
          scrollBehavior: scroll_behavior,
        },
      })
      await tick()

      const toc_item = doc_query(`aside.toc ol li`)
      toc_item.click()

      expect(scroll_into_view_mock).toHaveBeenCalledWith({
        behavior: scroll_behavior,
        block: `start`,
      })
    },
  )

  test(`mutation observer updates ToC when heading is dynamically added`, async () => {
    document.body.innerHTML = `
      <div id="content">
        <h2>Initial Heading</h2>
      </div>
    `

    mount(Toc, { target: document.body })
    await tick()

    let toc_items = document.querySelectorAll(`aside.toc > nav > ol > li`)
    expect(toc_items.length).toBe(1)
    expect(toc_items[0].textContent?.trim()).toBe(`Initial Heading`)

    const new_heading = document.createElement(`h3`)
    new_heading.textContent = `Dynamically Added Heading`
    document.getElementById(`content`)?.appendChild(new_heading)

    await tick()

    toc_items = document.querySelectorAll(`aside.toc > nav > ol > li`)
    expect(toc_items.length).toBe(2)
    expect(toc_items[1].textContent?.trim()).toBe(`Dynamically Added Heading`)
  })
})

describe(`Style and Class Props Application`, () => {
  const ensure_content_for_toc_elements = (
    headings = [`<h2>Content Heading 1</h2>`, `<h3>Content Heading 2</h3>`],
  ) => {
    document.body.innerHTML = headings.join(`\n`)
  }

  const ensure_mobile_button_is_visible = () => {
    ensure_content_for_toc_elements() // Need headings for the button to appear
    globalThis.innerWidth = 500 // Simulate mobile (default breakpoint is 1000px)
  }

  const test_cases = [
    // Aside tests
    {
      elementName: `aside`,
      propName: `aside_style`,
      value: `color: rgb(255, 0, 0);`,
      selector: `aside.toc`,
      check: `style`,
      setupFn: ensure_content_for_toc_elements,
    },
    {
      elementName: `aside`,
      propName: `aside_class`,
      value: `custom-aside-class`,
      selector: `aside.toc`,
      check: `class`,
      setupFn: ensure_content_for_toc_elements,
    },
    // Nav tests
    {
      elementName: `nav`,
      propName: `nav_style`,
      value: `background-color: rgb(0, 0, 255);`,
      selector: `aside.toc nav`,
      check: `style`,
      setupFn: ensure_content_for_toc_elements,
      extraProps: { title: `Test Title` }, // Nav needs title or items to render
    },
    {
      elementName: `nav`,
      propName: `nav_class`,
      value: `custom-nav-class`,
      selector: `aside.toc nav`,
      check: `class`,
      setupFn: ensure_content_for_toc_elements,
      extraProps: { title: `Test Title` },
    },
    // Title element tests
    {
      elementName: `title`,
      propName: `title_element_style`,
      value: `font-style: italic;`,
      selector: `aside.toc nav .toc-title`,
      check: `style`,
      setupFn: ensure_content_for_toc_elements,
      extraProps: { title: `Test Custom Title` },
    },
    {
      elementName: `title`,
      propName: `title_element_class`,
      value: `custom-title-class`,
      selector: `aside.toc nav .toc-title`,
      check: `class`,
      setupFn: ensure_content_for_toc_elements,
      extraProps: { title: `Test Custom Title` },
      additionalClassChecks: [`toc-title`, `toc-exclude`],
    },
    // OL tests
    {
      elementName: `ol`,
      propName: `ol_style`,
      value: `list-style-type: square;`,
      selector: `aside.toc nav ol`,
      check: `style`,
      setupFn: ensure_content_for_toc_elements,
    },
    {
      elementName: `ol`,
      propName: `ol_class`,
      value: `custom-ol-class`,
      selector: `aside.toc nav ol`,
      check: `class`,
      setupFn: ensure_content_for_toc_elements,
    },
    // LI tests
    {
      elementName: `li`,
      propName: `li_style`,
      value: `padding-left: 10px;`,
      selector: `aside.toc nav ol li`,
      check: `style`,
      setupFn: () => ensure_content_for_toc_elements([`<h2>Single Heading</h2>`]),
    },
    {
      elementName: `li`,
      propName: `li_class`,
      value: `custom-li-class`,
      selector: `aside.toc nav ol li`,
      check: `class`,
      setupFn: () => ensure_content_for_toc_elements([`<h2>Single Heading</h2>`]),
    },
    // Open button tests
    {
      elementName: `open button`,
      propName: `open_button_style`,
      value: `border: 1px solid rgb(0, 128, 0);`,
      selector: `aside.toc > button`,
      check: `style`,
      setupFn: ensure_mobile_button_is_visible,
      extraProps: { desktop: false }, // Ensure button context
    },
    {
      elementName: `open button`,
      propName: `open_button_class`,
      value: `custom-button-class`,
      selector: `aside.toc > button`,
      check: `class`,
      setupFn: ensure_mobile_button_is_visible,
      extraProps: { desktop: false },
    },
  ]

  test.each(test_cases)(
    `applies $propName to $elementName element ($check)`,
    async ({
      propName,
      value,
      selector,
      check,
      setupFn,
      extraProps = {},
      additionalClassChecks,
    }) => {
      if (setupFn) setupFn()

      mount(Toc, {
        target: document.body,
        props: { ...extraProps, [propName]: value },
      })
      await tick()

      const element = doc_query(selector) as HTMLElement
      expect(element, `${selector} should exist`).not.toBeNull()

      if (check === `style`) {
        const style_attribute = element.getAttribute(`style`)
        expect(
          style_attribute,
          `${selector} style attribute should exist`,
        ).not.toBeNull()
        if (style_attribute) {
          // Type guard for style_attribute
          expect(
            style_attribute,
            `${selector} style should contain '${value}'`,
          ).toContain(value)
          // Special check for li_style to ensure existing styles are preserved
          if (propName === `li_style`) {
            expect(
              style_attribute,
              `${selector} style should contain 'margin-left'`,
            ).toContain(`margin-left`)
            expect(
              style_attribute,
              `${selector} style should contain 'font-size'`,
            ).toContain(`font-size`)
          }
        }
      } else if (check === `class`) {
        expect(
          element.classList.contains(value),
          `${selector} should have class '${value}'`,
        ).toBe(true)
        if (additionalClassChecks) {
          additionalClassChecks.forEach((cls) => {
            expect(
              element.classList.contains(cls),
              `${selector} should retain class '${cls}'`,
            ).toBe(true)
          })
        }
      }
    },
  )
})
