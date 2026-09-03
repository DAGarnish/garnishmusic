import { getPayloadClient } from "./get-payload";

export type ContentCollection = "pages" | "products";

export type ContentSummary = {
  collection: ContentCollection;
  id: string | number;
  slug: string;
  title: string;
};

export type ContentDoc = ContentSummary & {
  content: string; // wpRawContent - the field that actually renders for legacy-path sites
};

const CONTENT_PREVIEW_CHARS = 6000;

/**
 * Every editable document on this admin's site, across both collections
 * that can hold visible content - Pages (course/landing pages) and
 * Products (where pricing/schedule text actually lives for some sites,
 * e.g. Miami's course products). Kept lightweight (no content body) so
 * this is cheap to hand to Claude as "here's what exists on this site."
 */
export async function listSiteContent(siteId: string | number): Promise<ContentSummary[]> {
  const payload = await getPayloadClient();

  const [pages, products] = await Promise.all([
    payload.find({
      collection: "pages",
      where: { site: { equals: siteId } },
      limit: 500,
      depth: 0,
    }),
    payload.find({
      collection: "products",
      where: { site: { equals: siteId } },
      limit: 500,
      depth: 0,
    }),
  ]);

  return [
    ...pages.docs.map((d) => ({
      collection: "pages" as const,
      id: d.id,
      slug: d.slug as string,
      title: (d.title as string) || d.slug,
    })),
    ...products.docs.map((d) => ({
      collection: "products" as const,
      id: d.id,
      slug: d.slug as string,
      title: (d.name as string) || d.slug,
    })),
  ];
}

/**
 * Fetches a document's current raw content, scoped to a specific site so
 * a slug from another city can never be read or edited even by mistake.
 * Truncated for the model's context - if a page is longer than this, an
 * edit near the end may fail to find its anchor text and should be
 * retried with a more specific instruction rather than silently guessing.
 */
export async function getDocumentContent(
  siteId: string | number,
  collection: ContentCollection,
  slug: string,
): Promise<ContentDoc | null> {
  const payload = await getPayloadClient();

  const result = await payload.find({
    collection,
    where: { and: [{ site: { equals: siteId } }, { slug: { equals: slug } }] },
    limit: 1,
    depth: 0,
  });

  const doc = result.docs[0];
  if (!doc) return null;

  const rawContent = (doc.wpRawContent as string) || "";

  return {
    collection,
    id: doc.id,
    slug: doc.slug as string,
    title: collection === "pages" ? (doc.title as string) || doc.slug : (doc.name as string) || doc.slug,
    content: rawContent.slice(0, CONTENT_PREVIEW_CHARS),
  };
}
