import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SITE } from "../../assets/js/config.js";
import { WA_DEFAULT } from "../../assets/js/strings.js";
import { buildWhatsAppUrl, packageWhatsAppText } from "../../assets/js/lib.js";

// Contact details are repeated in index.html for visitors without JavaScript.
// These tests fail if one copy is changed and another is forgotten.
const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");

const anchors = [...html.matchAll(/<a\b[^>]*>/g)].map((m) => m[0]);
const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
const decode = (v) => v.replace(/&amp;/g, "&");

test("every wa.me link in index.html uses the number from config.js", () => {
  const numbers = [...html.matchAll(/wa\.me\/(\d+)/g)].map((m) => m[1]);
  assert.ok(numbers.length >= 5);
  assert.deepEqual([...new Set(numbers)], [SITE.whatsapp]);
});

test("links marked data-wa carry the Indonesian default message", () => {
  const expected = `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(WA_DEFAULT)}`;
  const marked = anchors.filter((a) => /\sdata-wa(\s|=|>)/.test(a));
  assert.ok(marked.length >= 2);
  for (const a of marked) assert.equal(decode(attr(a, "href")), expected);
});

test("every Personal and Bisnis pricing CTA links to WhatsApp with its package text", () => {
  const ctas = anchors.filter((a) => /class="[^"]*\bplan__cta\b/.test(a) && attr(a, "data-package") !== undefined);
  assert.equal(ctas.length, 6);
  for (const a of ctas) {
    const name = decode(attr(a, "data-package"));
    assert.equal(decode(attr(a, "href")), buildWhatsAppUrl(SITE.whatsapp, packageWhatsAppText(name)), name);
    assert.equal(attr(a, "target"), "_blank", name);
    assert.equal(attr(a, "rel"), "noopener noreferrer", name);
  }
});

test("Enterprise pricing CTAs are mailto links without data-package", () => {
  const enterprise = html.match(/id="enterprise"[\s\S]*?(?=<\/section>)/)?.[0] ?? "";
  const ctas = [...enterprise.matchAll(/<a\b[^>]*class="[^"]*\bplan__cta\b[^>]*>/g)].map((m) => m[0]);
  assert.equal(ctas.length, 3);
  for (const a of ctas) {
    assert.ok(attr(a, "href").startsWith(`mailto:${SITE.email}?subject=`), a);
    assert.equal(attr(a, "data-package"), undefined, a);
  }
});

test("every email address in index.html matches config.js", () => {
  const emails = [...html.matchAll(/[\w.+-]+@[\w-]+\.[\w.]+/g)].map((m) => m[0]);
  assert.ok(emails.length >= 2);
  assert.deepEqual([...new Set(emails)], [SITE.email]);
});
