<script lang="ts">
  import Readme from '$root/readme.md'
</script>

<Readme />

<style>
  :global(h1) {
    display: flex;
    place-items: center;
    place-content: center;
    font-size: clamp(1.5rem, 1.5rem + 2vw, 2rem);
  }
  :global(h1 > br) {
    display: none;
  }
  :global(.hide-in-docs) {
    display: none;
  }
</style>
