<script lang="ts">
  import { name } from '$root/package.json'
  import { DemoNav } from '$site'
  import type { Snippet } from 'svelte'

  interface Props {
    children?: Snippet;
  }
  let { children }: Props = $props();
</script>

<h1>
  <img src="favicon.svg" alt={name} height="50" width="50" />&ensp;Svelte MultiSelect
</h1>

<DemoNav style="place-content: center;" />

{@render children?.()}

<style>
  h1 {
    text-align: center;
    display: flex;
    place-content: center;
    place-items: center;
  }
</style>
