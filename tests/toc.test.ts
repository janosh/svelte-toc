import { expect, test } from '@playwright/test'

test.describe(`Toc`, () => {
  test(`lists the right page headings`, async ({ page }) => {
    for (const slug of [`/`, `/long-page`]) {
      await page.goto(slug, { waitUntil: `networkidle` })

      const page_headings = await page
        .locator(`main :where(h2, h3):not(.toc-exclude)`)
        .allTextContents()

      const toc_headings = (
        await page.locator(`aside.toc > nav > ul > li`).allTextContents()
      ).map((h) => h.trim())

      expect(toc_headings).toEqual(page_headings)
    }
  })

  test(`scrolls to heading on clicking ToC item`, async ({ page }) => {
    await page.goto(`/`, { waitUntil: `networkidle` })

    expect(await page.evaluate(() => window.pageYOffset)).toBe(0)

    await page.click(`aside.toc > nav > ul > li:last-child`)
    await page.waitForTimeout(100) // TODO: wait for scroll to finish instead of hard-coding timeout
    expect(await page.evaluate(() => window.pageYOffset)).toBeGreaterThan(0)
  })

  test(`correctly highlights the closest heading in the ToC when scrolling manually`, async ({
    page,
  }) => {
    await page.goto(`/`, { waitUntil: `networkidle` })
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(1000)
    const active_toc_li = await page.innerText(
      `aside.toc > nav > ul > li.active`
    )
    expect(active_toc_li).toBe(`Styling`)
  })
})
