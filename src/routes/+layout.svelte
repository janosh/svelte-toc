<script lang="ts">
  import { page } from '$app/stores'
  import { Toc } from '$lib'
  import { repository } from '$root/package.json'
  import { GitHubCorner } from 'svelte-zoo'
  import '../app.css'

  $: headingSelector =
    { '/contributing': `main > h2`, '/changelog': `main > h4` }[$page.url.pathname] ??
    `main :where(h2, h3)`
</script>

<GitHubCorner href={repository} />

{#if !$page.error && $page.url.pathname !== `/`}
  <a href="." aria-label="Back to index page">&laquo; home</a>
{/if}

<main>
  <slot />
</main>

{#if [`/`, `/long-page`, `/changelog`, `/contributing`].includes($page.url.pathname)}
  <Toc {headingSelector} activeHeadingScrollOffset={200} />
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
