<p align="center">
  <img src="site/static/favicon.svg" alt="Svelte ToC" height=150>
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

<div class="table">

| name               | default                                             | description                                                                                                                                                                                                                                                     |
| :----------------- | :-------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `headingSelector`  | ``[...Array(6).keys()].map(i => `main h${i + 1}`)`` | String array of CSS-like selector that should return all headings to list in ToC. Will be passed to `[...document.querySelectorAll(headingSelector)]` so you can try out selectors in the dev console of your live page to make sure they return what you want. |
| `getTitle`         | `(node) => node.innerText`                          | Function that receives each DOM node matching `headingSelector` and returns the string to display in the TOC.                                                                                                                                                   |
| `getSlug`          | `(node) => node.id`                                 | Function that receives each DOM node matching `headingSelector` and returns the slug to append to the site's URL in the address bar when the corresponding heading is clicked in the ToC.                                                                       |
| `getDepth`         | `(node) => Number(node.nodeName[1])`                | Function that receives each DOM node matching `headingSelector` and returns an integer from 1 to 6 for the ToC depth (determines indentation and font-size).                                                                                                    |
| `throttleInterval` | `300`                                               | Time duration in milliseconds that determines the minimum time between calls to the `scrollHandler` which updates the currently active heading while scrolling. `300` is a sensible default and probably doesn't need to be changed.                            |
| `historyMode`      | `'replace'`                                         | Either `'replace'` or `'push'` if you want clicks on headings to replace or append new states to the browser history. Used only when `getSlug` returned a truthy slug.                                                                                          |

</div>

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

The repo is split into two workspaces, the `package` itself and the demo `site`. To submit a PR, best clone the repo, install dependencies and start the dev server to try out your changes first.

```sh
git clone https://github.com/janosh/svelte-toc
cd svelte-toc
yarn
yarn workspace site dev
```

## Examples

Used in production on these sites:

- [Svelte Algolia](https://svelte-algolia.netlify.app)
- [Svelte MultiSelect](https://svelte-multiselect.netlify.app)
