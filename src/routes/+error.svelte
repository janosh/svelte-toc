<script lang="ts">
  import { dev } from '$app/environment'
  import { page } from '$app/stores'
</script>

<svelte:head>
  <title>{$page.status}</title>
</svelte:head>

<div>
  <h1>{$page.error?.name} {$page.status}</h1>

  {#if $page.status === 404}
    <p>
      Page not found. Back to <a data-sveltekit-prefetch href="/">landing page</a>. 🤦
    </p>
  {/if}

  {#if dev && $page.error?.stack}
    <h2>Stack Trace</h2>
    <pre>{$page.error.stack}</pre>
  {/if}
</div>

<style>
  h1 {
    text-align: center;
  }
  div {
    max-width: 45em;
    padding: 5em 3em;
    margin: auto;
  }
  p {
    text-align: center;
  }
  pre {
    overflow: scroll;
    font-size: 0.9em;
    white-space: pre-wrap;
    background: var(--accentBg);
    padding: 5pt 1em;
    border-radius: 3pt;
  }
</style>
