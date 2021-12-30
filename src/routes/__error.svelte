<script context="module">
  import { dev } from '$app/env'

  export const load = ({ error, status }) => ({
    props: { error, status },
  })
</script>

<script>
  export let status
  export let error
</script>

<svelte:head>
  <title>{status}</title>
</svelte:head>

<div>
  <h1>{error.name} {status}</h1>

  {#if status === 404}
    <p>
      Page not found. Back to <a sveltekit:prefetch href="/">landing page</a>. 🤦
    </p>
  {/if}

  {#if dev && error?.stack}
    <h2>Stack Trace</h2>
    <pre>{error.stack}</pre>
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
