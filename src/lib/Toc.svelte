<script lang="ts">
  import type { Snippet } from 'svelte'
  import { untrack } from 'svelte'
  import type { HTMLAttributes, SVGAttributes } from 'svelte/elements'
  import { blur, type BlurParams } from 'svelte/transition'
  import type { CollapseMode } from './index'

  let {
    activeHeading = $bindable(null),
    activeHeadingScrollOffset = 100,
    activeTocLi = $bindable(null),
    aside = $bindable(),
    breakpoint = 1000,
    desktop = $bindable(true),
    flashClickedHeadingsFor = 1500,
    getHeadingIds = (node: HTMLHeadingElement): string => node.id,
    getHeadingLevels = (node: HTMLHeadingElement): number => Number(node.nodeName[1]),
    getHeadingTitles = (node: HTMLHeadingElement): string => node.textContent ?? ``,
    headings = $bindable([]),
    headingSelector = `:is(h2, h3, h4):not(.toc-exclude)`,
    hide = $bindable(false),
    hideOnIntersect = null,
    autoHide = true,
    keepActiveTocItemInView = true,
    minItems = 0,
    nav = $bindable(),
    open = $bindable(false),
    openButtonLabel = `Open table of contents`,
    reactToKeys = [`ArrowDown`, `ArrowUp`, ` `, `Enter`, `Escape`, `Tab`],
    scrollBehavior = `smooth`,
    title = `On this page`,
    titleTag = `h2`,
    tocItems = $bindable([]),
    warnOnEmpty = false,
    collapseSubheadings = false,
    blurParams = { duration: 200 },
    openTocIcon,
    titleSnippet,
    tocItem,
    onOpen,
    asideStyle = ``,
    asideClass = ``,
    navStyle = ``,
    navClass = ``,
    titleElementStyle = ``,
    titleElementClass = ``,
    olStyle = ``,
    olClass = ``,
    liStyle = ``,
    liClass = ``,
    openButtonStyle = ``,
    openButtonClass = ``,
    openButtonIconProps = {},
    ...rest
  }: {
    activeHeading?: HTMLHeadingElement | null
    activeHeadingScrollOffset?: number
    activeTocLi?: HTMLLIElement | null
    aside?: HTMLElement | undefined
    breakpoint?: number // in pixels (smaller window width is considered mobile, larger is desktop)
    desktop?: boolean
    flashClickedHeadingsFor?: number
    getHeadingIds?: (node: HTMLHeadingElement) => string
    getHeadingLevels?: (node: HTMLHeadingElement) => number
    getHeadingTitles?: (node: HTMLHeadingElement) => string
    // the result of document.querySelectorAll(headingSelector). can be useful for binding
    headings?: HTMLHeadingElement[]
    headingSelector?: string
    hide?: boolean
    hideOnIntersect?: string | HTMLElement[] | null
    autoHide?: boolean
    keepActiveTocItemInView?: boolean // requires scrollend event browser support
    minItems?: number
    nav?: HTMLElement | undefined
    open?: boolean
    openButtonLabel?: string
    reactToKeys?: string[]
    scrollBehavior?: `auto` | `smooth`
    title?: string
    titleTag?: string
    tocItems?: HTMLLIElement[]
    warnOnEmpty?: boolean
    // collapse subheadings under inactive parent headings
    // true = full nested collapse (each level collapses independently)
    // 'h3' = h3 is deepest collapsing level, h4+ expand together when h3 ancestor visible
    collapseSubheadings?: CollapseMode
    blurParams?: BlurParams | undefined
    openTocIcon?: Snippet
    titleSnippet?: Snippet
    tocItem?: Snippet<[HTMLHeadingElement]>
    // Add callback prop for open event
    onOpen?: (event: { open: boolean }) => void
    asideStyle?: string
    asideClass?: string
    navStyle?: string
    navClass?: string
    titleElementStyle?: string
    titleElementClass?: string
    olStyle?: string
    olClass?: string
    liStyle?: string
    liClass?: string
    openButtonStyle?: string
    openButtonClass?: string
    openButtonIconProps?: SVGAttributes<SVGSVGElement>
  } & HTMLAttributes<HTMLElementTagNameMap[`aside`]> = $props()

  let window_width: number = $state(0)
  // page_has_scrolled controls ignoring spurious scrollend events on page load before any actual
  // scrolling in chrome. see https://github.com/janosh/svelte-toc/issues/57
  let page_has_scrolled: boolean = $state(false)
  // tracks whether TOC overlaps with any hideOnIntersect elements (desktop only)
  let intersecting: boolean = $state(false)

  let levels: number[] = $derived(headings.map(getHeadingLevels))
  let minLevel: number = $derived(Math.min(...levels) || 0)

  // Collapse threshold: true -> 6 (full nesting), 'h3' -> 3, false -> Infinity
  let collapse_threshold: number = $derived(
    collapseSubheadings === true
      ? 6
      : typeof collapseSubheadings === `string`
      ? parseInt(collapseSubheadings.slice(1), 10)
      : Infinity,
  )

  // Check if heading at idx is "expanded" (active or contains active in subtree)
  function is_expanded(idx: number): boolean {
    if (headings[idx] === activeHeading) return true
    const level = levels[idx]
    for (let jdx = idx + 1; jdx < headings.length && levels[jdx] > level; jdx++) {
      if (headings[jdx] === activeHeading) return true
    }
    return false
  }

  // Memoized visibility array - computed once per render cycle
  let heading_visibility: boolean[] = $derived.by(() => {
    if (!collapseSubheadings || activeHeading === null) {
      return Array(headings.length).fill(true)
    }

    const visible: boolean[] = []
    for (let idx = 0; idx < headings.length; idx++) {
      const level = levels[idx]
      if (level === minLevel) {
        visible.push(true) // top-level always visible
      } else if (level <= collapse_threshold) {
        // Find immediate parent and check if expanded
        let parent_idx = idx - 1
        while (parent_idx >= 0 && levels[parent_idx] >= level) parent_idx--
        visible.push(parent_idx < 0 || is_expanded(parent_idx))
      } else {
        // Beyond threshold - chain to nearest ancestor at threshold level
        let ancestor_idx = idx - 1
        while (ancestor_idx >= 0 && levels[ancestor_idx] > collapse_threshold) {
          ancestor_idx--
        }
        visible.push(
          ancestor_idx < 0 || levels[ancestor_idx] < collapse_threshold ||
            visible[ancestor_idx],
        )
      }
    }
    return visible
  })

  $effect(() => onOpen?.({ open }))
  $effect(() => {
    desktop = window_width > breakpoint
  })

  // Re-check overlap when headings or hideOnIntersect change
  $effect(() => {
    void headings // track headings as dependency
    void hideOnIntersect // track prop changes
    check_toc_overlap()
  })

  function close(event: MouseEvent) {
    if (!aside?.contains(event.target as Node)) open = false
  }

  // (re-)query headings on mount and on route changes
  function update_toc_headings() {
    if (typeof document === `undefined`) return // for SSR

    const new_headings = Array.from(
      document.querySelectorAll(headingSelector),
    ) as HTMLHeadingElement[]

    // Use untrack to avoid creating dependencies on the state we're about to modify
    untrack(() => {
      headings = new_headings
      set_active_heading()
      if (headings.length === 0) {
        if (warnOnEmpty) {
          console.warn(
            `svelte-toc found no headings for headingSelector='${headingSelector}'. ${
              autoHide ? `Hiding` : `Showing empty`
            } table of contents.`,
          )
        }
        if (autoHide) hide = true
      } else if (hide && autoHide) hide = false
    })
  }

  $effect(update_toc_headings)

  $effect(() => {
    const observer = new MutationObserver(update_toc_headings)

    // Configure the observer to watch for changes in the DOM structure
    observer.observe(document.body, {
      childList: true, // Watch for added/removed nodes
      subtree: true, // Watch all descendants, not just direct children
      characterData: true, // Watch for text content changes
    })

    return () => observer.disconnect()
  })

  function set_active_heading() {
    let idx = headings.length
    while (idx--) {
      const { top } = headings[idx].getBoundingClientRect()

      // loop through headings from last to first until we find one that the viewport already
      // scrolled past. if none is found, set make first heading active
      if (top < activeHeadingScrollOffset || idx === 0) {
        activeHeading = headings[idx]
        activeTocLi = tocItems[idx]
        return // exit while loop if updated active heading
      }
    }
  }

  // check if TOC overlaps with any hideOnIntersect elements (desktop only)
  function check_toc_overlap() {
    if (!hideOnIntersect || !aside || !desktop) {
      intersecting = false
      return
    }

    const elements = typeof hideOnIntersect === `string`
      ? Array.from(document.querySelectorAll(hideOnIntersect))
      : hideOnIntersect

    const toc = aside.getBoundingClientRect()
    intersecting = elements.some((el) => {
      const rect = el.getBoundingClientRect()
      return !(toc.right < rect.left || toc.left > rect.right ||
        toc.bottom < rect.top || toc.top > rect.bottom)
    })
  }

  // click and key handler for ToC items that scrolls to the heading
  const li_click_key_handler =
    (node: HTMLHeadingElement) => (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent && ![`Enter`, ` `].includes(event.key)) {
        return
      }
      open = false
      node.scrollIntoView?.({ behavior: scrollBehavior, block: `start` })

      const id = getHeadingIds(node)
      if (id) history.replaceState({}, ``, `#${id}`)

      if (flashClickedHeadingsFor) {
        node.classList.add(`toc-clicked`)
        setTimeout(
          () => node.classList.remove(`toc-clicked`),
          flashClickedHeadingsFor,
        )
      }
    }

  function scroll_to_active_toc_item(
    behavior: `auto` | `smooth` | `instant` = `smooth`,
  ) {
    if (keepActiveTocItemInView && activeTocLi && nav) {
      // scroll the active ToC item into the middle of the ToC container
      const top = activeTocLi?.offsetTop - nav.offsetHeight / 2
      nav?.scrollTo?.({ top, behavior })
    }
  }

  // ensure active ToC is in view when ToC opens on mobile
  $effect(() => {
    if (open && nav) {
      set_active_heading()
      scroll_to_active_toc_item(`instant`)
    }
  })

  // enable keyboard navigation
  function on_keydown(event: KeyboardEvent) {
    if (!reactToKeys || !reactToKeys.includes(event.key)) return

    // `:hover`.at(-1) returns the most deeply nested hovered element
    const hovered = [...document.querySelectorAll(`:hover`)].at(-1)
    const toc_is_hovered = hovered && nav?.contains(hovered)

    if (
      // return early if ToC does not have focus
      (event.key === `Tab` && !nav?.contains(document.activeElement)) ||
      // ignore keyboard events when ToC is closed on mobile or when ToC is not currently hovered on desktop
      (!desktop && !open) ||
      (desktop && !toc_is_hovered)
    ) return

    event.preventDefault()

    if (event.key === `Escape` && open) open = false
    else if (event.key === `Tab` && !aside?.contains(document.activeElement)) {
      open = false
    } else if (activeTocLi) {
      if (event.key === `ArrowDown`) {
        let next = activeTocLi.nextElementSibling as HTMLLIElement | null
        // skip collapsed items when collapseSubheadings is enabled
        while (next?.classList.contains(`collapsed`)) {
          next = next.nextElementSibling as HTMLLIElement | null
        }
        if (next) activeTocLi = next
      }
      if (event.key === `ArrowUp`) {
        let prev = activeTocLi.previousElementSibling as HTMLLIElement | null
        // skip collapsed items when collapseSubheadings is enabled
        while (prev?.classList.contains(`collapsed`)) {
          prev = prev.previousElementSibling as HTMLLIElement | null
        }
        if (prev) activeTocLi = prev
      }
      // update active heading
      activeHeading = headings[tocItems.indexOf(activeTocLi)]
    }
    if (activeTocLi && [` `, `Enter`].includes(event.key)) {
      activeHeading?.scrollIntoView({ behavior: `instant`, block: `start` })
    }
  }
