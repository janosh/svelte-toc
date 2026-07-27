import { expect, test, type Locator, type Page } from '@playwright/test'

const toc_item_sel = `aside.toc > nav > ol > li`
const desktop_viewport = { width: 1400, height: 800 }

const trimmed_texts = async (locator: Locator): Promise<string[]> =>
  (await locator.allTextContents()).map((text) => text.trim())

// waits until scrollY stops changing, which is when the browser fires scrollend and the
// component clears scroll_target. polling beats a fixed sleep tied to its fallback timeout.
type ScrollProbe = { last_y?: number; stable_polls?: number }

const wait_for_scroll_idle = async (page: Page) => {
  // clear any counters left by an earlier call so this one can't pass on stale state
  await page.evaluate(() => {
    delete (globalThis as ScrollProbe).last_y
    delete (globalThis as ScrollProbe).stable_polls
  })
  await page.waitForFunction(
    () => {
      const probe = globalThis as ScrollProbe
      probe.stable_polls = probe.last_y === scrollY ? (probe.stable_polls ?? 0) + 1 : 0
      probe.last_y = scrollY
      return probe.stable_polls >= 3
    },
    null,
    { polling: 100 },
  )
}

test.describe(`collapseSubheadings`, () => {
  // Helper to scroll to element and wait for TOC to update
  async function scroll_to_element(page: Page, selector: string): Promise<void> {
    const heading_text = await page.evaluate((selector_to_scroll) => {
      const element = document.querySelector(selector_to_scroll)
      if (!element) {
        throw new Error(`scroll_to_element target not found: ${selector_to_scroll}`)
      }
      element.scrollIntoView({ behavior: `instant`, block: `start` })
      return element.textContent?.trim() ?? ``
    }, selector)
    // Wait for active heading to update in TOC
    if (heading_text !== ``) {
      await expect(page.locator(`aside.toc > nav > ol > li.active`)).toContainText(
        heading_text,
        { timeout: 1000 },
      )
    }
  }

  test.beforeEach(async ({ page }) => {
    await page.goto(`/collapse-headings`, { waitUntil: `networkidle` })
    await page.setViewportSize(desktop_viewport)
  })

  test(`all items visible when collapseSubheadings is off`, async ({ page }) => {
    // Default mode is off
    const toc_items = page.locator(toc_item_sel)
    await expect(toc_items).toHaveCount(41) // 5 h2s + 11 h3s + 18 h4s + 7 h5s

    // None should be collapsed
    await expect(page.locator(`${toc_item_sel}.collapsed`)).toHaveCount(0)
  })

  test(`full nested collapse follows active heading hierarchy`, async ({ page }) => {
    await page.click(`input[value="true"]`)
    await scroll_to_element(page, `#getting-started`)

    const toc_items = page.locator(toc_item_sel)
    const getting_started = toc_items.filter({ hasText: /^Getting Started$/ })
    const installation = toc_items.filter({ hasText: /^Installation$/ })
    const npm_setup = toc_items.filter({ hasText: /^NPM Setup$/ })
    const styling = toc_items.filter({ hasText: /^Styling Options$/ })

    await expect(getting_started).not.toHaveClass(/collapsed/)
    await expect(installation).not.toHaveClass(/collapsed/)
    await expect(npm_setup).toHaveClass(/collapsed/)
    await expect(styling).toHaveClass(/collapsed/)

    await scroll_to_element(page, `#installation`)

    const pnpm_setup = toc_items.filter({ hasText: /^PNPM Setup$/ })
    const import_component = toc_items.filter({ hasText: /^Importing the Component$/ })
    await expect(npm_setup).not.toHaveClass(/collapsed/)
    await expect(pnpm_setup).not.toHaveClass(/collapsed/)
    await expect(import_component).toHaveClass(/collapsed/)
  })

  test(`collapsed items are hidden from a11y tree and faded out`, async ({ page }) => {
    // Enable full nested collapse
    await page.click(`input[value="true"]`)

    // Scroll to Getting Started to set context
    await scroll_to_element(page, `#getting-started`)

    const toc_items = page.locator(toc_item_sel)
    const collapsed = toc_items.filter({ hasText: /^NPM Setup$/ })
    const visible = toc_items.filter({ hasText: /^Getting Started$/ })

    // Collapsed items: collapsed class, aria-hidden="true", link tabindex="-1"
    await expect(collapsed).toHaveClass(/collapsed/)
    await expect(collapsed).toHaveAttribute(`aria-hidden`, `true`)
    await expect(collapsed.locator(`a`)).toHaveAttribute(`tabindex`, `-1`)

    // Visible items: no aria-hidden, link tabindex="0"
    await expect(visible).not.toHaveAttribute(`aria-hidden`)
    await expect(visible.locator(`a`)).toHaveAttribute(`tabindex`, `0`)

    // opacity reaches 0 once the collapse transition finishes
    await expect(async () => {
      const opacity = await collapsed.evaluate(
        (element) => getComputedStyle(element).opacity,
      )
      expect(opacity).toBe(`0`)
    }).toPass({ timeout: 500 })
  })

  test(`clicking a TOC item scrolls to heading and updates collapse state`, async ({
    page,
  }) => {
    // Enable full nested collapse
    await page.click(`input[value="true"]`)

    const toc_items = page.locator(toc_item_sel)

    // Click on Configuration in TOC
    const config_toc = toc_items.filter({ hasText: /^Configuration$/ })
    await config_toc.click()

    // Configuration's h3 children should now be visible
    const styling = toc_items.filter({ hasText: /^Styling Options$/ })
    const behavior = toc_items.filter({ hasText: /^Behavior Props$/ })
    await expect(styling).not.toHaveClass(/collapsed/)
    await expect(behavior).not.toHaveClass(/collapsed/)

    // Getting Started's h3 children should now be collapsed
    const installation = toc_items.filter({ hasText: /^Installation$/ })
    await expect(installation).toHaveClass(/collapsed/)
  })

  test(`switching collapse modes updates visibility immediately`, async ({ page }) => {
    // Start with off mode - all visible
    const collapsed_items = page.locator(`${toc_item_sel}.collapsed`)
    await expect(collapsed_items).toHaveCount(0)

    // Switch to full nested - wait for at least one item to collapse
    await page.click(`input[value="true"]`)
    await expect(collapsed_items.first()).toBeAttached()
    const collapsed_count_nested = await collapsed_items.count()
    expect(collapsed_count_nested).toBeGreaterThan(0)

    // Switch to h3 threshold
    await page.click(`input[value="h3"]`)
    // h3 threshold should have fewer or equal collapsed items than full nested
    await expect(async () => {
      const count = await collapsed_items.count()
      expect(count).toBeLessThanOrEqual(collapsed_count_nested)
    }).toPass()

    // Switch back to off
    await page.click(`input[value="false"]`)
    await expect(collapsed_items).toHaveCount(0)
  })

  test(`scrolling to h4 reveals it and its siblings`, async ({ page }) => {
    // Enable full nested collapse
    await page.click(`input[value="true"]`)

    const toc_items = page.locator(toc_item_sel)

    // Scroll directly to an h4 (NPM Setup). scroll_to_element already asserts it went active.
    await scroll_to_element(page, `#npm-setup`)

    // The h4 and its siblings under the same h3 should be visible
    const npm_setup = toc_items.filter({ hasText: /^NPM Setup$/ })
    const pnpm_setup = toc_items.filter({ hasText: /^PNPM Setup$/ })
    await expect(npm_setup).not.toHaveClass(/collapsed/)
    await expect(pnpm_setup).not.toHaveClass(/collapsed/)

    // an h4 under a different h3 stays collapsed
    await expect(toc_items.filter({ hasText: /^Importing the Component$/ })).toHaveClass(
      /collapsed/,
    )
  })

  test(`h4 threshold expands h5s along with their h4 ancestor`, async ({ page }) => {
    await page.click(`input[value="h4"]`)
    await scroll_to_element(page, `#installation`)

    const toc_items = page.locator(toc_item_sel)

    // h4s under the active h3 are visible in every collapsing mode
    await expect(toc_items.filter({ hasText: /^NPM Setup$/ })).not.toHaveClass(
      /collapsed/,
    )
    // what makes h4 the threshold: the h5 rides along with its visible h4 ancestor
    // instead of waiting for that h4 to become active (as full nesting would require)
    await expect(
      toc_items.filter({ hasText: /^Workspace Configuration$/ }),
    ).not.toHaveClass(/collapsed/)
  })
})

