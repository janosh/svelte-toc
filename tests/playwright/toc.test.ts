import { expect, test } from '@playwright/test'

test.describe(`collapseSubheadings`, () => {
  test.describe.configure({ mode: `parallel` })
  // Helper to scroll to element and wait for TOC to update
  async function scroll_to_element(
    page: import('@playwright/test').Page,
    selector: string,
  ) {
    const heading_text = await page.evaluate((sel) => {
      const element = document.querySelector(sel)
      if (element) {
        element.scrollIntoView({ behavior: `instant`, block: `start` })
        return element.textContent?.trim()
      }
      return null
    }, selector)
    // Wait for active heading to update in TOC
    if (heading_text) {
      await expect(page.locator(`aside.toc > nav > ol > li.active`)).toContainText(
        heading_text,
        { timeout: 1000 },
      )
    }
  }

  test.beforeEach(async ({ page }) => {
    await page.goto(`/collapse-headings`, { waitUntil: `networkidle` })
    await page.setViewportSize({ width: 1400, height: 800 })
  })

  test(`all items visible when collapseSubheadings is off`, async ({ page }) => {
    // Default mode is off
    const toc_items = page.locator(`aside.toc > nav > ol > li`)
    await expect(toc_items).toHaveCount(41) // 5 h2s + 11 h3s + 18 h4s + 7 h5s

    // None should be collapsed
    const collapsed_items = page.locator(`aside.toc > nav > ol > li.collapsed`)
    await expect(collapsed_items).toHaveCount(0)
  })

  test(`top-level headings always visible with full nested collapse`, async ({ page }) => {
    // Enable full nested collapse
    await page.click(`input[value="true"]`)

    const toc_items = page.locator(`aside.toc > nav > ol > li`)
    await expect(toc_items).toHaveCount(41)

    // h2 sections should never be collapsed
    const getting_started = toc_items.filter({ hasText: /^Getting Started$/ })
    const configuration = toc_items.filter({ hasText: /^Configuration$/ })
    const advanced = toc_items.filter({ hasText: /^Advanced Features$/ })

    await expect(getting_started).not.toHaveClass(/collapsed/)
    await expect(configuration).not.toHaveClass(/collapsed/)
    await expect(advanced).not.toHaveClass(/collapsed/)
  })

  test(`nested collapse hides h4s when h3 parent not active`, async ({ page }) => {
    // Enable full nested collapse
    await page.click(`input[value="true"]`)

    // Scroll to Getting Started to make it active
    await scroll_to_element(page, `#getting-started`)

    const toc_items = page.locator(`aside.toc > nav > ol > li`)

    // With Getting Started (h2) active, h3s under it should be visible
    const installation = toc_items.filter({ hasText: /^Installation$/ })
    await expect(installation).not.toHaveClass(/collapsed/)

    // But h4s should be collapsed (their h3 parent is not active)
    const npm_setup = toc_items.filter({ hasText: /^NPM Setup$/ })
    const pnpm_setup = toc_items.filter({ hasText: /^PNPM Setup$/ })
    await expect(npm_setup).toHaveClass(/collapsed/)
    await expect(pnpm_setup).toHaveClass(/collapsed/)

    // h3s under inactive h2 Configuration should be collapsed
    const styling = toc_items.filter({ hasText: /^Styling Options$/ })
    await expect(styling).toHaveClass(/collapsed/)
  })

  test(`h4s expand when scrolling to their h3 parent`, async ({ page }) => {
    // Enable full nested collapse
    await page.click(`input[value="true"]`)

    const toc_items = page.locator(`aside.toc > nav > ol > li`)
    const npm_setup = toc_items.filter({ hasText: /^NPM Setup$/ })

    // First scroll to Getting Started to set context - h4s should be collapsed
    await scroll_to_element(page, `#getting-started`)
    await expect(npm_setup).toHaveClass(/collapsed/)

    // Now scroll to Installation (h3) - h4s under it should expand
    await scroll_to_element(page, `#installation`)

    // h4s under Installation should now be visible
    await expect(npm_setup).not.toHaveClass(/collapsed/)
    const pnpm_setup = toc_items.filter({ hasText: /^PNPM Setup$/ })
    await expect(pnpm_setup).not.toHaveClass(/collapsed/)

    // h4 under Basic Usage should still be collapsed (different h3 parent)
    const import_component = toc_items.filter({ hasText: /^Importing the Component$/ })
    await expect(import_component).toHaveClass(/collapsed/)
  })

  test(`threshold mode h3 expands all h4s when h3 ancestor visible`, async ({ page }) => {
    // Enable h3 threshold mode
    await page.click(`input[value="h3"]`)

    // Scroll to Getting Started to make it active
    await scroll_to_element(page, `#getting-started`)

    const toc_items = page.locator(`aside.toc > nav > ol > li`)

    // With h3 threshold, when h2 Getting Started is active:
    // - All h3s under Getting Started are visible
    // - ALL h4s+ under those h3s should also be visible (no independent collapse)
    const installation = toc_items.filter({ hasText: /^Installation$/ })
    const basic_usage = toc_items.filter({ hasText: /^Basic Usage$/ })
    await expect(installation).not.toHaveClass(/collapsed/)
    await expect(basic_usage).not.toHaveClass(/collapsed/)

    // h4s should be visible with threshold mode
    const npm_setup = toc_items.filter({ hasText: /^NPM Setup$/ })
    const pnpm_setup = toc_items.filter({ hasText: /^PNPM Setup$/ })
    const import_component = toc_items.filter({ hasText: /^Importing the Component$/ })
    await expect(npm_setup).not.toHaveClass(/collapsed/)
    await expect(pnpm_setup).not.toHaveClass(/collapsed/)
    await expect(import_component).not.toHaveClass(/collapsed/)

    // h3s under inactive Configuration should still be collapsed
    const styling = toc_items.filter({ hasText: /^Styling Options$/ })
    await expect(styling).toHaveClass(/collapsed/)
  })

  test(`collapsed items have correct accessibility attributes`, async ({ page }) => {
    // Enable full nested collapse
    await page.click(`input[value="true"]`)

    // Scroll to Getting Started to set context
    await scroll_to_element(page, `#getting-started`)

    const toc_items = page.locator(`aside.toc > nav > ol > li`)
    const collapsed = toc_items.filter({ hasText: /^NPM Setup$/ })
    const visible = toc_items.filter({ hasText: /^Getting Started$/ })

    // Collapsed items: aria-hidden="true", tabindex="-1"
    await expect(collapsed).toHaveAttribute(`aria-hidden`, `true`)
    await expect(collapsed).toHaveAttribute(`tabindex`, `-1`)

    // Visible items: no aria-hidden, tabindex="0"
    await expect(visible).not.toHaveAttribute(`aria-hidden`)
    await expect(visible).toHaveAttribute(`tabindex`, `0`)
  })

  test(`clicking a TOC item scrolls to heading and updates collapse state`, async ({ page }) => {
    // Enable full nested collapse
    await page.click(`input[value="true"]`)

    const toc_items = page.locator(`aside.toc > nav > ol > li`)

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
    const collapsed_items = page.locator(`aside.toc > nav > ol > li.collapsed`)
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

    const toc_items = page.locator(`aside.toc > nav > ol > li`)

    // Scroll directly to an h4 (NPM Setup)
    await scroll_to_element(page, `#npm-setup`)

    // The h4 and its siblings under the same h3 should be visible
    const npm_setup = toc_items.filter({ hasText: /^NPM Setup$/ })
    const pnpm_setup = toc_items.filter({ hasText: /^PNPM Setup$/ })
    await expect(npm_setup).not.toHaveClass(/collapsed/)
    await expect(pnpm_setup).not.toHaveClass(/collapsed/)

    // Either the h4 or its h3 parent should be active (depends on scroll position)
    const active_item = page.locator(`aside.toc > nav > ol > li.active`)
    const active_text = await active_item.textContent()
    expect(active_text?.includes(`NPM`) || active_text?.includes(`Installation`)).toBe(
      true,
    )
  })

  test(`h4 threshold mode behavior`, async ({ page }) => {
    // Enable h4 threshold mode
    await page.click(`input[value="h4"]`)

    // Scroll to Installation to make it active
    await scroll_to_element(page, `#installation`)

    const toc_items = page.locator(`aside.toc > nav > ol > li`)

    // h4s under Installation should be visible (h4 threshold means h4s collapse based on h3)
    const npm_setup = toc_items.filter({ hasText: /^NPM Setup$/ })
    await expect(npm_setup).not.toHaveClass(/collapsed/)
  })

  test(`maintains correct active heading highlight while collapsed`, async ({ page }) => {
    // Enable full nested collapse
    await page.click(`input[value="true"]`)

    // Test that scrolling to different h2 sections updates active state
    await scroll_to_element(page, `#getting-started`)
    let active_item = page.locator(`aside.toc > nav > ol > li.active`)
    await expect(active_item).toContainText(`Getting Started`)

    await scroll_to_element(page, `#configuration`)
    active_item = page.locator(`aside.toc > nav > ol > li.active`)
    await expect(active_item).toContainText(`Configuration`)

    await scroll_to_element(page, `#advanced-features`)
    active_item = page.locator(`aside.toc > nav > ol > li.active`)
    await expect(active_item).toContainText(`Advanced Features`)
  })

  test(`collapsed items have correct CSS properties`, async ({ page }) => {
    // Enable full nested collapse
    await page.click(`input[value="true"]`)

    // Scroll to Getting Started so h4s are collapsed
    await scroll_to_element(page, `#getting-started`)

    const toc_items = page.locator(`aside.toc > nav > ol > li`)
    const collapsed_item = toc_items.filter({ hasText: /^NPM Setup$/ })

    // Verify collapsed class is applied
    await expect(collapsed_item).toHaveClass(/collapsed/)

    // Verify opacity reaches 0 after CSS transition completes
    await expect(async () => {
      const opacity = await collapsed_item.evaluate((el) => getComputedStyle(el).opacity)
      expect(opacity).toBe(`0`)
    }).toPass({ timeout: 500 })
  })
})

