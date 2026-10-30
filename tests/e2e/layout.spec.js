import { test, expect } from "@playwright/test";
import { gotoReady } from "./helpers.js";

const WIDTHS = [320, 375, 768, 1024, 1440, 1920];

for (const width of WIDTHS) {
  test(`no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await gotoReady(page);
    // Open every reveal so the final layout is measured.
    await page.evaluate(() => document.querySelectorAll("[data-reveal]").forEach((el) => el.classList.add("is-visible")));
    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
  });
}

test("loads with no console errors, page errors or failed requests", async ({ page }) => {
  const problems = [];
  page.on("console", (m) => m.type() === "error" && problems.push(`console: ${m.text()}`));
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
  page.on("requestfailed", (r) => problems.push(`failed: ${r.url()} ${r.failure()?.errorText}`));
  page.on("response", (r) => r.status() >= 400 && problems.push(`http ${r.status()}: ${r.url()}`));

  await page.goto("/", { waitUntil: "networkidle" });
  expect(problems).toEqual([]);
});

test("every local asset request returns 200", async ({ page, baseURL }) => {
  const origin = new URL(baseURL).origin;
  const bad = [];
  let count = 0;
  page.on("response", (r) => {
    if (!r.url().startsWith(origin)) return;
    count += 1;
    if (r.status() !== 200) bad.push(`${r.status()} ${r.url()}`);
  });
  await page.goto("/", { waitUntil: "networkidle" });
  // Lazy images below the fold: scroll through the page so they load too.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight) {
      window.scrollTo(0, y);
      await new Promise((res) => requestAnimationFrame(() => res()));
    }
  });
  await page.waitForLoadState("networkidle");
  expect(count).toBeGreaterThan(5);
  expect(bad).toEqual([]);
});
