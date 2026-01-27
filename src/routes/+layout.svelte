<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import { Toc } from '$lib'
  import { repository } from '$root/package.json'
  import type { Snippet } from 'svelte'
  import { CmdPalette, CopyButton, GitHubCorner, Nav } from 'svelte-multiselect'
  import { heading_anchors } from 'svelte-multiselect/heading-anchors'
  import '../app.css'

  let { children }: { children?: Snippet<[]> } = $props()

  let headingSelector = $derived(
    {
      '/contributing': `main > h2`,
      '/changelog': `main > h4`,
    }[page.url.pathname as string] ?? `main :where(h2, h3):not(.toc-exclude)`,
  )

  const all_routes = Object.keys(import.meta.glob(`./**/+page.{svelte,md}`))
    .map((filename) => {
      const parts = filename.split(`/`).filter((part) => !part.startsWith(`(`))
      return `/${parts.slice(1, -1).join(`/`)}`
    })
    .filter((route) => route !== `/`) // home handled separately

  // Show home link in nav when not on home page
  let nav_routes = $derived(
    page.url.pathname === `/` ? all_routes : [`/`, ...all_routes],
  )

  const actions = all_routes.map((route) => ({
    label: route,
    action: () => goto(route),
  }))
</script>

<CmdPalette {actions} --sms-options-bg="rgba(0, 0, 0, 0.7)" />
<GitHubCorner href={repository} />
<CopyButton global />
<Nav routes={nav_routes} menu_props={{ style: `gap: 2em` }} />

<main {@attach heading_anchors()}>
  {@render children?.()}
</main>

{#if [`/`, `/long-page`, `/changelog`, `/contributing`, `/hide-on-intersect`].includes(
    page.url.pathname,
  )}
  <Toc
    {headingSelector}
    hideOnIntersect={page.url.pathname === `/hide-on-intersect` ? `.hero-banner, .info-banner` : null}
  />
{/if}