</script>

<svelte:window
  bind:innerWidth={window_width}
  onscroll={() => {
    page_has_scrolled = true
    set_active_heading()
    check_toc_overlap()
  }}
  onclick={close}
  onscrollend={() => {
    if (!page_has_scrolled) return
    // wait for scroll end since Chrome doesn't support multiple simultaneous scrolls,
    // smooth or otherwise (https://stackoverflow.com/a/63563437)
    scroll_to_active_toc_item()
  }}
  onresize={() => {
    desktop = window_width > breakpoint
    set_active_heading()
    check_toc_overlap()
  }}
  onkeydown={on_keydown}
/>

<aside
  {...rest}
  class="toc {asideClass || null}"
  class:collapsible={collapseSubheadings}
  class:desktop
  class:hidden={hide}
  class:intersecting
  class:mobile={!desktop}
  bind:this={aside}
  hidden={hide}
  aria-hidden={hide || intersecting}
  style={asideStyle || null}
>
  {#if !open && !desktop && headings.length >= minItems}
    <button
      onclick={(event) => {
        event.stopPropagation()
        event.preventDefault()
        open = true
      }}
      aria-label={openButtonLabel}
      class={openButtonClass || null}
      style={openButtonStyle || null}
    >
      {#if openTocIcon}{@render openTocIcon()}{:else}
        <!-- https://iconify.design/icon-sets/heroicons-solid/menu.html -->
        <svg width="1em" {...openButtonIconProps} viewBox="0 0 20 20" fill="currentColor">
          <path
            d="M3 5a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1zm0 5a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1zm0 5a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1z"
          />
        </svg>
      {/if}
    </button>
  {/if}
  {#if open || (desktop && headings.length >= minItems)}
    <nav
      transition:blur={blurParams}
      bind:this={nav}
      class={navClass || null}
      style={navStyle || null}
    >
      {#if title}
        {#if titleSnippet}
          {@render titleSnippet()}
        {:else}
          <svelte:element
            this={titleTag}
            class="toc-title toc-exclude {titleElementClass || null}"
            style={titleElementStyle || null}
          >
            {title}
          </svelte:element>
        {/if}
      {/if}
      <ol role="menu" class={olClass || null} style={olStyle || null}>
        {#each headings as heading, idx (`${idx}-${heading.id}`)}
          {@const indent = levels[idx] - minLevel}
          {@const collapsed = collapseSubheadings && !heading_visibility[idx]}
          <li
            role="menuitem"
            tabindex={collapsed ? -1 : 0}
            class:active={heading === activeHeading}
            class:collapsed
            aria-hidden={collapsed || undefined}
            class={liClass || null}
            bind:this={tocItems[idx]}
            style={liStyle || null}
            style:margin-left="calc({indent} * var(--toc-indent-per-level, 1em))"
            style:font-size="max(var(--toc-li-font-size-min, 2ex), calc(var(--toc-li-font-size-base, 3ex) - {indent} * var(--toc-li-font-size-step, 0.1ex)))"
            onclick={li_click_key_handler(heading)}
            onkeydown={li_click_key_handler(heading)}
          >
            {#if tocItem}
              {@render tocItem(heading)}
            {:else}
              {getHeadingTitles(heading)}
            {/if}
          </li>
        {/each}
      </ol>
    </nav>
  {/if}
</aside>

<style>
  :where(aside.toc) {
    box-sizing: border-box;
    height: max-content;
    overflow-wrap: break-word;
    font-size: var(--toc-font-size, 0.7em);
    min-width: var(--toc-min-width, 15em);
    width: var(--toc-width);
    z-index: var(--toc-z-index);
    text-wrap: var(--toc-text-wrap, balance);
    transition: opacity 0.15s;
  }
  :where(aside.toc > nav) {
    overflow: var(--toc-overflow, auto);
    overscroll-behavior: contain;
    max-height: var(--toc-max-height, 90vh);
    padding: var(--toc-padding, 1em 1em 0 3em);
    position: relative;
  }
  :where(aside.toc > nav > ol) {
    list-style: var(--toc-ol-list-style, none);
    padding: var(--toc-ol-padding, 0);
    margin: var(--toc-ol-margin);
  }
  :where(.toc-title) {
    padding: var(--toc-title-padding);
    margin: var(--toc-title-margin, 1em 0);
    font-size: var(--toc-title-font-size, initial);
    color: var(--toc-title-color);
    font-weight: var(--toc-title-font-weight);
  }
  :where(aside.toc > nav > ol > li) {
    cursor: pointer;
    color: var(--toc-li-color);
    background: var(--toc-li-bg);
    border: var(--toc-li-border);
    border-radius: var(--toc-li-border-radius);
    margin: var(--toc-li-margin);
    padding: var(--toc-li-padding, 2pt 4pt);
    font: var(--toc-li-font);
    transition: var(--toc-li-transition);
  }
  :where(aside.toc > nav > ol > li:focus-visible) {
    outline: var(--toc-focus-outline, 2px solid currentColor);
    outline-offset: var(--toc-focus-outline-offset, 1px);
  }
  :where(aside.toc.collapsible > nav > ol > li) {
    max-height: var(--toc-li-max-height, 10em);
    overflow: hidden;
    transition:
      max-height var(--toc-collapse-duration, 0.2s) ease-out,
      opacity var(--toc-collapse-duration, 0.2s) ease-out,
      padding var(--toc-collapse-duration, 0.2s) ease-out,
      margin var(--toc-collapse-duration, 0.2s) ease-out;
  }
  :where(aside.toc.collapsible > nav > ol > li.collapsed) {
    max-height: 0;
    opacity: 0;
    padding-block: 0;
    margin-block: 0;
  }
  :where(aside.toc > nav > ol > li:hover) {
    color: var(--toc-li-hover-color);
    background: var(--toc-li-hover-bg);
  }
  :where(aside.toc > nav > ol > li.active) {
    background: var(--toc-active-bg);
    color: var(--toc-active-color);
    font: var(--toc-active-li-font);
    text-shadow: var(--toc-active-text-shadow);
    border: var(--toc-active-border);
    border-width: var(--toc-active-border-width);
    border-radius: var(--toc-active-border-radius, 2pt);
  }
  :where(aside.toc > button) {
    border: none;
    bottom: var(--toc-mobile-btn-bottom, 0);
    cursor: pointer;
    font: var(--toc-mobile-btn-font, 2em sans-serif);
    line-height: var(--toc-mobile-btn-line-height, 0);
    position: absolute;
    right: var(--toc-mobile-btn-right, 0);
    z-index: var(--toc-mobile-btn-z-index, 2);
    padding: var(--toc-mobile-btn-padding, 2pt 3pt);
    border-radius: var(--toc-mobile-btn-border-radius, 4pt);
    background: var(--toc-mobile-btn-bg, rgba(255, 255, 255, 0.2));
    color: var(--toc-mobile-btn-color, black);
  }
  :where(aside.toc > nav > .toc-title) {
    margin-top: var(--toc-title-margin-top, 0);
  }

  :where(aside.toc.mobile) {
    position: fixed;
    bottom: var(--toc-mobile-bottom, 1em);
    right: var(--toc-mobile-right, 1em);
  }
  :where(aside.toc.mobile > nav) {
    border-radius: var(--toc-mobile-border-radius, 3pt);
    right: var(--toc-mobile-right, 1em);
    z-index: -1;
    box-sizing: border-box;
    background: var(--toc-mobile-bg, white);
    width: var(--toc-mobile-width, 18em);
    box-shadow: var(--toc-mobile-shadow);
    border: var(--toc-mobile-border);
  }
  :where(aside.toc.desktop) {
    position: sticky;
    background: var(--toc-desktop-bg);
    margin: var(--toc-desktop-aside-margin);
    max-width: var(--toc-desktop-max-width);
    top: var(--toc-desktop-sticky-top, 2em);
  }

  :where(aside.toc.desktop > nav) {
    margin: var(--toc-desktop-nav-margin);
  }
  :where(aside.toc.intersecting) {
    opacity: 0;
    pointer-events: none;
  }
</style>
