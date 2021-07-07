<p align="center">
  <img src="static/favicon.svg" alt="Svelte ToC" height=150>
</p>

# Svelte ToC

<!-- remove above in docs -->

[![NPM version](https://img.shields.io/npm/v/svelte-toc?color=blue&logo=NPM)](https://npmjs.com/package/svelte-toc)
[![Netlify Status](https://api.netlify.com/api/v1/badges/0238699e-17a8-4423-85de-a5ca30baff0d/deploy-status)](https://app.netlify.com/sites/svelte-toc/deploys)

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
  My content
</main>
```

`Toc.svelte` needs access to the `page` store to be able to update the table of contents on route changes. Since `page` is imported differently in SvelteKit and Sapper, I went with the SvelteKit way. If you'd like to use this component in a Sapper app, let me know and I'll turn `page` into a prop.

## Props

Full list of props/bindable variables for this component:

- `headingSelector` (`str[]`, default: ``[...Array(6).keys()].map(i => `main h${i + 1}`)``): String array of CSS-like selectors that should return all headings to list in ToC. Will be passed to `[...document.querySelectorAll(headingSelector)]` so you can try out selectors in the dev console of your live page to make sure they return what you want.
- `getHeadingTitles` (`function`, default: `(node) => node.innerText`): Function that receives each DOM node matching `headingSelector` and returns the string to display in the TOC.
- `getHeadingIds` (`function`, default: `(node) => node.id`): Function that receives each DOM node matching `headingSelector` and returns the string to set the URL hash to when clicking the associated ToC entry. Set to `null` to prevent updating the URL hash on ToC clicks if e.g. your headings don't have IDs.
- `getHeadingLevels` (`function`, default: `(node) => Number(node.nodeName[1])`): Function that receives each DOM node matching `headingSelector` and returns an integer from 1 to 6 for the ToC depth (determines indentation and font-size).
- `title` (`str`, default: `'Contents'`): ToC title to display above the list of headings. Set empty string to hide.
- `openButtonLabel` (`str`, default: `'Open table of contents'`): What to use as ARIA label for the button shown on mobile screens to open the ToC. Not used on desktop screens.
- `breakpoint` (`int`, default: `1000`): At what screen width in pixels to break from mobile to desktop styles.
- `open` (`bool`, default: `false`): Whether the ToC is currently in an open state on mobile screens. This value is ignored on desktops.
- `activeHeading` (`DOMNode`, default: `null`): The DOM node of the currently active (highlighted) heading (based on the users scroll position on the page).
- `flashClickedHeadingsFor` (`int`, default: `1000`): How long a heading clicked in the ToC should receive a class of `.toc-clicked` in the main document. This can be used to help users immediately spot the heading they clicked on after the ToC finished scrolling them into view. Flash duration is in milliseconds. Set to 0 to disable this behavior. Style `.toc-clicked` however you like, though less is usually more. For example, the demo site uses

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
* { /* or main :where(h1, h2, h3, h4, h5, h6) or whatever */
  scroll-margin-top: 100px;
}
```

## Styling

`Toc.svelte` offers the following CSS variables listed here with their defaults that can be [passed in directly as props](https://github.com/sveltejs/rfcs/pull/13):

- `var(--toc-z-index, 1)`: Controls `z-index` of the top-level ToC `aside` element on both mobile and desktop.
- `var(--toc-mobile-width, 12em)`:
- `var(--toc-desktop-width, 12em)`:
- `var(--toc-max-height, 90vh)`: Height beyond which ToC will use scrolling instead of growing vertically.
- `var(--toc-hover-color, cornflowerblue)`: Text color of hovered headings.
- `var(--toc-active-color, orange)`: Text color of the currently active heading. The active heading is the one closest to current scroll position.
- `var(--toc-mobile-btn-color, black)`: Color of the menu icon used as ToC opener button on mobile screen sizes.
- `var(--toc-mobile-btn-bg-color, rgba(255, 255, 255, 0.2))`: Background color of the padding area around the menu icon button.
- `var(--toc-mobile-bg-color, white)`: Background color of the `nav` element hovering in the lower-left screen corner when the ToC was opened on mobile screens.
- `var(--toc-desktop-sticky-top, 2em)`: How far below the screen's top edge the ToC starts being sticky.
- `var(--toc-desktop-margin, 0)`: Margin of the outer-most `aside.toc` element.

For example:

```svelte
<Toc
  --toc-desktop-margin="10em 0 0 0"
  --toc-desktop-sticky-top="3em"
  --toc-desktop-width="15em" />
```

## Want to contribute?

To submit a PR, clone the repo, install dependencies and start the dev server to try out your changes.

```sh
git clone https://github.com/janosh/svelte-toc
cd svelte-toc
yarn
yarn dev
```

## Examples

Used in production on these sites:

- [Svelte Algolia](https://svelte-algolia.netlify.app)
- [Svelte MultiSelect](https://svelte-multiselect.netlify.app)
