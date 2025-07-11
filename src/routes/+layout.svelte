<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import { Toc } from '$lib'
  import { repository } from '$root/package.json'
  import { type Snippet } from 'svelte'
  import { CmdPalette, CopyButton, GitHubCorner } from 'svelte-multiselect'
  import '../app.css'

  interface Props {
    children?: Snippet
  }
  let { children }: Props = $props()

  let headingSelector = $derived(
    { '/contributing': `main > h2`, '/changelog': `main > h4` }[page.url.pathname] ??
      `main :where(h2, h3)`,
  )

  const routes = Object.keys(
    import.meta.glob(`./**/+page.{svelte,md}`),
  ).map((filename) => {
    const parts = filename.split(`/`).filter((part) => !part.startsWith(`(`)) // remove hidden route segments
    return { route: `/${parts.slice(1, -1).join(`/`)}`, filename }
  })
</script>

<CmdPalette
  actions={routes.map(({ route }) => ({
    label: route,
    action: () => goto(route),
  }))}
  --sms-options-bg="rgba(0, 0, 0, 0.7)"
/>
<GitHubCorner href={repository} />
<CopyButton global />

{#if !page.error && page.url.pathname !== `/`}
  <a href="." aria-label="Back to index page">&laquo; home</a>
{/if}

<main>
  {@render children?.()}
</main>

{#if [`/`, `/long-page`, `/changelog`, `/contributing`].includes(page.url.pathname)}
  <Toc {headingSelector} />
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
