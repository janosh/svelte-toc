<script lang="ts">
  import { name } from '$root/package.json'
  import type { Snippet } from 'svelte'
  import { Nav } from 'svelte-multiselect'
  import { demo_routes } from '../index'

  let { children }: { children?: Snippet<[]> } = $props()
</script>

<h1>
  <img src="favicon.svg" alt={name} height="50" width="50" />&ensp;Svelte MultiSelect
</h1>

<Nav routes={demo_routes} style="place-content: center" />

{@render children?.()}

<style>
  h1 {
    text-align: center;
    display: flex;
    place-content: center;
    place-items: center;
  }
</style>
