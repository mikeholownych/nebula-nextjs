import { test, expect } from '@playwright/test'

/**
 * Regression check for the sitewide pt-[72px] vs SiteNav's actual rendered
 * height (79px desktop / 89px mobile) gap fixed in 7cad6e8c. jsdom-based
 * Jest tests can't catch this class of bug — jsdom doesn't compute real
 * layout, so bounding boxes are always zero. This needs a real browser.
 */
const PAGES = ['/', '/learning-centre', '/audit', '/resources', '/thank-you']

for (const path of PAGES) {
  test(`header does not overlap main content on ${path}`, async ({ page }) => {
    await page.goto(path)

    const header = page.locator('header').first()
    const headerBox = await header.boundingBox()
    expect(headerBox).not.toBeNull()

    const main = page.locator('main').first()
    const firstContent = main.locator(':scope > *').first()
    const contentBox = await firstContent.boundingBox()
    expect(contentBox).not.toBeNull()

    const headerBottom = headerBox!.y + headerBox!.height
    expect(contentBox!.y).toBeGreaterThanOrEqual(headerBottom)
  })
}
