Your prefer a left border on the active `<li>` to a full background color? Here's how to do that:

```svelte example
<script>
  import Toc from '$lib'
</script>

<div>
  <main>
    <h1>Hello</h1>

    Lorem ipsum dolor sit amet consectetur

    <h2>World</h2>

    adipisicing elit. Recusandae eos, molestias cumque adipisci

    <h3>More</h3>

    veniam totam vitae illo voluptatem assumenda magni consequuntur!

    <h2>Headings</h2>

    asperiores ab laboriosam quod est odit accusamus, reiciendis eum
  </main>

  <Toc
    --toc-active-border="solid cornflowerblue"
    --toc-active-border-width="0 0 0 2pt"
    --toc-active-bg="none"
    --toc-active-border-radius="0"
  />
</div>

<style>
  div {
    display: grid;
    grid-template-columns: 1fr 12em;
  }
</style>
```
