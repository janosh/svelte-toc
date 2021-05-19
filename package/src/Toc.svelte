<script>
  import { blur } from 'svelte/transition'
  import { onMount } from 'svelte'

  import { page } from '$app/stores'

  import { onClickOutside } from './actions'
  import MenuIcon from './MenuIcon.svelte'

  export let headingSelector = [...Array(6).keys()].map((i) => `main h${i + 1}`)
  export let getTitle = (node) => node.innerText
  export let getDepth = (node) => Number(node.nodeName[1])
  export let throttleInterval = 300

  function accumulateOffsetTop(el, totalOffset = 0) {
    while (el) {
      totalOffset += el.offsetTop - el.scrollTop + el.clientTop
      el = el.offsetParent
    }
    return totalOffset
  }

  function throttle(callback, limit) {
    // execute `callback` at most one every `limit` milliseconds
    let wait = false
    return function () {
      if (!wait) {
        callback.call()
        wait = true
        setTimeout(() => (wait = false), limit)
      }
    }
  }

  let windowWidth
  let open = false
  let activeHeading = undefined
  let headings = []
  let nodes = []
  const scrollHandler = throttle(() => {
    // Offsets need to be recomputed because lazily-loaded
    // content may increase offsets as user scrolls down.
    const offsets = nodes.map((el) => accumulateOffsetTop(el))
    const activeIndex = offsets.findIndex(
      (offset) => offset > window.scrollY + 0.6 * window.innerHeight
    )
    activeHeading = activeIndex === -1 ? headings.length - 1 : activeIndex - 1
  }, throttleInterval)

  function handleRouteChange() {
    nodes = [...document.querySelectorAll(headingSelector)]
    const depths = nodes.map(getDepth)
    const minDepth = Math.min(...depths)

    headings = nodes.map((node, idx) => ({
      title: getTitle(node),
      depth: depths[idx] - minDepth,
    }))
    scrollHandler()
  }

  // compute list of HTML headings on mount and on route changes
  if (typeof window !== `undefined`) page.subscribe(handleRouteChange)
  onMount(() => {
    handleRouteChange()
  })
</script>

<svelte:window on:scroll={scrollHandler} bind:innerWidth={windowWidth} />

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
      {#each headings as { title, depth }, idx}
        <li
          tabindex={idx + 1}
          style="margin-left: {depth}em; font-size: {2 - 0.2 * depth}ex"
          class:active={activeHeading === idx}
          on:click={() => {
            open = false
            nodes[idx].scrollIntoView({ behavior: `smooth`, block: `center` })
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
