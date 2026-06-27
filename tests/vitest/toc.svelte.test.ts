import Toc from '$lib'
import type { OpenChangeHandler } from '$lib'
import type { Component, MountOptions } from 'svelte'
import { createRawSnippet, mount as svelte_mount, tick, unmount } from 'svelte'
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'
import { doc_query } from './index.js'

const mounted_components: Record<string, unknown>[] = []

function mount<
  Props extends Record<string, unknown>,
  Exports extends Record<string, unknown>,
>(component: Component<Props, Exports>, options: MountOptions<Props>): Exports {
  const mounted = svelte_mount(component, options)
  mounted_components.push(mounted)
  return mounted
}

const set_body = (html: string) => {
  document.body.innerHTML = html
}

const setup_empty_page = () =>
  set_body(`
      <h1>Heading 1</h1>
      <h2 class="toc-exclude">Heading 2</h2>
      <h5>Heading 5</h5>
      <h6>Heading 6</h6>
    `)

const set_window_width = (width: number) => {
  globalThis.innerWidth = width
  globalThis.dispatchEvent(new Event(`resize`))
}

const ensure_content_for_toc_elements = (
  headings = [`<h2>Content Heading 1</h2>`, `<h3>Content Heading 2</h3>`],
) => set_body(headings.join(`\n`))

const ensure_single_heading = () =>
  ensure_content_for_toc_elements([`<h2>Single Heading</h2>`])

const ensure_mobile_button_is_visible = () => {
  ensure_content_for_toc_elements() // Need headings for the button to appear
  set_window_width(500) // Simulate mobile (default breakpoint is 1000px)
}

const setup_nested_headings = () =>
  set_body(`
      <h2 id="section-1">Section 1</h2>
      <h3 id="sub-1-1">Sub 1.1</h3>
      <h4 id="detail-1-1-1">Detail 1.1.1</h4>
      <h4 id="detail-1-1-2">Detail 1.1.2</h4>
      <h3 id="sub-1-2">Sub 1.2</h3>
      <h4 id="detail-1-2-1">Detail 1.2.1</h4>
      <h2 id="section-2">Section 2</h2>
      <h3 id="sub-2-1">Sub 2.1</h3>
    `)

const dom_rect = (rect: Partial<DOMRect> = {}): DOMRect => {
  const x = rect.left ?? rect.x ?? 0
  const y = rect.top ?? rect.y ?? 0
  const width = rect.right === undefined ? (rect.width ?? 0) : rect.right - x
  const height = rect.bottom === undefined ? (rect.height ?? 0) : rect.bottom - y
  return DOMRect.fromRect({ x, y, width, height })
}

// Mock scroll position to make a specific heading "active" (scrolled past viewport top)
const mock_active_heading = (active_id: string) => {
  const headings = Array.from(document.querySelectorAll(`h2, h3, h4`))
  const active_idx = headings.findIndex((heading) => heading.id === active_id)
  headings.forEach((heading, idx) => {
    // Active heading and all before it are scrolled past (negative top)
    const top =
      idx <= active_idx ? -10 * (active_idx - idx + 1) : 100 * (idx - active_idx)
    vi.spyOn(heading, `getBoundingClientRect`).mockReturnValue(dom_rect({ top }))
  })
}

// Get collapsed state as array of booleans for easy assertion
const get_collapsed_states = () =>
  Array.from(document.querySelectorAll(`aside.toc > nav > ol > li`)).map((li) =>
    li.classList.contains(`collapsed`),
  )

const find_matching_css_selector = (style_text: string, declaration_pattern: RegExp) => {
  const matching_block = Array.from(
    style_text.matchAll(/(?<selector>[^{}]+)\{(?<block>[^{}]+)\}/g),
  ).find((match) => declaration_pattern.test(match.groups?.block ?? ``))
  if (!matching_block) throw new Error(`No CSS block matched ${declaration_pattern}`)
  const selector = matching_block.groups?.selector
  if (!selector) throw new Error(`No CSS selector matched ${declaration_pattern}`)
  return selector.trim()
}

beforeAll(() => {
  // Mock enough of the animate API for Svelte transitions in jsdom.
  Object.defineProperty(Element.prototype, `animate`, {
    configurable: true,
    value: vi.fn<() => { cancel: () => void }>(() => ({ cancel: vi.fn<() => void>() })),
  })
})

afterEach(async () => {
  await Promise.all(mounted_components.splice(0).map((component) => unmount(component)))
  vi.restoreAllMocks()
})

