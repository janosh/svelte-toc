<script lang="ts">
  // /internal needed for module resolution pending fix for https://github.com/vitest-dev/vitest/issues/2834
  import { onMount } from 'svelte/internal'
  import { blur } from 'svelte/transition'
  import { MenuIcon } from '.'

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
  export let autoHide: boolean = true
  export let keepActiveTocItemInView: boolean = true
  export let open: boolean = false
  export let openButtonLabel: string = `Open table of contents`
  export let pageBody: string | HTMLElement = `body`
  export let scrollBehavior: 'auto' | 'smooth' = `smooth`
  export let title: string = `On this page`
  export let titleTag: string = `h2`
  export let tocItems: HTMLLIElement[] = []
  export let warnOnEmpty: boolean = true

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
    if (headings.length === 0) {
      if (warnOnEmpty) {
        console.warn(
          `svelte-toc found no headings for headingSelector='${headingSelector}'. ${
            autoHide ? `Hiding` : `Showing empty`
          } table of contents.`
        )
      }
      if (autoHide) hide = true
    } else if (hide && autoHide) {
      hide = false
    }
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

  let scroll_id: number
  function set_active_heading() {
    let idx = headings.length
    while (idx--) {
      const { top } = headings[idx].getBoundingClientRect()

      // loop through headings from last to first until we find one that the viewport already
      // scrolled past. if none is found, set make first heading active
      if (top < activeHeadingScrollOffset || idx === 0) {
        activeHeading = headings[idx]
        activeTocLi = tocItems[idx]
        // this annoying hackery to wait for scroll end is necessary because scrollend event only has 2%
        // browser support https://stackoverflow.com/a/57867348 and Chrome doesn't support multiple
        // simultaneous scrolls, smooth or otherwise (https://stackoverflow.com/a/63563437)
        clearTimeout(scroll_id)
        scroll_id = window.setTimeout(() => {
          if (keepActiveTocItemInView && activeTocLi) {
            // get the currently active ToC list item
            // scroll the active ToC item into the middle of the ToC container
            activeTocLi.scrollIntoView?.({ behavior: scrollBehavior, block: `center` })
          }
        }, 50)
        return // exit while loop if updated active heading
      }
    }
  }

  const handler = (node: HTMLHeadingElement) => (event: MouseEvent | KeyboardEvent) => {
    if (event instanceof KeyboardEvent && ![`Enter`, ` `].includes(event.key)) return
    open = false
    node.scrollIntoView({ behavior: scrollBehavior, block: `start` })

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

<aside
  class="toc"
  class:desktop
  class:hidden={hide}
  class:mobile={!desktop}
  bind:this={aside}
  hidden={hide}
  aria-hidden={hide}
>
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
        <slot name="title">
          <svelte:element this={titleTag} class="toc-title toc-exclude">
            {title}
          </svelte:element>
        </slot>
      {/if}
      <ol>
        {#each headings as heading, idx}
          <li
            tabindex="0"
            role="link"
            style:margin="0 0 0 {levels[idx] - minLevel}em"
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
      </ol>
    </nav>
  {/if}
</aside>

<style>
  :where(aside.toc) {
    box-sizing: border-box;
    height: max-content;
    font-size: var(--toc-font-size);
    min-width: var(--toc-min-width);
    width: var(--toc-width);
    z-index: var(--toc-z-index, 1);
  }
  :where(aside.toc > nav) {
    overflow: var(--toc-overflow, auto scroll);
    overscroll-behavior: contain;
    max-height: var(--toc-max-height, 90vh);
    padding: var(--toc-padding, 1em 1em 0);
  }
  :where(aside.toc > nav > ol) {
    list-style: var(--toc-ol-list-style, none);
    padding: var(--toc-ol-padding, 0);
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
