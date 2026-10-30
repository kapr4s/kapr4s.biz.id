import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

// Static content guards, checked by parsing index.html text.
const root = new URL("../../", import.meta.url);
const html = readFileSync(new URL("index.html", root), "utf8");

const decodeEntities = (s) =>
  s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'");
const text = (fragment) => decodeEntities(fragment.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
const innerOf = (cls) =>
  [...html.matchAll(new RegExp(`<(\\w+)[^>]*class="[^"]*\\b${cls}\\b[^"]*"[^>]*>([\\s\\S]*?)</\\1>`, "g"))].map((m) => text(m[2]));

test("document is Indonesian only", () => {
  assert.match(html, /<html[^>]*\blang="id"/);
});

test("title and h1 match the contract", () => {
  assert.equal(text(html.match(/<title>([\s\S]*?)<\/title>/)[1]), "Jasa Pembuatan Website, Chatbot AI & Otomatisasi | kapr4s");
  assert.equal(text(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)[1]), "Teknologi yang meringankan, bukan merepotkan.");
});

test("required section and heading ids exist", () => {
  for (const id of ["tentang", "masalah", "layanan", "tarif", "cara-kerja", "kenapa", "faq", "kontak"]) assert.match(html, new RegExp(`id="${id}"`), id);
  for (const id of ["about-title", "problems-title", "services-title", "pricing-title", "process-title", "whyme-title", "faq-title", "contact-title"]) {
    assert.match(html, new RegExp(`id="${id}"`), id);
  }
});

test("hero links to the pricing section", () => {
  assert.match(html, /<a\b[^>]*href="#tarif"[^>]*>(?:(?!<\/a>)[\s\S])*Lihat tarif(?:(?!<\/a>)[\s\S])*<\/a>/);
});

test("pricing package names appear exactly once as card names", () => {
  const names = innerOf("plan__name");
  assert.deepEqual(names, [
    "Link-in-Bio", "Personal Website / Media Kit", "AI Asisten Pribadi",
    "Chatbot AI WhatsApp/Web", "Otomatisasi Operasional", "Website Usaha",
    "Maintenance & Support", "Proof of Concept", "Web / Aplikasi Internal & AI Agent",
  ]);
});

test("pricing prices and notes are present", () => {
  const prices = innerOf("plan__price");
  assert.deepEqual(prices.map((p) => p.replace(/\s+/g, " ")), [
    "mulai dari Rp222.000", "mulai dari Rp333.000", "mulai dari Rp555.000",
    "Harga normal Rp666.000 mulai dari Rp333.000", "mulai dari Rp333.000", "mulai dari Rp555.000",
    "mulai dari Rp1.200.000 /bulan per bulan", "mulai dari Rp3.000.000", "Negosiasi",
  ]);
  const flat = text(html);
  assert.match(flat, /Belum termasuk biaya pihak ketiga/);
  for (const gone of [/Harga perkenalan/, /Paling diminati/, /Sketsa kasar gratis sebelum DP/, /Rp150rb/]) {
    assert.doesNotMatch(flat, gone);
  }
  assert.match(flat, /QRIS/);
});

test("pricing has no featured cards or badges", () => {
  assert.doesNotMatch(html, /plan--featured|plan__badge|pricing__terms|pricing__intro/);
});


test("contact service options are numbered 1-6 with their labels", () => {
  const select = html.match(/<select\b[^>]*id="cf-service"[^>]*>([\s\S]*?)<\/select>/)[1];
  const opts = [...select.matchAll(/<option\b[^>]*value="([^"]*)"[^>]*>([\s\S]*?)<\/option>/g)]
    .map((m) => [m[1], text(m[2])])
    .filter(([v]) => v !== "");
  assert.deepEqual(opts, [
    ["1", "Website"], ["2", "Aplikasi & dashboard"], ["3", "AI agent & chatbot"],
    ["4", "Otomatisasi"], ["5", "Maintenance & support"], ["6", "Custom / ide lain"],
  ]);
});

function jsonLdBlocks() {
  return [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
}
const flatten = (blocks) => blocks.flatMap((b) => (Array.isArray(b["@graph"]) ? b["@graph"] : [b]));

test("FAQPage JSON-LD equals the visible FAQ text", () => {
  const faq = flatten(jsonLdBlocks()).find((n) => n["@type"] === "FAQPage");
  assert.ok(faq, "FAQPage JSON-LD present");
  const questions = innerOf("faq-item__q");
  const answers = innerOf("faq-item__a");
  assert.ok(questions.length > 0);
  assert.equal(faq.mainEntity.length, questions.length);
  assert.deepEqual(faq.mainEntity.map((q) => text(q.name)), questions);
  assert.deepEqual(faq.mainEntity.map((q) => text(q.acceptedAnswer.text)), answers);
});

test("ProfessionalService JSON-LD advertises Indonesian only", () => {
  const svc = flatten(jsonLdBlocks()).find((n) => n["@type"] === "ProfessionalService");
  assert.ok(svc, "ProfessionalService JSON-LD present");
  assert.deepEqual([svc.availableLanguage].flat(), ["id"]);
});

test("every CSS file stays under 800 lines", () => {
  const dir = new URL("assets/css/", root);
  const files = readdirSync(dir).filter((f) => f.endsWith(".css"));
  assert.ok(files.length > 0);
  for (const f of files) {
    const lines = readFileSync(new URL(f, dir), "utf8").split("\n").length;
    assert.ok(lines < 800, `${f} has ${lines} lines`);
  }
});
