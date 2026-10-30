// Pure helpers with no DOM access, so they can be unit-tested in Node.

export const MIN_MESSAGE_LENGTH = 10;

// Stand-in for {message} while the template is tidied, so the visitor's own
// text (line breaks, "...", spacing) reaches WhatsApp exactly as typed.
const MESSAGE_SLOT = "\u0000MSG\u0000";

/** Replace {key} placeholders, then collapse the gaps left by empty values. */
export function fillTemplate(template, vars = {}) {
  const message = String(vars.message ?? "").trim();
  const tidy = template
    .replace(/\{(\w+)\}/g, (_, key) => (key === "message" ? (message ? MESSAGE_SLOT : "") : String(vars[key] ?? "").trim()))
    .replace(/\s+([.,!?])/g, "$1")
    .replace(/([.!?])(?:\s*\.)+/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
  return tidy.replace(MESSAGE_SLOT, () => message);
}

/** Build a wa.me click-to-chat link. */
export function buildWhatsAppUrl(phone, text) {
  const digits = String(phone).replace(/\D/g, "");
  const base = `https://wa.me/${digits}`;
  if (!text) return base;
  // A maxlength cut can split an emoji; encodeURIComponent throws on half of one.
  const safe = typeof text.toWellFormed === "function" ? text.toWellFormed() : text;
  return `${base}?text=${encodeURIComponent(safe)}`;
}

/** Validate the contact form. Errors are keys into ERRORS in strings.js. */
export function validateContact({ name = "", message = "" } = {}) {
  const errors = {};
  if (name.trim() === "") errors.name = "contact.form.error_name";

  const msg = message.trim();
  if (msg === "") errors.message = "contact.form.error_message_required";
  else if (msg.length < MIN_MESSAGE_LENGTH) errors.message = "contact.form.error_message_short";

  return { valid: Object.keys(errors).length === 0, errors };
}

/** Roving focus for a tablist: the index to move to for a key, or null if the key is not handled. */
export function nextTabIndex(current, key, count) {
  switch (key) {
    case "ArrowRight":
      return (current + 1) % count;
    case "ArrowLeft":
      return (current - 1 + count) % count;
    case "Home":
      return 0;
    case "End":
      return count - 1;
    default:
      return null;
  }
}

/** Match a location hash ("#Bisnis") to one of the given ids, case-insensitively. */
export function tabFromHash(hash, ids) {
  const wanted = String(hash ?? "").replace(/^#/, "").toLowerCase();
  if (!wanted) return null;
  return ids.find((id) => id.toLowerCase() === wanted) ?? null;
}

/** Prefilled WhatsApp text for a pricing package. */
export function packageWhatsAppText(name) {
  return `Halo kapr4s! Saya tertarik dengan paket ${name}. Boleh diskusi dulu?`;
}
