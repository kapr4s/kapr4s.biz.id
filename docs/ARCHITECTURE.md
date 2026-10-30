# Architecture

This document records the main design decisions behind the site, the reasoning, and the trade-offs that were accepted.

## Goals

1. Explain the services to non-technical visitors, mostly on mobile, and convert them into a WhatsApp conversation.
2. Look and behave like the work of an experienced engineer: fast, accessible, secure and tested.
3. Stay easy to maintain for a single owner, with no framework upgrades or build pipeline to babysit.
4. Cost nothing to host.

## Decisions

### 1. No framework, no build step

**Decision.** Plain HTML, CSS custom properties and native ES modules, served as-is.

**Why.** The site is one page with light interactivity. A framework would add a toolchain, dependency updates and hydration cost without user-facing benefit. What is in the repository is exactly what runs in the browser.

**Trade-off.** Markup is written by hand, so `index.html` is long. Copy that JavaScript needs is kept in `assets/js/strings.js`, and tests guard the places where copy is duplicated (see §8).

### 2. Progressive enhancement

**Decision.** The HTML is complete and in Indonesian without JavaScript. Scripts only enhance it.

- Navigation links, WhatsApp links and the contact form all work without JS. The form falls back to a `GET` to `https://wa.me/…` with the message in `text`.
- Scroll-reveal styles only apply after JS adds `.js-reveal` and when the user has not requested reduced motion, so content is never hidden permanently.
- JS-only controls (mobile menu toggle, marquee pause, pricing tablist) are shown only under `.has-js`. Without JS the pricing tablist stays hidden and every package panel is visible, so no package is lost.

### 3. Single language (Indonesian)

**Decision.** The site is published in Indonesian only. `<html lang="id">`, `og:locale` `id_ID` and the JSON-LD `inLanguage` are set to `id`.

- The audience is Indonesian-speaking, so a second language would double the copy, the tests and the risk of drift without a matching audience.
- Visible copy lives only in `index.html`, and the few strings that JavaScript writes (form errors, the WhatsApp template, the success note) live in `assets/js/strings.js`.
- `tests/unit/content.test.js` checks the document language and the key copy.

**Trade-off.** English visitors get Indonesian text. If English search traffic becomes important, the next step is a separate static page with its own URL and `hreflang`, not a runtime switch.

### 4. Contact flow without a backend

**Decision.** The form validates input, fills a template and opens `https://wa.me/<number>?text=<message>`. Each pricing CTA opens the same kind of link with the package name in the greeting.

- No server, database, third-party form service or analytics. Nothing the visitor types is stored by the site.
- The visitor's message is inserted after the template is normalised, so line breaks and punctuation are kept exactly as typed. The text is converted with `toWellFormed()` before `encodeURIComponent`, so an emoji cut by `maxlength` cannot throw.
- Pricing CTAs for Personal and Bisnis are static `wa.me` links in `index.html` that carry the package name in their text, so they work without JS. The Enterprise package is contacted by `mailto:` instead. `packageWhatsAppText()` in `lib.js` holds the same greeting for reuse and is covered by unit tests.
- Contact details live in `assets/js/config.js`. The static links in `index.html` (needed without JS) are checked against it by `tests/unit/contacts.test.js`.

### 5. Pricing tabs with URL hash

**Decision.** Pricing is split into three packages (Personal, Bisnis, Enterprise) behind a WAI-ARIA tablist, implemented in `assets/js/pricing-tabs.js`. Tabs use automatic activation, so moving focus with the arrow keys also selects the tab.

- Each tab is wired to its panel with `aria-controls`, and each panel with `aria-labelledby`. Only the selected tab has `tabindex="0"` (roving tabindex). Arrow keys wrap, and Home and End jump to the ends. The key logic (`nextTabIndex`) is a pure function in `lib.js`.
- The selected tab is written to the hash (`#personal`, `#bisnis`, `#enterprise`) with `history.replaceState`, so tab changes add no history entries. Opening a hash link selects that tab and scrolls to the section. `hashchange` also re-selects, so Back and Forward work.
- Hash matching (`tabFromHash`) is case-insensitive and only accepts the three known ids, so an unknown hash keeps the default tab.
- The tablist is hidden until the script runs (see §2), so a visitor without JS sees all three packages.

**Trade-off.** The hash is a navigation aid, not state that survives a reload on another device. That is intentional, because nothing is stored.

### 6. Stylesheet split

**Decision.** The styles are split by concern, so each file can be read and changed on its own:

