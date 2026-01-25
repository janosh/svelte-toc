import { expect, test } from '@playwright/test'

test.describe.configure({ mode: `parallel` })

test.describe(`hideOnIntersect`, () => {
  test(`TOC hides when full-width banner overlaps it`, async ({ page }) => {
    await page.goto(`/hide-on-intersect`, { waitUntil: `networkidle` })
    await page.setViewportSize({ width: 1400, height: 800 })

    const toc = page.locator(`aside.toc`)

    // Initially TOC should be visible
    await expect(toc).not.toHaveClass(/intersecting/)

    // Scroll to full-width banner - it spans 100vw so always overlaps TOC
    await page.locator(`[data-testid="banner-1"]`).scrollIntoViewIfNeeded()
    await page.waitForTimeout(100)

    await expect(toc).toHaveClass(/intersecting/)
  })

  test(`TOC reappears when scrolling past the overlapping element`, async ({ page }) => {
    await page.goto(`/hide-on-intersect`, { waitUntil: `networkidle` })
    await page.setViewportSize({ width: 1400, height: 800 })

    const toc = page.locator(`aside.toc`)

    // Scroll to banner then back to top
    await page.locator(`[data-testid="banner-1"]`).scrollIntoViewIfNeeded()
    await page.waitForTimeout(100)
    await page.evaluate(() => scrollTo(0, 0))
    await page.waitForTimeout(100)

    await expect(toc).not.toHaveClass(/intersecting/)
  })

  test(`TOC is not hidden on mobile even when banner is in view`, async ({ page }) => {
    await page.goto(`/hide-on-intersect`, { waitUntil: `networkidle` })
    await page.setViewportSize({ width: 600, height: 800 })

    const toc = page.locator(`aside.toc`)
    await expect(toc).toHaveClass(/mobile/)

    await page.locator(`[data-testid="banner-1"]`).scrollIntoViewIfNeeded()
    await page.waitForTimeout(100)

    // hideOnIntersect is desktop-only
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

    const toc_headings = await page
      .locator(`aside.toc > nav > ol > li`)
      .allTextContents()
      .then((texts) => texts.map((text) => text.trim()))

    expect(toc_headings).toEqual(expected_headings)
  })
})

test.describe(`Toc`, () => {
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
    await page.waitForTimeout(100) // TODO: wait for scroll to finish instead of hard-coding timeout
    expect(await page.evaluate(() => globalThis.scrollY)).toBeGreaterThan(0)
  })

  test(`correctly highlights the closest heading in the ToC when scrolling manually`, async ({ page }) => {
    await page.goto(`/contributing`, { waitUntil: `networkidle` })
    let active_toc_li = await page.innerText(`aside.toc > nav > ol > li.active`)
    expect(active_toc_li).toContain(`🙋 How can I help?`)

    // scroll to the bottom of the page
    await page.evaluate(() => globalThis.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(1000)

    active_toc_li = await page.innerText(`aside.toc > nav > ol > li.active`)
    expect(active_toc_li).toContain(`🆕 New release`)
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
})
