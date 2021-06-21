<script>
  import { blur } from 'svelte/transition'
  import { onMount } from 'svelte'

  import { page } from '$app/stores'

  import { onClickOutside } from './actions'
  import MenuIcon from './MenuIcon.svelte'

  export let headingSelector = [...Array(6).keys()].map((i) => `main h${i + 1}`)
  export let getHeadingTitles = (node) => node.innerText
  export let getHeadingLevels = (node) => Number(node.nodeName[1])
  export let activeHeading = null
  export let open = false
  export let title = `Contents`
  export let openButtonLabel = `Open table of contents`
  export let breakpoint = 1000
  export let flashClickedHeadingsFor = 1000

  let windowWidth
  let headings = []
  let nodes = []

  function handleRouteChange() {
    nodes = [...document.querySelectorAll(headingSelector)]
    const depths = nodes.map(getHeadingLevels)
    const minDepth = Math.min(...depths)

    headings = nodes.map((node, idx) => ({
      title: getHeadingTitles(node),
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

<aside
  use:onClickOutside={() => (open = false)}
  class="toc"
  class:desktop={windowWidth > breakpoint}
  class:mobile={windowWidth < breakpoint}>
  {#if !open}
    <button on:click|preventDefault={() => (open = !open)} aria-label={openButtonLabel}>
      <MenuIcon width="1em" />
    </button>
  {/if}
  {#if open || windowWidth > breakpoint}
    <nav transition:blur>
      {#if title}
        <h2>{title}</h2>
      {/if}
      {#each headings as { title, depth }, idx}
        <li
          tabindex={idx + 1}
          style="margin-left: {depth}em; font-size: {2 - 0.2 * depth}ex"
          class:active={activeHeading === nodes[idx]}
          on:click={() => {
            open = false
            const heading = nodes[idx]
            heading.scrollIntoView({ behavior: `smooth`, block: `start` })
            if (flashClickedHeadingsFor) {
              heading.classList.add(`toc-clicked`)
              setTimeout(
                () => heading.classList.remove(`toc-clicked`),
                flashClickedHeadingsFor
              )
            }
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

  aside.toc.mobile {
    position: fixed;
    bottom: 1em;
    right: 1em;
  }
  aside.toc.mobile > nav {
    width: var(--toc-mobile-width, 12em);
    bottom: -1em;
    right: 0;
    z-index: -1;
    background-color: var(--toc-mobile-bg-color, white);
    margin: 0 1em;
  }

  aside.toc.desktop {
    width: var(--toc-desktop-width, 12em);
    margin: var(--toc-desktop-margin, 0);
  }
  aside.toc.desktop > nav {
    position: sticky;
    top: var(--toc-desktop-sticky-top, 2em);
  }
  aside.toc.desktop > button {
    display: none;
  }
</style>
