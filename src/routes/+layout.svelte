<script lang="ts">
  import { afterNavigate } from '$app/navigation'
  import { page } from '$app/state'
  import { Toc } from '$lib'
  import { repository } from '$root/package.json'
  import { mount, type Snippet } from 'svelte'
  import { CopyButton, GitHubCorner } from 'svelte-zoo'
  import '../app.css'

  interface Props {
    children?: Snippet;
  }
  let { children }: Props = $props();

  afterNavigate(() => {
    for (const node of document.querySelectorAll(`pre > code`)) {
      // skip if <pre> already contains a button (presumably for copy)
      const pre = node.parentElement
      if (!pre || pre.querySelector(`button`)) continue

      mount(CopyButton, {
        target: pre,
        props: {
          content: node.textContent ?? ``,
          style: `position: absolute; top: 1ex; right: 1ex;`,
        },
      })
    }
  })

  let headingSelector =
    $derived({ '/contributing': `main > h2`, '/changelog': `main > h4` }[page.url.pathname] ??
    `main :where(h2, h3)`)
</script>

<GitHubCorner href={repository} />

{#if !page.error && page.url.pathname !== `/`}
  <a href="." aria-label="Back to index page">&laquo; home</a>
{/if}

<main>
  {@render children?.()}
</main>

{#if [`/`, `/long-page`, `/changelog`, `/contributing`].includes(page.url.pathname)}
  <Toc {headingSelector} activeHeadingScrollOffset={200} blurParams={{ duration: 400 }} />
{/if}

<style>
  a[href='.'] {
    font-size: 15pt;
    position: absolute;
    top: 2em;
    left: 2em;
    background-color: rgba(255, 255, 255, 0.1);
    padding: 1pt 5pt;
    border-radius: 3pt;
    transition: 0.2s;
  }
  a[href='.']:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
</style>
