### Changelog

#### [v0.6.2](https://github.com/janosh/svelte-toc/compare/v0.6.1...v0.6.2)

> 11 July 2025

- Update documentation to be in sync with `Toc.svelte` and fix minor bugs by @Zlendy in https://github.com/janosh/svelte-toc/pull/63
- Swap `node` for `deno` by @janosh in https://github.com/janosh/svelte-toc/pull/65
- Update deps, add `vitest` and `playwright` tests, add `svelte-check` and `svelte-package` scripts, add `eslint` and `eslint-plugin-svelte` to `devDependencies`

##### New Contributors

- @Zlendy made their first contribution in https://github.com/janosh/svelte-toc/pull/63

**Full Changelog**: https://github.com/janosh/svelte-toc/compare/v0.6.1...v0.6.2

#### [v0.6.1](https://github.com/janosh/svelte-toc/compare/v0.6.0...v0.6.1)

> 18 May 2025

- add many more style props to Toc component [`9cf5697`](https://github.com/janosh/svelte-toc/commit/9cf5697c30cf25737defb88bba5a8d520d2f9d56)

#### [v0.6.0](https://github.com/janosh/svelte-toc/compare/v0.5.9...v0.6.0)

> 13 April 2025

- Svelte 5 Migration [`#61`](https://github.com/janosh/svelte-toc/pull/61)

#### [v0.5.9](https://github.com/janosh/svelte-toc/compare/v0.5.8...v0.5.9)

> 12 June 2024

- Ignore spurious `scrollend` events on page load before any actual scrolling in Chrome [`#58`](https://github.com/janosh/svelte-toc/pull/58)

#### [v0.5.8](https://github.com/janosh/svelte-toc/compare/v0.5.7...v0.5.8)

> 21 March 2024

- Add `reactToKeys` prop to Toc component and `on_keydown` handler to enable navigating ToC with keyboard [`#55`](https://github.com/janosh/svelte-toc/pull/55)
- When opening ToC on mobile, ensure active ToC item is scrolled into view [`#54`](https://github.com/janosh/svelte-toc/pull/54)

#### [v0.5.7](https://github.com/janosh/svelte-toc/compare/v0.5.6...v0.5.7)

> 22 January 2024

- Replace hacky `window.setTimeout(50)` callback with `scrollend` event to `keepActiveTocItemInView` [`#53`](https://github.com/janosh/svelte-toc/pull/53)
- `package.json` add `"types": "./dist/index.d.ts"` and default `--toc-overflow to auto` [`#49`](https://github.com/janosh/svelte-toc/pull/49)
- expose Toc aside and nav HTMLElements for external access [`fc8806d`](https://github.com/janosh/svelte-toc/commit/fc8806dd53b68cf972e8a07fa5600c6152560693)

#### [v0.5.6](https://github.com/janosh/svelte-toc/compare/v0.5.5...v0.5.6)

> 12 September 2023

- Add prop `blurParams: BlurParams | null = { duration: 200 }` [`#47`](https://github.com/janosh/svelte-toc/pull/47)
- Copy buttons [`#43`](https://github.com/janosh/svelte-toc/pull/43)

#### [v0.5.5](https://github.com/janosh/svelte-toc/compare/v0.5.4...v0.5.5)

> 20 April 2023

- DRY GitHub Actions [`#40`](https://github.com/janosh/svelte-toc/pull/40)
- fix svelte a11y warning about &lt;li&gt; tabindex and role [`aa1cd50`](https://github.com/janosh/svelte-toc/commit/aa1cd507e158acdf13048bf158e4f4b3ba0fbba1)

#### [v0.5.4](https://github.com/janosh/svelte-toc/compare/v0.5.3...v0.5.4)

> 16 March 2023

- Fix new timeout callback for keepActiveTocItemInView=true breaking page scrolling [`#39`](https://github.com/janosh/svelte-toc/pull/39)

#### [v0.5.3](https://github.com/janosh/svelte-toc/compare/v0.5.2...v0.5.3)

> 12 March 2023

- Fix ToC scroll abort [`#37`](https://github.com/janosh/svelte-toc/pull/37)
- Add var(--toc-overflow, auto scroll) [`#34`](https://github.com/janosh/svelte-toc/pull/34)
- add src/routes/(demos)/left-border-active-li/+page.md powered by mdsvexamples [`6be66f0`](https://github.com/janosh/svelte-toc/commit/6be66f061145b9ca6635cafff6c20fd687b98c4d)
- tweak readme prop docs [`84c1854`](https://github.com/janosh/svelte-toc/commit/84c1854f037c214e5d736982b2d834c8f278bf0f)
- document new CSS variables in readme [`5df7767`](https://github.com/janosh/svelte-toc/commit/5df7767cfe5a9253d0a673b6945bf10d6b024685)
- add test 'subheadings are indented' [`06da853`](https://github.com/janosh/svelte-toc/commit/06da85303dcbe6bed1e31057447f5348e4220c84)
- add var(--toc-ol-list-style, none) and var(--toc-ol-padding, 0) [`ade5425`](https://github.com/janosh/svelte-toc/commit/ade54251c2d67f0ac3adc41cfe10e5ce4ef16272)

#### [v0.5.2](https://github.com/janosh/svelte-toc/compare/v0.5.1...v0.5.2)

> 12 January 2023

- add auto changelog [`d7eaeea`](https://github.com/janosh/svelte-toc/commit/d7eaeeacf3fe5e9de4500413a318bb87ccf2f578)
- add contributing.md [`a313e7b`](https://github.com/janosh/svelte-toc/commit/a313e7be15ab3d4fdc4e0e056d5cf39a31c6a76a)
- add many new CSS variables in Toc.svelte [`badbe2f`](https://github.com/janosh/svelte-toc/commit/badbe2f4e39c22970820056003d27b957050629a)
- add coverage badges to readme [`8a24e2b`](https://github.com/janosh/svelte-toc/commit/8a24e2b920829cde85fb5c27e6e64e94902dacf5)
- add vite alias $root to clean up package.json, readme|contributing|changelog.md imports [`76427ee`](https://github.com/janosh/svelte-toc/commit/76427ee06bbc5ef1ce5ec23e629ef8dc003b9763)

#### [v0.5.1](https://github.com/janosh/svelte-toc/compare/v0.5.0...v0.5.1)

> 20 December 2022

- use margin instead transform: translateX for indented ToC items [`49d43d7`](https://github.com/janosh/svelte-toc/commit/49d43d7fb5ebfe0b0f95b370c0dd01c0dc3e60fe)
- pnpm add -D @vitest/coverage-c8 [`bab57dc`](https://github.com/janosh/svelte-toc/commit/bab57dc8b7368cc20df4bf071772eef3ff74bf6e)

#### [v0.5.0](https://github.com/janosh/svelte-toc/compare/v0.4.1...v0.5.0)

> 3 December 2022

- Breaking: hide ToC if empty [`#30`](https://github.com/janosh/svelte-toc/pull/30)
- Deploy docs to GitHub Pages [`#29`](https://github.com/janosh/svelte-toc/pull/29)

#### [v0.4.1](https://github.com/janosh/svelte-toc/compare/v0.4.0...v0.4.1)

> 6 November 2022

- Only trigger keyup event handler on enter/space keys [`#28`](https://github.com/janosh/svelte-toc/pull/28)
- `yarn` to `pnpm` [`#27`](https://github.com/janosh/svelte-toc/pull/27)
- use code fences in readme to document prop, types and defaults [`b7f6f49`](https://github.com/janosh/svelte-toc/commit/b7f6f49a535ede380ca11d554af4bef5579cb2f2)
- test CSS variables in readme are in sync with actual component [`ecf994b`](https://github.com/janosh/svelte-toc/commit/ecf994bc025e2d69105b8c01440e9e7fde8530eb)
- test that readme documents no non-existent props [`d08eb59`](https://github.com/janosh/svelte-toc/commit/d08eb59b2a7fbf2b835f4afc02af09fb25bcbba2)
- add test 'ToC lists expected headings' [`b18b003`](https://github.com/janosh/svelte-toc/commit/b18b0038795be6f320e0c141aa87dcaa3e670416)
- improve readme doc on CSS class toc-exclude in default heading selector [`9e1476a`](https://github.com/janosh/svelte-toc/commit/9e1476aab169d2025b87b1407a791d6cb7c83769)

#### [v0.4.0](https://github.com/janosh/svelte-toc/compare/v0.3.2...v0.4.0)

> 13 September 2022

- Better readme test [`#24`](https://github.com/janosh/svelte-toc/pull/24)
- Fix ToC preventing page scrolling beyond active heading when zoomed into page [`#23`](https://github.com/janosh/svelte-toc/pull/23)

#### [v0.3.2](https://github.com/janosh/svelte-toc/compare/v0.3.1...v0.3.2)

> 11 September 2022

- Add prop `titleTag` allowing to change HTML tag used for ToC title [`#21`](https://github.com/janosh/svelte-toc/pull/21)

#### [v0.3.1](https://github.com/janosh/svelte-toc/compare/v0.3.0...v0.3.1)

> 10 September 2022

- fix: exclude header of table itself by class toc-exclude [`#20`](https://github.com/janosh/svelte-toc/pull/20)

#### [v0.3.0](https://github.com/janosh/svelte-toc/compare/v0.2.12...v0.3.0)

> 10 September 2022

- Mutation observer [`#19`](https://github.com/janosh/svelte-toc/pull/19)
- Fix cases where node.offsetTop is returning 0 [`#16`](https://github.com/janosh/svelte-toc/pull/16)
- add playwright testing in tests/toc.test.ts [`a52aa29`](https://github.com/janosh/svelte-toc/commit/a52aa29bb89f546b1266a4a00e17286c75c6961b)
- mv `.github/workflows/{publish,test}.yml` and have it run yarn test in CI [`42a232d`](https://github.com/janosh/svelte-toc/commit/42a232dee2c8de46819b3a68fc059d2b5903098d)
- update deps and address sveltekit breaking changes [`e023246`](https://github.com/janosh/svelte-toc/commit/e02324612af3fe246e54fa5eb49fc9cbb6e5fdab)

#### [v0.2.12](https://github.com/janosh/svelte-toc/compare/v0.2.11...v0.2.12)

> 23 August 2022

- Export headings and desktop and add hide prop [`#14`](https://github.com/janosh/svelte-toc/pull/14)

#### [v0.2.11](https://github.com/janosh/svelte-toc/compare/v0.2.10...v0.2.11)

> 18 August 2022

- sveltekit auto migration [`ce8e4a8`](https://github.com/janosh/svelte-toc/commit/ce8e4a8cb424320bd5830b5453b88a5611844c09)

#### [v0.2.10](https://github.com/janosh/svelte-toc/compare/v0.2.9...v0.2.10)

> 17 July 2022

- [pre-commit.ci] pre-commit autoupdate [`#13`](https://github.com/janosh/svelte-toc/pull/13)
- [pre-commit.ci] pre-commit autoupdate [`#11`](https://github.com/janosh/svelte-toc/pull/11)
- update deps [`dd64696`](https://github.com/janosh/svelte-toc/commit/dd64696aa072453c79ccc1e6aeb4ae35bb6f55a8)
- replace `scrollIntoViewIfNeeded()` with ``scrollIntoView({ block: `nearest` })`` [`3466e0f`](https://github.com/janosh/svelte-toc/commit/3466e0fa2be40cba2f2c4aca7988c44fb43d613f)

#### [v0.2.9](https://github.com/janosh/svelte-toc/compare/v0.2.8...v0.2.9)

> 2 April 2022

- fix page.subscribe(requery_headings) causing 'Function called outside component initialization' [`f8ad29f`](https://github.com/janosh/svelte-toc/commit/f8ad29fcfaf3fdeee1614f66fa7eb2c3c876cacb)

#### [v0.2.8](https://github.com/janosh/svelte-toc/compare/v0.2.7...v0.2.8)

> 23 March 2022

- Fix `afterNavigate()` runtime error [`#10`](https://github.com/janosh/svelte-toc/pull/10)

#### [v0.2.7](https://github.com/janosh/svelte-toc/compare/v0.2.6...v0.2.7)

> 13 March 2022

- Exclude headings with class `.toc-exclude` [`#9`](https://github.com/janosh/svelte-toc/pull/9)
- replace onClickOutside action with svelte:window click listener [`da0cd75`](https://github.com/janosh/svelte-toc/commit/da0cd750e42ef1366f366bef81c90702f2daf9b7)

#### [v0.2.6](https://github.com/janosh/svelte-toc/compare/v0.2.5...v0.2.6)

> 19 February 2022

- fix scroll heading into view on ToC click [`f0b6f5f`](https://github.com/janosh/svelte-toc/commit/f0b6f5fdd5240eae9cc66708e783717659d618bd)

#### [v0.2.5](https://github.com/janosh/svelte-toc/compare/v0.2.4...v0.2.5)

> 14 February 2022

- add css vars --toc-active-bg and --toc-active-font-weight [`a2ad8ef`](https://github.com/janosh/svelte-toc/commit/a2ad8ef811b563d65c769a7d74e7176c9460681c)
- fix scroll heading into view on ToC click [`983596b`](https://github.com/janosh/svelte-toc/commit/983596ba5351275e3250ef8ce700d8ab59d9cdea)

#### [v0.2.4](https://github.com/janosh/svelte-toc/compare/v0.2.3...v0.2.4)

> 13 February 2022

- much simpler active heading logic inspired by sveltekit docs ToC [`1bab517`](https://github.com/janosh/svelte-toc/commit/1bab5176f73c393664da71abd6f78b221599328e)
- add .github/workflows/publish.yml, update readme mention afterNavigate lifecycle hook, use mdsvex v0.10.5 TS globals [`b3feb92`](https://github.com/janosh/svelte-toc/commit/b3feb9231b4b0184ff3b0031832277146f173e88)

#### [v0.2.3](https://github.com/janosh/svelte-toc/compare/v0.2.2...v0.2.3)

> 22 January 2022

- replace page.subscribe() + onMount() with new afterNavigate() lifecycle hook <https://github.com/sveltejs/kit/pull/3293> [`4d39a87`](https://github.com/janosh/svelte-toc/commit/4d39a87014ed6b793a4226781b69b8126aa7df65)

#### [v0.2.2](https://github.com/janosh/svelte-toc/compare/v0.2.1...v0.2.2)

> 10 January 2022

- add bool prop keepActiveTocItemInView [`f3e1dea`](https://github.com/janosh/svelte-toc/commit/f3e1dea4f37f364e9cef5c2edbedc7d978965643)

#### [v0.2.1](https://github.com/janosh/svelte-toc/compare/v0.2.0...v0.2.1)

> 7 January 2022

- change default ToC title: Contents -&gt; On this page, rename heading, bump node 16.1 to 17.3, add types of error + layout pages [`d52329f`](https://github.com/janosh/svelte-toc/commit/d52329f04360555a948cda16372e4cdbe1b5225a)
- drop custom Heading type, use HTMLHeadingElement directly (-15 LoC), add package default export [`d012ab7`](https://github.com/janosh/svelte-toc/commit/d012ab71df0e32fe30bf624a03bd1843f0422154)
- [pre-commit.ci] pre-commit autoupdate [`bf6fa1a`](https://github.com/janosh/svelte-toc/commit/bf6fa1abd1b9642765b72ceb786e2546d8647579)

#### [v0.2.0](https://github.com/janosh/svelte-toc/compare/v0.1.11...v0.2.0)

> 31 December 2021

- fix erratic highlighting of active heading near page bottom + keep active heading in ToC scrolled into view + some new CSS variables (closes #2) [`#2`](https://github.com/janosh/svelte-toc/issues/2)

#### [v0.1.11](https://github.com/janosh/svelte-toc/compare/v0.1.10...v0.1.11)

> 30 December 2021

- make blur transition local to not show on unmount due to page navigation (closes #3) [`#3`](https://github.com/janosh/svelte-toc/issues/3)
- prettier drop svelteBracketNewLine, sort imports [`69922f8`](https://github.com/janosh/svelte-toc/commit/69922f89239a9e94b653ace6175b817c9762a952)

#### [v0.1.10](https://github.com/janosh/svelte-toc/compare/v0.1.9...v0.1.10)

> 13 November 2021

- recessive CSS rules <https://git.io/JXpnx> [`adab50c`](https://github.com/janosh/svelte-toc/commit/adab50c4c9ce6628f8aecaf6df58525e42071361)

#### [v0.1.9](https://github.com/janosh/svelte-toc/compare/v0.1.8...v0.1.9)

> 20 October 2021

- add pre-commit hooks [`dfc78ab`](https://github.com/janosh/svelte-toc/commit/dfc78ab7cdf848a81e30f18cb97ed725d7425cd7)
- update deps, seems to fix janosh/svelte-bricks#1 [`414628d`](https://github.com/janosh/svelte-toc/commit/414628d9f509d2d28a7a362d1dabb235f8a46b52)
- use rehype-autolink-headings test to not link &lt;h1&gt; [`56ba0cb`](https://github.com/janosh/svelte-toc/commit/56ba0cb25faa6b7628185e12091fbb4dd5d4d0dd)

#### [v0.1.8](https://github.com/janosh/svelte-toc/compare/v0.1.7...v0.1.8)

> 17 July 2021

- grab latest prism-vsc-dark-plus.css from <https://git.io/JWPGk> [`42842ff`](https://github.com/janosh/svelte-toc/commit/42842ffda2c7c000c1eef3abbca9292321ffc41d)
- use custom tsconfig.json [`be9463a`](https://github.com/janosh/svelte-toc/commit/be9463a626b3aa4d72e65ec42cac5289ec825085)

#### [v0.1.7](https://github.com/janosh/svelte-toc/compare/v0.1.6...v0.1.7)

> 12 July 2021

- more typescript migration [`d90d059`](https://github.com/janosh/svelte-toc/commit/d90d059694b92f09595621009b7a549ca65178cf)
- update to @sveltejs/kit@1.0.0-next.124+ to use svelte field in package.json [`e80854d`](https://github.com/janosh/svelte-toc/commit/e80854d225d4a1a2d2fc2f31543fece4846572fc)

#### [v0.1.6](https://github.com/janosh/svelte-toc/compare/v0.1.5...v0.1.6)

> 9 July 2021

- convert package to typescript [`1438b75`](https://github.com/janosh/svelte-toc/commit/1438b75e4fa092e363b1cb1195ad9779d7b1fe26)
- git rm --cache auto-generated src/docs.svx [`fe4abdb`](https://github.com/janosh/svelte-toc/commit/fe4abdb144268d37905eabb7cc335ad055114c78)
- update URL hash on ToC clicks [`d460c76`](https://github.com/janosh/svelte-toc/commit/d460c76a6f1908f4bb99113962b4cca714dfd8b7)

#### [v0.1.5](https://github.com/janosh/svelte-toc/compare/v0.1.4...v0.1.5)

> 22 June 2021

- republish to fix default export [`0980c3f`](https://github.com/janosh/svelte-toc/commit/0980c3f7bde7a2a1dc887662c27e610b4ef9a176)

#### [v0.1.4](https://github.com/janosh/svelte-toc/compare/v0.1.3...v0.1.4)

> 22 June 2021

- convert file structure from yarn workspaces to svelte-kit package [`647fd32`](https://github.com/janosh/svelte-toc/commit/647fd327eafcfad1dc86252bfdc60944ea5fd87e)

#### [v0.1.3](https://github.com/janosh/svelte-toc/compare/v0.1.2...v0.1.3)

> 19 June 2021

- Toc.svelte add props title, openButtonLabel, breakpoint, flashClickedHeadingsFor [`a12e071`](https://github.com/janosh/svelte-toc/commit/a12e0714f2297c82dbd09c0f9890c78dae35cf2e)

#### [v0.1.2](https://github.com/janosh/svelte-toc/compare/v0.1.1...v0.1.2)

> 16 June 2021

- much simpler Toc by replacing scrollHandler with IntersectionObserver [`3a179d4`](https://github.com/janosh/svelte-toc/commit/3a179d4dbc8494df64156ef299edad70c5263c46)
- refactor heading links using <https://git.io/JGasX> [`8493df3`](https://github.com/janosh/svelte-toc/commit/8493df334a11661eddf03434372f6cd71ea313c1)

#### [v0.1.1](https://github.com/janosh/svelte-toc/compare/v0.1.0...v0.1.1)

> 2 June 2021

- animate GitHubCorner arm-wave on hover [`a13c6b2`](https://github.com/janosh/svelte-toc/commit/a13c6b2686ef9c89f9e4bc84910c4453090dedb2)
- site fix wide table, add GitHubCorner.svelte [`523d100`](https://github.com/janosh/svelte-toc/commit/523d10035810d57b287e87ab69e4eae30382d2d7)
- Toc.svelte set slugs of clicked headings as url hash [`1ab9791`](https://github.com/janosh/svelte-toc/commit/1ab9791c9a868560d26a3224ad99b88bfff6327e)

#### v0.1.0

> 19 May 2021

- initial commit [`a28c5c8`](https://github.com/janosh/svelte-toc/commit/a28c5c88d0f9256133bac7ea19e42960cc6be2c7)
- add correct netlify readme badge [`b2fc18b`](https://github.com/janosh/svelte-toc/commit/b2fc18b1c2a218ef3f8dee42764edb66effb17f1)
