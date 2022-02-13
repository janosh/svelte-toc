<script lang="ts">
  import GitHubCorner from 'svelte-github-corner'
</script>

<GitHubCorner href="https://github.com/janosh/svelte-toc" />

<slot />

<style>
  :global(:root) {
    --toc-mobile-bg: #484452;
    --toc-mobile-btn-color: white;
    --toc-max-width: 15em;
    --ghc-color: var(--bg);
    --ghc-bg: white;
  }
</style>
