<script lang="ts">
  import type { Snippet } from 'svelte'
  import { blur, type BlurParams } from 'svelte/transition'
  import { MenuIcon } from '.'

  interface Props {
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
    autoHide?: boolean
    keepActiveTocItemInView?: boolean // requires scrollend event browser support
    minItems?: number
    nav?: HTMLElement | undefined
    open?: boolean
    openButtonLabel?: string
    // prettier-ignore
    reactToKeys?: string[];
    scrollBehavior?: `auto` | `smooth`
    title?: string
    titleTag?: string
    tocItems?: HTMLLIElement[]
    warnOnEmpty?: boolean
    blurParams?: BlurParams | undefined
    open_toc_icon?: Snippet
    title_snippet?: Snippet
    toc_item?: Snippet<[HTMLHeadingElement]>
    // Add callback prop for open event
    onOpen?: (event: { open: boolean }) => void
  }
  let {
    activeHeading = $bindable(null),
    activeHeadingScrollOffset = 100,
    activeTocLi = $bindable(null),
    aside = $bindable(undefined),
    breakpoint = 1000,
    desktop = $bindable(true),
    flashClickedHeadingsFor = 1500,
    getHeadingIds = (node: HTMLHeadingElement): string => node.id,
    getHeadingLevels = (node: HTMLHeadingElement): number => Number(node.nodeName[1]),
    getHeadingTitles = (node: HTMLHeadingElement): string => node.textContent ?? ``,
    headings = $bindable([]),
    headingSelector = `:is(h2, h3, h4):not(.toc-exclude)`,
    hide = $bindable(false),
    autoHide = true,
    keepActiveTocItemInView = true,
    minItems = 0,
    nav = $bindable(undefined),
    open = $bindable(false),
    openButtonLabel = `Open table of contents`,
    reactToKeys = [`ArrowDown`, `ArrowUp`, ` `, `Enter`, `Escape`, `Tab`],
    scrollBehavior = `smooth`,
    title = `On this page`,
    titleTag = `h2`,
    tocItems = $bindable([]),
    warnOnEmpty = false,
    blurParams = { duration: 200 },
    open_toc_icon,
    title_snippet,
    toc_item,
    onOpen,
  }: Props = $props()

  let window_width: number = $state(0)
  // page_has_scrolled controls ignoring spurious scrollend events on page load before any actual
  // scrolling in chrome. see https://github.com/janosh/svelte-toc/issues/57
  let page_has_scrolled: boolean = $state(false)

  let levels: number[] = $derived(headings.map(getHeadingLevels))
  let minLevel: number = $derived(Math.min(...levels) || 0)
  $effect(() => onOpen?.({ open }))
  $effect(() => {
    desktop = window_width > breakpoint
  })

  function close(event: MouseEvent) {
    if (!aside?.contains(event.target as Node)) open = false
  }

  // (re-)query headings on mount and on route changes
  function update_toc_headings() {
    if (typeof document === `undefined`) return // for SSR

    headings = [...document.querySelectorAll(headingSelector)] as HTMLHeadingElement[]
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
    } else if (hide && autoHide) {
      hide = false
    }
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

  // click and key handler for ToC items that scrolls to the heading
  const li_click_key_handler =
    (node: HTMLHeadingElement) => (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent && ![`Enter`, ` `].includes(event.key)) return
      open = false
      node.scrollIntoView?.({ behavior: scrollBehavior, block: `start` })

      const id = getHeadingIds && getHeadingIds(node)
      if (id) history.replaceState({}, ``, `#${id}`)

      if (flashClickedHeadingsFor) {
        node.classList.add(`toc-clicked`)
        setTimeout(() => node.classList.remove(`toc-clicked`), flashClickedHeadingsFor)
      }
    }

  function scroll_to_active_toc_item(behavior: `auto` | `smooth` | `instant` = `smooth`) {
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
    )
      return

    event.preventDefault()

    if (event.key === `Escape` && open) open = false
    else if (event.key === `Tab` && !aside?.contains(document.activeElement)) open = false
    else if (activeTocLi) {
      if (event.key === `ArrowDown`) {
        const next = activeTocLi.nextElementSibling
        if (next) activeTocLi = next as HTMLLIElement
      }
      if (event.key === `ArrowUp`) {
        const prev = activeTocLi.previousElementSibling
        if (prev) activeTocLi = prev as HTMLLIElement
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
  }}
  onkeydown={on_keydown}
/>

<aside
  class="toc"
  class:desktop
  class:hidden={hide}
  class:mobile={!desktop}
  bind:this={aside}
  hidden={hide}
  aria-hidden={hide}
