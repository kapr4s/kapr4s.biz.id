// Page behaviour: mobile menu, scroll reveal, pricing tabs, contact form.
// Everything here is progressive enhancement: without JavaScript the page is
// complete (Indonesian), links still open WhatsApp and the form still submits.

import { SITE } from "./config.js";
import { buildWhatsAppUrl, fillTemplate, validateContact } from "./lib.js";
import { initPricingTabs } from "./pricing-tabs.js";
import { ERRORS, SERVICE_UNSET, WA_TEMPLATE } from "./strings.js";

const root = document.documentElement;

/* ---------- Mobile menu ---------- */

const menuToggle = document.querySelector(".menu-toggle");
const nav = document.getElementById("site-nav");

function isMenuOpen() {
  return menuToggle?.getAttribute("aria-expanded") === "true";
}

function setMenu(open) {
  if (!menuToggle || !nav) return;
  menuToggle.setAttribute("aria-expanded", String(open));
  nav.classList.toggle("is-open", open);
  root.classList.toggle("menu-open", open);
  // The panel's links come before the toggle in the DOM, so move focus into it.
  if (open) nav.querySelector("a")?.focus();
}

function initMenu() {
  if (!menuToggle || !nav) return;
  menuToggle.addEventListener("click", () => setMenu(!isMenuOpen()));
  nav.addEventListener("click", (e) => {
    if (e.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isMenuOpen()) {
      setMenu(false);
      menuToggle.focus();
    }
  });
  // Close the panel if the viewport grows to desktop width while it is open.
  window.matchMedia("(min-width: 60rem)").addEventListener("change", (e) => {
    if (e.matches) setMenu(false);
  });
}

/* ---------- Current section in the nav ---------- */

// Marks the nav link of the section in view with aria-current="true".
function initNavSpy() {
  if (!nav || !("IntersectionObserver" in window)) return;
  const links = [...nav.querySelectorAll('ul a[href^="#"]')];
  const byId = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));
  const sections = [...byId.keys()].map((id) => document.getElementById(id)).filter(Boolean);

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        for (const a of links) a.removeAttribute("aria-current");
        byId.get(entry.target.id)?.setAttribute("aria-current", "true");
      }
    },
    { rootMargin: "-45% 0px -50% 0px" },
  );
  for (const section of sections) observer.observe(section);
}

/* ---------- Scroll reveal ---------- */

function initReveal() {
  const items = document.querySelectorAll("[data-reveal]");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) return;

  root.classList.add("js-reveal");
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
  );
  for (const el of items) observer.observe(el);
}

/* ---------- Marquee pause button (WCAG 2.2.2) ---------- */

function initMarqueeToggle() {
  const marquee = document.querySelector(".marquee");
  const toggle = marquee?.querySelector(".marquee__toggle");
  if (!toggle) return;
  toggle.addEventListener("click", () => {
    const paused = marquee.classList.toggle("is-paused");
    toggle.setAttribute("aria-pressed", String(paused));
    toggle.querySelector("use")?.setAttribute("href", `assets/img/ui-icons.svg#${paused ? "play" : "pause"}`);
  });
}

/* ---------- Floating WhatsApp button: hidden while the hero is on screen ---------- */

function initFloatingButton() {
  const fab = document.querySelector(".wa-float");
  const hero = document.querySelector(".hero");
  if (!fab || !hero || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(([entry]) => {
    fab.classList.toggle("is-hidden", entry.isIntersecting);
  });
  observer.observe(hero);
}

/* ---------- Contact form ---------- */

const form = document.getElementById("contact-form");

function showFieldError(field, key) {
  const errorEl = document.getElementById(`${field.id}-error`);
  if (!errorEl) return;
  if (key) {
    errorEl.textContent = ERRORS[key] ?? "";
    field.setAttribute("aria-invalid", "true");
  } else {
    errorEl.textContent = "";
    field.removeAttribute("aria-invalid");
  }
}

function serviceLabel(select) {
  const option = select.selectedOptions[0];
  return select.value && option ? option.textContent.trim() : SERVICE_UNSET;
}

function initContactForm() {
  if (!form) return;
  const name = form.elements.namedItem("name");
  const service = form.elements.namedItem("service");
  const message = form.elements.namedItem("text");
  const success = form.querySelector(".contact-form__success");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const { valid, errors } = validateContact({ name: name.value, message: message.value });
    showFieldError(name, errors.name);
    showFieldError(message, errors.message);
    success.hidden = true;

    if (!valid) {
      (errors.name ? name : message).focus();
      return;
    }

    const text = fillTemplate(WA_TEMPLATE, {
      name: name.value,
      service: serviceLabel(service),
      message: message.value,
    });
    window.open(buildWhatsAppUrl(SITE.whatsapp, text), "_blank", "noopener");
    success.hidden = false;
  });

  // Clear an error as soon as the visitor fixes the field.
  for (const field of [name, message]) {
    field.addEventListener("input", () => {
      if (field.getAttribute("aria-invalid") !== "true") return;
      const { errors } = validateContact({ name: name.value, message: message.value });
      showFieldError(field, field === name ? errors.name : errors.message);
    });
  }
}

/* ---------- Boot ---------- */

function initYear() {
  for (const el of document.querySelectorAll("[data-year]")) el.textContent = String(new Date().getFullYear());
}

root.classList.add("has-js");
initMenu();
initNavSpy();
initPricingTabs();
initReveal();
initMarqueeToggle();
initFloatingButton();
initContactForm();
initYear();