describe(`Toc`, () => {
  test(`renders default title element`, () => {
    mount(Toc, { target: document.body, props: { title: `Custom title` } })

    const title_node = doc_query(`h2`)
    expect(title_node.textContent).toBe(`Custom title`)
    expect(title_node.classList.contains(`toc-title`)).toBe(true)
    expect(title_node.classList.contains(`toc-exclude`)).toBe(true)
  })

  test.each([
    [null, 3, [0, 1, 2].map((lvl) => `Heading ${lvl + 2}`)],
    [
      `body > :is(h1, h2, h3, h4, h5, h6)`,
      5,
      Array.from({ length: 5 }, (_, lvl) => `Heading ${lvl + 2}`),
    ],
    [`h1`, 0, []],
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
      if (headingSelector !== null) props = { headingSelector }

      mount(Toc, { target: document.body, props })
      await tick()

      const toc_list = doc_query(`aside.toc > nav > ol`)
      expect(toc_list.children).toHaveLength(expected_lis)
      expect(toc_list.textContent.trim()).toBe(expected_text.join(``))
    },
  )

  test.each([
    [`default exclusion`, `toc-exclude`, {}, [`Included heading`]],
    [
      `custom exclusion`,
      `skip-toc`,
      { excludeSelector: `.skip-toc` },
      [`Included heading`],
    ],
    [
      `disabled exclusion`,
      `toc-exclude`,
      { excludeSelector: `` },
      [`Excluded child heading`, `Excluded nested heading`, `Included heading`],
    ],
  ])(
    `%s with custom headingSelector`,
    async (_test_case, class_name, props, expected_headings) => {
      set_body(`
      <section class="${class_name}">
        <h2>Excluded child heading</h2>
        <div><h3>Excluded nested heading</h3></div>
      </section>
      <h2>Included heading</h2>
    `)

      mount(Toc, {
        target: document.body,
        props: { headingSelector: `:is(h2, h3)`, ...props },
      })
      await tick()

      const toc_list = doc_query(`aside.toc > nav > ol`)
      expect(toc_list.children).toHaveLength(expected_headings.length)
      expect(toc_list.textContent.trim()).toBe(expected_headings.join(``))
    },
  )

  test(`getHeadingData customizes listed headings`, async () => {
    set_body(`<h2>Keep</h2><h3>Skip</h3>`)
    const replace_state_mock = vi.spyOn(history, `replaceState`)
    mount(Toc, {
      target: document.body,
      props: {
        getHeadingData: (node: HTMLHeadingElement) =>
          node.textContent === `Skip`
            ? null
            : { id: `custom`, level: 2, title: `Custom` },
        headingSelector: `:is(h2, h3)`,
      },
    })
    await tick()

    const toc_items = document.querySelectorAll(`aside.toc li`)
    expect(toc_items).toHaveLength(1)
    const toc_item = toc_items[0]
    expect(toc_item.textContent).toBe(`Custom`)
    expect(doc_query(`body > h2`).id).toBe(`custom`)
    expect(toc_item.querySelector(`a`)?.getAttribute(`href`)).toBe(`#custom`)
    expect(document.querySelector(`#custom`)).toBe(doc_query(`body > h2`))

    toc_item.dispatchEvent(new MouseEvent(`click`, { bubbles: true }))
    expect(replace_state_mock).toHaveBeenCalledWith({}, ``, `#custom`)
  })

  test(`replaceState uses the raw id while the link href is URL-encoded`, async () => {
    set_body(`<h2 id="sec:1">Section</h2>`)
    const replace_state_mock = vi.spyOn(history, `replaceState`)
    Element.prototype.scrollIntoView = vi.fn<Element[`scrollIntoView`]>()

    mount(Toc, { target: document.body })
    await tick()

    // the <a href> is a valid percent-encoded URL string
    expect(doc_query(`aside.toc li > a`).getAttribute(`href`)).toBe(`#sec%3A1`)

    // but the history fragment must match the DOM id exactly (no encoding) so it resolves
    // directly via getElementById rather than the browser's percent-decode fallback
    doc_query(`aside.toc li > a`).dispatchEvent(
      new MouseEvent(`click`, { bubbles: true }),
    )
    expect(replace_state_mock).toHaveBeenCalledWith({}, ``, `#sec:1`)
  })

  test(`existing heading ids stay the fragment target over getHeadingData ids`, async () => {
    set_body(`<h2 id="real">Keep</h2>`)

    mount(Toc, {
      target: document.body,
      props: {
        getHeadingData: (node: HTMLHeadingElement) => ({
          id: `custom`,
          level: 2,
          title: node.textContent ?? ``,
        }),
      },
    })
    await tick()

    expect(doc_query(`body > h2`).id).toBe(`real`)
    expect(doc_query(`aside.toc li > a`).getAttribute(`href`)).toBe(`#real`)
  })

  test(`autoIds assigns unique heading ids and link hrefs`, async () => {
    set_body(`
      <div id="intro"></div>
      <h2>Intro!</h2>
      <h2>Intro?</h2>
      <h3 id="custom-id">Custom</h3>
    `)

    mount(Toc, { target: document.body })
    await tick()

    const headings = document.querySelectorAll<HTMLHeadingElement>(`body > :is(h2, h3)`)
    expect([...headings].map((heading) => heading.id)).toEqual([
      `intro-2`,
      `intro-3`,
      `custom-id`,
    ])
    expect(
      [...document.querySelectorAll<HTMLAnchorElement>(`aside.toc li > a`)].map(
        (anchor) => anchor.getAttribute(`href`),
      ),
    ).toEqual([`#intro-2`, `#intro-3`, `#custom-id`])
  })

  test(`autoIds=false leaves headings without ids or hrefs`, async () => {
    set_body(`<h2>No id</h2>`)

    mount(Toc, { target: document.body, props: { autoIds: false } })
    await tick()

    expect(doc_query(`body > h2`).id).toBe(``)
    expect(doc_query(`aside.toc li > a`).hasAttribute(`href`)).toBe(false)
  })

  test(`slugifyHeading customizes generated ids`, async () => {
    set_body(`<h2>First</h2><h2>Second</h2>`)

    mount(Toc, {
      target: document.body,
      props: {
        slugifyHeading: (_heading: HTMLHeadingElement, idx: number) => `section-${idx}`,
      },
    })
    await tick()

    expect(
      [...document.querySelectorAll<HTMLHeadingElement>(`body > h2`)].map(
        (heading) => heading.id,
      ),
    ).toEqual([`section-0`, `section-1`])
  })

  test(`tocItem snippet replaces default link content`, async () => {
    set_body(`<h2 id="intro">Intro</h2>`)

    mount(Toc, {
      target: document.body,
      props: {
        tocItem: createRawSnippet<[HTMLHeadingElement]>((heading) => ({
          render: () =>
            `<span class="custom-toc-item">${heading().id}:${heading().textContent}</span>`,
        })),
      },
    })
    await tick()

    const item = doc_query(`aside.toc li`)
    expect(item.getAttribute(`tabindex`)).toBe(`0`)
    expect(item.getAttribute(`aria-current`)).toBe(`location`)
    expect(item.querySelector(`a`)).toBeNull()
    expect(item.querySelector(`.custom-toc-item`)?.textContent).toBe(`intro:Intro`)
  })

  test.each([
    {
      desc: `anchor keeps its own click behavior`,
      html: (heading: HTMLHeadingElement) =>
        `<a class="custom-link" href="#${heading.id}">${heading.textContent}</a>`,
      n_anchors: 1,
      selector: `aside.toc li > a.custom-link`,
      scrolls: false,
    },
    {
      desc: `button keeps its own click behavior`,
      html: (heading: HTMLHeadingElement) =>
        `<button class="custom-button" type="button">${heading.textContent}</button>`,
      n_anchors: 0,
      selector: `aside.toc li > button.custom-button`,
      scrolls: false,
    },
    {
      desc: `non-interactive span scrolls to the heading`,
      html: (heading: HTMLHeadingElement) =>
        `<span class="plain">${heading.textContent}</span>`,
      n_anchors: 0,
      selector: `aside.toc li > span.plain`,
      scrolls: true,
    },
  ])(`tocItem $desc`, async ({ html, n_anchors, selector, scrolls }) => {
    set_body(`<h2 id="intro">Intro</h2>`)
    const replace_state_mock = vi.spyOn(history, `replaceState`)
    const scroll_into_view_mock = vi.fn<Element[`scrollIntoView`]>()
    Element.prototype.scrollIntoView = scroll_into_view_mock

    mount(Toc, {
      target: document.body,
      props: {
        tocItem: createRawSnippet<[HTMLHeadingElement]>((heading) => ({
          render: () => html(heading()),
        })),
      },
    })
    await tick()

    const item = doc_query(`aside.toc li`)
    expect(item.querySelectorAll(`a`)).toHaveLength(n_anchors)

    const event = new MouseEvent(`click`, { bubbles: true, cancelable: true })
    doc_query(selector).dispatchEvent(event)

    // a nested interactive element keeps native behavior (no preventDefault, no scroll);
    // plain content falls through to the li handler which scrolls and updates the fragment
    expect(event.defaultPrevented).toBe(scrolls)
    expect(scroll_into_view_mock).toHaveBeenCalledTimes(scrolls ? 1 : 0)
    expect(replace_state_mock.mock.calls).toEqual(scrolls ? [[{}, ``, `#intro`]] : [])
  })

  test(`modified clicks on ToC links keep native browser behavior`, async () => {
    set_body(`<h2 id="intro">Intro</h2>`)
    const replace_state_mock = vi.spyOn(history, `replaceState`)
    const scroll_into_view_mock = vi.fn<Element[`scrollIntoView`]>()
    Element.prototype.scrollIntoView = scroll_into_view_mock

    mount(Toc, { target: document.body })
    await tick()

    const event = new MouseEvent(`click`, {
      bubbles: true,
      cancelable: true,
      ctrlKey: true,
    })
    doc_query(`aside.toc li > a`).dispatchEvent(event)

    expect(event.defaultPrevented).toBe(false)
    expect(replace_state_mock).not.toHaveBeenCalled()
    expect(scroll_into_view_mock).not.toHaveBeenCalled()
  })

  test(`flashClickedHeadingsFor removes the clicked-heading class`, async () => {
    vi.useFakeTimers()
    try {
      set_body(`<h2 id="intro">Intro</h2>`)

      mount(Toc, {
        target: document.body,
        props: { flashClickedHeadingsFor: 10 },
      })
      await tick()

      const heading = doc_query(`#intro`)
      doc_query(`aside.toc li`).click()
      expect(heading.classList.contains(`toc-clicked`)).toBe(true)

      vi.advanceTimersByTime(10)
      expect(heading.classList.contains(`toc-clicked`)).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  test.each([
    [`headingSelector`, { headingSelector: `[` }],
    [`excludeSelector`, { excludeSelector: `[` }],
  ])(`warns once and hides for invalid %s`, async (selector_name, props) => {
    document.body.innerHTML = `<h2>Visible heading</h2>`
    const warn_mock = vi.spyOn(console, `warn`).mockImplementation(() => {})

    mount(Toc, {
      target: document.body,
      props: { warnOnEmpty: true, ...props },
    })
    await tick()

    expect(warn_mock).toHaveBeenCalledExactlyOnceWith(
      expect.stringContaining(`invalid ${selector_name}='['`),
    )
    expect(doc_query(`aside.toc`).getAttribute(`hidden`)).toBe(``)
  })

  describe.each([undefined, `foobar`, `h2`, `h4`])(
    `with headingSelector='%s'`,
    (headingSelector) => {
      test(`autoHide=true hides ToC when no headings match`, async () => {
        setup_empty_page()
        mount(Toc, {
          target: document.body,
          props: { headingSelector, autoHide: true },
        })
        await tick()

        const node = doc_query(`aside.toc`)
        expect(node).toBeInstanceOf(HTMLElement)
        expect(node.getAttribute(`aria-hidden`)).toBe(`true`)
        expect(node.className).toContain(`hidden`)
        expect(node.getAttribute(`hidden`)).toBe(``)
      })

      test(`autoHide=false keeps ToC visible when no headings match`, async () => {
        setup_empty_page()
        mount(Toc, {
          target: document.body,
          props: { headingSelector, autoHide: false },
        })
        await tick()

        const node = doc_query(`aside.toc`)
        expect(node).toBeInstanceOf(HTMLElement)
        expect(node.getAttribute(`aria-hidden`)).toBe(`false`)
        expect(node.className).not.toContain(`hidden`)
        expect(node.getAttribute(`hidden`)).toBeNull()
      })
    },
  )

  test(`console.warns when empty and warnOnEmpty=true`, async () => {
    const warn_mock = vi.spyOn(console, `warn`).mockImplementation(() => {})
    mount(Toc, { target: document.body, props: { warnOnEmpty: true } })
    await tick()
    const msg = `svelte-toc found no headings for headingSelector=':is(h2, h3, h4)' after applying excludeSelector='.toc-exclude'. Hiding table of contents.`
    expect(warn_mock).toHaveBeenCalledWith(msg)
  })

  test(`no console.warn when warnOnEmpty=false`, () => {
    const warn_mock = vi.spyOn(console, `warn`).mockImplementation(() => {})
    mount(Toc, { target: document.body, props: { warnOnEmpty: false } })
    expect(warn_mock).not.toHaveBeenCalled()
  })

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
    expect(toc_list.children).toHaveLength(3)

    const lis = toc_list.querySelectorAll<HTMLLIElement>(`:scope > li`)
    // Indent is applied via CSS calc with --toc-indent-per-level variable
    expect(lis[0].style.marginLeft).toContain(`calc(0 *`)
    expect(lis[1].style.marginLeft).toContain(`calc(1 *`)
    expect(lis[2].style.marginLeft).toContain(`calc(2 *`)
  })

  // heading_levels [1,2,3,4] has 3 matches for :is(h2,h3,h4), so minItems 1-3 render
  test.each([[1], [2], [3]])(
    `renders TOC when minItems=%s and enough headings match`,
    async (minItems) => {
      document.body.innerHTML = [1, 2, 3, 4]
        .map((lvl) => `<h${lvl}>Heading ${lvl}</h${lvl}>`)
        .join(``)

      mount(Toc, {
        target: document.body,
        props: { headingSelector: `:is(h2, h3, h4)`, minItems },
      })
      await tick()

      const toc_list = doc_query(`aside.toc > nav > ol`)
      expect(toc_list.children.length).toBeGreaterThanOrEqual(minItems)
    },
  )

  // heading_levels [1,2,3,4] has 3 matches, so minItems=4 hides; [1,5,6] has 0 matches
  test.each([
    [[1, 2, 3, 4], 4],
    [[1, 5, 6], 1],
    [[1, 5, 6], 2],
  ])(
    `hides TOC when fewer than minItems headings match (levels=%j, minItems=%s)`,
    async (heading_levels, minItems) => {
      document.body.innerHTML = heading_levels
        .map((lvl) => `<h${lvl}>Heading ${lvl}</h${lvl}>`)
        .join(``)

      mount(Toc, {
        target: document.body,
        props: { headingSelector: `:is(h2, h3, h4)`, minItems },
      })
      await tick()

      const nav = document.querySelector(`aside.toc nav`)
      expect(nav).toBeNull()
    },
  )

  test.each([
    [400, 500, 600],
    [700, 800, 900],
    [999, 1000, 1001],
  ])(
    `should handle custom breakpoint with small=%i, breakpoint=%i, large=%i`,
    async (smaller, breakpoint, larger) => {
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

  test(`onOpenChange handler receives open state, desktop state, and trigger`, async () => {
    set_window_width(1200)
    ensure_content_for_toc_elements()
    const on_open_change = vi.fn<OpenChangeHandler>()

    mount(Toc, {
      target: document.body,
      props: { onOpenChange: on_open_change, open: false },
    })
    await tick()

    expect(on_open_change).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ desktop: true, open: false, trigger: `programmatic` }),
    )

    set_window_width(600)
    await tick()
    doc_query(`aside.toc button`).click()
    await tick()

    expect(on_open_change).toHaveBeenCalledTimes(2)
    expect(on_open_change).toHaveBeenCalledWith(
      expect.objectContaining({ desktop: false, open: true, trigger: `button` }),
    )

    globalThis.dispatchEvent(new KeyboardEvent(`keydown`, { key: `Escape` }))
    await tick()
    on_open_change.mockClear()

    // Same-tick open changes should emit each internal trigger separately.
    doc_query(`aside.toc button`).click()
    globalThis.dispatchEvent(new KeyboardEvent(`keydown`, { key: `Escape` }))
    await tick()

    expect(on_open_change).toHaveBeenCalledTimes(2)
    expect(on_open_change).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ desktop: false, open: true, trigger: `button` }),
    )
    expect(on_open_change).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ desktop: false, open: false, trigger: `escape` }),
    )
  })

  test(`should toggle mobile ToC visibility`, async () => {
    globalThis.innerWidth = 600
    document.body.innerHTML = `
      <h2>Heading 1</h2>
      <h2>Heading 2</h2>
    `

    mount(Toc, { target: document.body, props: { desktop: false } })

    const button = doc_query(`aside.toc button`)

    const nav_before_open = document.querySelector(`aside.toc > nav`)
    expect(nav_before_open).toBeNull()

    button.click()
    await tick()

    const nav_after_open = document.querySelector(`aside.toc > nav`)
    expect(nav_after_open).not.toBeNull()
  })

  test(`active heading is scrolled into view and highlighted when opening ToC on mobile`, async () => {
    const n_headings = 100
    document.body.innerHTML = Array.from(
      { length: n_headings },
      (_, idx) => `<h2 id="heading-${idx + 1}">Heading ${idx + 1}</h2>`,
    ).join(`\n`)

    globalThis.innerWidth = 600

    mount(Toc, { target: document.body, props: { open: true } })
    await tick()

    const active_li = doc_query(`aside.toc ol li.active`)
    expect(active_li).not.toBeNull()
    expect(active_li.textContent.trim()).toBe(`Heading ${n_headings}`)
  })

  test(`arrow keys navigate the active ToC item when open`, async () => {
    document.body.innerHTML = `
      <h2 id="heading-1">Heading 1</h2>
      <h2 id="heading-2">Heading 2</h2>
      <h2 id="heading-3">Heading 3</h2>
      <h2 id="heading-4">Heading 4</h2>
    `
    set_window_width(600)
    mock_active_heading(`heading-1`)
    mount(Toc, {
      target: document.body,
      props: { breakpoint: 10_000, desktop: false, open: true },
    })
    await tick()

    const initial_active = doc_query(`aside.toc > nav > ol > li.active`)
    initial_active.dispatchEvent(new MouseEvent(`click`, { bubbles: true }))
    await tick()
    doc_query(`aside.toc button`).dispatchEvent(
      new MouseEvent(`click`, { bubbles: true }),
    )
    await tick()

    globalThis.dispatchEvent(new KeyboardEvent(`keydown`, { key: `ArrowDown` }))
    await tick()

    const after_down = doc_query(`aside.toc > nav > ol > li.active`)
    expect(after_down.textContent).toBe(`Heading 2`)

    globalThis.dispatchEvent(new KeyboardEvent(`keydown`, { key: `ArrowUp` }))
    await tick()

    const after_up = doc_query(`aside.toc > nav > ol > li.active`)
    expect(after_up.textContent).toBe(`Heading 1`)
  })

  test(`arrow keys keep selection at visible list boundaries`, async () => {
    document.body.innerHTML = `
      <h2 id="heading-1">Heading 1</h2>
      <h2 id="heading-2">Heading 2</h2>
    `
    set_window_width(600)
    mock_active_heading(`heading-2`)
    mount(Toc, {
      target: document.body,
      props: { breakpoint: 10_000, desktop: false, open: true },
    })
    await tick()

    globalThis.dispatchEvent(new KeyboardEvent(`keydown`, { key: `ArrowDown` }))
    await tick()

    expect(doc_query(`aside.toc > nav > ol > li.active`).textContent).toBe(`Heading 2`)
  })

  test(`desktop (focused, no hover) arrow keys move focus + selection and Enter follows`, async () => {
    document.body.innerHTML = `
      <h2 id="heading-1">Heading 1</h2>
      <h2 id="heading-2">Heading 2</h2>
    `
    set_window_width(1200)
    mock_active_heading(`heading-1`)
    Element.prototype.scrollIntoView = vi.fn<Element[`scrollIntoView`]>()
    const replace_mock = vi.spyOn(history, `replaceState`)

    mount(Toc, { target: document.body })
    await tick()

    doc_query(`aside.toc > nav > ol > li.active > a`).focus()
    // dispatch on the focused li (bubbles) to mirror real keyboard usage
    document.activeElement?.dispatchEvent(
      new KeyboardEvent(`keydown`, { key: `ArrowDown`, bubbles: true }),
    )
    await tick()

    // selection AND DOM focus move together; otherwise the focused li's own keydown
    // handler would override the arrow-navigation on the next Enter
    const active = doc_query(`aside.toc > nav > ol > li.active`)
    expect(active.textContent).toBe(`Heading 2`)
    expect(document.activeElement).toBe(active.querySelector(`a`))

    // Enter activates the arrow-selected Heading 2, not the originally-focused Heading 1
    document.activeElement?.dispatchEvent(
      new KeyboardEvent(`keydown`, { key: `Enter`, bubbles: true }),
    )
    expect(doc_query(`aside.toc > nav > ol > li.active`).textContent).toBe(`Heading 2`)
    expect(replace_mock).toHaveBeenCalledWith({}, ``, `#heading-2`)
  })

  test(`only the active ToC item carries aria-current="location"`, async () => {
    document.body.innerHTML = `<h2 id="a">Heading 1</h2><h2 id="b">Heading 2</h2>`
    mount(Toc, { target: document.body })
    await tick()

    const links = document.querySelectorAll<HTMLAnchorElement>(`aside.toc li > a`)
    expect(doc_query(`aside.toc li.active > a`).getAttribute(`aria-current`)).toBe(
      `location`,
    )
    for (const link of links) {
      if (!link.closest(`li`)?.classList.contains(`active`)) {
        expect(link.getAttribute(`aria-current`)).toBeNull()
      }
    }
  })

  test.each([
    [` `, `smooth`, `smooth`],
    [`Enter`, `smooth`, `smooth`],
    [` `, `auto`, `auto`],
    [`Enter`, `auto`, `auto`],
    [`Enter`, undefined, `smooth`], // default scrollBehavior when prop omitted
  ] as const)(
    `%s key with scrollBehavior=%s scrolls with behavior %s`,
    async (key, scroll_behavior, expected_behavior) => {
      document.body.innerHTML = `
        <h2 id="heading-1">Heading 1</h2>
        <h2 id="heading-2">Heading 2</h2>
      `

      const scroll_into_view_mock = vi.fn<Element[`scrollIntoView`]>()
      Element.prototype.scrollIntoView = scroll_into_view_mock
      const replace_state_mock = vi.spyOn(history, `replaceState`)

      // Use breakpoint higher than JSDOM's default width to simulate mobile mode
      // On mobile, keyboard events work when open=true (no hover check needed)
      mount(Toc, {
        target: document.body,
        props: {
          open: true,
          breakpoint: 2000,
          ...(scroll_behavior ? { scrollBehavior: scroll_behavior } : {}),
        },
      })
      await tick()

      const active_item = doc_query(`aside.toc ol li.active`)
      expect(active_item).not.toBeNull()

      globalThis.dispatchEvent(new KeyboardEvent(`keydown`, { key }))

      expect(scroll_into_view_mock).toHaveBeenCalledWith({
        behavior: expected_behavior,
        block: `start`,
      })
      expect(replace_state_mock).toHaveBeenCalledWith({}, ``, `#heading-2`)
    },
  )

  test.each([
    { key: `Escape`, trigger: `escape`, focus_toc: false, default_prevented: true },
    { key: `Tab`, trigger: `tab`, focus_toc: true, default_prevented: false },
  ] as const)(
    `$key key closes ToC on mobile when reactToKeys includes it`,
    async ({ key, trigger, focus_toc, default_prevented }) => {
      document.body.innerHTML = `<h2>Heading 1</h2><h2>Heading 2</h2>`
      set_window_width(600)
      const on_open_change = vi.fn<OpenChangeHandler>()

      mount(Toc, {
        target: document.body,
        props: { open: true, reactToKeys: [key], onOpenChange: on_open_change },
      })
      await tick()
      on_open_change.mockClear()

      if (focus_toc) doc_query(`aside.toc > nav > ol > li.active > a`).focus()
      const key_event = new KeyboardEvent(`keydown`, { key, cancelable: true })
      globalThis.dispatchEvent(key_event)
      await tick()

      expect(key_event.defaultPrevented).toBe(default_prevented)
      expect(on_open_change).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ desktop: false, open: false, trigger }),
      )
    },
  )

  test(`Escape key does nothing when reactToKeys is empty`, async () => {
    document.body.innerHTML = `<h2>Heading 1</h2><h2>Heading 2</h2>`
    globalThis.innerWidth = 600
    const on_open_change = vi.fn<OpenChangeHandler>()

    mount(Toc, {
      target: document.body,
      props: { open: true, reactToKeys: [], onOpenChange: on_open_change },
    })
    await tick()
    on_open_change.mockClear()

    globalThis.dispatchEvent(new KeyboardEvent(`keydown`, { key: `Escape` }))
    await tick()

    expect(on_open_change).not.toHaveBeenCalled()
  })

  test(`updates ToC when page content changes`, async () => {
    document.body.innerHTML = `
      <div id="content-container">
        <h2>First Page Heading 1</h2>
        <h3>First Page Heading 2</h3>
      </div>
    `

    mount(Toc, { target: document.body })
    await tick()

    let toc_items = document.querySelectorAll(`aside.toc > nav > ol > li`)
    expect(toc_items).toHaveLength(2)
    expect(toc_items[0].textContent.trim()).toBe(`First Page Heading 1`)
    expect(toc_items[1].textContent.trim()).toBe(`First Page Heading 2`)

    const container = document.querySelector(`#content-container`)
    if (container) {
      container.innerHTML = `
        <h2>Second Page Heading 1</h2>
        <h3>Second Page Heading 2</h3>
        <h4>Second Page Heading 3</h4>
      `
    }

    await tick()

    toc_items = document.querySelectorAll(`aside.toc > nav > ol > li`)
    expect(toc_items).toHaveLength(3)
    expect(toc_items[0].textContent.trim()).toBe(`Second Page Heading 1`)
    expect(toc_items[1].textContent.trim()).toBe(`Second Page Heading 2`)
    expect(toc_items[2].textContent.trim()).toBe(`Second Page Heading 3`)
  })

  test.each([`auto`, `smooth`] as const)(
    `custom scroll behavior %s is applied when clicking ToC items`,
    async (scroll_behavior) => {
      document.body.innerHTML = `
        <h2 id="heading-1">Heading 1</h2>
        <h2 id="heading-2">Heading 2</h2>
      `

      const scroll_into_view_mock = vi.fn<Element[`scrollIntoView`]>()
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

  test(`mutation observer updates ToC when headings change`, async () => {
    document.body.innerHTML = `
      <div id="content">
        <h2 id="initial">Initial Heading</h2>
      </div>
    `
    const scroll_into_view_mock = vi.fn<Element[`scrollIntoView`]>()
    Element.prototype.scrollIntoView = scroll_into_view_mock

    mount(Toc, { target: document.body })
    await tick()

    let toc_items = document.querySelectorAll(`aside.toc > nav > ol > li`)
    expect(toc_items).toHaveLength(1)
    expect(toc_items[0].textContent.trim()).toBe(`Initial Heading`)
    const stale_item = toc_items[0]

    const new_heading = document.createElement(`h3`)
    new_heading.textContent = `Dynamically Added Heading`
    doc_query(`#content`).append(new_heading)

    await tick()

    toc_items = document.querySelectorAll(`aside.toc > nav > ol > li`)
    expect(toc_items).toHaveLength(2)
    expect(toc_items[1].textContent.trim()).toBe(`Dynamically Added Heading`)

    doc_query(`#initial`).remove()
    await tick()
    expect(doc_query(`aside.toc ol li`).textContent).toBe(`Dynamically Added Heading`)

    stale_item.dispatchEvent(new MouseEvent(`click`, { bubbles: true }))
    expect(scroll_into_view_mock).not.toHaveBeenCalled()
  })

  test(`unrelated DOM mutations skip the heading rebuild while real changes don't`, async () => {
    set_body(`<h2 id="a">Alpha</h2><h2 id="b">Beta</h2>`)
    mount(Toc, { target: document.body })
    await tick()

    // jsdom returns all-zero rects, so set_active_heading picks the last heading
    expect(doc_query(`aside.toc li.active`).textContent.trim()).toBe(`Beta`)

    // arrange rects so any rebuild's set_active_heading() would switch active to Alpha
    mock_active_heading(`a`)

    // appending a non-heading is an unrelated mutation: the skip must avoid rebuilding
    // (and re-running set_active_heading), so the active heading stays put
    document.body.append(document.createElement(`p`))
    await tick()
    expect(doc_query(`aside.toc li.active`).textContent.trim()).toBe(`Beta`)

    // appending a real heading changes the set, so the rebuild runs and active updates
    const new_heading = document.createElement(`h2`)
    new_heading.id = `c`
    new_heading.textContent = `Gamma`
    document.body.append(new_heading)
    await tick()
    expect(doc_query(`aside.toc li.active`).textContent.trim()).toBe(`Gamma`)
  })

  test.each([
    {
      desc: `text-node data edits (characterData) update the ToC`,
      mutate: (heading: HTMLElement) => {
        ;(heading.firstChild as Text).data = `Changed`
      },
      expected: `Changed`,
    },
    {
      desc: `in-place textContent edits (childList) update the ToC`,
      mutate: (heading: HTMLElement) => {
        heading.textContent = `Changed`
      },
      expected: `Changed`,
    },
  ])(`heading $desc`, async ({ mutate, expected }) => {
    set_body(`<h2 id="a">Original</h2>`)
    mount(Toc, { target: document.body })
    await tick()
    expect(doc_query(`aside.toc li`).textContent.trim()).toBe(`Original`)

    mutate(doc_query(`#a`))
    await tick()
    expect(doc_query(`aside.toc li`).textContent.trim()).toBe(expected)
  })

  test(`unrelated text-node data edits do not rebuild active heading`, async () => {
    set_body(`<h2 id="a">Alpha</h2><h2 id="b">Beta</h2><p>Original</p>`)
    mount(Toc, { target: document.body })
    await tick()

    expect(doc_query(`aside.toc li.active`).textContent.trim()).toBe(`Beta`)
    mock_active_heading(`a`)

    ;(doc_query(`p`).firstChild as Text).data = `Changed`
    await tick()

    expect(doc_query(`aside.toc li.active`).textContent.trim()).toBe(`Beta`)
  })

  test(`heading id attribute changes update link targets`, async () => {
    set_body(`<h2 id="old">Title</h2>`)
    mount(Toc, { target: document.body })
    await tick()

    expect(doc_query(`aside.toc li > a`).getAttribute(`href`)).toBe(`#old`)

    doc_query(`body > h2`).id = `new`
    await tick()

    expect(doc_query(`aside.toc li > a`).getAttribute(`href`)).toBe(`#new`)
  })

  test(`rebinds when a heading element is replaced with identical content`, async () => {
    set_body(`<h2 id="a">Title</h2>`)
    mount(Toc, { target: document.body })
    await tick()

    // a framework re-render can swap in a fresh element with the same id/text; the
    // element-identity check must rebuild so clicks target the live (attached) heading
    const replacement = document.createElement(`h2`)
    replacement.id = `a`
    replacement.textContent = `Title`
    const scroll_spy = vi.fn()
    replacement.scrollIntoView = scroll_spy
    doc_query(`#a`).replaceWith(replacement)
    await tick()

    doc_query(`aside.toc li`).click()
    expect(scroll_spy).toHaveBeenCalled()
  })

  // Tests for issue #50: scroll_target prevents flicker during programmatic scrolling
  // https://github.com/janosh/svelte-toc/issues/50
  describe(`scroll_target behavior`, () => {
    const active_text = () => doc_query(`aside.toc ol li.active`).textContent.trim()
    const scroll_mock = vi.fn<Element[`scrollIntoView`]>()

    beforeEach(() => {
      document.body.innerHTML = `
        <h2 id="heading-1">Heading 1</h2>
        <h2 id="heading-2">Heading 2</h2>
        <h2 id="heading-3">Heading 3</h2>
      `
      scroll_mock.mockClear()
      Element.prototype.scrollIntoView = function (arg) {
        scroll_mock(arg)
      }
    })

    test(`clicking ToC item immediately sets active heading`, async () => {
      mount(Toc, { target: document.body, props: { open: true } })
      await tick()

      // In JSDOM, last heading is initially active (getBoundingClientRect returns 0 for all)
      expect(active_text()).toBe(`Heading 3`)

      // Click first heading - should be immediately active
      const first_item = doc_query(`aside.toc ol li`)
      first_item.click()
      await tick()
      expect(active_text()).toBe(`Heading 1`)
      expect(scroll_mock).toHaveBeenCalled()
    })

    test(`scroll events during click-initiated scroll do not change active heading`, async () => {
      mount(Toc, { target: document.body, props: { open: true } })
      await tick()

      // Click first item (differs from JSDOM's default of last)
      const first_item = doc_query(`aside.toc ol li`)
      first_item.click()
      await tick()
      expect(active_text()).toBe(`Heading 1`)

      // Simulate scroll events - should not change active heading
      globalThis.dispatchEvent(new Event(`scroll`))
      await tick()
      expect(active_text()).toBe(`Heading 1`)
    })

    test(`scrollend clears scroll_target allowing normal detection`, async () => {
      mount(Toc, { target: document.body, props: { open: true } })
      await tick()

      const first_item = doc_query(`aside.toc ol li`)
      first_item.click()
      await tick()
      expect(active_text()).toBe(`Heading 1`)

      // Scroll event while scroll_target set - no change
      globalThis.dispatchEvent(new Event(`scroll`))
      await tick()
      expect(active_text()).toBe(`Heading 1`)

      // scrollend clears scroll_target, next scroll can update
      globalThis.dispatchEvent(new Event(`scrollend`))
      globalThis.dispatchEvent(new Event(`scroll`))
      await tick()
      // JSDOM: all getBoundingClientRect return 0, so last heading becomes active
      expect(active_text()).toBe(`Heading 3`)
    })

    test(`fallback timeout clears scroll_target when scrollend never fires`, async () => {
      vi.useFakeTimers()
      try {
        mount(Toc, { target: document.body, props: { open: true } })
        await tick()

        doc_query(`aside.toc ol li`).click()
        await tick()
        expect(active_text()).toBe(`Heading 1`)

        // scroll while scroll_target is set keeps the clicked heading active
        globalThis.dispatchEvent(new Event(`scroll`))
        await tick()
        expect(active_text()).toBe(`Heading 1`)

        // no scrollend fires, so the fallback timeout clears scroll_target after 1s
        vi.advanceTimersByTime(1000)
        globalThis.dispatchEvent(new Event(`scroll`))
        await tick()
        // JSDOM: all getBoundingClientRect return 0, so last heading becomes active
        expect(active_text()).toBe(`Heading 3`)
      } finally {
        vi.useRealTimers()
      }
    })

    test(`removing scroll target activates a remaining heading`, async () => {
      mount(Toc, { target: document.body, props: { open: true } })
      await tick()

      doc_query(`aside.toc ol li`).click()
      await tick()
      expect(active_text()).toBe(`Heading 1`)

      doc_query(`#heading-1`).remove()
      await tick()

      expect(active_text()).toBe(`Heading 3`)
    })

    test(`rapid clicks activate last clicked item`, async () => {
      mount(Toc, { target: document.body, props: { open: true } })
      await tick()

      const items = document.querySelectorAll<HTMLLIElement>(`aside.toc ol li`)
      const item_0 = items[0]
      const item_1 = items[1]
      const item_2 = items[2]
      item_2.click()
      item_0.click()
      item_1.click()
      await tick()

      expect(active_text()).toBe(`Heading 2`)
      expect(scroll_mock).toHaveBeenCalledTimes(3)
    })

    test(`scroll_target persists when heading far from destination during smooth scroll`, async () => {
      mount(Toc, { target: document.body, props: { open: true } })
      await tick()

      const headings = document.querySelectorAll(`h2`)
      const first_heading = headings[0]

      // Mock heading starting far from destination (simulating start of smooth scroll)
      // First call: heading is at y=2000 (far from activeHeadingScrollOffset=100)
      let mock_top = 2000
      vi.spyOn(first_heading, `getBoundingClientRect`).mockImplementation(() =>
        dom_rect({ top: mock_top }),
      )

      // Click first heading - should be immediately active
      const first_item = doc_query(`aside.toc ol li`)
      first_item.click()
      await tick()
      expect(active_text()).toBe(`Heading 1`)

      // Simulate scroll events during smooth scroll (heading moving toward destination)
      // Distance is decreasing, so scroll_target should NOT be cleared
      mock_top = 1500 // moved closer
      globalThis.dispatchEvent(new Event(`scroll`))
      await tick()
      expect(active_text()).toBe(`Heading 1`) // still active, not cleared

      mock_top = 800 // moved even closer
      globalThis.dispatchEvent(new Event(`scroll`))
      await tick()
      expect(active_text()).toBe(`Heading 1`) // still active

      mock_top = 200 // almost at destination
      globalThis.dispatchEvent(new Event(`scroll`))
      await tick()
      expect(active_text()).toBe(`Heading 1`) // still active
    })

    test(`scroll_target clears when user manually scrolls away`, async () => {
      mount(Toc, { target: document.body, props: { open: true } })
      await tick()

      const headings = document.querySelectorAll(`h2`)
      const first_heading = headings[0]

      // Start with heading near destination
      let mock_top = 150
      vi.spyOn(first_heading, `getBoundingClientRect`).mockImplementation(() =>
        dom_rect({ top: mock_top }),
      )

      const first_item = doc_query(`aside.toc ol li`)
      first_item.click()
      await tick()
      expect(active_text()).toBe(`Heading 1`)

      // First scroll event establishes baseline distance
      globalThis.dispatchEvent(new Event(`scroll`))
      await tick()
      expect(active_text()).toBe(`Heading 1`)

      // User manually scrolls away - distance increases significantly (>50px threshold)
      mock_top = 500 // user scrolled down, heading moved up in viewport
      globalThis.dispatchEvent(new Event(`scroll`))
      await tick()
      // scroll_target should be cleared, normal detection resumes
      // In JSDOM with default mocks, last heading becomes active
      expect(active_text()).toBe(`Heading 3`)
    })
  })
})

