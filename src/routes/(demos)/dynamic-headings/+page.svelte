<script lang="ts">
  import { Toc } from '$lib'

  let main: HTMLElement
  let heading_count: number = $state(0)
</script>

<div class="container">
  <main bind:this={main}>
    <h1>Dynamic Headings Demo</h1>
    <p>
      This demo shows how the TOC component reacts to DOM mutations in real-time. Use the
      buttons to add or remove headings and observe how the TOC updates.
    </p>

    <div class="controls">
      <button onclick={() => heading_count++}>Add Heading</button>
      <button onclick={() => (heading_count = Math.max(heading_count - 1, 0))}>
        Remove Last Heading
      </button>
      <button onclick={() => (heading_count = 0)}>Remove All Headings</button>
      <span>Total headings: {heading_count}</span>
    </div>

    {#each Array(heading_count).fill(0) as _, idx (idx)}
      <h2>Heading {idx + 1}</h2>
    {/each}
  </main>

  <Toc />
</div>

<style>
  div.container {
    display: grid;
    grid-template-columns: 1fr 200px;
    gap: 1rem;
    margin: 1em auto;
  }
  div.controls {
    display: flex;
    flex-wrap: wrap;
    gap: 1ex;
  }
</style>
