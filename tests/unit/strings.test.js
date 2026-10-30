import { test } from "node:test";
import assert from "node:assert/strict";
import { ERRORS, WA_TEMPLATE, WA_DEFAULT, SERVICE_UNSET, SUCCESS } from "../../assets/js/strings.js";

test("ERRORS maps each validation key to Indonesian copy", () => {
  assert.deepEqual({ ...ERRORS }, {
    "contact.form.error_name": "Mohon isi namamu.",
    "contact.form.error_message_required": "Mohon tulis pesanmu.",
    "contact.form.error_message_short": "Pesan terlalu singkat. Ceritakan sedikit lebih detail.",
  });
});

test("WhatsApp strings match the contract", () => {
  assert.equal(WA_TEMPLATE, "Halo kapr4s, saya {name}. Saya butuh: {service}. {message} Saya ingin konsultasi gratis. Terima kasih.");
  assert.equal(WA_DEFAULT, "Halo kapr4s!");
  assert.equal(SERVICE_UNSET, "belum tahu");
  assert.equal(typeof SUCCESS, "string");
  assert.notEqual(SUCCESS.trim(), "");
});

test("exported string collections are frozen", () => {
  assert.equal(Object.isFrozen(ERRORS), true);
});