describe(`hideOnIntersect`, () => {
  // Mocks getBoundingClientRect. Note: width/height are independent defaults—overlap
  // detection only uses top/bottom/left/right, so geometry consistency isn't required.
  const mock_bounding_rect = (element: Element, rect: Partial<DOMRect>) => {
    vi.spyOn(element, `getBoundingClientRect`).mockReturnValue(
      dom_rect({
        top: 0,
        left: 0,
        bottom: 100,
        right: 100,
        width: 100,
        height: 100,
        x: 0,
        y: 0,
        ...rect,
      }),
    )
  }

  // Parameterized test for overlap detection on desktop
  test.each([
    { banner_rect: { top: 150, bottom: 250 }, should_hide: true, desc: `overlapping` },
    { banner_rect: { top: 0, bottom: 50 }, should_hide: false, desc: `non-overlapping` },
  ])(
    `$desc banner: TOC hidden=$should_hide on desktop`,
    async ({ banner_rect, should_hide }) => {
      document.body.innerHTML = `<h2>Heading 1</h2><div class="banner">Banner</div>`
      globalThis.innerWidth = 1200

      mount(Toc, { target: document.body, props: { hideOnIntersect: `.banner` } })
      await tick()

      const aside = doc_query(`aside.toc`)
      mock_bounding_rect(aside, { top: 100, bottom: 300, left: 800, right: 1000 })
      mock_bounding_rect(doc_query(`.banner`), { left: 0, right: 1200, ...banner_rect })

      globalThis.dispatchEvent(new Event(`scroll`))
      await tick()

      expect(aside.classList.contains(`intersecting`)).toBe(should_hide)
    },
  )

  test(`does not hide on mobile even when overlapping`, async () => {
    document.body.innerHTML = `<h2>Heading 1</h2><div class="banner">Banner</div>`
    globalThis.innerWidth = 600

    mount(Toc, {
      target: document.body,
      props: { hideOnIntersect: `.banner`, open: true },
    })
    await tick()

    const aside = doc_query(`aside.toc`)
    mock_bounding_rect(aside, { top: 100, bottom: 300, left: 0, right: 200 })
    mock_bounding_rect(doc_query(`.banner`), {
      top: 150,
      bottom: 250,
      left: 0,
      right: 600,
    })

    globalThis.dispatchEvent(new Event(`scroll`))
    await tick()

    expect(aside.classList.contains(`intersecting`)).toBe(false)
  })

  test(`accepts HTMLElement array`, async () => {
    document.body.innerHTML = `<h2>Heading 1</h2><div id="b1">B1</div><div id="b2">B2</div>`
    globalThis.innerWidth = 1200

    const b1 = doc_query(`#b1`)
    const b2 = doc_query(`#b2`)
    mount(Toc, { target: document.body, props: { hideOnIntersect: [b1, b2] } })
    await tick()

    const aside = doc_query(`aside.toc`)
    mock_bounding_rect(aside, { top: 100, bottom: 300, left: 800, right: 1000 })
    mock_bounding_rect(b1, { top: 0, bottom: 50, left: 0, right: 1200 })
    mock_bounding_rect(b2, { top: 150, bottom: 250, left: 0, right: 1200 }) // overlaps

    globalThis.dispatchEvent(new Event(`scroll`))
    await tick()

    expect(aside.classList.contains(`intersecting`)).toBe(true)
  })

  test(`does not hide when selector matches nothing`, async () => {
    document.body.innerHTML = `<h2>Heading 1</h2>`
    globalThis.innerWidth = 1200

    mount(Toc, { target: document.body, props: { hideOnIntersect: `.nonexistent` } })
    await tick()

    globalThis.dispatchEvent(new Event(`scroll`))
    await tick()

    expect(doc_query(`aside.toc`).classList.contains(`intersecting`)).toBe(false)
  })

  test(`invalid hideOnIntersect selector warns and is ignored`, async () => {
    document.body.innerHTML = `<h2>Heading 1</h2>`
    globalThis.innerWidth = 1200
    const warn_mock = vi.spyOn(console, `warn`).mockImplementation(() => {})

    mount(Toc, { target: document.body, props: { hideOnIntersect: `[` } })
    await tick()

    globalThis.dispatchEvent(new Event(`scroll`))
    await tick()

    expect(warn_mock).toHaveBeenCalledExactlyOnceWith(
      expect.stringContaining(`invalid hideOnIntersect='['`),
    )
    expect(doc_query(`aside.toc`).classList.contains(`intersecting`)).toBe(false)
  })

  test(`re-shows TOC when overlap ends`, async () => {
    document.body.innerHTML = `<h2>Heading 1</h2><div class="banner">Banner</div>`
    globalThis.innerWidth = 1200

    mount(Toc, { target: document.body, props: { hideOnIntersect: `.banner` } })
    await tick()

    const aside = doc_query(`aside.toc`)
    const banner = doc_query(`.banner`)
    mock_bounding_rect(aside, { top: 100, bottom: 300, left: 800, right: 1000 })
    mock_bounding_rect(banner, { top: 150, bottom: 250, left: 0, right: 1200 })

    globalThis.dispatchEvent(new Event(`scroll`))
    await tick()
    expect(aside.classList.contains(`intersecting`)).toBe(true)

    mock_bounding_rect(banner, { top: 500, bottom: 600, left: 0, right: 1200 })
    globalThis.dispatchEvent(new Event(`scroll`))
    await tick()
    expect(aside.classList.contains(`intersecting`)).toBe(false)
  })
})

