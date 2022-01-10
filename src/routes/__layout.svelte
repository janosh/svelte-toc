<script lang="ts">
  import GitHubCorner from 'svelte-github-corner'
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