>
  {#if !open && !desktop && headings.length >= minItems}
    <button
      onclick={(event) => {
        event.stopPropagation()
        event.preventDefault()
        open = true
      }}
      aria-label={openButtonLabel}
    >
      {#if open_toc_icon}{@render open_toc_icon()}{:else}
        <MenuIcon width="1em" />
      {/if}
    </button>
  {/if}
  {#if open || (desktop && headings.length >= minItems)}
    <nav transition:blur={blurParams} bind:this={nav}>
      {#if title}
        {#if title_snippet}
          {@render title_snippet()}
        {:else}
          <svelte:element this={titleTag} class="toc-title toc-exclude">
            {title}
          </svelte:element>
        {/if}
      {/if}
      <ol role="menu">
        {#each headings as heading, idx (`${idx}-${heading.id}`)}
          {@const level = getHeadingLevels(heading)}
          {@const indent = level - minLevel}
          {@const title = getHeadingTitles(heading)}
          <li
            role="menuitem"
            class:active={heading === activeHeading}
            bind:this={tocItems[idx]}
            style:margin-left="{indent}em"
            style:font-size="{Math.max(3 - indent * 0.1, 2)}ex"
            onclick={li_click_key_handler(heading)}
            onkeydown={li_click_key_handler(heading)}
          >
            {#if toc_item}
              {@render toc_item(heading)}
            {:else}
              {title}
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
    font-size: var(--toc-font-size);
    min-width: var(--toc-min-width);
    width: var(--toc-width);
    z-index: var(--toc-z-index, 1);
  }
  :where(aside.toc > nav) {
    overflow: var(--toc-overflow, auto);
    overscroll-behavior: contain;
    max-height: var(--toc-max-height, 90vh);
    padding: var(--toc-padding, 1em 1em 0);
  }
  :where(aside.toc > nav > ol) {
    list-style: var(--toc-ol-list-style, none);
    padding: var(--toc-ol-padding, 0);
    margin: var(--toc-ol-margin);
  }
  :where(.toc-title) {
    padding: var(--toc-title-padding);
    margin: var(--toc-title-margin);
  }
  :where(aside.toc > nav > ol > li) {
    cursor: pointer;
    color: var(--toc-li-color);
    border: var(--toc-li-border);
    border-radius: var(--toc-li-border-radius);
    margin: var(--toc-li-margin);
    padding: var(--toc-li-padding, 2pt 4pt);
  }
  :where(aside.toc > nav > ol > li:hover) {
    color: var(--toc-li-hover-color, cornflowerblue);
    background: var(--toc-li-hover-bg);
  }
  :where(aside.toc > nav > ol > li.active) {
    background: var(--toc-active-bg, cornflowerblue);
    color: var(--toc-active-color, white);
    font-weight: var(--toc-active-font-weight);
    border: var(--toc-active-border);
    border-width: var(--toc-active-border-width);
    border-radius: var(--toc-active-border-radius, 2pt);
  }
  :where(aside.toc > button) {
    border: none;
    bottom: 0;
    cursor: pointer;
    font-size: 2em;
    line-height: 0;
    position: absolute;
    right: 0;
    z-index: 2;
    padding: var(--toc-mobile-btn-padding, 2pt 3pt);
    border-radius: var(--toc-mobile-btn-border-radius, 4pt);
    background: var(--toc-mobile-btn-bg, rgba(255, 255, 255, 0.2));
    color: var(--toc-mobile-btn-color, black);
  }
  :where(aside.toc > nav) {
    position: relative;
  }
  :where(aside.toc > nav > .toc-title) {
    margin-top: 0;
  }

  :where(aside.toc.mobile) {
    position: fixed;
    bottom: var(--toc-mobile-bottom, 1em);
    right: var(--toc-mobile-right, 1em);
  }
  :where(aside.toc.mobile > nav) {
    border-radius: 3pt;
    right: 0;
    z-index: -1;
    box-sizing: border-box;
    background: var(--toc-mobile-bg, white);
    width: var(--toc-mobile-width, 18em);
    box-shadow: var(--toc-mobile-shadow);
    border: var(--toc-mobile-border);
  }

  :where(aside.toc.desktop) {
    margin: var(--toc-desktop-aside-margin);
  }
  :where(aside.toc.desktop) {
    position: sticky;
    background: var(--toc-desktop-bg);
    margin: var(--toc-desktop-nav-margin);
    max-width: var(--toc-desktop-max-width);
    top: var(--toc-desktop-sticky-top, 2em);
  }
</style>
