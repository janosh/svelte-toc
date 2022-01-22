<script lang="ts">
  import { afterNavigate } from '$app/navigation'
  import { blur } from 'svelte/transition'
  import { onClickOutside } from './actions'
  import MenuIcon from './MenuIcon.svelte'

  export let headingSelector = `main :where(h1, h2, h3, h4, h5, h6)`
  export let getHeadingTitles = (node: HTMLHeadingElement): string => node.innerText
  export let getHeadingIds = (node: HTMLHeadingElement): string => node.id
  export let getHeadingLevels = (node: HTMLHeadingElement): number =>
    Number(node.nodeName[1]) // get the number from H1, H2, ...
  export let activeHeading: HTMLHeadingElement | null = null
  export let open = false
  export let title = `On this page`
  export let openButtonLabel = `Open table of contents`
  export let breakpoint = 1000
  export let flashClickedHeadingsFor = 1000
  export let keepActiveTocItemInView = true

  let windowWidth: number
  let windowHeight: number
  let scrollY: number
  let headings: HTMLHeadingElement[] = []
  let visibleHeadings: HTMLHeadingElement[] = []
  $: levels = headings.map(getHeadingLevels)
  $: minLevel = Math.min(...levels)

  // (re-)query headings on mount and on route changes
  afterNavigate(() => {
    headings = [...document.querySelectorAll(headingSelector)] as HTMLHeadingElement[]

    // set first heading as active if null on page load
    if (activeHeading === null) activeHeading = headings[0]

    const observer = new IntersectionObserver(
      (entries) => {
        // callback receives only observed nodes whose intersection changed
        entries = entries.filter((en) => en.isIntersecting)
        visibleHeadings = entries.map((en) => en.target) as HTMLHeadingElement[]
      },
      { threshold: 1 } // only consider headings intersecting once they fully entered viewport
    )

    headings.map((hdn) => observer.observe(hdn))
    return () => observer.disconnect() // clean up function to run when component unmounts
  })

  function setActiveHeading() {
    if (visibleHeadings.length > 0) {
      // if any heading is visible, set the top one as active
      activeHeading = visibleHeadings[0]
    } else {
      // if no headings are visible, set active heading to the last one we scrolled past
      const nextHdnIdx = headings.findIndex((hdn) => hdn.offsetTop > scrollY)
      activeHeading = headings[nextHdnIdx > 0 ? nextHdnIdx - 1 : 0]
    }
    const pageHeight = document.body.scrollHeight
    const scrollProgress = (scrollY + windowHeight) / pageHeight
    if (scrollProgress > 0.99) {
      activeHeading = headings[headings.length - 1]
    }

    if (keepActiveTocItemInView) {
      // get the currently active ToC list item
      const activeTocLi = document.querySelector(`aside > nav > ul > li.active`)
      activeTocLi?.scrollIntoViewIfNeeded()
    }
  }

  const clickHandler = (node: HTMLHeadingElement) => () => {
    open = false
    // Chrome doesn't yet support multiple simulatneous smooth scrolls (https://stackoverflow.com/q/49318497)
    // with node.scrollIntoView({ behavior: `smooth` }) so we use window.scrollTo() instead
    window.scrollTo({ top: node.offsetTop, behavior: `smooth` })

    if (getHeadingIds) history.replaceState({}, ``, `#${getHeadingIds(node)}`)

    if (flashClickedHeadingsFor) {
      node.classList.add(`toc-clicked`)
      setTimeout(() => node.classList.remove(`toc-clicked`), flashClickedHeadingsFor)
    }
  }
</script>

<svelte:window
  bind:scrollY
  bind:innerWidth={windowWidth}
  bind:innerHeight={windowHeight}
  on:scroll={setActiveHeading}
/>

<aside
  use:onClickOutside={() => (open = false)}
  class="toc"
  class:desktop={windowWidth > breakpoint}
  class:mobile={windowWidth < breakpoint}
>
  {#if !open}
    <button on:click|preventDefault={() => (open = !open)} aria-label={openButtonLabel}>
      <MenuIcon width="1em" />
    </button>
  {/if}
  {#if open || windowWidth > breakpoint}
    <nav transition:blur|local>
      {#if title}
        <h2>{title}</h2>
      {/if}
      <ul>
        {#each headings as hdn, idx}
          <li
            tabindex={idx + 1}
            style="margin-left: {levels[idx] - minLevel}em; font-size: {2 -
              0.2 * (levels[idx] - minLevel)}ex"
            class:active={activeHeading === hdn}
            on:click={clickHandler(hdn)}
          >
            {getHeadingTitles(hdn)}
          </li>
        {/each}
      </ul>
    </nav>
  {/if}
</aside>

<style>
  :where(aside) {
    z-index: var(--toc-z-index, 1);
    width: var(--toc-width);
  }
  :where(nav) {
    list-style: none;
    max-height: var(--toc-max-height, 90vh);
    overflow: auto;
    overscroll-behavior: contain;
  }
  :where(nav > ul) {
    list-style: none;
    padding: 0;
  }
  :where(nav > ul > li) {
    margin-top: 5pt;
    cursor: pointer;
    scroll-margin: var(--toc-li-scroll-margin, 20pt 0);
  }
  :where(nav > ul > li:hover) {
    color: var(--toc-hover-color, cornflowerblue);
  }
  :where(nav > ul > li.active) {
    color: var(--toc-active-color, orange);
  }
  :where(button) {
    position: absolute;
    bottom: 0;
    right: 0;
    z-index: 2;
    cursor: pointer;
    font-size: 2em;
    line-height: 0;
    background: var(--toc-mobile-btn-bg-color, rgba(255, 255, 255, 0.2));
    border-radius: 5pt;
    padding: 2pt 4pt;
    border: none;
    color: var(--toc-mobile-btn-color, black);
  }
  :where(nav) {
    margin: 1em 0;
    padding: 1em 1em 1ex;
  }
  :where(nav > h2) {
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
    background-color: var(--toc-mobile-bg-color, white);
  }

  :where(aside.toc.desktop) {
    margin: var(--toc-desktop-aside-margin, 0);
  }
  :where(aside.toc.desktop > nav) {
    position: sticky;
    padding: 12pt 14pt 0;
    margin: var(--toc-desktop-nav-margin, 0 2ex 0 0);
    top: var(--toc-desktop-sticky-top, 2em);
    background-color: var(--toc-desktop-bg-color);
    border-radius: 5pt;
  }
  :where(aside.toc.desktop > button) {
    display: none;
  }
</style>