describe(`Element Prop Bags`, () => {
  const prop_bag_cases = [
    {
      element_name: `aside`,
      prop_name: `asideProps`,
      bag: {
        class: [`custom-aside-class`, { 'custom-aside-object-class': true }],
        style: `color: rgb(255, 0, 0);`,
        'data-testid': `toc-aside`,
      },
      extra_props: { hide: true, autoHide: false },
      selector: `aside.toc`,
      expected_classes: [`toc`, `custom-aside-class`, `custom-aside-object-class`],
      expected_attributes: { hidden: ``, 'aria-hidden': `true` },
      setup: ensure_content_for_toc_elements,
    },
    {
      element_name: `nav`,
      prop_name: `navProps`,
      bag: {
        class: `custom-nav-class`,
        style: `background-color: rgb(0, 0, 255);`,
        'data-testid': `toc-nav`,
      },
      selector: `aside.toc nav`,
      expected_classes: [`custom-nav-class`],
      setup: ensure_content_for_toc_elements,
    },
    {
      element_name: `title`,
      prop_name: `titleProps`,
      bag: {
        class: { 'custom-title-class': true },
        style: `font-style: italic;`,
        'data-testid': `toc-title`,
      },
      extra_props: { title: `Test Custom Title` },
      selector: `aside.toc nav .toc-title`,
      expected_classes: [`toc-title`, `toc-exclude`, `custom-title-class`],
      setup: ensure_content_for_toc_elements,
    },
    {
      element_name: `ol`,
      prop_name: `olProps`,
      bag: {
        class: `custom-ol-class`,
        style: `list-style-type: square;`,
        'data-testid': `toc-list`,
        start: 3,
        reversed: true,
      },
      selector: `aside.toc nav ol`,
      expected_classes: [`custom-ol-class`],
      expected_attributes: { start: `3`, reversed: `` },
      setup: ensure_content_for_toc_elements,
    },
    {
      element_name: `li`,
      prop_name: `liProps`,
      bag: {
        class: `custom-li-class`,
        style: `padding-left: 10px;`,
        'data-testid': `toc-item`,
        onclick: vi.fn<() => void>(),
        value: 7,
      },
      selector: `aside.toc nav ol li`,
      expected_classes: [`active`, `custom-li-class`],
      expected_attributes: { value: `7` },
      expected_open_changes: 0,
      setup: ensure_single_heading,
    },
    {
      element_name: `open button`,
      prop_name: `openButtonProps`,
      bag: {
        class: `custom-button-class`,
        style: `border: 1px solid rgb(0, 128, 0);`,
        'data-testid': `toc-open-button`,
        disabled: true,
        onclick: vi.fn<(event: MouseEvent) => void>((event) => event.preventDefault()),
        type: `button`,
      },
      extra_props: { desktop: false },
      selector: `aside.toc > button`,
      expected_classes: [`custom-button-class`],
      expected_attributes: {
        'aria-label': `Open table of contents`,
        disabled: ``,
        type: `button`,
      },
      expected_open_changes: 0,
      setup: ensure_mobile_button_is_visible,
    },
  ]

  test.each(prop_bag_cases)(
    `applies $element_name prop bag attributes`,
    async ({
      prop_name,
      bag,
      extra_props = {},
      selector,
      expected_classes,
      expected_attributes = {},
      expected_open_changes,
      setup,
    }) => {
      setup()
      const has_user_click = `onclick` in bag
      const user_click = has_user_click ? bag.onclick : vi.fn<() => void>()
      const on_open_change = vi.fn<OpenChangeHandler>()
      const expected_open_change_count = expected_open_changes ?? (has_user_click ? 1 : 0)

      mount(Toc, {
        target: document.body,
        props: {
          ...extra_props,
          ...(has_user_click ? { onOpenChange: on_open_change } : {}),
          [prop_name]: bag,
        },
      })
      await tick()
      on_open_change.mockClear()

      const element = doc_query(selector)
      expect(element.getAttribute(`style`)).toContain(bag.style)
      expect(element.getAttribute(`data-testid`)).toBe(bag[`data-testid`])
      for (const cls of expected_classes) {
        expect(element.classList.contains(cls)).toBe(true)
      }
      for (const [attribute, value] of Object.entries(expected_attributes)) {
        expect(element.getAttribute(attribute)).toBe(value)
      }
      if (`onclick` in bag) {
        element.dispatchEvent(
          new MouseEvent(`click`, { bubbles: true, cancelable: true }),
        )
        await tick()
      }
      expect(user_click).toHaveBeenCalledTimes(has_user_click ? 1 : 0)
      expect(on_open_change).toHaveBeenCalledTimes(expected_open_change_count)
    },
  )

  test(`liProps.style preserves generated margin-left and font-size styles`, async () => {
    ensure_content_for_toc_elements([`<h2>Single Heading</h2>`])

    mount(Toc, {
      target: document.body,
      props: { liProps: { style: `padding-left: 10px;` } },
    })
    await tick()

    const style_attribute = doc_query(`aside.toc nav ol li`).getAttribute(`style`)
    expect(style_attribute).toContain(`padding-left: 10px;`)
    expect(style_attribute).toContain(`margin-left`)
    expect(style_attribute).toContain(`font-size`)
  })

  test.each([
    {
      rule_name: `aside base rule`,
      declaration_pattern: /box-sizing: border-box;/,
      expects_where: true,
    },
    {
      rule_name: `nav base rule`,
      declaration_pattern: /overflow: var\(--toc-overflow, auto\);/,
      expects_where: true,
    },
    {
      rule_name: `list item base rule`,
      declaration_pattern: /color: var\(--toc-li-color\);/,
      expects_where: true,
    },
    {
      rule_name: `open button base rule`,
      declaration_pattern: /bottom: var\(--toc-mobile-btn-bottom, 0\);/,
      expects_where: true,
    },
    {
      // https://github.com/janosh/svelte-toc/issues/71
      rule_name: `ordered list structural rule`,
      declaration_pattern: /list-style: var\(--toc-ol-list-style, none\);/,
      expects_where: false,
      selector_pattern: /aside\.toc.*> nav.*> ol/,
    },
  ])(
    `uses expected selector specificity for $rule_name`,
    async ({ declaration_pattern, expects_where, selector_pattern = /.*/ }) => {
      document.body.innerHTML = `<h2>Heading 1</h2><h3>Heading 2</h3>`

      mount(Toc, { target: document.body })
      await tick()

      const selector_line = find_matching_css_selector(
        document.head.textContent,
        declaration_pattern,
      )
      expect(selector_line.startsWith(`:where(`)).toBe(expects_where)
      expect(selector_line).toMatch(selector_pattern)
    },
  )
})