test.describe(`hideOnIntersect`, () => {
  test.describe.configure({ mode: `parallel` })

  test(`TOC hides when full-width banner overlaps it`, async ({ page }) => {
    await page.goto(`/hide-on-intersect`, { waitUntil: `networkidle` })
    await page.setViewportSize({ width: 1400, height: 800 })

    const toc = page.locator(`aside.toc`)

    // Initially TOC should be visible
    await expect(toc).not.toHaveClass(/intersecting/)

    // Scroll to full-width banner - it spans 100vw so always overlaps TOC
    await page.locator(`[data-testid="banner-1"]`).scrollIntoViewIfNeeded()
    await expect(toc).toHaveClass(/intersecting/)
  })

  test(`TOC reappears when scrolling past the overlapping element`, async ({ page }) => {
    await page.goto(`/hide-on-intersect`, { waitUntil: `networkidle` })
    await page.setViewportSize({ width: 1400, height: 800 })

    const toc = page.locator(`aside.toc`)

    // Scroll to banner and verify TOC hides
    await page.locator(`[data-testid="banner-1"]`).scrollIntoViewIfNeeded()
    await expect(toc).toHaveClass(/intersecting/)

    // Scroll back to top and verify TOC reappears
    await page.evaluate(() => scrollTo(0, 0))
    await expect(toc).not.toHaveClass(/intersecting/)
  })

  test(`TOC is not hidden on mobile even when banner is in view`, async ({ page }) => {
    await page.goto(`/hide-on-intersect`, { waitUntil: `networkidle` })
    await page.setViewportSize({ width: 600, height: 800 })

    const toc = page.locator(`aside.toc`)
    await expect(toc).toHaveClass(/mobile/)

    await page.locator(`[data-testid="banner-1"]`).scrollIntoViewIfNeeded()
    // hideOnIntersect is desktop-only, so TOC should remain visible on mobile
    await expect(toc).not.toHaveClass(/intersecting/)
  })

  test(`TOC lists correct headings on hide-on-intersect page`, async ({ page }) => {
    await page.goto(`/hide-on-intersect`, { waitUntil: `networkidle` })
    await page.setViewportSize({ width: 1400, height: 800 })

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

    const toc_items = page.locator(`aside.toc > nav > ol > li`)
    await toc_items.first().waitFor()

    const toc_headings = await toc_items
      .allTextContents()
      .then((texts) => texts.map((text) => text.trim()))

    expect(toc_headings).toEqual(expected_headings)
  })
})

