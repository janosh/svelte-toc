<script lang="ts">
  import { page } from '$app/stores'
  import { onMount } from 'svelte'
  import { blur } from 'svelte/transition'
  import MenuIcon from './MenuIcon.svelte'

  export let headingSelector = `main :where(h1, h2, h3, h4):not(.toc-exclude)`
  export let getHeadingTitles = (node: HTMLHeadingElement): string => node.innerText
  export let getHeadingIds = (node: HTMLHeadingElement): string => node.id
  export let getHeadingLevels = (node: HTMLHeadingElement): number =>
    Number(node.nodeName[1]) // get the number from H1, H2, ...
  export let activeHeading: HTMLHeadingElement | null = null
  export let open = false
  export let title = `On this page`
  export let openButtonLabel = `Open table of contents`
  export let breakpoint = 1000
  export let flashClickedHeadingsFor = 1500
  export let keepActiveTocItemInView = true
  export let activeTopOffset = 100
  export let headings: HTMLHeadingElement[] = []
  export let desktop = true
  export let hide = false

  let windowWidth: number
  let windowHeight: number

  let aside: HTMLElement
  $: levels = headings.map(getHeadingLevels)
  $: minLevel = Math.min(...levels)
  $: desktop = windowWidth > breakpoint

  function close(event: MouseEvent) {
    if (!aside.contains(event.target as Node)) open = false
  }

  // (re-)query headings on mount and on route changes
  function requery_headings() {
    if (typeof document === `undefined`) return // for SSR safety
    headings = [...document.querySelectorAll(headingSelector)] as HTMLHeadingElement[]
    setActiveHeading()
  }
  page.subscribe(requery_headings)
  onMount(requery_headings)

  function setActiveHeading() {
    let idx = headings.length
    while (idx--) {
      const { top } = headings[idx].getBoundingClientRect()

      // loop through headings from last to first until we find one that the viewport already
      // scrolled past. if none is found, set make first heading active
      if (top < activeTopOffset || idx === 0) {
        activeHeading = headings[idx]
        if (keepActiveTocItemInView) {
          // get the currently active ToC list item
          const activeTocLi = document.querySelector(`aside.toc > nav > ul > li.active`)
          activeTocLi?.scrollIntoView({ block: `nearest` })
        }
        return
      }
    }
  }

  function get_offset_top(element: HTMLElement | null): number {
    // added in https://github.com/janosh/svelte-toc/pull/16
    if (!element) return 0
    return element.offsetTop + get_offset_top(element.offsetParent as HTMLElement)
  }

  const clickHandler = (node: HTMLHeadingElement) => () => {
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
  bind:innerWidth={windowWidth}
  bind:innerHeight={windowHeight}
  on:scroll={setActiveHeading}
  on:click={close}
/>
{#if !hide}
  <aside class="toc" class:desktop class:mobile={!desktop} bind:this={aside}>
    {#if !open && !desktop}
      <button
        on:click|preventDefault|stopPropagation={() => (open = true)}
        aria-label={openButtonLabel}
      >
        <MenuIcon width="1em" />
      </button>
    {/if}
    {#if open || desktop}
      <nav transition:blur|local>
        {#if title}
          <h2>{title}</h2>
        {/if}
        <ul>
          {#each headings as heading, idx}
            <li
              tabindex={idx + 1}
              style:transform="translateX({levels[idx] - minLevel}em)"
              style:font-size="{2 - 0.2 * (levels[idx] - minLevel)}ex"
              class:active={activeHeading === heading}
              on:click={clickHandler(heading)}
            >
              <slot name="tocItem" {heading} {idx}>
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
    z-index: var(--toc-z-index, 1);
  }
  :where(aside.toc > nav) {
    min-width: var(--toc-min-width);
    max-width: var(--toc-max-width);
    width: var(--toc-width);
    list-style: none;
    max-height: var(--toc-max-height, 90vh);
    overflow: auto;
    overscroll-behavior: contain;
  }
  :where(aside.toc > nav > ul) {
    list-style: none;
    padding: 0;
  }
  :where(aside.toc > nav > ul > li) {
    margin-top: 5pt;
    cursor: pointer;
    scroll-margin: var(--toc-li-scroll-margin, 50pt 0);
  }
  :where(aside.toc > nav > ul > li:hover) {
    color: var(--toc-hover-color, cornflowerblue);
  }
  :where(aside.toc > nav > ul > li.active) {
    color: var(--toc-active-color, smokewhite);
    background: var(--toc-active-bg, cornflowerblue);
    font-weight: var(--toc-active-font-weight);
    padding: var(--toc-active-padding);
    margin: var(--toc-active-margin);
    border-radius: 2pt;
  }
  :where(aside.toc > button) {
    position: absolute;
    bottom: 0;
    right: 0;
    z-index: 2;
    cursor: pointer;
    font-size: 2em;
    line-height: 0;
    border-radius: 5pt;
    padding: 2pt 4pt;
    border: none;
    color: var(--toc-mobile-btn-color, black);
    background: var(--toc-mobile-btn-bg, rgba(255, 255, 255, 0.2));
  }
  :where(aside.toc > nav) {
    margin: 1em 0;
    padding: 1em 1em 1ex;
  }
  :where(aside.toc > nav > h2) {
    margin-top: 0;
  }

  :where(aside.toc.mobile) {
    position: fixed;
    bottom: 1em;
    right: 1em;
  }
  :where(aside.toc.mobile > nav) {
    border-radius: 3pt;
    width: var(--toc-mobile-width, 12em);
    bottom: -1em;
    right: 0;
    z-index: -1;
    background-color: var(--toc-mobile-bg, white);
  }

  :where(aside.toc.desktop) {
    margin: var(--toc-desktop-aside-margin);
  }
  :where(aside.toc.desktop > nav) {
    position: sticky;
    padding: 12pt 14pt 0;
    margin: var(--toc-desktop-nav-margin);
    top: var(--toc-desktop-sticky-top, 2em);
    background-color: var(--toc-desktop-bg);
    border-radius: 5pt;
  }
</style>
