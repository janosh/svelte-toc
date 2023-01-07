<script lang="ts">
  import Toc from '$lib'
  import Contributing from '$root/contributing.md'
</script>

<main>
  <Contributing />
</main>

<Toc headingSelector="main > :where(h2)" breakpoint={1250} />

<style>
  :global(aside.toc.desktop) {
    position: fixed;
    top: 3em;
    left: calc(50vw + 55em / 2);
    max-width: 16em;
  }
</style>
