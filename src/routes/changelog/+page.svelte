<script lang="ts">
  import Toc from '$lib'
  import Changelog from '$root/changelog.md'
</script>

<main>
  <Changelog />
</main>

<Toc headingSelector="main > h4" breakpoint={1250} />

<style>
  :global(aside.toc.desktop) {
    position: fixed;
    top: 3em;
    left: calc(50vw + 55em / 2);
    max-width: 16em;
  }
</style>
