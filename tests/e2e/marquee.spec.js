import { test, expect } from "@playwright/test";
import { gotoReady } from "./helpers.js";

// WCAG 2.2.2: auto-moving content needs a way to pause it that works on touch and keyboard.
test("pause button stops and restarts the skills marquee", async ({ page }) => {
  await gotoReady(page);
  const toggle = page.locator(".marquee__toggle");
  const track = page.locator(".marquee__track").first();

  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect(toggle).toHaveAccessibleName("Jeda animasi");

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(track).toHaveCSS("animation-play-state", "paused");

  await page.locator("body").click({ position: { x: 5, y: 5 } }); // move focus away so :focus-within no longer pauses
  await expect(track).toHaveCSS("animation-play-state", "paused");

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  // Focus is still on the button: the marquee must run again anyway.
  await expect(toggle).toBeFocused();
  await expect(track).toHaveCSS("animation-play-state", "running");
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("pause button is hidden because nothing moves", async ({ page }) => {
    await gotoReady(page);
    await expect(page.locator(".marquee__toggle")).toBeHidden();
  });
});
