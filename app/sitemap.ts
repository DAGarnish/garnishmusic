import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getCurrentSite } from "../lib/current-site";
import { getPayloadClient } from "../lib/get-payload";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = await getCurrentSite();
  if (!site) return [];

  const headerList = await headers();
  const host = headerList.get("host") || site.domain;
  const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
  const base = `${protocol}://${host}`;

  const payload = await getPayloadClient();
  const [pages, posts, products] = await Promise.all([
    payload.find({ collection: "pages", where: { site: { equals: site.id } }, limit: 0, depth: 0 }),
    payload.find({ collection: "posts", where: { site: { equals: site.id } }, limit: 0, depth: 0 }),
    payload.find({ collection: "products", where: { site: { equals: site.id } }, limit: 0, depth: 0 }),
  ]);

  const entries: MetadataRoute.Sitemap = [{ url: `${base}/`, lastModified: new Date() }];

  for (const doc of [...pages.docs, ...posts.docs, ...products.docs] as any[]) {
    entries.push({
      url: `${base}/${doc.slug}/`,
      lastModified: doc.updatedAt ? new Date(doc.updatedAt) : undefined,
    });
  }

  return entries;
}
