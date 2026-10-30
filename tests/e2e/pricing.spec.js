import { test, expect } from "@playwright/test";
import { gotoReady } from "./helpers.js";

const TABS = [
  { id: "personal", label: "Personal", cards: 3 },
  { id: "bisnis", label: "Bisnis", cards: 3 },
  { id: "enterprise", label: "Enterprise", cards: 3 },
];

const tab = (page, id) => page.locator(`#tab-${id}`);
const panel = (page, id) => page.locator(`#${id}`);

async function expectOnlyActive(page, activeId) {
  for (const { id } of TABS) {
    const active = id === activeId;
    await expect(tab(page, id), `tab ${id}`).toHaveAttribute("aria-selected", active ? "true" : "false");
    await expect(tab(page, id), `tabindex ${id}`).toHaveAttribute("tabindex", active ? "0" : "-1");
    if (active) await expect(panel(page, id)).toBeVisible();
    else await expect(panel(page, id)).toBeHidden();
  }
}

test.describe("structure", () => {
  test("tablist is revealed by JavaScript and labelled", async ({ page }) => {
    await gotoReady(page);
    const tablist = page.locator(".pricing__tabs");
    await expect(tablist).toBeVisible();
    await expect(tablist).toHaveAttribute("role", "tablist");
    await expect(tablist).toHaveAttribute("aria-label", "Kategori paket");
    await expect(tablist).not.toHaveAttribute("hidden", /.*/);
  });

  test("each tab is wired to its panel with matching ARIA attributes", async ({ page }) => {
    await gotoReady(page);
    await expect(page.locator('.pricing__tabs [role="tab"]')).toHaveText(TABS.map((t) => t.label));
    for (const { id } of TABS) {
      await expect(tab(page, id)).toHaveAttribute("role", "tab");
      await expect(tab(page, id)).toHaveAttribute("aria-controls", id);
      await expect(panel(page, id)).toHaveAttribute("role", "tabpanel");
      await expect(panel(page, id)).toHaveAttribute("aria-labelledby", `tab-${id}`);
      await expect(panel(page, id)).toHaveClass(/\bpricing__panel\b/);
    }
  });

  test("personal is the default active tab and other panels are hidden", async ({ page }) => {
    await gotoReady(page);
    await expectOnlyActive(page, "personal");
  });

  test("section is titled Tarif and has no introductory-price label", async ({ page }) => {
    await gotoReady(page);
    await expect(page.locator("#pricing-title")).toHaveText("Transparan sejak awal");
    await expect(page.locator("#tarif .eyebrow")).toHaveText("Tarif");
    await expect(page.locator(".pricing__intro")).toHaveCount(0);
  });

  test("each panel has the expected number of complete plan cards", async ({ page }) => {
    await gotoReady(page);
    for (const { id, cards } of TABS) {
      const items = page.locator(`#${id} ul.plans > li.plan`);
      await expect(items, id).toHaveCount(cards);
      for (const card of await items.all()) {
        await expect(card.locator("h4.plan__name")).toHaveCount(1);
        await expect(card.locator("p.plan__desc")).toHaveCount(1);
        await expect(card.locator("p.plan__price")).toHaveCount(1);
        const features = await card.locator("ul.plan__features > li").count();
        expect(features).toBeGreaterThanOrEqual(3);
        expect(features).toBeLessThanOrEqual(4);
        await expect(card.locator("a.plan__cta")).toHaveCount(1);
      }
    }
  });

  test("no card is marked as featured", async ({ page }) => {
    await gotoReady(page);
    await expect(page.locator(".plan--featured, .plan__badge")).toHaveCount(0);
  });

  test("closing block invites the visitor to describe their problem via WhatsApp", async ({ page }) => {
    await gotoReady(page);
    await expect(page.locator(".pricing__closing h3")).toHaveText("Masalahmu tidak ada di daftar?");
    const cta = page.locator("a#pricing-closing-cta");
    await expect(cta).toHaveText("Ceritakan masalahmu");
    await expect(cta).toHaveAttribute("href", /^https:\/\/wa\.me\/628175000891\?text=./);
  });
});