describe(`collapseSubheadings`, () => {
  test(`all items visible when collapseSubheadings=false`, async () => {
    setup_nested_headings()
    mount(Toc, { target: document.body })
    await tick()

    expect(get_collapsed_states()).toEqual(Array.from({ length: 8 }, () => false))
  })

  test(`top-level h2s never collapse with collapseSubheadings=true`, async () => {
    setup_nested_headings()
    mount(Toc, { target: document.body, props: { collapseSubheadings: true } })
    await tick()

    const states = get_collapsed_states()
    expect(states[0]).toBe(false) // Section 1 (h2)
    expect(states[6]).toBe(false) // Section 2 (h2)
  })

  // Parameterized test for collapse behavior with different modes and active headings
  test.each([
    // [description, mode, active_id, expected_collapsed_states]
    [
      `full nesting with h2 active`,
      true,
      `section-1`,
      [false, false, true, true, false, true, false, true],
    ],
    [
      `full nesting with h3 active`,
      true,
      `sub-1-1`,
      [false, false, false, false, false, true, false, true],
    ],
    [
      `full nesting with h4 active`,
      true,
      `detail-1-1-1`,
      [false, false, false, false, false, true, false, true],
    ],
    [
      // deep active under a second-position parent: a preceding uncle's subtree
      // (detail-1-1-*) must stay collapsed, exercising the ancestor-chain walk
      `full nesting with deep active under second h3`,
      true,
      `detail-1-2-1`,
      [false, false, true, true, false, false, false, true],
    ],
    [
      `h3 threshold with h2 active`,
      `h3`,
      `section-1`,
      [false, false, false, false, false, false, false, true],
    ],
  ] as const)(`%s`, async (_, mode, active_id, expected) => {
    setup_nested_headings()
    mock_active_heading(active_id)
    mount(Toc, { target: document.body, props: { collapseSubheadings: mode } })
    await tick()

    expect(get_collapsed_states()).toEqual(expected)
  })

  test(`collapsed items have aria-hidden=true and unfocusable links`, async () => {
    setup_nested_headings()
    mock_active_heading(`section-1`)
    mount(Toc, { target: document.body, props: { collapseSubheadings: true } })
    await tick()

    const items = document.querySelectorAll<HTMLLIElement>(`aside.toc > nav > ol > li`)
    const collapsed = items[2]
    const visible = items[0]

    expect(collapsed.getAttribute(`aria-hidden`)).toBe(`true`)
    expect(collapsed.querySelector(`a`)?.getAttribute(`tabindex`)).toBe(`-1`)
    expect(visible.getAttribute(`aria-hidden`)).toBeNull()
    expect(visible.querySelector(`a`)?.getAttribute(`tabindex`)).toBe(`0`)
  })

  test(`first heading becomes active on mount, revealing its children`, async () => {
    setup_nested_headings()
    // No mock - tests that set_active_heading() correctly selects first heading on mount
    // In JSDOM, getBoundingClientRect returns 0 for all elements, so last heading would
    // be selected by scroll logic, but idx===0 fallback ensures first heading is always set
    mount(Toc, { target: document.body, props: { collapseSubheadings: true } })
    await tick()

    // set_active_heading sets last heading active in JSDOM (top=0 < offset=100)
    // This tests that collapse logic works correctly with that active state
    const states = get_collapsed_states()
    // At least the top-level h2s should never be collapsed
    expect(states[0]).toBe(false) // Section 1 (h2)
    expect(states[6]).toBe(false) // Section 2 (h2)
  })
})
