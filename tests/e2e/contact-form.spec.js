import { test, expect } from "@playwright/test";
import { getOpened, gotoReady, stubWindowOpen } from "./helpers.js";

const submit = (page) => page.locator('#contact-form button[type="submit"]');
const WA_PREFIX = "https://wa.me/628175000891?text=";

test.beforeEach(async ({ page }) => {
  await stubWindowOpen(page);
  await gotoReady(page);
});

test("empty submit shows both errors, marks fields invalid and focuses the name", async ({ page }) => {
  await submit(page).click();
  await expect(page.locator("#cf-name-error")).toHaveText("Mohon isi namamu.");
  await expect(page.locator("#cf-message-error")).toHaveText("Mohon tulis pesanmu.");
  await expect(page.locator("#cf-name")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#cf-message")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#cf-name")).toBeFocused();
  expect(await getOpened(page)).toEqual([]);
  await expect(page.locator(".contact-form__success")).toBeHidden();
});

test("short message is rejected, focus goes to the message, name error stays clear", async ({ page }) => {
  await page.locator("#cf-name").fill("Sari");
  await page.locator("#cf-message").fill("halo");
  await submit(page).click();
  await expect(page.locator("#cf-message-error")).toHaveText("Pesan terlalu singkat. Ceritakan sedikit lebih detail.");
  await expect(page.locator("#cf-name-error")).toHaveText("");
  await expect(page.locator("#cf-name")).not.toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#cf-message")).toBeFocused();
  expect(await getOpened(page)).toEqual([]);
});

test("an error clears once the field is fixed", async ({ page }) => {
  await submit(page).click();
  await page.locator("#cf-name").fill("Sari");
  await expect(page.locator("#cf-name-error")).toHaveText("");
  await expect(page.locator("#cf-name")).not.toHaveAttribute("aria-invalid", "true");
});

test("valid submit in Indonesian opens the exact wa.me URL and shows the success note", async ({ page }) => {
  await page.locator("#cf-name").fill("Sari");
  await page.locator("#cf-service").selectOption("4");
  await page.locator("#cf-message").fill("Mau otomatisasi laporan stok toko kue saya.");
  await submit(page).click();

  const opened = await getOpened(page);
  expect(opened).toHaveLength(1);
  const [url, target, features] = opened[0];
  expect(target).toBe("_blank");
  expect(features).toBe("noopener");
  expect(url.startsWith(WA_PREFIX)).toBe(true);
  expect(decodeURIComponent(url.slice(WA_PREFIX.length))).toBe(
    "Halo kapr4s, saya Sari. Saya butuh: Otomatisasi. Mau otomatisasi laporan stok toko kue saya. Saya ingin konsultasi gratis. Terima kasih.",
  );
  await expect(page.locator(".contact-form__success")).toBeVisible();
});

test("without a service selected the template uses the 'not sure yet' label", async ({ page }) => {
  await page.locator("#cf-name").fill("Sari");
  await page.locator("#cf-message").fill("Mau tanya-tanya dulu soal harga.");
  await submit(page).click();
  const [[url]] = await getOpened(page);
  expect(decodeURIComponent(url.slice(WA_PREFIX.length))).toContain("Saya butuh: belum tahu.");
});

test("a failed submit after a success hides the success note again", async ({ page }) => {
  await page.locator("#cf-name").fill("Sari");
  await page.locator("#cf-message").fill("Mau otomatisasi laporan stok.");
  await submit(page).click();
  await expect(page.locator(".contact-form__success")).toBeVisible();
  await page.locator("#cf-message").fill("pendek");
  await submit(page).click();
  await expect(page.locator(".contact-form__success")).toBeHidden();
});

test("special characters, emoji and line breaks reach WhatsApp exactly as typed", async ({ page }) => {
  const message = "Halo & tes 100%? Harga #1 ...\nBaris kedua + emoji 😀";
  await page.fill("#cf-name", "Budi & Co");
  await page.selectOption("#cf-service", "1");
  await page.fill("#cf-message", message);
  await submit(page).click();

  const [[url]] = await getOpened(page); // each call is recorded as [url, target, features]
  expect(url.startsWith(WA_PREFIX)).toBe(true);
  expect(new URL(url).searchParams.get("text")).toBe(
    `Halo kapr4s, saya Budi & Co. Saya butuh: Website. ${message} Saya ingin konsultasi gratis. Terima kasih.`,
  );
});

test("service select offers six options with numeric values", async ({ page }) => {
  const options = await page.$$eval("#cf-service option", (os) => os.map((o) => [o.value, o.textContent.trim()]).filter(([v]) => v !== ""));
  expect(options).toEqual([
    ["1", "Website"],
    ["2", "Aplikasi & dashboard"],
    ["3", "AI agent & chatbot"],
    ["4", "Otomatisasi"],
    ["5", "Maintenance & support"],
    ["6", "Custom / ide lain"],
  ]);
});
