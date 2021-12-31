<script lang="ts">
  import { page } from '$app/stores'
  import { onMount } from 'svelte'
  import { blur } from 'svelte/transition'
  import { onClickOutside } from './actions'
  import MenuIcon from './MenuIcon.svelte'

  export let headingSelector = `main :where(h1, h2, h3, h4, h5, h6)`
  export let getHeadingTitles = (node: HTMLHeadingElement): string => node.innerText
  export let getHeadingIds = (node: HTMLHeadingElement): string => node.id
  export let getHeadingLevels = (node: HTMLHeadingElement): number =>
    Number(node.nodeName[1])
  export let activeHeading: Heading | null = null
  export let open = false
  export let title = `Contents`
  export let openButtonLabel = `Open table of contents`
  export let breakpoint = 1000
  export let flashClickedHeadingsFor = 1000

  type Heading = {
    title: string
    depth: number
    node: HTMLHeadingElement
    visible?: boolean
  }

  let windowWidth: number
  let windowHeight: number
  let scrollY: number
  let headings: Heading[] = []

  function handleRouteChange() {
    const nodes = [...document.querySelectorAll(headingSelector)] as HTMLHeadingElement[]

    const depths = nodes.map(getHeadingLevels)
    const minDepth = Math.min(...depths)

    headings = nodes.map((node, idx) => ({
      title: getHeadingTitles(node),
      depth: depths[idx] - minDepth,
      node,
    }))

    // set first heading as active if null on page load
    if (activeHeading === null) activeHeading = headings[0]
  }

  // (re-)compute list of HTML headings on mount and on route changes
  if (typeof window !== `undefined`) {
    page.subscribe(handleRouteChange)
  }

  onMount(() => {
    handleRouteChange()
    const observer = new IntersectionObserver(
      (entries) => {
        // callback receives only observed nodes whose intersection changed
        for (const { target, isIntersecting } of entries) {
          const hdn = headings.find(({ node }) => node === target)
          if (hdn) hdn.visible = isIntersecting
        }
      },
      { threshold: 1 } // only consider headings intersecting once they fully entered viewport
    )

    headings.map(({ node }) => observer.observe(node))
    return () => observer.disconnect() // clean up function to run when component unmounts
  })

  function setActiveHeading() {
    const visibleHeadings = headings.filter((hd) => hd.visible)

    if (visibleHeadings.length > 0) {
      // if any heading is visible, set the top one as active
      activeHeading = visibleHeadings[0]
    } else {
      // if no headings are visible, set active heading to the last one we scrolled past
      const nextHdnIdx = headings.findIndex((hd) => hd.node.offsetTop > scrollY)
      activeHeading = headings[nextHdnIdx > 0 ? nextHdnIdx - 1 : 0]
    }
    const pageHeight = document.body.scrollHeight
    const scrollProgress = (scrollY + windowHeight) / pageHeight
    if (scrollProgress > 0.99) {
      activeHeading = headings[headings.length - 1]
    }

    const activeTocLi = document.querySelector(`aside > nav > ul > li.active`)
    activeTocLi?.scrollIntoViewIfNeeded?.()
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
        {#each headings as { title, depth, node }, idx}
          <li
            tabindex={idx + 1}
            style="margin-left: {depth}em; font-size: {2 - 0.2 * depth}ex"
            class:active={activeHeading?.node === node}
            on:click={clickHandler(node)}
          >
            {title}
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
    margin: var(--toc-desktop-margin, 0);
  }
  :where(aside.toc.desktop > nav) {
    position: sticky;
    padding: 12pt 14pt 0;
    margin: 0 2ex 0 0;
    top: var(--toc-desktop-sticky-top, 2em);
    background-color: var(--toc-desktop-bg-color);
    border-radius: 5pt;
  }
  :where(aside.toc.desktop > button) {
    display: none;
  }
</style>
