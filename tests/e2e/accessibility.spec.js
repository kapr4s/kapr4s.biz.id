import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";
import { gotoReady } from "./helpers.js";

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

function summarize(violations) {
  return violations
    .map((v) => {
      const targets = v.nodes.map((n) => n.target.join(" ")).slice(0, 5).join(" | ");
      return `${v.id} [${v.impact}] ${targets} :: ${v.help}`;
    })
    .join("\n");
}

for (const path of ["/", "/#personal", "/#bisnis", "/#enterprise"]) {
  test(`axe: no WCAG A/AA violations (${path})`, async ({ page }) => {
    await gotoReady(page, path);
    // Measure contrast on final colours, not mid-reveal opacity.
    await page.evaluate(() => document.querySelectorAll("[data-reveal]").forEach((el) => el.classList.add("is-visible")));
    // Reveal transitions (opacity) are CSS-driven; wait until nothing is still animating.
    await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== "running" || a.effect?.getTiming().iterations === Infinity));

    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    expect(summarize(results.violations)).toBe("");
  });
}

test("every <img> has an alt attribute", async ({ page }) => {
  await gotoReady(page);
  const missing = await page.$$eval("img", (imgs) => imgs.filter((i) => !i.hasAttribute("alt")).map((i) => i.getAttribute("src")));
  expect(missing).toEqual([]);
});

test("first Tab stop is the skip link, targeting #main", async ({ page }) => {
  await gotoReady(page);
  await page.keyboard.press("Tab");
  const skip = page.locator(".skip-link");
  await expect(skip).toBeFocused();
  await expect(skip).toHaveAttribute("href", "#main");
  await expect(skip).toBeVisible();
  await expect(page.locator("#main")).toHaveCount(1);
});
