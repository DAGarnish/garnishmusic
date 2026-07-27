import { getPayloadClient } from "./get-payload";
import type { ImageUrlResolver } from "../scripts/wp-shortcode-render";

export async function buildImageResolver(
  siteId: number | string,
  rawContent: string
): Promise<ImageUrlResolver> {
  // Matches any attribute ending in "image" (image=, background_image=,
  // parallax_background_image=, ...). A stricter alternation with \b missed
  // parallax_background_image= entirely: \b requires a boundary before
  // "background_image", but "_" is a word character, so there's no boundary
  // between "parallax_" and "background_image" - that id was never even
  // queried, silently dropping every parallax row's background image.
  const ids = new Set<string>();
  for (const m of (rawContent || "").matchAll(/\w*image="(\d+)"/g)) {
    ids.add(m[1]);
  }

  const map = new Map<string, string>();
  if (ids.size > 0) {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: "media",
      where: {
        and: [{ site: { equals: siteId } }, { wpAttachmentId: { in: [...ids].map(Number) } }],
      },
      limit: ids.size,
    });
    for (const doc of result.docs) {
      if (doc.wpAttachmentId != null && doc.url) {
        map.set(String(doc.wpAttachmentId), doc.url);
      }
    }
  }

  return (wpAttachmentId: string) => map.get(wpAttachmentId);
}
