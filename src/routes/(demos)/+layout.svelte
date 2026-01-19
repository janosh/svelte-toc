<script lang="ts">
  import { name } from '$root/package.json'
  import type { Snippet } from 'svelte'

  let { children }: { children?: Snippet<[]> } = $props()
</script>

<h1>
  <img src="favicon.svg" alt={name} height="50" width="50" />&ensp;Svelte ToC
</h1>

{@render children?.()}

<style>
  h1 {
    text-align: center;
    display: flex;
    place-content: center;
    place-items: center;
  }
</style>
