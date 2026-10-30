// Shared helpers for the E2E specs.

/** Replace window.open so tests never open real pages; calls are recorded in window.__opened. */
export async function stubWindowOpen(page) {
  await page.addInitScript(() => {
    window.__opened = [];
    window.open = (...args) => {
      window.__opened.push(args);
      return null;
    };
  });
}

export const getOpened = (page) => page.evaluate(() => window.__opened);

/** Wait until main.js has run (has-js class). */
export async function gotoReady(page, path = "/") {
  await page.goto(path);
  await page.locator("html.has-js").waitFor({ state: "attached" });
}

export const SERVICES_HEADING = "Apa yang bisa saya kerjakan untukmu";
export const TITLE = "Jasa Pembuatan Website, Chatbot AI & Otomatisasi | kapr4s";
