import { test } from "node:test";
import assert from "node:assert/strict";
import {
  fillTemplate,
  buildWhatsAppUrl,
  validateContact,
  nextTabIndex,
  tabFromHash,
  packageWhatsAppText,
} from "../../assets/js/lib.js";

test("fillTemplate replaces placeholders and tidies whitespace", () => {
  const out = fillTemplate("Hi {name}. Need: {service}. {message} Thanks.", {
    name: "  Budi ",
    service: "Website",
    message: "",
  });
  assert.equal(out, "Hi Budi. Need: Website. Thanks.");
});

test("fillTemplate leaves unknown placeholders empty instead of printing braces", () => {
  assert.equal(fillTemplate("A {missing} B", {}), "A B");
});

test("buildWhatsAppUrl encodes text and strips non-digits from phone", () => {
  const url = buildWhatsAppUrl("+62 817-5000-891", "Halo & salam?");
  assert.equal(url, "https://wa.me/628175000891?text=Halo%20%26%20salam%3F");
});

test("buildWhatsAppUrl omits text param when text is empty", () => {
  assert.equal(buildWhatsAppUrl("628175000891", ""), "https://wa.me/628175000891");
});

test("validateContact passes with name and a detailed message", () => {
  const r = validateContact({ name: "Sari", message: "Butuh website toko kue." });
  assert.equal(r.valid, true);
  assert.deepEqual(r.errors, {});
});

test("validateContact flags missing name and missing message", () => {
  const r = validateContact({ name: "  ", message: "" });
  assert.equal(r.valid, false);
  assert.equal(r.errors.name, "contact.form.error_name");
  assert.equal(r.errors.message, "contact.form.error_message_required");
});

test("validateContact flags a message that is too short", () => {
  const r = validateContact({ name: "Sari", message: "halo" });
  assert.equal(r.errors.message, "contact.form.error_message_short");
});

test("fillTemplate keeps the visitor's message exactly as typed", () => {
  const message = "Line1\n\nLine2 ... wait !\nok & 100% #1?";
  const out = fillTemplate("Hi {name}. Need: {service}. {message} Thanks.", {
    name: "Sari",
    service: "Website",
    message,
  });
  assert.equal(out, `Hi Sari. Need: Website. ${message} Thanks.`);
});

test("buildWhatsAppUrl survives a half emoji left by a maxlength cut", () => {
  const url = buildWhatsAppUrl("62", "hi \ud83d");
  assert.ok(url.startsWith("https://wa.me/62?text=hi%20"));
});

test("buildWhatsAppUrl round-trips special characters", () => {
  const text = "a&b?c#d%e+f 😀\nbaris";
  const url = new URL(buildWhatsAppUrl("62", text));
  assert.equal(url.searchParams.get("text"), text);
});

test("nextTabIndex moves right and wraps from last to first", () => {
  assert.equal(nextTabIndex(0, "ArrowRight", 3), 1);
  assert.equal(nextTabIndex(2, "ArrowRight", 3), 0);
});

test("nextTabIndex moves left and wraps from first to last", () => {
  assert.equal(nextTabIndex(2, "ArrowLeft", 3), 1);
  assert.equal(nextTabIndex(0, "ArrowLeft", 3), 2);
});

test("nextTabIndex jumps to the ends with Home and End", () => {
  assert.equal(nextTabIndex(1, "Home", 3), 0);
  assert.equal(nextTabIndex(1, "End", 3), 2);
});

test("nextTabIndex returns null for keys it does not handle", () => {
  for (const key of ["Enter", " ", "Tab", "ArrowUp", "ArrowDown", "a", ""]) assert.equal(nextTabIndex(1, key, 3), null, key);
});

const TAB_IDS = ["personal", "bisnis", "enterprise"];

test("tabFromHash strips the leading # and matches an id", () => {
  assert.equal(tabFromHash("#bisnis", TAB_IDS), "bisnis");
});

test("tabFromHash is case-insensitive and returns the canonical id", () => {
  assert.equal(tabFromHash("#Enterprise", TAB_IDS), "enterprise");
  assert.equal(tabFromHash("#PERSONAL", TAB_IDS), "personal");
});

test("tabFromHash returns null for empty, bare or unknown hashes", () => {
  assert.equal(tabFromHash("", TAB_IDS), null);
  assert.equal(tabFromHash("#", TAB_IDS), null);
  assert.equal(tabFromHash("#unknown", TAB_IDS), null);
  assert.equal(tabFromHash("#faq", TAB_IDS), null);
});

test("packageWhatsAppText names the package in the greeting", () => {
  assert.equal(
    packageWhatsAppText("Link-in-Bio"),
    "Halo kapr4s! Saya tertarik dengan paket Link-in-Bio. Boleh diskusi dulu?",
  );
});

test("lib.js no longer exports language helpers", async () => {
  const lib = await import("../../assets/js/lib.js");
  for (const name of ["SUPPORTED_LANGS", "DEFAULT_LANG", "normalizeLang", "resolveInitialLang"]) assert.equal(name in lib, false, name);
  assert.equal(lib.MIN_MESSAGE_LENGTH, 10);
});
