<script lang="ts">
  import { Toc } from '$lib'

  type CollapseMode = boolean | `h${2 | 3 | 4 | 5 | 6}`
  let collapse_mode: CollapseMode = $state(false)

  const mode_options: [CollapseMode, string][] = [
    [false, `Off (all visible)`],
    [true, `Full nested`],
    [`h3`, `Threshold: h3`],
    [`h4`, `Threshold: h4`],
    [`h5`, `Threshold: h5`],
  ]

  const lorem = `Lorem ipsum dolor sit amet. `.repeat(8)
  const filler = `This is sample content to demonstrate scrolling behavior. `.repeat(
    4,
  )
</script>

<main>
  <h1>Collapse Subheadings Demo</h1>
  <p>
    This demo shows the <code>collapseSubheadings</code> feature. Select different modes
    to see how the TOC collapses and expands based on the active heading. Scroll through
    the page to watch child headings appear and disappear in the TOC as you navigate.
  </p>

  <div class="controls">
    {#each mode_options as [value, label] (String(value))}
      <label>
        <input type="radio" name="collapse" {value} bind:group={collapse_mode} />
        {label}
      </label>
    {/each}
  </div>

  <h2 id="getting-started">Getting Started</h2>
  <p>{lorem}</p>

  <h3 id="installation">Installation</h3>
  <p>{filler}</p>

  <h4 id="npm-setup">NPM Setup</h4>
  <p>
    Run <code>npm install svelte-toc</code> to add the package to your project. {filler}
  </p>

  <h4 id="pnpm-setup">PNPM Setup</h4>
  <p>Run <code>pnpm add svelte-toc</code> for pnpm users. {filler}</p>

  <h5 id="workspace-config">Workspace Configuration</h5>
  <p>For monorepo setups, ensure proper hoisting. {lorem}</p>

  <h3 id="basic-usage">Basic Usage</h3>
  <p>{lorem}</p>

  <h4 id="import-component">Importing the Component</h4>
  <p>Import the Toc component from the package. {filler}</p>

  <h4 id="minimal-example">Minimal Example</h4>
  <p>Just add <code>&lt;Toc /&gt;</code> to your page. {filler}</p>

  <h2 id="configuration">Configuration</h2>
  <p>{lorem}</p>

  <h3 id="styling-options">Styling Options</h3>
  <p>Customize the appearance of your table of contents. {filler}</p>

  <h4 id="css-variables">CSS Variables</h4>
  <p>Override default styles using CSS custom properties. {lorem}</p>

  <h5 id="color-scheme">Color Scheme</h5>
  <p>Set <code>--toc-active-color</code> and related variables. {filler}</p>

  <h5 id="typography">Typography</h5>
  <p>Adjust font sizes and weights for different heading levels. {filler}</p>

  <h4 id="custom-classes">Custom Classes</h4>
  <p>Apply your own CSS classes for full control. {lorem}</p>

  <h3 id="behavior-props">Behavior Props</h3>
  <p>Configure how the TOC responds to page scrolling. {filler}</p>

  <h4 id="scroll-offset">Scroll Offset</h4>
  <p>Adjust the offset used when scrolling to headings. {lorem}</p>

  <h4 id="active-detection">Active Heading Detection</h4>
  <p>Fine-tune how the currently active heading is determined. {filler}</p>

  <h5 id="intersection-observer">Intersection Observer</h5>
  <p>The component uses IntersectionObserver for efficient detection. {lorem}</p>

  <h5 id="threshold-tuning">Threshold Tuning</h5>
  <p>Adjust visibility thresholds for edge cases. {filler}</p>

  <h2 id="advanced-features">Advanced Features</h2>
  <p>{lorem}</p>

  <h3 id="collapse-feature">Collapsible Subheadings</h3>
  <p>
    The feature you're testing right now! Subheadings can be collapsed based on context.
    {filler}
  </p>

  <h4 id="collapse-modes">Collapse Modes</h4>
  <p>Choose between full collapse and threshold-based collapse. {lorem}</p>

  <h5 id="full-collapse">Full Collapse Mode</h5>
  <p>Only show immediate children of the active heading. {filler}</p>

  <h5 id="threshold-collapse">Threshold Collapse</h5>
  <p>Collapse only headings below a certain level. {filler}</p>

  <h4 id="animation">Animation</h4>
  <p>Smooth transitions when headings expand and collapse. {lorem}</p>

  <h3 id="dynamic-content">Dynamic Content</h3>
  <p>Handle pages where headings change dynamically. {filler}</p>

  <h4 id="mutation-observer">Mutation Observer</h4>
  <p>Automatically detects new headings added to the page. {lorem}</p>

  <h4 id="manual-refresh">Manual Refresh</h4>
  <p>Trigger a TOC update programmatically when needed. {filler}</p>

  <h2 id="api-reference">API Reference</h2>
  <p>{lorem}</p>

  <h3 id="props">Props</h3>
  <p>All available component properties. {filler}</p>

  <h4 id="required-props">Required Props</h4>
  <p>None! The component works with sensible defaults. {filler}</p>

  <h4 id="optional-props">Optional Props</h4>
  <p>Extensive customization through optional properties. {lorem}</p>

  <h3 id="events">Events</h3>
  <p>React to TOC interactions and state changes. {filler}</p>

  <h4 id="click-events">Click Events</h4>
  <p>Fired when users click on TOC items. {filler}</p>

  <h4 id="scroll-events">Scroll Events</h4>
  <p>Fired when the active heading changes. {lorem}</p>

  <h3 id="slots">Slots</h3>
  <p>Customize the rendering of TOC elements. {filler}</p>

  <h2 id="troubleshooting">Troubleshooting</h2>
  <p>{lorem}</p>

  <h3 id="common-issues">Common Issues</h3>
  <p>Solutions to frequently encountered problems. {filler}</p>

  <h4 id="missing-headings">Missing Headings</h4>
  <p>Check your heading selector if some headings don't appear. {lorem}</p>

  <h4 id="scroll-not-working">Scroll Not Working</h4>
  <p>Ensure headings have proper IDs assigned. {filler}</p>

  <h3 id="faq">FAQ</h3>
  <p>Answers to common questions. {lorem}</p>

  <!-- Add some padding at the bottom for scrolling tests -->
  <div style="height: 50vh"></div>
</main>

<Toc
  collapseSubheadings={collapse_mode}
  headingSelector=":is(h2, h3, h4, h5, h6):not(.toc-exclude)"
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
  /* Position TOC to the right side of viewport */
  :global(aside.toc.desktop) {
    position: fixed;
    right: 9em;
    top: 6em;
    width: 22em;
  }
  /* Highlight active TOC item - use text-shadow instead of font-weight to avoid layout shift */
  :global(aside.toc li.active) {
    text-shadow: 0 0 0.5px currentColor, 0 0 0.5px currentColor;
    background: rgba(100, 149, 237, 0.2);
  }
</style>
