<script>
  import { blur } from 'svelte/transition'
  import { onMount } from 'svelte'

  import { page } from '$app/stores'

  import { onClickOutside } from './actions'
  import MenuIcon from './MenuIcon.svelte'

  export let headingSelector = [...Array(6).keys()].map((i) => `main h${i + 1}`)
  export let getTitle = (node) => node.innerText
  export let getDepth = (node) => Number(node.nodeName[1])
  export let activeHeading = null
  export let open = false

  let windowWidth
  let headings = []
  let nodes = []

  function handleRouteChange() {
    nodes = [...document.querySelectorAll(headingSelector)]
    const depths = nodes.map(getDepth)
    const minDepth = Math.min(...depths)

    headings = nodes.map((node, idx) => ({
      title: getTitle(node),
      depth: depths[idx] - minDepth,
    }))
  }

  // (re-)compute list of HTML headings on mount and on route changes
  if (typeof window !== `undefined`) {
    page.subscribe(handleRouteChange)
  }
  onMount(() => {
    const observer = new IntersectionObserver(
      // callback receives all observed nodes whose intersection changed, we only need the first
      ([entry]) => {
        activeHeading = entry.target // assign intersecting node to activeHeading
      },
      { threshold: [1] } // only consider heading as intersecting once it fully entered viewport
    )

    nodes.map((node) => observer.observe(node))
    handleRouteChange()
    return () => nodes.map((node) => observer.unobserve(node))
  })
</script>

<svelte:window bind:innerWidth={windowWidth} />

<aside use:onClickOutside={() => (open = false)} class="toc">
  {#if !open}
    <button
      on:click|preventDefault={() => (open = !open)}
      aria-label="Open table of contents">
      <MenuIcon width="1em" />
    </button>
  {/if}
  {#if open || windowWidth > 1000}
    <nav transition:blur>
      <h2>Contents</h2>
      {#each headings as { title, depth, slug }, idx}
        <li
          tabindex={idx + 1}
          style="margin-left: {depth}em; font-size: {2 - 0.2 * depth}ex"
          class:active={activeHeading === nodes[idx]}
          on:click={() => {
            open = false
            nodes[idx].scrollIntoView({ behavior: `smooth`, block: `start` })
          }}>
          {title}
        </li>
      {/each}
    </nav>
  {/if}
</aside>

<style>
  aside {
    z-index: var(--toc-z-index, 1);
  }
  nav {
    list-style: none;
    max-height: var(--toc-max-height, 90vh);
    overflow: auto;
    overscroll-behavior: contain;
  }
  nav > li {
    margin-top: 5pt;
    cursor: pointer;
  }
  nav > li:hover {
    color: var(--toc-hover-color, cornflowerblue);
  }
  nav > li.active {
    color: var(--toc-active-color, orange);
  }
  button {
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
  nav {
    margin: 1em 0;
    padding: 5pt 1ex 1ex 1.5ex;
  }
  nav > h2 {
    margin-top: 0;
  }
  @media (max-width: 1000px) {
    /* mobile styles */
    aside {
      position: fixed;
      bottom: 1em;
      right: 1em;
    }
    nav {
      width: var(--toc-mobile-width, 12em);
      bottom: -1em;
      right: 0;
      z-index: -1;
      background-color: var(--toc-mobile-bg-color, white);
      margin: 0 1em;
    }
  }
  @media (min-width: 1001px) {
    /* desktop styles */
    aside {
      width: var(--toc-desktop-width, 12em);
      margin: var(--toc-desktop-margin, 0);
    }
    nav {
      position: sticky;
      top: var(--toc-desktop-sticky-top, 2em);
    }
    aside > button {
      display: none;
    }
  }
</style>
