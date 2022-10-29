<h1 align="center">
  <img src="https://raw.githubusercontent.com/janosh/svelte-toc/main/static/favicon.svg" alt="Svelte ToC" height=60>
  <br>&ensp;Svelte ToC
</h1>

<h4 align="center">

[![Tests](https://github.com/janosh/svelte-toc/actions/workflows/test.yml/badge.svg)](https://github.com/janosh/svelte-toc/actions/workflows/test.yml)
[![NPM version](https://img.shields.io/npm/v/svelte-toc?color=blue&logo=NPM)](https://npmjs.com/package/svelte-toc)
[![Netlify Status](https://api.netlify.com/api/v1/badges/0238699e-17a8-4423-85de-a5ca30baff0d/deploy-status)](https://app.netlify.com/sites/svelte-toc/deploys)
[![pre-commit.ci status](https://results.pre-commit.ci/badge/github/janosh/svelte-toc/main.svg)](https://results.pre-commit.ci/latest/github/janosh/svelte-toc/main)
[![Open in StackBlitz](https://img.shields.io/badge/Open%20in-StackBlitz-darkblue?logo=stackblitz)](https://stackblitz.com/github/janosh/svelte-toc)

</h4>

Sticky responsive table of contents component. <strong class="hide-in-docs"><a href="https://svelte-toc.netlify.app">Live demo</a></strong>

## Installation

```sh
npm add -D svelte-toc
pnpm add -D svelte-toc
```

## Usage

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

1. ```ts
   activeHeading: HTMLHeadingElement | null = null
   ```

   The DOM node of the currently active (highlighted) heading (based on the users scroll position on the page).

1. ```ts
   activeHeadingScrollOffset: number = 100
   ```

   Distance in pixels to top edge of screen at which a heading jumps from inactive to active. Increase this value if you have a header that makes headings disappear earlier than the viewport's top edge.

1. ```ts
   activeTocLi: HTMLLIElement | null = null
   ```

   The DOM node of the currently active (highlighted) ToC item (based on the users scroll position on the page).

1. ```ts
   breakpoint: number = 1000
   ```

   At what screen width in pixels to break from mobile to desktop styles.

1. ```ts
   desktop: boolean = true
   ```

   `true` if current window width > `breakpoint` else `false`.

1. ```ts
   flashClickedHeadingsFor: number = 1500
   ```

   How long (in milliseconds) a heading clicked in the ToC should receive a class of `.toc-clicked` in the main document. This can be used to help users immediately spot the heading they clicked on after the ToC scrolled it into view. Flash duration is in milliseconds. Set to 0 to disable this behavior. Style `.toc-clicked` however you like, though less is usually more. For example, the demo site uses

   ```css
   :is(h2, h3, h4) {
     transition: 0.3s;
   }
   .toc-clicked {
     color: cornflowerblue;
   }
   ```

1. ```ts
   getHeadingIds = (node: HTMLHeadingElement): string => node.id
   ```

   Function that receives each DOM node matching `headingSelector` and returns the string to set the URL hash to when clicking the associated ToC entry. Set to `null` to prevent updating the URL hash on ToC clicks if e.g. your headings don't have IDs.

1. ```ts
   getHeadingLevels = (node: HTMLHeadingElement): number =>
     Number(node.nodeName[1]) // get the number from H1, H2, ...
   ```

   Function that receives each DOM node matching `headingSelector` and returns an integer from 1 to 6 for the ToC depth (determines indentation and font-size).

1. ```ts
   getHeadingTitles = (node: HTMLHeadingElement): string => node.innerText
   ```

   Function that receives each DOM node matching `headingSelector` and returns the string to display in the TOC.

1. ```ts
   headings: HTMLHeadingElement[] = []
   ```

   Array of DOM heading nodes currently listed and tracked by the ToC. Is bindable but mostly meant for reading, not writing. Deciding which headings to list should be left to the ToC and controlled via `headingSelector`.

1. ```ts
   headingSelector: string = `:is(h1, h2, h3, h4):not(.toc-exclude)`
   ```

   CSS selector string that should return all headings to list in the ToC. You can try out selectors in the dev console of your live page to make sure they return what you want by passing it into `[...document.querySelectorAll(headingSelector)]`. The default selector `:is(h1, h2, h3, h4):not(.toc-exclude)` excludes `h5` and `h6` headings as well as any node with a class of `toc-exclude`. For example `<h1 class="toc-exclude">Page Title</h1>` will not be listed.

1. ```ts
   hide: boolean = false
   ```

   Whether to render or hide the ToC. The reason you would use this and not wrap the component as a whole with Svelte's `{#if}` block is so that the script part of this component can still operate and keep track of the headings on the page, allowing conditional rendering based on the number or kinds of headings present (see [PR#14](https://github.com/janosh/svelte-toc/pull/14)). To access the headings `<Toc>` is currently tracking, use `<Toc bind:headings={myHeadings} />`.

1. ```ts
   keepActiveTocItemInView: boolean = true
   ```

   Whether to scroll the ToC along with the page.

1. ```ts
   open: boolean = false
   ```

   Whether the ToC is currently in an open state on mobile screens. This value is ignored on desktops.

1. ```ts
   openButtonLabel: string = `Open table of contents`
   ```

   What to use as ARIA label for the button shown on mobile screens to open the ToC. Not used on desktop screens.

1. ```ts
   pageBody: string | HTMLElement = `body`
   ```

   Which DOM node to use as the `MutationObserver` root node. This is usually the page's `<main>` tag or `<body>` element. All headings to list in the ToC should be children of this root node. Use the closest parent node containing all headings for efficiency.

1. ```ts
   title: string = `On this page`
   ```

   ToC title to display above the list of headings. Set `title=''` to hide.

1. ```ts
   titleTag: string = `h2`
   ```

   Change the HTML tag to be used for the ToC title. For example, to get `<strong>{title}</strong>`, set `titleTag='strong'`

1. ```ts
   tocItems: HTMLLIElement[] = []
   ```

   Array of rendered Toc list items DOM nodes. Essentially the result of passing `aside.toc > nav > ul > li` to `document.querySelectorAll()`.

To control how far from the viewport top headings come to rest when scrolled into view from clicking on them in the ToC, use

```css
/* replace next line with appropriate CSS selector for all your headings */
:where(h1, h2, h3, h4) {
  scroll-margin-top: 50px;
}
```

## Slots

`Toc.svelte` has 2 named slots:

- `slot="toc-item"` to customize how individual headings are rendered inside the ToC. It has access to the DOM node it represents via `let:heading` as well as the list index `let:idx` (counting from 0) at which it appears in the ToC.

  ```svelte
  <Toc>
    <span let:idx let:heading slot="toc-item">
      {idx + 1}. {heading.innerText}
    </span>
  </Toc>
  ```

- `slot="open-toc-icon"`: Customize icon shown on mobile screens which opens the ToC on clicks.

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
  - `max-width: var(--toc-desktop-max-width)`
  - `width: var(--toc-width)`
  - `max-height: var(--toc-max-height, 90vh)`: Height beyond which ToC will use scrolling instead of growing vertically.
  - `padding: var(--toc-padding, 1em 1em 0)`
- `aside.toc > nav > ul > li`
  - `border-radius: var(--toc-li-border-radius, 2pt)`
  - `padding: var(--toc-li-padding, 2pt 4pt)`
  - `margin: var(--toc-li-margin)`
- `aside.toc > nav > ul > li:hover`
  - `color: var(--toc-hover-color, cornflowerblue)`: Text color of hovered headings.
- `aside.toc > nav > ul > li.active`
  - `color: var(--toc-active-color, white)`: Text color of the currently active heading (the one nearest but above top side of current viewport scroll position).
  - `background: var(--toc-active-bg, cornflowerblue)`
  - `font-weight: var(--toc-active-font-weight)`
- `aside.toc > button`
  - `color: var(--toc-mobile-btn-color, black)`: Menu icon color of button used as ToC opener on mobile.
  - `background: var(--toc-mobile-btn-bg, rgba(255, 255, 255, 0.2))`: Background of padding area around the menu icon button.
- `aside.toc.mobile`
  - `bottom: var(--toc-mobile-bottom, 1em)`
  - `right: var(--toc-mobile-right, 1em)`
- `aside.toc.mobile > nav`
  - `width: var(--toc-mobile-width, 18em)`
  - `background-color: var(--toc-mobile-bg, white)`: Background color of the `nav` element hovering in the lower-left screen corner when the ToC was opened on mobile screens.
- `aside.toc.desktop`
  - `margin: var(--toc-desktop-aside-margin)`: Margin of the outer-most `aside.toc` element on desktops.
- `aside.toc.desktop > nav`
  - `margin: var(--toc-desktop-nav-margin)`
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
pnpm install
pnpm dev
```
