import type { SiteContent } from "@/data/site-content";

type Links = SiteContent["links"];

/** Strip anything besides digits and a leading +. Good for normalizing PT numbers. */
function digitsOnly(input: string, keepPlus = false): string {
  const sign = keepPlus && input.trim().startsWith("+") ? "+" : "";
  return sign + input.replace(/\D/g, "");
}

/** Convert raw E.164-ish phone into the digits wa.me expects (no `+`). */
export function normalizeWaPhone(raw: string): string {
  return digitsOnly(raw).replace(/^\+/, "");
}

/**
 * Build a WhatsApp click-to-chat URL using a raw international phone and
 * a pre-filled message (will be URL-encoded).
 */
export function buildWhatsAppHref(whatsappRaw: string, message: string): string {
  const phone = normalizeWaPhone(whatsappRaw);
  const text = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${text}`;
}

/** Build a `tel:` href from a raw international phone. */
export function buildPhoneHref(phoneRaw: string): string {
  return `tel:${phoneRaw.replace(/\s+/g, "")}`;
}

/** Build a `mailto:` href from an email address. */
export function buildEmailHref(email: string): string {
  return `mailto:${email}`;
}

/** Build the Google Maps *embed* URL for use in an `<iframe src>`. */
export function buildMapEmbedUrl(
  coords: string,
  hl = "pt-PT",
  z = 14,
): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(coords)}&hl=${hl}&z=${z}&output=embed`;
}

/** Build the Google Maps search URL — used for "open in Maps" links. */
export function buildMapSearchHref(coords: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(coords)}`;
}

/**
 * Convenience accessor: returns a typed object with everything already
 * resolved to a final href. Components consume this so they never have to
 * recompute the URL themselves.
 */
export function resolveLinks(links: Links) {
  return {
    phoneHref: buildPhoneHref(links.phoneRaw),
    emailHref: buildEmailHref(links.email),
    whatsAppHref: buildWhatsAppHref(links.whatsappRaw, links.whatsappMessage),
    mapEmbedUrl: buildMapEmbedUrl(links.mapCoords),
    mapSearchHref: buildMapSearchHref(links.mapCoords),
    orcamentoAnchor: links.orcamentoAnchor || "#orcamento",
    navAnchors: links.navAnchors ?? [],
    // Defensive coercion: localStorage may have corrupted data — only arrays are real.
    socials: Array.isArray(links.socials) ? links.socials : [],
  };
}
