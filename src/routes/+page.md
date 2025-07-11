<script lang="ts">
  import Readme from '$root/readme.md'
  import { DemoNav } from '../site'
</script>

<Readme>
  <svelte:fragment slot="demo-nav">
    <h2>📝 &thinsp; Examples</h2>
    <p>Demos of specific features of <code>svelte-toc</code>.</p>
    <DemoNav />
  </svelte:fragment>
</Readme>

<style>
  :global(h1) {
    display: flex;
    place-items: center;
    place-content: center;
    font-size: clamp(2rem, 2rem + 2vw, 3rem);
  }
  :global(h1 > br) {
    display: none;
  }
  @media (max-width: 500px) {
    :global(h1) {
      flex-direction: column;
      gap: 1ex;
      margin-bottom: 3rem;
    }
  }
  :global(.hide-in-docs) {
    display: none;
  }
</style>
