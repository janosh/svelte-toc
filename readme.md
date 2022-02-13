<h1 align="center">
  <img src="https://raw.githubusercontent.com/janosh/svelte-toc/main/static/favicon.svg" alt="Svelte ToC" height=60>
  <br>&ensp;Svelte ToC
</h1>

<h4 align="center">

[![NPM version](https://img.shields.io/npm/v/svelte-toc?color=blue&logo=NPM)](https://npmjs.com/package/svelte-toc)
[![Netlify Status](https://api.netlify.com/api/v1/badges/0238699e-17a8-4423-85de-a5ca30baff0d/deploy-status)](https://app.netlify.com/sites/svelte-toc/deploys)
[![pre-commit.ci status](https://results.pre-commit.ci/badge/github/janosh/svelte-toc/main.svg)](https://results.pre-commit.ci/latest/github/janosh/svelte-toc/main)

</h4>

[Sticky Active Smooth Responsive ToC](https://janosh.dev/blog/sticky-active-smooth-responsive-toc) for SvelteKit projects.

## Installation

```sh
yarn add -D svelte-toc
```

## Usage

In a SvelteKit project:

```svelte
<script>
  import Toc from 'svelte-toc'
</script>

<Toc />

<main>
  <h1>Top Heading</h1>
</main>
```

## Props

Full list of props and bindable variables for this component (all of them optional):

- `headingSelector` (`string`, default: `'main :where(h1, h2, h3, h4, h5, h6)'`): CSS selector string that should return all headings to list in the ToC. You can try out selectors in the dev console of your live page to make sure they return what you want by passing it into `[...document.querySelectorAll(headingSelector)]`.
- `getHeadingTitles` (`function`, default: `(node) => node.innerText`): Function that receives each DOM node matching `headingSelector` and returns the string to display in the TOC.
- `getHeadingIds` (`function`, default: `(node) => node.id`): Function that receives each DOM node matching `headingSelector` and returns the string to set the URL hash to when clicking the associated ToC entry. Set to `null` to prevent updating the URL hash on ToC clicks if e.g. your headings don't have IDs.
- `getHeadingLevels` (`function`, default: `(node) => Number(node.nodeName[1])`): Function that receives each DOM node matching `headingSelector` and returns an integer from 1 to 6 for the ToC depth (determines indentation and font-size).
- `title` (`str`, default: `'Contents'`): ToC title to display above the list of headings. Set `title=''` to hide.
- `openButtonLabel` (`str`, default: `'Open table of contents'`): What to use as ARIA label for the button shown on mobile screens to open the ToC. Not used on desktop screens.
- `breakpoint` (`int`, default: `1000`): At what screen width in pixels to break from mobile to desktop styles.
- `activeTopOffset` (`integer`, default: `100`): Distance to top edge of screen (in pixels) at which a heading jumps from inactive to active. Increase this value if you have a header that makes headings disappear earlier than the viewport's top edge.
- `open` (`bool`, default: `false`): Whether the ToC is currently in an open state on mobile screens. This value is ignored on desktops.
- `activeHeading` (`HTMLHeadingElement | null`, default: `null`): The DOM node of the currently active (highlighted) heading (based on the users scroll position on the page).
- `keepActiveTocItemInView` (`boolean`, default `false`): Whether to scroll the ToC along with the page.
- `flashClickedHeadingsFor` (`int`, default: `1000`): How long a heading clicked in the ToC should receive a class of `.toc-clicked` in the main document. This can be used to help users immediately spot the heading they clicked on after the ToC scrolled it into view. Flash duration is in milliseconds. Set to 0 to disable this behavior. Style `.toc-clicked` however you like, though less is usually more. For example, the demo site uses

  ```css
  :is(h2, h3, h4, h5, h6) {
    transition: 0.3s;
  }
  .toc-clicked {
    color: cornflowerblue;
  }
  ```

To control how far from the viewport top headings come to rest when scrolled into view from clicking on them in the ToC, use

```css
* {
  /* or main :where(h1, h2, h3, h4, h5, h6) or whatever */
  scroll-margin-top: 100px;
}
```

## Slots

`Toc.svelte` accepts a slot named `"tocItem"` to customize how individual headings are rendered inside the ToC. It has access to the DOM node it represents `let:heading` as well as the list index `let:idx` (counting from 0) at which it appears in the ToC.

```svelte
<Toc>
  <span let:idx let:heading slot="tocItem">
    {idx + 1}. {heading.innerText}
  </span>
</Toc>
```

## Styling

The HTML structure of this component is

```html
<aside>
  <button>open/close (only present on mobile)</button>
  <nav>
    <h2>{title}</h2>
    <ul>
      <li>{heading1}</li>
      <li>{heading2}</li>
      ...
    </ul>
  </nav>
</aside>
```

`Toc.svelte` offers the following CSS variables which can be [passed in directly as props](https://github.com/sveltejs/rfcs/pull/13):

- `aside.toc`
  - `z-index: var(--toc-z-index, 1)`: Applies on both mobile and desktop.
- `aside.toc > nav`
  - `min-width: var(--toc-min-width)`
  - `max-width: var(--toc-max-width)`
  - `width: var(--toc-width)`
  - `max-height: var(--toc-max-height, 90vh)`: Height beyond which ToC will use scrolling instead of growing vertically.
- `aside.toc > nav > ul > li`
  - `scroll-margin: var(--toc-li-scroll-margin, 20pt 0)`: Scroll margin of ToC list items (determines distance from viewport edge (top or bottom) when keeping active ToC item scrolled in view as page scrolls).
- `aside.toc > nav > ul > li:hover`
  - `color: var(--toc-hover-color, cornflowerblue)`: Text color of hovered headings.
- `aside.toc > nav > ul > li.active`
  - `color: var(--toc-active-color, orange)`: Text color of the currently active heading (the one nearest but above top side of current viewport scroll position).
- `aside.toc > button`
  - `color: var(--toc-mobile-btn-color, black)`: Menu icon color of button used as ToC opener on mobile.
  - `background: var(--toc-mobile-btn-bg, rgba(255, 255, 255, 0.2))`: Background of padding area around the menu icon button.
- `aside.toc.mobile > nav`
  - `width: var(--toc-mobile-width, 12em)`
  - `background-color: var(--toc-mobile-bg, white)`: Background color of the `nav` element hovering in the lower-left screen corner when the ToC was opened on mobile screens.
- `aside.toc.desktop`
  - `margin: var(--toc-desktop-aside-margin)`: Margin of the outer-most `aside.toc` element on desktops.
- `aside.toc.desktop > nav`
  - `margin: var(--toc-desktop-nav-margin, 0 2ex 0 0)`
  - `top: var(--toc-desktop-sticky-top, 2em)`: How far below the screen's top edge the ToC starts being sticky.
  - `background-color: var(--toc-desktop-bg)`

Example:

```svelte
<Toc
  --toc-desktop-aside-margin="10em 0 0 0"
  --toc-desktop-sticky-top="3em"
  --toc-desktop-width="15em"
/>
```

## Want to contribute?

To submit a PR, clone the repo, install dependencies and start the dev server to try out your changes.

```sh
git clone https://github.com/janosh/svelte-toc
cd svelte-toc
yarn
yarn dev
```