test.describe(`Toc`, () => {
  test.describe.configure({ mode: `parallel` })

  const toc_item_sel = `aside.toc > nav > ol > li`

  test(`lists the right page headings`, async ({ page }) => {
    // Test each page separately to avoid await in loop
    await page.goto(`/`, { waitUntil: `networkidle` })

    let expected_headings = await page
      .locator(`main :where(h2, h3):not(.toc-exclude)`)
      .allTextContents()

    // wait for ToC to render headings
    await page.waitForSelector(`aside.toc > nav > ol > li`)

    let toc_headings = (
      await page.locator(`aside.toc > nav > ol > li`).allTextContents()
    ).map((h) => h.trim())

    expect(toc_headings).toEqual(expected_headings)

    // Test long-page
    await page.goto(`/long-page`, { waitUntil: `networkidle` })

    expected_headings = await page
      .locator(`main :where(h2, h3):not(.toc-exclude)`)
      .allTextContents()

    // wait for ToC to render headings
    await page.waitForSelector(`aside.toc > nav > ol > li`)

    toc_headings = (
      await page.locator(`aside.toc > nav > ol > li`).allTextContents()
    ).map((h) => h.trim())

    expect(toc_headings).toEqual(expected_headings)
  })

  test(`scrolls to heading on clicking ToC item`, async ({ page }) => {
    await page.goto(`/`, { waitUntil: `networkidle` })

    expect(await page.evaluate(() => globalThis.scrollY)).toBe(0)

    await page.click(`aside.toc > nav > ol > li:last-child`)
    // Wait for scroll to complete
    await expect(async () => {
      const scroll_y = await page.evaluate(() => globalThis.scrollY)
      expect(scroll_y).toBeGreaterThan(0)
    }).toPass()
  })

  test(`correctly highlights the closest heading in the ToC when scrolling manually`, async ({ page }) => {
    await page.goto(`/contributing`, { waitUntil: `networkidle` })
    const active_toc_li = await page.innerText(`aside.toc > nav > ol > li.active`)
    expect(active_toc_li).toContain(`🙋 How can I help?`)

    // scroll to the bottom of the page
    await page.evaluate(() => globalThis.scrollTo(0, document.body.scrollHeight))
    // Wait for active heading to update to last item
    await expect(page.locator(`aside.toc > nav > ol > li.active`)).toContainText(
      `🆕 New release`,
    )
  })

  test(`updates when headings are added/removed from the page after load`, async ({ page }) => {
    await page.goto(`/`, { waitUntil: `networkidle` })

    const add_heading = () => {
      const newHeading = document.createElement(`h2`)
      newHeading.textContent = `New Heading`
      document.querySelector(`main`)?.appendChild(newHeading)
    }
    const remove_heading = () => {
      const headingToRemove = document.querySelector(`h2`)
      headingToRemove?.remove()
    }

    // Test adding a heading
    await page.evaluate(add_heading)

    const page_headings_after_add = await page
      .locator(`main :where(h2, h3):not(.toc-exclude)`)
      .allTextContents()

    const toc_headings_after_add = (
      await page.locator(`aside.toc > nav > ol > li`).allTextContents()
    ).map((li_text) => li_text.trim())

    expect(toc_headings_after_add).toEqual(page_headings_after_add)

    // Test removing a heading
    await page.evaluate(remove_heading)

    const page_headings_after_remove = await page
      .locator(`main :where(h2, h3):not(.toc-exclude)`)
      .allTextContents()

    const toc_headings_after_remove = (
      await page.locator(`aside.toc > nav > ol > li`).allTextContents()
    ).map((li_text) => li_text.trim())

    expect(toc_headings_after_remove).toEqual(page_headings_after_remove)
  })

  // Tests for issue #50: clicking ToC items should immediately highlight the correct heading
  // https://github.com/janosh/svelte-toc/issues/50
  test(`clicking ToC item immediately highlights clicked heading`, async ({ page }) => {
    await page.goto(`/long-page`, { waitUntil: `networkidle` })
    await page.setViewportSize({ width: 1400, height: 800 })

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

  test(`clicking ToC item skipping multiple headings highlights correct target`, async ({ page }) => {
    await page.goto(`/contributing`, { waitUntil: `networkidle` })
    await page.setViewportSize({ width: 1400, height: 800 })

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
    await page.setViewportSize({ width: 1400, height: 800 })

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

  test(`manual scroll after ToC click correctly updates active heading`, async ({ page }) => {
    await page.goto(`/contributing`, { waitUntil: `networkidle` })
    await page.setViewportSize({ width: 1400, height: 800 })

    const toc_items = page.locator(toc_item_sel)
    const active = page.locator(`${toc_item_sel}.active`)
    const last_text = ((await toc_items.last().textContent()) ?? ``).trim()

    await toc_items.last().click()
    await expect(active).toContainText(last_text)

    // Manual scroll to top should update active heading
    await page.evaluate(() => globalThis.scrollTo(0, 0))
    const first_text = ((await toc_items.first().textContent()) ?? ``).trim()
    await expect(active).toContainText(first_text)
  })
})
