<script lang="ts">
  import Readme from '$root/readme.md'
  import { Nav } from 'svelte-multiselect'
  import { demo_routes } from './index'
</script>

<Readme>

## 📝 &thinsp; Examples

<Nav routes={demo_routes} />

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
