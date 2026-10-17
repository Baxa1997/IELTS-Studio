/**
 * The one inbox and the one number — for learners, for education centres, and
 * for the legal pages that have to publish a contact.
 *
 * ⚠️ THIS EXISTS BECAUSE THE ADDRESS WAS SPELLED OUT IN SIX PLACES. The footer,
 * the contact page, the terms, the privacy policy and a line of marketing prose
 * each held their own copy, and two centre-facing surfaces had drifted onto
 * invented addresses that reach nobody (`centers@engprogress.com`,
 * `sales@engprogress.com`). A centre that wrote to either got silence. Import
 * from here; never retype the value.
 *
 * NO "use client" ON PURPOSE. These are values, and a client module may export
 * a component to a server module but never a value — so the constants have to
 * live in a plain module that both sides can import.
 */

/** Every contact route lands here; there is no second inbox. */
export const CONTACT_EMAIL = "bahridnurullav@gmail.com";

/**
 * Display form, with the spacing a reader expects. The href builders below
 * strip it, so this is the only place the grouping is decided — change it here
 * and the `tel:` and WhatsApp links follow.
 */
export const CONTACT_PHONE = "+998 97 711 68 12";

export const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}`;

/** `tel:` keeps the leading `+`; WhatsApp's wa.me takes digits only. */
export const CONTACT_TEL_HREF = `tel:${CONTACT_PHONE.replace(/[^+0-9]/g, "")}`;
export const CONTACT_WHATSAPP_HREF = `https://wa.me/${CONTACT_PHONE.replace(/[^0-9]/g, "")}`;

/** Supplied by the owner with the contact details above (aaad474). */
export const INSTAGRAM_URL = "https://instagram.com/engprogress";
/** `@engprogress_bot` — it carries parent notifications and the staff assistant. */
export const TELEGRAM_URL = "https://t.me/engprogress_bot";

/**
 * The company's own accounts elsewhere: the footer's social discs, and the
 * Organization `sameAs` in every JSON-LD graph (`organization()` in lib/seo.ts),
 * which is how a search or answer engine learns that the account and the site
 * are one company.
 *
 * ⚠️ ONLY ACCOUNTS THE COMPANY OWNS. A `sameAs` tells every engine "we are that
 * page", so a guessed handle would merge us with a stranger. WhatsApp is left
 * out on purpose: wa.me is a chat with a phone number, not a profile.
 */
export const OFFICIAL_PROFILES = [INSTAGRAM_URL, TELEGRAM_URL] as const;