test.describe("mouse interaction", () => {
  test("clicking a tab shows its panel, hides the others and updates the URL hash", async ({ page }) => {
    await gotoReady(page);
    await tab(page, "bisnis").click();
    await expectOnlyActive(page, "bisnis");
    await expect(page).toHaveURL(/#bisnis$/);

    await tab(page, "enterprise").click();
    await expectOnlyActive(page, "enterprise");
    await expect(page).toHaveURL(/#enterprise$/);
  });

  test("switching tabs does not add history entries", async ({ page }) => {
    await gotoReady(page);
    const before = await page.evaluate(() => history.length);
    await tab(page, "bisnis").click();
    await tab(page, "enterprise").click();
    await expectOnlyActive(page, "enterprise");
    expect(await page.evaluate(() => history.length)).toBe(before);
  });
});

test.describe("keyboard", () => {
  test("ArrowRight moves focus and activates the next tab, wrapping at the end", async ({ page }) => {
    await gotoReady(page);
    await tab(page, "personal").focus();
    await page.keyboard.press("ArrowRight");
    await expect(tab(page, "bisnis")).toBeFocused();
    await expectOnlyActive(page, "bisnis");
    await page.keyboard.press("ArrowRight");
    await expect(tab(page, "enterprise")).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(tab(page, "personal")).toBeFocused();
    await expectOnlyActive(page, "personal");
  });

  test("ArrowLeft wraps from the first tab to the last", async ({ page }) => {
    await gotoReady(page);
    await tab(page, "personal").focus();
    await page.keyboard.press("ArrowLeft");
    await expect(tab(page, "enterprise")).toBeFocused();
    await expectOnlyActive(page, "enterprise");
  });

  test("End and Home jump to the last and first tab", async ({ page }) => {
    await gotoReady(page);
    await tab(page, "personal").focus();
    await page.keyboard.press("End");
    await expect(tab(page, "enterprise")).toBeFocused();
    await expectOnlyActive(page, "enterprise");
    await page.keyboard.press("Home");
    await expect(tab(page, "personal")).toBeFocused();
    await expectOnlyActive(page, "personal");
  });

  test("Tab from the active tab leaves the tablist (roving tabindex)", async ({ page }) => {
    await gotoReady(page);
    await tab(page, "personal").focus();
    await page.keyboard.press("Tab");
    const insideTablist = await page.evaluate(() => !!document.activeElement.closest(".pricing__tabs"));
    expect(insideTablist).toBe(false);
  });
});

test.describe("location hash", () => {
  for (const { id } of TABS) {
    test(`loading /#${id} opens the ${id} tab`, async ({ page }) => {
      await gotoReady(page, `/#${id}`);
      await expectOnlyActive(page, id);
    });
  }

  test("hash matching is case-insensitive", async ({ page }) => {
    await gotoReady(page, "/#Enterprise");
    await expectOnlyActive(page, "enterprise");
  });

  test("an unknown hash keeps the default tab", async ({ page }) => {
    await gotoReady(page, "/#unknown");
    await expectOnlyActive(page, "personal");
  });

  test("hashchange switches the active tab", async ({ page }) => {
    await gotoReady(page);
    await page.evaluate(() => { location.hash = "#bisnis"; });
    await expectOnlyActive(page, "bisnis");
    await page.evaluate(() => { location.hash = "#enterprise"; });
    await expectOnlyActive(page, "enterprise");
  });
});

test.describe("small screens", () => {
  test("at 320px neither the tablist nor the document overflows horizontally", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await gotoReady(page);
    for (const { id } of TABS) {
      await tab(page, id).click();
      await expectOnlyActive(page, id);
      const m = await page.evaluate(() => {
        const list = document.querySelector(".pricing__tabs");
        return { docScroll: document.documentElement.scrollWidth, inner: window.innerWidth, listScroll: list.scrollWidth, listClient: list.clientWidth };
      });
      expect(m.docScroll, `document (${id})`).toBeLessThanOrEqual(m.inner);
      expect(m.listScroll, `tablist (${id})`).toBeLessThanOrEqual(m.listClient);
    }
  });
});
