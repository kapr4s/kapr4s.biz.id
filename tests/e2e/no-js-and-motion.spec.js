import { test, expect } from "@playwright/test";
import { gotoReady } from "./helpers.js";

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("all key sections stay visible and the menu toggle is hidden", async ({ page }) => {
    await page.goto("/");
    for (const sel of ["#about-title", "#problems-title", "#services-title", "#pricing-title", "#process-title", "#whyme-title", "#faq-title", "#contact-title", "#contact-form", ".svc >> nth=0", ".step >> nth=0"]) {
      await expect(page.locator(sel), sel).toBeVisible();
    }
    await expect(page.locator("html")).not.toHaveClass(/js-reveal|has-js/);
    await expect(page.locator(".menu-toggle")).toBeHidden();
    await expect(page.locator("#services-title")).toHaveText("Apa yang bisa saya kerjakan untukmu");
  });

  test("pricing shows every panel and card without the tablist", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".pricing__tabs")).toBeHidden();
    for (const id of ["personal", "bisnis", "enterprise"]) await expect(page.locator(`#${id}`), id).toBeVisible();
    const cards = page.locator(".plan");
    await expect(cards).toHaveCount(9);
    for (const card of await cards.all()) await expect(card).toBeVisible();
  });

  test("reveal elements are fully opaque", async ({ page }) => {
    await page.goto("/");
    const faint = await page.$$eval("[data-reveal]", (els) =>
      els.filter((e) => getComputedStyle(e).opacity !== "1").map((e) => e.className),
    );
    expect(faint).toEqual([]);
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("duplicate marquee tracks are hidden, primary tracks visible", async ({ page }) => {
    await gotoReady(page);
    const dups = page.locator('.marquee__track[aria-hidden="true"]');
    expect(await dups.count()).toBeGreaterThan(0);
    for (const t of await dups.all()) await expect(t).toBeHidden();
    await expect(page.locator(".marquee__track:not([aria-hidden])").first()).toBeVisible();
  });

  test("no [data-reveal] element is left at opacity 0", async ({ page }) => {
    await gotoReady(page);
    await expect(page.locator("html")).not.toHaveClass(/js-reveal/);
    const faint = await page.$$eval("[data-reveal]", (els) =>
      els.filter((e) => getComputedStyle(e).opacity !== "1").map((e) => `${e.className}:${getComputedStyle(e).opacity}`),
    );
    expect(faint).toEqual([]);
  });
});