test.describe(`hideOnIntersect`, () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/hide-on-intersect`, { waitUntil: `networkidle` })
    await page.setViewportSize(desktop_viewport)
  })

  test(`TOC hides when banner overlaps it and reappears after scrolling back`, async ({
    page,
  }) => {
    const toc = page.locator(`aside.toc`)

    // Initially TOC should be visible
    await expect(toc).not.toHaveClass(/intersecting/)

    // Scroll to full-width banner - it spans 100vw so always overlaps TOC
    await page.locator(`[data-testid="banner-1"]`).scrollIntoViewIfNeeded()
    await expect(toc).toHaveClass(/intersecting/)

    // Scroll back to top and verify TOC reappears
    await page.evaluate(() => scrollTo(0, 0))
    await expect(toc).not.toHaveClass(/intersecting/)
  })

  test(`TOC is not hidden on mobile even when banner is in view`, async ({ page }) => {
    await page.setViewportSize({ width: 600, height: 800 })

    const toc = page.locator(`aside.toc`)
    await expect(toc).toHaveClass(/mobile/)

    await page.locator(`[data-testid="banner-1"]`).scrollIntoViewIfNeeded()
    // hideOnIntersect is desktop-only, so TOC should remain visible on mobile
    await expect(toc).not.toHaveClass(/intersecting/)
  })

  test(`TOC lists correct headings on hide-on-intersect page`, async ({ page }) => {
    const expected_headings = [
      `The hideOnIntersect Feature`,
      `Why This Matters`,
      `How It Works`,
      `Usage Example`,
      `Desktop Only`,
      `Performance Considerations`,
      `Accessibility`,
      `Edge Cases Handled`,
      `Implementation Details`,
      `Try It Yourself`,
      `Summary`,
    ]

    const toc_items = page.locator(toc_item_sel)
    await toc_items.first().waitFor()

    expect(await trimmed_texts(toc_items)).toEqual(expected_headings)
  })
})

test.describe(`Toc`, () => {
  for (const route of [`/`, `/long-page`]) {
    test(`lists the right page headings on ${route}`, async ({ page }) => {
      await page.goto(route, { waitUntil: `networkidle` })

      const expected_headings = await trimmed_texts(page.locator(`main :where(h2, h3)`))
      expect(expected_headings.length).toBeGreaterThan(0)

      const toc_items = page.locator(toc_item_sel)
      await toc_items.first().waitFor()

      expect(await trimmed_texts(toc_items)).toEqual(expected_headings)
    })
  }

  test(`scrolls to heading on clicking ToC item`, async ({ page }) => {
    await page.goto(`/`, { waitUntil: `networkidle` })

    expect(await page.evaluate(() => globalThis.scrollY)).toBe(0)

    await page.click(`${toc_item_sel}:last-child`)
    // Wait for scroll to complete
    await expect(async () => {
      const scroll_y = await page.evaluate(() => globalThis.scrollY)
      expect(scroll_y).toBeGreaterThan(0)
    }).toPass()
  })

  test(`correctly highlights the closest heading in the ToC when scrolling manually`, async ({
    page,
  }) => {
    await page.goto(`/contributing`, { waitUntil: `networkidle` })
    const active = page.locator(`${toc_item_sel}.active`)
    await expect(active).toContainText(`🙋 How can I help?`)

    // scroll to the bottom of the page
    await page.evaluate(() => globalThis.scrollTo(0, document.body.scrollHeight))
    // Wait for active heading to move past the first one
    await expect(active).not.toContainText(`🙋 How can I help?`)
  })

  test(`updates when headings are added/removed from the page after load`, async ({
    page,
  }) => {
    await page.goto(`/`, { waitUntil: `networkidle` })

    // Test adding a heading
    await page.evaluate(() => {
      const new_heading = document.createElement(`h2`)
      new_heading.textContent = `New Heading`
      document.querySelector(`main`)?.append(new_heading)
    })

    const page_headings = page.locator(`main :where(h2, h3)`)
    const toc_items = page.locator(toc_item_sel)

    await expect(async () => {
      expect(await trimmed_texts(toc_items)).toEqual(await trimmed_texts(page_headings))
    }).toPass({ timeout: 1000 })
    await expect(toc_items).toContainText([`New Heading`])

    // Test removing a heading
    const heading_count_before = await page_headings.count()
    await page.evaluate(() => {
      document.querySelector(`h2`)?.remove()
    })
    // guard against a no-op removal leaving both lists trivially equal
    await expect(page_headings).toHaveCount(heading_count_before - 1)

    await expect(async () => {
      expect(await trimmed_texts(toc_items)).toEqual(await trimmed_texts(page_headings))
    }).toPass({ timeout: 1000 })
  })

  // Tests for issue #50: clicking ToC items should immediately highlight the correct heading
  // https://github.com/janosh/svelte-toc/issues/50
  test(`clicking ToC item immediately highlights clicked heading`, async ({ page }) => {
    await page.goto(`/long-page`, { waitUntil: `networkidle` })
    await page.setViewportSize(desktop_viewport)

    const toc_items = page.locator(toc_item_sel)
    const active = page.locator(`${toc_item_sel}.active`)
    const mid_idx = Math.floor((await toc_items.count()) / 2)
    const target_text = ((await toc_items.nth(mid_idx).textContent()) ?? ``).trim()

    // Scroll to bottom, then click middle item
    await page.evaluate(() => globalThis.scrollTo(0, document.body.scrollHeight))
    // Wait for scroll to complete
    await expect(async () => {
      const at_bottom = await page.evaluate(
        () =>
          globalThis.scrollY + globalThis.innerHeight >= document.body.scrollHeight - 10,
      )
      expect(at_bottom).toBe(true)
    }).toPass()
    await toc_items.nth(mid_idx).click()

    // Clicked item should be immediately active and stay active after scroll completes
    await expect(active).toContainText(target_text)
  })

  test(`clicking ToC item skipping multiple headings highlights correct target`, async ({
    page,
  }) => {
    await page.goto(`/contributing`, { waitUntil: `networkidle` })
    await page.setViewportSize(desktop_viewport)

    const toc_items = page.locator(toc_item_sel)
    const active = page.locator(`${toc_item_sel}.active`)
    const first_text = ((await toc_items.first().textContent()) ?? ``).trim()
    const last_text = ((await toc_items.last().textContent()) ?? ``).trim()

    await expect(active).toContainText(first_text)

    await toc_items.last().click()
    await expect(active).toContainText(last_text)

    await toc_items.first().click()
    await expect(active).toContainText(first_text)
  })

  test(`rapid ToC clicks highlight last clicked heading`, async ({ page }) => {
    await page.goto(`/long-page`, { waitUntil: `networkidle` })
    await page.setViewportSize(desktop_viewport)

    const toc_items = page.locator(toc_item_sel)
    const active = page.locator(`${toc_item_sel}.active`)
    const count = await toc_items.count()
    const mid_idx = Math.floor(count / 2)

    // Click multiple items rapidly - last clicked should be active
    await toc_items.nth(count - 1).click()
    await toc_items.nth(1).click()
    await toc_items.nth(mid_idx).click()

    const mid_text = ((await toc_items.nth(mid_idx).textContent()) ?? ``).trim()
    await expect(active).toContainText(mid_text)
  })

  test(`manual scroll after ToC click correctly updates active heading`, async ({
    page,
  }) => {
    await page.goto(`/contributing`, { waitUntil: `networkidle` })
    await page.setViewportSize(desktop_viewport)

    const toc_items = page.locator(toc_item_sel)
    const active = page.locator(`${toc_item_sel}.active`)
    const last_text = ((await toc_items.last().textContent()) ?? ``).trim()

    await toc_items.last().click()
    await expect(active).toContainText(last_text)
    // the smooth scroll must finish (and scrollend clear scroll_target) before a manual
    // scroll is allowed to move the active heading again
    await wait_for_scroll_idle(page)

    // Manual scroll to top should update active heading
    await page.evaluate(() => globalThis.scrollTo(0, 0))
    const first_text = ((await toc_items.first().textContent()) ?? ``).trim()
    await expect(active).toContainText(first_text)
  })
})
