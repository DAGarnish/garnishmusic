// Pulls structured contact details out of a migrated WPBakery shortcode
// string (page.wpRawContent) for the modern contact page. Same principle as
// modern-homepage-content.ts: read the real CMS content rather than
// hardcoding copy, so editing the page's content in Payload admin (or
// re-running the WP migration) keeps this page in sync.
export type ContactDetails = {
  address: string | null;
  phone: string | null;
  ctaText: string | null;
  ctaLink: string | null;
  mapEmbedSrc: string | null;
};

function shortcodeAttr(shortcodeTag: string, iconMatch: string, raw: string): string | null {
  const re = new RegExp(
    `\\[${shortcodeTag}[^\\]]*fe_icon="${iconMatch}"[^\\]]*title="([^"]*)"`,
    "i"
  );
  return raw.match(re)?.[1] ?? null;
}

export function extractContactDetails(wpRawContent: string): ContactDetails {
  const raw = wpRawContent || "";

  const address = shortcodeAttr("mkd_icon_list_item", "icon_pushpin_alt", raw);
  const phone = shortcodeAttr("mkd_icon_list_item", "icon_phone", raw);

  const buttonMatch = raw.match(/\[mkd_button[^\]]*text="([^"]*)"[^\]]*link="([^"]*)"/i);
  const ctaText = buttonMatch?.[1] ?? null;
  const ctaLink = buttonMatch?.[2] ?? null;

  let mapEmbedSrc: string | null = null;
  const rawHtmlMatch = raw.match(/\[vc_raw_html[^\]]*\]([\s\S]*?)\[\/vc_raw_html\]/i);
  if (rawHtmlMatch) {
    try {
      const decoded = decodeURIComponent(Buffer.from(rawHtmlMatch[1], "base64").toString("utf-8"));
      mapEmbedSrc = decoded.match(/src="([^"]*)"/i)?.[1] ?? null;
    } catch {
      mapEmbedSrc = null;
    }
  }

  return { address, phone, ctaText, ctaLink, mapEmbedSrc };
}

// edu's real /connect/ page ("Hello!") is a different shape entirely from
// every per-city contact page extractContactDetails above handles - no
// address/phone/map, just a raw <iframe> embedding a Google Form (plus a
// "Some of our partners" block already covered elsewhere by ModernPartners,
// so not extracted here) - see ModernEduContactPage.
export function extractGoogleFormSrc(wpRawContent: string): string | null {
  const raw = wpRawContent || "";
  return raw.match(/<iframe[^>]*\bsrc="(https:\/\/docs\.google\.com\/forms\/[^"]*)"/i)?.[1] ?? null;
}
