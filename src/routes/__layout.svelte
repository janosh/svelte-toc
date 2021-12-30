<script>
  import GitHubCorner from '../components/GitHubCorner.svelte'
</script>

<GitHubCorner href="https://github.com/janosh/svelte-toc" />

<slot />

<style>
  :global(:root) {
    --toc-mobile-bg-color: #484452;
    --toc-mobile-btn-color: white;
    --ghc-color: var(--bg);
    --ghc-bg: white;
  }
</style>