| File | Contents |
|---|---|
| `tokens.css` | Design tokens |
| `base.css` | Reset, typography, buttons, utilities, print |
| `layout.css` | Header, navigation, hero, footer, floating button |
| `marquee.css` | Technology marquee |
| `sections.css` | Problems, process, why, FAQ and shared section styles |
| `services.css` | Services section |
| `pricing.css` | Pricing tabs and plan cards |
| `contact.css` | Contact section and form |
| `theme.css` | Colour roles, heading face, soft shadows and card radius, layered over the base styles |
| `motion.css` | Entrances, list stagger and hover/press motion |
| `404.css` | Not-found page |

**Trade-off.** Cascade order matters more than it did with one file, so `index.html` loads the files in a fixed order (tokens, base, layout, marquee, sections, services, pricing, contact, theme, motion). `tests/unit/content.test.js` keeps every CSS file under 800 lines.

### 7. Security model

- **CSP (meta tag):** `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action https://wa.me https://api.whatsapp.com https://web.whatsapp.com`. There are no inline scripts, styles or style attributes. JSON-LD is a non-executable data block.
- **DOM:** no `innerHTML`, `eval` or dynamic script creation. Untrusted input is checked or encoded before use: the location hash is matched against the fixed list of tab ids (`tabFromHash`), and form fields are encoded (`encodeURIComponent`).
- **Links:** all `target="_blank"` links and the form use `rel="noopener noreferrer"`.
- **Known limitation:** GitHub Pages cannot set response headers, so `frame-ancestors` / `X-Frame-Options` are unavailable. Clickjacking risk is accepted, because the page has no authenticated or state-changing actions.

### 8. Accessibility (WCAG 2.2 AA)

- Semantic landmarks, one `h1`, ordered headings, labelled sections and native `<details>` for the FAQ.
- Pricing uses the WAI-ARIA tabs pattern with keyboard support (see §5).
- Visible focus on every background (white ring on blue surfaces, two-tone ring on the floating button).
- The mobile menu moves focus into the panel, closes on Escape and returns focus, and scrolls when the viewport is short.
- Moving content has a pause button (2.2.2). Blinking and pulsing effects stop after a few cycles. Everything respects `prefers-reduced-motion`.
- Form errors use `aria-invalid`, `aria-describedby` and always-rendered live regions. Required fields are labelled.
- Verified automatically by axe-core on `/` and on each pricing tab, on desktop and mobile.

### 9. Performance

- About 30 KB of compressed HTML, CSS and JS in total. There are no runtime dependencies and no third-party requests.
- Two variable WOFF2 fonts (latin subset) with `font-display: swap`: Inter for headings and body, JetBrains Mono for technical accents.
- The portrait is a 72 KB WebP with a JPEG fallback and explicit dimensions. Icons are SVG sprites.
- Animations use only `transform` and `opacity`. Reveal and list stagger use `IntersectionObserver`, and `motion.js` does nothing when reduced motion is requested.

### 10. Testing strategy

| Layer | Tool | Focus |
|---|---|---|
| Unit | `node:test` | Pure helpers in `lib.js` (templating, WhatsApp URL, validation, tab keys and hashes), strings contract, page content, contact-data consistency |
| End-to-end | Playwright (desktop 1440 px and Pixel 7) | User journeys, pricing tabs, layout at 6 widths, no-JS, reduced motion, console and network errors |
| Accessibility | `@axe-core/playwright` | WCAG 2.0, 2.1 and 2.2 A/AA on `/` and each pricing tab |

Tests run against `tests/serve.js`, a dependency-free static server bound to `127.0.0.1` with path-traversal protection.

### 11. Delivery pipeline

- GitHub Actions: **test → build → deploy**. Build and deploy run only on `main` after tests pass. Pull requests are tested but never deployed.
- `scripts/build-site.sh` publishes an explicit allow-list (HTML, `favicon.ico`, assets, `robots.txt`, `sitemap.xml`, the Google Search Console verification file, `.nojekyll`). Tests, tooling and documentation are never served.
- Least-privilege permissions, serialised deploys (`cancel-in-progress: false`), job timeouts, and explicitly pinned action and dev-dependency versions.

## Known trade-offs

| Item | Status |
|---|---|
| Site is Indonesian only; no English version | Accepted. Revisit with a separate static page and `hreflang` if English traffic matters |
| `frame-ancestors` unavailable on GitHub Pages | Accepted (no sensitive actions) |
| `404.html` uses absolute `/assets/...` paths | Correct because the site is served at the root of `kapr4s.biz.id` |
| Pricing hash is not persisted | Accepted. Nothing is stored, and the hash makes each package linkable |
| Copy duplicated between HTML, JSON-LD and `strings.js` | Mitigated by the content and strings tests |
