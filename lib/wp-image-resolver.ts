import { getPayloadClient } from "./get-payload";
import type { ImageUrlResolver } from "../scripts/wp-shortcode-render";

export async function buildImageResolver(
  siteId: number | string,
  rawContent: string
): Promise<ImageUrlResolver> {
  const ids = new Set<string>();
  for (const m of (rawContent || "").matchAll(/\b(?:image|background_image)="(\d+)"/g)) {
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
