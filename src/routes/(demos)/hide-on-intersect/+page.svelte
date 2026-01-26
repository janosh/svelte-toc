<h2>The hideOnIntersect Feature</h2>
<p>
  This page demonstrates how the <code>hideOnIntersect</code> prop automatically hides the
  table of contents when it would overlap with full-width elements like hero sections,
  banners, or images. Scroll down to see the TOC disappear and reappear.
</p>
<p>
  Watch the TOC on the right side of the screen. As you scroll through this page, it will
  hide when you reach a full-width banner, then reappear when you scroll past it.
</p>

<h2>Why This Matters</h2>
<p>
  Fixed or sticky sidebars can clash visually with full-width content that's designed to
  span the entire viewport. The <code>hideOnIntersect</code> prop solves this by
  temporarily hiding the TOC when such elements scroll into its space.
</p>
<p>
  This is especially useful for marketing pages, documentation with hero sections, or any
  layout that mixes sidebar navigation with full-bleed imagery.
</p>

<h2>How It Works</h2>
<p>
  Pass a CSS selector or array of elements to <code>hideOnIntersect</code>. The component
  checks on every scroll event whether any matching element's bounding box overlaps with
  the TOC. When overlap is detected, the TOC gracefully hides.
</p>

<h3>Usage Example</h3>
<pre>
<code>&lt;Toc hideOnIntersect=".full-width-banner" /&gt;

&lt;!-- Or with multiple selectors --&gt;
&lt;Toc hideOnIntersect=".hero, .cta-banner, .full-width-image" /&gt;</code></pre>

<h2>Desktop Only</h2>
<p>
  This feature only activates on desktop viewports. On mobile, the TOC appears as a
  compact button that doesn't interfere with full-width layouts, so intersection detection
  is unnecessary.
</p>
<p>
  The breakpoint for desktop/mobile is controlled by the <code>breakpoint</code> prop,
  which defaults to 1000px.
</p>

<div class="hero-banner" data-testid="banner-1">
  <span class="hero-icon">🚀</span>
  <h3 class="toc-exclude">Full-Width Hero Section</h3>
  <p>Notice how the TOC hides when this banner overlaps its position</p>
</div>

<h2>Performance Considerations</h2>
<p>
  The overlap detection uses <code>getBoundingClientRect()</code> which is called on
  scroll. For most pages with a handful of full-width elements, this is negligible. The
  check short-circuits early if <code>hideOnIntersect</code> is not set.
</p>
<p>
  The implementation uses a simple AABB (axis-aligned bounding box) collision test, which
  is one of the fastest intersection algorithms available.
</p>

<h2>Accessibility</h2>
<p>
  When hidden by intersection, the TOC sets <code>aria-hidden="true"</code> so screen
  readers skip the temporarily hidden content. Visibility is controlled via CSS (<code
  >opacity: 0</code>, <code>pointer-events: none</code>) to enable smooth fade transitions
  while keeping the element in the layout flow.
</p>
<p>
  This approach is preferred over using the <code>hidden</code> attribute or removing the
  element from the DOM, as it maintains layout stability and allows for smooth animations.
</p>

<h2>Edge Cases Handled</h2>
<ul>
  <li>Empty selector (no elements match) — TOC stays visible</li>
  <li>Elements added dynamically — re-checked on DOM mutations</li>
  <li>Window resize — overlap recalculated</li>
  <li>Multiple overlapping elements — hides if any overlap</li>
</ul>
<p>
  The feature is designed to be robust and handle real-world scenarios where content may
  change dynamically or the viewport may be resized.
</p>

<h2>Implementation Details</h2>
<p>
  The overlap check runs on every scroll event, but only when <code>hideOnIntersect</code>
  is set. The check compares the bounding rectangles of the TOC and each target element.
</p>
<p>
  Two rectangles overlap if and only if they overlap on both axes. The code uses the
  inverse check: rectangles do NOT overlap if one is completely to the left, right, above,
  or below the other.
</p>

<div class="cta-banner" data-testid="banner-2">
  <h3 class="toc-exclude">Call to Action Banner</h3>
  <p>Full-width CTAs are common in marketing pages</p>
  <button>Learn More</button>
</div>

<h2>Try It Yourself</h2>
<p>
  Scroll up and down this page and watch the TOC in the corner. It will hide whenever one
  of the colorful full-width sections enters its space, then smoothly reappear when you
  scroll past.
</p>
<p>
  Try resizing the browser window to see how the feature responds. On mobile widths, the
  TOC becomes a button and the intersection hiding is disabled.
</p>

<h2>Summary</h2>
<p>
  The <code>hideOnIntersect</code> prop provides a clean solution for pages that need both
  a sticky table of contents and full-width visual elements. It's performant, accessible,
  and handles edge cases gracefully.
</p>

<style>
  p {
    line-height: 1.7;
    margin: 1rem 0;
  }
  code {
    background: rgba(127, 127, 127, 0.15);
    padding: 0.15em 0.4em;
    border-radius: 4px;
    font-size: 0.9em;
  }
  pre {
    background: rgba(127, 127, 127, 0.1);
    padding: 1rem;
    border-radius: 8px;
    overflow-x: auto;
  }
  pre code {
    background: none;
    padding: 0;
  }
  .hero-banner,
  .cta-banner {
    width: 100vw;
    position: relative;
    left: 50%;
    transform: translateX(-50%);
    padding: 3rem 2rem;
    margin: 3rem 0;
    text-align: center;
    color: white;
  }
  .hero-banner {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
  .hero-banner .hero-icon {
    font-size: 3rem;
    display: block;
    margin-bottom: 0.5rem;
  }
  .hero-banner h3 {
    margin: 0 0 0.5rem;
    font-size: 1.8rem;
  }
  .hero-banner p {
    margin: 0;
    opacity: 0.9;
  }
  .cta-banner {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }
  .cta-banner h3 {
    margin: 0 0 0.5rem;
    font-size: 1.5rem;
  }
  .cta-banner p {
    margin: 0 0 1rem;
    opacity: 0.9;
  }
  .cta-banner button {
    background: white;
    color: #f5576c;
    border: none;
    padding: 0.75rem 2rem;
    font-size: 1rem;
    font-weight: 600;
    border-radius: 25px;
    cursor: pointer;
    transition: transform 0.2s;
  }
  .cta-banner button:hover {
    transform: scale(1.05);
  }
  ul {
    padding-left: 1.5rem;
  }
  li {
    margin: 0.5rem 0;
    line-height: 1.6;
  }
</style>
