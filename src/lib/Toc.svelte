<script lang="ts">
  import { onMount } from 'svelte'
  import { blur } from 'svelte/transition'
  import MenuIcon from './MenuIcon.svelte'

  export let activeHeading: HTMLHeadingElement | null = null
  export let activeHeadingScrollOffset: number = 100
  export let activeTocLi: HTMLLIElement | null = null
  export let breakpoint: number = 1000
  export let desktop: boolean = true
  export let flashClickedHeadingsFor: number = 1500
  export let getHeadingIds = (node: HTMLHeadingElement): string => node.id
  export let getHeadingLevels = (node: HTMLHeadingElement): number =>
    Number(node.nodeName[1]) // get the number from H1, H2, ...
  export let getHeadingTitles = (node: HTMLHeadingElement): string =>
    node.textContent ?? ``
  export let headings: HTMLHeadingElement[] = []
  export let headingSelector: string = `:is(h2, h3, h4):not(.toc-exclude)`
  export let hide: boolean = false
  export let keepActiveTocItemInView: boolean = true
  export let open: boolean = false
  export let openButtonLabel: string = `Open table of contents`
  export let pageBody: string | HTMLElement = `body`
  export let title: string = `On this page`
  export let titleTag: string = `h2`
  export let tocItems: HTMLLIElement[] = []

  let window_width: number

  let aside: HTMLElement
  let nav: HTMLElement
  $: levels = headings.map(getHeadingLevels)
  $: minLevel = Math.min(...levels)
  $: desktop = window_width > breakpoint

  function close(event: MouseEvent) {
    if (!aside.contains(event.target as Node)) open = false
  }

  // (re-)query headings on mount and on route changes
  function requery_headings() {
    if (typeof document === `undefined`) return // for SSR
    headings = [...document.querySelectorAll(headingSelector)] as HTMLHeadingElement[]
    set_active_heading()
  }

  onMount(() => {
    if (typeof pageBody === `string`) {
      pageBody = document.querySelector(pageBody) as HTMLElement

      if (!pageBody) {
        throw new Error(`Could not find page body element: ${pageBody}`)
      }
    }
    const mutation_observer = new MutationObserver(requery_headings)
    mutation_observer.observe(pageBody, { childList: true, subtree: true })
    return () => mutation_observer.disconnect()
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
        if (keepActiveTocItemInView && activeTocLi) {
          // get the currently active ToC list item

          // scroll the active ToC item into the middle of the ToC container
          nav.scrollTo?.({ top: activeTocLi?.offsetTop - nav.offsetHeight / 2 })
        }
        return // exit while loop if updated active heading
      }
    }
  }

  function get_offset_top(element: HTMLElement | null): number {
    // added in https://github.com/janosh/svelte-toc/pull/16
    if (!element) return 0
    return element.offsetTop + get_offset_top(element.offsetParent as HTMLElement)
  }

  const handler = (node: HTMLHeadingElement) => (event: MouseEvent | KeyboardEvent) => {
    if (event instanceof KeyboardEvent && ![`Enter`, ` `].includes(event.key)) return
    open = false
    // Chrome doesn't (yet?) support multiple simultaneous smooth scrolls (https://stackoverflow.com/q/49318497)
    // with node.scrollIntoView(). Use window.scrollTo() instead.
    const scrollMargin = Number(getComputedStyle(node).scrollMarginTop.replace(`px`, ``))
    window.scrollTo({ top: get_offset_top(node) - scrollMargin, behavior: `smooth` })

    const id = getHeadingIds && getHeadingIds(node)
    if (id) history.replaceState({}, ``, `#${id}`)

    if (flashClickedHeadingsFor) {
      node.classList.add(`toc-clicked`)
      setTimeout(() => node.classList.remove(`toc-clicked`), flashClickedHeadingsFor)
    }
  }
</script>

<svelte:window
  bind:innerWidth={window_width}
  on:scroll={set_active_heading}
  on:click={close}
/>

{#if !hide}
  <aside class="toc" class:desktop class:mobile={!desktop} bind:this={aside}>
    {#if !open && !desktop}
      <button
        on:click|preventDefault|stopPropagation={() => (open = true)}
        aria-label={openButtonLabel}
      >
        <slot name="open-toc-icon">
          <MenuIcon width="1em" />
        </slot>
      </button>
    {/if}
    {#if open || desktop}
      <nav transition:blur|local bind:this={nav}>
        {#if title}
          <svelte:element this={titleTag} class="toc-title toc-exclude">
            {title}
          </svelte:element>
        {/if}
        <ul>
          {#each headings as heading, idx}
            <li
              tabindex="0"
              role="link"
              style:transform="translateX({levels[idx] - minLevel}em)"
              style:font-size="{2 - 0.2 * (levels[idx] - minLevel)}ex"
              class:active={activeHeading === heading}
              on:click={handler(heading)}
              on:keyup={handler(heading)}
              bind:this={tocItems[idx]}
            >
              <slot name="toc-item" {heading} {idx}>
                {getHeadingTitles(heading)}
              </slot>
            </li>
          {/each}
        </ul>
      </nav>
    {/if}
  </aside>
{/if}

<style>
  :where(aside.toc) {
    box-sizing: border-box;
    font-size: var(--toc-font-size);
    height: max-content;
    min-width: var(--toc-min-width);
    width: var(--toc-width);
    z-index: var(--toc-z-index, 1);
  }
  :where(aside.toc > nav) {
    max-height: var(--toc-max-height, 90vh);
    overflow-y: scroll;
    overscroll-behavior: contain;
    padding: var(--toc-padding, 1em 1em 0);
  }
  :where(aside.toc > nav > ul) {
    list-style: none;
    padding: 0;
  }
  :where(aside.toc > nav > ul > li) {
    border-radius: var(--toc-li-border-radius, 2pt);
    cursor: pointer;
    margin: var(--toc-li-margin);
    padding: var(--toc-li-padding, 2pt 4pt);
  }
  :where(aside.toc > nav > ul > li:hover) {
    color: var(--toc-hover-color, cornflowerblue);
  }
  :where(aside.toc > nav > ul > li.active) {
    background: var(--toc-active-bg, cornflowerblue);
    color: var(--toc-active-color, white);
    font-weight: var(--toc-active-font-weight);
  }
  :where(aside.toc > button) {
    background: var(--toc-mobile-btn-bg, rgba(255, 255, 255, 0.2));
    border-radius: 5pt;
    border: none;
    bottom: 0;
    color: var(--toc-mobile-btn-color, black);
    cursor: pointer;
    font-size: 2em;
    line-height: 0;
    padding: 2pt 4pt;
    position: absolute;
    right: 0;
    z-index: 2;
  }
  :where(aside.toc > nav) {
    position: relative;
  }
  :where(aside.toc > nav > .toc-title) {
    margin-top: 0;
  }

  :where(aside.toc.mobile) {
    bottom: var(--toc-mobile-bottom, 1em);
    position: fixed;
    right: var(--toc-mobile-right, 1em);
  }
  :where(aside.toc.mobile > nav) {
    background-color: var(--toc-mobile-bg, white);
    border-radius: 3pt;
    right: 0;
    width: var(--toc-mobile-width, 18em);
    z-index: -1;
  }

  :where(aside.toc.desktop) {
    margin: var(--toc-desktop-aside-margin);
  }
  :where(aside.toc.desktop) {
    background-color: var(--toc-desktop-bg);
    margin: var(--toc-desktop-nav-margin);
    max-width: var(--toc-desktop-max-width);
    position: sticky;
    top: var(--toc-desktop-sticky-top, 2em);
  }
</style>
