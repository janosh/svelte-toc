<script>
  import GitHubCorner from '../components/GitHubCorner.svelte'
  import Docs from '../docs.svx'
  import Toc from '../lib/Toc.svelte'
</script>

<Toc headingSelector="main :where(h2, h3, h4)" />

<GitHubCorner href="https://github.com/janosh/svelte-toc" />

<main>
  <h1>
    <img
      src="https://raw.githubusercontent.com/janosh/svelte-toc/main/static/favicon.svg"
      alt="Logo"
    />&nbsp;Svelte-ToC
  </h1>

  <Docs />
</main>

<style>
  :global(:root) {
    --toc-mobile-bg-color: #484452;
    --toc-mobile-btn-color: white;
    --toc-desktop-margin: 12em 0 0 0;
    --ghc-color: var(--bg);
    --ghc-bg: white;
  }
  h1 {
    font-size: calc(1em + 3vw);
  }
  h1 img {
    height: 1.2em;
    vertical-align: -10pt;
    padding-right: 4pt;
  }
</style>
