import { test, expect } from "@playwright/test";
import { gotoReady } from "./helpers.js";

test("floating WhatsApp button is hidden at the top and visible after scrolling past the hero", async ({ page }) => {
  await gotoReady(page);
  const fab = page.locator(".wa-float");

  await expect(fab).toHaveClass(/is-hidden/);
  await expect(fab).toBeHidden();

  await page.locator("#kontak").scrollIntoViewIfNeeded();
  await expect(fab).not.toHaveClass(/is-hidden/);
  await expect(fab).toBeVisible();

  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(fab).toHaveClass(/is-hidden/);
});

// The button is fixed at every width, so the footer must leave room for it.
for (const width of [390, 960, 1100, 1280, 1920]) {
  test(`floating button never covers the footer at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const fab = page.locator(".wa-float");
    await expect(fab).toBeVisible();
    const overlaps = await page.evaluate(() => {
      const f = document.querySelector(".wa-float").getBoundingClientRect();
      return [...document.querySelectorAll(".site-footer__specs li, .site-footer__top")].some((el) => {
        const r = el.getBoundingClientRect();
        return !(r.right < f.left || r.left > f.right || r.bottom < f.top || r.top > f.bottom);
      });
    });
    expect(overlaps).toBe(false);
  });
}
