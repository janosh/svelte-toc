<script lang="ts">
  import { page } from '$app/state'

  interface Props {
    style?: string | null
  }
  let { style = null }: Props = $props()

  const routes = Object.keys(
    import.meta.glob(`/src/routes/*demos*/*/+page*.{svx,md,svelte}`),
  ).map((filename) => filename.split(`/`)[4])

  let is_current = $derived((path: string) => {
    if (`/${path}` == page.url.pathname) return `page`
    return undefined
  })
</script>

<nav {style}>
  {#each routes as href, idx (href)}
    {#if idx > 0}<strong>&bull;</strong>{/if}
    <a {href} aria-current={is_current(href)}>{href}</a>
  {/each}
</nav>

<style>
  nav {
    display: flex;
    gap: 1em 1ex;
    flex-wrap: wrap;
  }
  nav > a {
    padding: 0 4pt;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 3pt;
    transition: 0.2s;
  }
  nav > a[aria-current='page'] {
    color: mediumseagreen;
  }
</style>
