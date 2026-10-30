import { test, expect } from "@playwright/test";
import { gotoReady } from "./helpers.js";

test.describe("mobile menu", () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "menu toggle is mobile-only");
  });

  test("opens and closes with the toggle, keeping a constant label and moving focus into the panel", async ({ page }) => {
    await gotoReady(page);
    const toggle = page.locator(".menu-toggle");
    const nav = page.locator("#site-nav");

    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-controls", "site-nav");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    // Constant name + aria-expanded avoids a contradictory "Close menu, expanded" announcement.
    await expect(toggle).toHaveAttribute("aria-label", "Menu");
    await expect(nav).not.toHaveClass(/is-open/);

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(toggle).toHaveAttribute("aria-label", "Menu");
    await expect(nav).toHaveClass(/is-open/);
    // The panel precedes the toggle in the DOM, so focus must move into it.
    await expect(nav.locator("a").first()).toBeFocused();
    await expect(nav.getByRole("link", { name: "FAQ" })).toBeVisible();

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(nav).not.toHaveClass(/is-open/);
  });

  test("open panel scrolls when the viewport is short (reflow)", async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 320 });
    await gotoReady(page);
    await page.locator(".menu-toggle").click();
    const { scrollable, fits } = await page.locator("#site-nav").evaluate((el) => ({
      scrollable: getComputedStyle(el).overflowY === "auto",
      fits: el.getBoundingClientRect().bottom <= window.innerHeight + 1,
    }));
    expect(scrollable).toBe(true);
    expect(fits).toBe(true);
  });

  test("closes when a nav link is clicked", async ({ page }) => {
    await gotoReady(page);
    const toggle = page.locator(".menu-toggle");
    await toggle.click();
    await page.locator('#site-nav a[href="#faq"]').click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#site-nav")).not.toHaveClass(/is-open/);
    await expect(page).toHaveURL(/#faq$/);
  });

  test("Escape closes the menu and returns focus to the toggle", async ({ page }) => {
    await gotoReady(page);
    const toggle = page.locator(".menu-toggle");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toBeFocused();
  });
});

test.describe("desktop navigation", () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "inline nav is desktop-only");
  });

  test("nav links appear in order: Beranda, Tentang, Layanan, Tarif, Cara Kerja, FAQ, then the CTA", async ({ page }) => {
    await gotoReady(page);
    const links = page.locator("#site-nav a");
    await expect(links).toHaveText(["Beranda", "Tentang", "Layanan", "Tarif", "Cara Kerja", "FAQ", "Konsultasi Gratis"]);
    const hrefs = await links.evaluateAll((as) => as.map((a) => a.getAttribute("href")));
    expect(hrefs.slice(0, 6)).toEqual(["#top", "#tentang", "#layanan", "#tarif", "#cara-kerja", "#faq"]);
    expect(hrefs[6]).toMatch(/^https:\/\/wa\.me\/628175000891/);
  });

  test("nav links are visible inline and the toggle is hidden", async ({ page }) => {
    await gotoReady(page);
    await expect(page.locator(".menu-toggle")).toBeHidden();
    await expect(page.locator('#site-nav a[href="#layanan"]')).toBeVisible();
    await expect(page.locator('#site-nav a[href="#tarif"]')).toBeVisible();
    await expect(page.locator('#site-nav a[href="#faq"]')).toBeVisible();
  });
});

test.describe("in-page anchors", () => {
  test("every a[href^='#'] points to an existing id", async ({ page }) => {
    await gotoReady(page);
    const hrefs = await page.$$eval('a[href^="#"]', (as) => as.map((a) => a.getAttribute("href")));
    expect(hrefs.length).toBeGreaterThan(5);
    const missing = await page.evaluate(
      (list) => list.filter((h) => h.length > 1 && !document.getElementById(h.slice(1))),
      hrefs,
    );
    expect(missing).toEqual([]);
  });

  test("pricing section #tarif exists", async ({ page }) => {
    await gotoReady(page);
    await expect(page.locator("section#tarif")).toHaveCount(1);
  });
});
