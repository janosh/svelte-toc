<h1 align="center">
  <img src="https://raw.githubusercontent.com/janosh/svelte-toc/main/static/favicon.svg" alt="Logo" height=60>
  <br>&ensp;Svelte ToC
</h1>

<h4 align="center">

[![Tests](https://github.com/janosh/svelte-toc/actions/workflows/test.yml/badge.svg)](https://github.com/janosh/svelte-toc/actions/workflows/test.yml)
[![GitHub Pages](https://github.com/janosh/svelte-toc/actions/workflows/gh-pages.yml/badge.svg)](https://github.com/janosh/svelte-toc/actions/workflows/gh-pages.yml)
[![pre-commit.ci status](https://results.pre-commit.ci/badge/github/janosh/svelte-toc/main.svg)](https://results.pre-commit.ci/latest/github/janosh/svelte-toc/main)
[![NPM version](https://img.shields.io/npm/v/svelte-toc?color=blue&logo=NPM)](https://npmjs.com/package/svelte-toc)
[![Open in StackBlitz](https://img.shields.io/badge/Open%20in-StackBlitz-darkblue?logo=stackblitz)](https://stackblitz.com/github/janosh/svelte-toc)
[![REPL](https://img.shields.io/badge/Svelte-REPL-blue?label=Try%20it!)](https://svelte.dev/repl/e292ff8935dc4f5d97e5373f9f611c1b)

</h4>

Sticky responsive table of contents component. <strong class="hide-in-docs"><a href="https://janosh.github.io/svelte-toc">Live Demo</a></strong>

## 🔨 &nbsp; Installation

```sh
npm install --dev svelte-toc
```

<slot name="demo-nav" />

## 📙 &nbsp; Usage

```svelte
<script>
  import Toc from 'svelte-toc'
</script>

<Toc />

<main>
  <h1>Page Title</h1>
  <h2>Section</h2>
  <h3>Subsection</h3>
  <h2>Next Section</h2>
  <h3 class="toc-exclude">Another Subsection</h3>
</main>
```

## 🔣 &nbsp; Props

Full list of props and bindable variables for this component (all of them optional):

1. ```ts
   activeHeading: HTMLHeadingElement | null = null
   ```

   The DOM node of the currently active (highlighted) heading (based on user's scroll position on the page).

1. ```ts
   activeHeadingScrollOffset: number = 100
   ```

   Distance in pixels to top edge of screen at which a heading jumps from inactive to active. Increase this value if you have a header that makes headings disappear earlier than the viewport's top edge.

1. ```ts
   activeTocLi: HTMLLIElement | null = null
   ```

   The DOM node of the currently active (highlighted) ToC item (based on user's scroll position on the page).

1. ```ts
   aside: HTMLElement | undefined = undefined
   ```

   The DOM node of the outer-most `aside` element. This is the element that gets the `toc` class. Cannot be passed in as a prop, only for external access!

1. ```ts
   blurParams: BlurParams | undefined = { duration: 200 }
   ```

   Parameters to pass to `transition:blur` from `svelte/transition`. Set to `null` or `{ duration: 0 }` to disable blurring.

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
   getHeadingTitles = (node: HTMLHeadingElement): string =>
     node.textContent ?? ``
   ```

   Function that receives each DOM node matching `headingSelector` and returns the string to display in the TOC.

1. ```ts
   headings: HTMLHeadingElement[] = []
   ```

   Array of DOM heading nodes currently listed and tracked by the ToC. Is bindable but mostly meant for reading, not writing. Deciding which headings to list should be left to the ToC and controlled via `headingSelector`.

1. ```ts
   headingSelector: string = `:is(h2, h3, h4):not(.toc-exclude)`
   ```

   CSS selector that matches all headings to list in the ToC. You can try out selectors in the dev console of your live page to make sure they return what you want by passing it into `[...document.querySelectorAll(headingSelector)]`. The default selector `:is(h2, h3, h4):not(.toc-exclude)` excludes `h5` and `h6` headings as well as any node with a class of `toc-exclude`. For example `<h2 class="toc-exclude">Section Title</h2>` will not be listed.

1. ```ts
   hide: boolean = false
   ```

   Whether to render the ToC. The reason you would use this and not wrap the component as a whole with Svelte's `{#if}` block is so that the script part of this component can still operate and keep track of the headings on the page, allowing conditional rendering based on the number or kinds of headings present (see [PR#14](https://github.com/janosh/svelte-toc/pull/14)). To access the headings `<Toc>` is currently tracking, use `<Toc bind:headings />`.

1. ```ts
   autoHide: boolean = true
   ```

   Whether to automatically hide the ToC when it's empty, i.e. when no headings match `headingSelector`. If true, ToC also automatically un-hides itself when re-querying for headings (e.g. on scroll) and finding some.

1. ```ts
   keepActiveTocItemInView: boolean = true
   ```

   Whether to keep the active ToC item in view when scrolling the page. Only applies to long ToCs that are too high to fit on screen. If true, the ToC container will scroll itself to keep the active item in view and centered (if possible).
   Requires [`scrollend` event](https://developer.mozilla.org/en-US/docs/Web/API/Document/scrollend_event) browser support ([71% as of 2024-01-22](https://caniuse.com/mdn-api_element_scrollend_event)), with Safari the only major browser lacking support.

1. ```ts
   minItems: number = 0
   ```

   Completely prevent the ToC from rendering if it doesn't find at least `minItems` matching headings on the page. The default of 0 means the ToC will always render, even if it's empty.

1. ```ts
   nav: HTMLElement | undefined = undefined
   ```

   The DOM node of the `nav` element. Cannot be passed in as a prop, only for external access!

1. ```ts
   open: boolean = false
   ```

   Whether the ToC is currently in an open state on mobile screens. Can be used to externally control the `open` state through 2-way binding. This value is ignored on desktop.

1. ```ts
   openButtonLabel: string = `Open table of contents`
   ```

   What to use as ARIA label for the button shown on mobile screens to open the ToC. Not used on desktop screens.

1. ```ts
   pageBody: string | HTMLElement = `body`
   ```

   Which DOM node to use as the `MutationObserver` root node. This is usually the page's `<main>` tag or `<body>` element. All headings to list in the ToC should be children of this root node. Use the closest parent node containing all headings for efficiency, especially if you have a lot of elements on the page that are on a separate branch of the DOM tree from the headings you want to list.

1. ```ts
   reactToKeys: string[] = [`ArrowDown`, `ArrowUp`, ` `, `Enter`, `Escape`, `Tab`]
   ```

   Which keyboard events to listen for. The default set of keys closes the ToC on `Escape` and `Tab` out, navigates the ToC list with `ArrowDown`, `ArrowUp`, and scrolls to the active ToC item on `Space`, and `Enter`. Set `reactToKeys = false` or `[]` to disable keyboard support entirely. Remove individual keys from the array to disable specific behaviors.

1. ```ts
   scrollBehavior: 'auto' | 'smooth' = `smooth`
   ```

   Whether to scroll the page smoothly or instantly when clicking on a ToC item. Set to `'auto'` to use the browser's default behavior.

1. ```ts
   title: string = `On this page`
   ```

   ToC title to display above the list of headings. Set `title=''` to hide.

1. ```ts
   titleTag: string = `h2`
   ```

   Change the HTML tag to be used for the ToC title. For example, to get `<strong>{title}</strong>`, set `titleTag='strong'`.

1. ```ts
   tocItems: HTMLLIElement[] = []
   ```

   Array of rendered Toc list items DOM nodes. Essentially the result of `document.querySelectorAll(headingSelector)`. Can be useful for binding.

1. ```ts
   warnOnEmpty: boolean = true
   ```

   Whether to issue a console warning if the ToC is empty.

To control how far from the viewport top headings come to rest when scrolled into view from clicking on them in the ToC, use

```css
/* replace next line with appropriate CSS selector for all your headings */
:where(h1, h2, h3, h4) {
  scroll-margin-top: 50px;
}
```

## 🎰 &nbsp; Slots

`Toc.svelte` has 3 named slots:

- `slot="toc-item"` to customize how individual headings are rendered inside the ToC. It has access to the DOM node it represents via `let:heading` as well as the list index `let:idx` (counting from 0) at which it appears in the ToC.

  ```svelte
  <Toc>
    <span let:idx let:heading slot="toc-item">
      {idx + 1}. {heading.innerText}
    </span>
  </Toc>
  ```

- `slot="title"`: Title shown above the list of ToC entries. Props `title` and `titleTag` have no effect when filling this slot.
- `slot="open-toc-icon"`: Icon shown on mobile screens which opens the ToC on clicks.

## ✨ &nbsp; Styling

The HTML structure of this component is

```html
<aside>
  <button>open/close (only present on mobile)</button>
  <nav>
    <h2>{title}</h2>
    <ol>
      <li>{heading1}</li>
      <li>{heading2}</li>
      ...
    </ol>
  </nav>
</aside>
```

`Toc.svelte` offers the following CSS variables which can be [passed in directly as props](https://github.com/sveltejs/rfcs/pull/13):

- `aside.toc`
  - `font: var(--toc-font, 10pt sans-serif)`
  - `min-width: var(--toc-min-width)`
  - `width: var(--toc-width)`
  - `z-index: var(--toc-z-index)`: Applies on both mobile and desktop.
- `aside.toc > nav`
  - `overflow: var(--toc-overflow, auto)`
  - `max-height: var(--toc-max-height, 90vh)`: Height beyond which ToC will use scrolling instead of growing vertically.
  - `padding: var(--toc-padding, 1em 1em 0)`
- `aside.toc > nav > ol`
  - `list-style: var(--toc-ol-list-style, none)`
  - `padding: var(--toc-ol-padding, 0)`
  - `margin: var(--toc-ol-margin)`
- `.toc-title`
  - `padding: var(--toc-title-padding)`
  - `margin: var(--toc-title-margin)`
  - `font: var(--toc-title-font)`
- `aside.toc > nav > ol > li`
  - `color: var(--toc-li-color)`
  - `border: var(--toc-li-border)`
  - `border-radius: var(--toc-li-border-radius)`
  - `margin: var(--toc-li-margin)`
  - `padding: var(--toc-li-padding, 2pt 4pt)`
  - `font: var(--toc-li-font)`
- `aside.toc > nav > ol > li:hover`
  - `color: var(--toc-li-hover-color, cornflowerblue)`: Text color of hovered headings.
  - `background: var(--toc-li-hover-bg)`
- `aside.toc > nav > ol > li.active`
  - `background: var(--toc-active-bg, cornflowerblue)`
  - `color: var(--toc-active-color, white)`: Text color of the currently active heading (the one nearest but above top side of current viewport scroll position).
  - `font: var(--toc-active-li-font)`
  - `border: var(--toc-active-border)`
  - `border-width: var(--toc-active-border-width)`: Allows setting top, right, bottom, left border widths separately.
  - `border-radius: var(--toc-active-border-radius, 2pt)`
- `aside.toc > button`
  - `bottom: var(--toc-mobile-btn-bottom, 0)`
  - `font: var(--toc-mobile-btn-font, 2em sans-serif)`
  - `line-height: var(--toc-mobile-btn-line-height, 0)`
  - `right: var(--toc-mobile-btn-right, 0)`
  - `z-index: var(--toc-mobile-btn-z-index, 2)`
  - `padding: var(--toc-mobile-btn-padding, 2pt 3pt)`
  - `border-radius: var(--toc-mobile-btn-border-radius, 4pt)`
  - `background: var(--toc-mobile-btn-bg, rgba(255, 255, 255, 0.2))`: Background of padding area around the menu icon button.
  - `color: var(--toc-mobile-btn-color, black)`: Menu icon color of button used as ToC opener on mobile.
- `aside.toc > nav > .toc-title`
  - `margin-top: var(--toc-title-margin-top, 0)`
- `aside.toc.mobile`
  - `bottom: var(--toc-mobile-bottom, 1em)`
  - `right: var(--toc-mobile-right, 1em)`
- `aside.toc.mobile > nav`
  - `border-radius: var(--toc-mobile-border-radius, 3pt)`
  - `right: var(--toc-mobile-right, 1em)`
  - `background: var(--toc-mobile-bg, white)`: Background color of the `nav` element hovering in the lower-left screen corner when the ToC was opened on mobile screens.
  - `width: var(--toc-mobile-width, 18em)`
  - `box-shadow: var(--toc-mobile-shadow)`
  - `border: var(--toc-mobile-border)`
- `aside.toc.desktop`
  - `background: var(--toc-desktop-bg)`
  - `margin: var(--toc-desktop-aside-margin)`: Margin of the outer-most `aside.toc` element on desktops.
  - `max-width: var(--toc-desktop-max-width)`
  - `top: var(--toc-desktop-sticky-top, 2em)`: How far below the screen's top edge the ToC starts being sticky.
- `aside.toc.desktop > nav`
  - `margin: var(--toc-desktop-nav-margin)`

Example:

```svelte
<Toc
  --toc-desktop-aside-margin="10em 0 0 0"
  --toc-desktop-sticky-top="3em"
  --toc-width="15em"
/>
```

## 🧪 &thinsp; Coverage

| Statements                                                                         | Branches                                                                             | Lines                                                                    |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| ![Statements](https://img.shields.io/badge/statements-78.57%25-red.svg?style=flat) | ![Branches](https://img.shields.io/badge/branches-100%25-brightgreen.svg?style=flat) | ![Lines](https://img.shields.io/badge/lines-78.57%25-red.svg?style=flat) |

## 🆕 &nbsp; Changelog

[View the changelog](changelog.md).

## 🙏 &nbsp; Contributing

Here are some steps to [get you started](contributing.md) if you'd like to contribute to this project!
