<script lang="ts">
  import { type CollapseMode, Toc } from '$lib'

  let collapse_mode: CollapseMode = $state(false)

  const mode_options: [CollapseMode, string][] = [
    [false, `Off (all visible)`],
    [true, `Full nested`],
    [`h3`, `Threshold: h3`],
    [`h4`, `Threshold: h4`],
    [`h5`, `Threshold: h5`],
  ]

  // deep h2-h5 outline for the collapse modes to act on. indentation mirrors the level so
  // the hierarchy the ToC renders is readable here. 5 h2s + 11 h3s + 18 h4s + 7 h5s
  const outline: [level: number, id: string, title: string][] = [
    [2, `getting-started`, `Getting Started`],
    [3, `installation`, `Installation`],
    [4, `npm-setup`, `NPM Setup`],
    [4, `pnpm-setup`, `PNPM Setup`],
    [5, `workspace-config`, `Workspace Configuration`],
    [3, `basic-usage`, `Basic Usage`],
    [4, `import-component`, `Importing the Component`],
    [4, `minimal-example`, `Minimal Example`],
    [2, `configuration`, `Configuration`],
    [3, `styling-options`, `Styling Options`],
    [4, `css-variables`, `CSS Variables`],
    [5, `color-scheme`, `Color Scheme`],
    [5, `typography`, `Typography`],
    [4, `custom-classes`, `Custom Classes`],
    [3, `behavior-props`, `Behavior Props`],
    [4, `scroll-offset`, `Scroll Offset`],
    [4, `active-detection`, `Active Heading Detection`],
    [5, `intersection-observer`, `Intersection Observer`],
    [5, `threshold-tuning`, `Threshold Tuning`],
    [2, `advanced-features`, `Advanced Features`],
    [3, `collapse-feature`, `Collapsible Subheadings`],
    [4, `collapse-modes`, `Collapse Modes`],
    [5, `full-collapse`, `Full Collapse Mode`],
    [5, `threshold-collapse`, `Threshold Collapse`],
    [4, `animation`, `Animation`],
    [3, `dynamic-content`, `Dynamic Content`],
    [4, `mutation-observer`, `Mutation Observer`],
    [4, `manual-refresh`, `Manual Refresh`],
    [2, `api-reference`, `API Reference`],
    [3, `props`, `Props`],
    [4, `required-props`, `Required Props`],
    [4, `optional-props`, `Optional Props`],
    [3, `events`, `Events`],
    [4, `click-events`, `Click Events`],
    [4, `scroll-events`, `Scroll Events`],
    [3, `slots`, `Slots`],
    [2, `troubleshooting`, `Troubleshooting`],
    [3, `common-issues`, `Common Issues`],
    [4, `missing-headings`, `Missing Headings`],
    [4, `scroll-not-working`, `Scroll Not Working`],
    [3, `faq`, `FAQ`],
  ]

  // enough filler that each section scrolls, so the active heading changes as you go
  const filler =
    `Lorem ipsum dolor sit amet, sample content demonstrating scroll behavior. `.repeat(6)
</script>

<main>
  <h1>Collapse Subheadings Demo</h1>
  <p>
    This demo shows the <code>collapseSubheadings</code> feature. Select different modes to
    see how the TOC collapses and expands based on the active heading. Scroll through the page
    to watch child headings appear and disappear in the TOC as you navigate.
  </p>

  <div class="controls">
    {#each mode_options as [value, label] (String(value))}
      <label>
        <input type="radio" name="collapse" {value} bind:group={collapse_mode} />
        {label}
      </label>
    {/each}
  </div>

  {#each outline as [level, id, title] (id)}
    <svelte:element this={`h${level}`} {id}>{title}</svelte:element>
    <p>{filler}</p>
  {/each}

  <!-- padding at the bottom so the last headings can still scroll to the top -->
  <div style="height: 50vh"></div>
</main>

<Toc
  collapseSubheadings={collapse_mode}
  headingSelector=":is(h2, h3, h4, h5, h6)"
  asideProps={{ style: `position: fixed; right: 9em; top: 6em; width: 22em;` }}
/>

<style>
  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 1em;
    padding: 1em;
    background-color: color-mix(in srgb, var(--toc-mobile-bg) 20%, transparent);
    border-radius: 2pt;
  }
  .controls label {
    display: flex;
    align-items: center;
    gap: 0.3em;
    cursor: pointer;
  }
  :is(h2, h3, h4, h5) {
    scroll-margin-top: 20px;
    margin-top: 2em;
  }
  h3 {
    margin-top: 1.5em;
  }
  :is(h4, h5) {
    margin-top: 1em;
  }
</style>
