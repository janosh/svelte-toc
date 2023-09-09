import { expect, test } from '@playwright/test'

test.describe.configure({ mode: `parallel` })

test.describe(`Toc`, () => {
  test(`lists the right page headings`, async ({ page }) => {
    for (const slug of [`/`, `/long-page`]) {
      await page.goto(slug, { waitUntil: `networkidle` })

      const expected_headings = await page
        .locator(`main :where(h2, h3):not(.toc-exclude)`)
        .allTextContents()

      // wait for ToC to render headings
      await page.waitForSelector(`aside.toc > nav > ol > li`)

      const toc_headings = (
        await page.locator(`aside.toc > nav > ol > li`).allTextContents()
      ).map((h) => h.trim())

      expect(toc_headings).toEqual(expected_headings)
    }
  })

  test(`scrolls to heading on clicking ToC item`, async ({ page }) => {
    await page.goto(`/`, { waitUntil: `networkidle` })

    expect(await page.evaluate(() => window.scrollY)).toBe(0)

    await page.click(`aside.toc > nav > ol > li:last-child`)
    await page.waitForTimeout(100) // TODO: wait for scroll to finish instead of hard-coding timeout
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
  })

  test(`correctly highlights the closest heading in the ToC when scrolling manually`, async ({
    page,
  }) => {
    await page.goto(`/contributing`, { waitUntil: `networkidle` })
    let active_toc_li = await page.innerText(`aside.toc > nav > ol > li.active`)
    expect(active_toc_li).toContain(`🙋 How can I help?`)

    // scroll to the bottom of the page
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(1000)

    active_toc_li = await page.innerText(`aside.toc > nav > ol > li.active`)
    expect(active_toc_li).toContain(`🆕 New release`)
  })

  test(`updates when headings are added/removed from the page after load`, async ({
    page,
  }) => {
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
    for (const mutation of [add_heading, remove_heading]) {
      await page.evaluate(mutation)

      const page_headings = await page
        .locator(`main :where(h2, h3):not(.toc-exclude)`)
        .allTextContents()

      const toc_headings = (
        await page.locator(`aside.toc > nav > ol > li`).allTextContents()
      ).map((li_text) => li_text.trim())

      expect(toc_headings).toEqual(page_headings)
    }
  })
})
