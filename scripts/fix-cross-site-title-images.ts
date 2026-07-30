import { getPayload } from "payload";
import config from "../payload.config";
import fs from "fs";
import { getWpConnection, tablePrefixForBlog, BASE_PREFIX } from "./wp-db";
import { buildAttachmentIndex, resolveAttachmentIdFromUrl } from "./wp-media";

// WordPress multisite lets an editor pick a title-area background image
// from ANY site's media library, not just the current one, and it renders
// fine live (WP just serves whatever URL is in the meta value). The
// original migration's image resolver only ever checked the CURRENT site's
// own attachment table, so every one of these cross-site references
// silently failed to resolve and the page fell back to no hero image at
// all (confirmed against production - edu's /courses/songwriting-course/
// pulls its hero from ny's media library). This backfills them by
// resolving through whichever site's attachment table the URL's domain
// actually points to, reusing that site's already-migrated (already in
// S3) Payload media record - never re-uploads anything.

type MediaMap = Record<string, Record<string, number | string>>;

async function main() {
  const payload = await getPayload({ config });
  const conn = await getWpConnection();
  const mediaMap: MediaMap = JSON.parse(fs.readFileSync("./scripts/.media-map.json", "utf-8"));

  const allSites = await payload.find({ collection: "sites", limit: 100 });
  const [blogs]: any = await conn.query(`SELECT blog_id, domain FROM ${BASE_PREFIX}blogs ORDER BY blog_id`);
  const networkDomains = new Set((blogs as any[]).map((b: any) => b.domain));
  const blogIdByDomain = new Map((blogs as any[]).map((b: any) => [b.domain, b.blog_id]));

  // Lazily-built, cached per source domain so a popular shared image (like
  // ny's free-class-header.jpg) only costs one query no matter how many
  // other sites/pages reference it.
  const attachmentIndexCache = new Map<string, Map<string, number>>();
  async function getByFilenameKey(domain: string) {
    if (!attachmentIndexCache.has(domain)) {
      const prefix = tablePrefixForBlog(blogIdByDomain.get(domain));
      const { byFilenameKey } = await buildAttachmentIndex(conn, prefix);
      attachmentIndexCache.set(domain, byFilenameKey);
    }
    return attachmentIndexCache.get(domain)!;
  }

  let fixed = 0;
  let alreadySet = 0;
  let externalDomain = 0;
  let unresolved = 0;
  let notFoundInPayload = 0;

  for (const blog of blogs as any[]) {
    const prefix = tablePrefixForBlog(blog.blog_id);
    const site = allSites.docs.find((s: any) => s.domain === blog.domain);
    if (!site) continue;

    const [allRows]: any = await conn.query(
      `SELECT p.ID, p.post_type, pm.meta_value
       FROM ${prefix}posts p
       JOIN ${prefix}postmeta pm ON pm.post_id = p.ID
       WHERE pm.meta_key IN ('mkd_title_area_background_image_meta','edgtf_title_area_background_image_meta')
       AND pm.meta_value != ''
       AND p.post_status = 'publish'`
    );
    const seenPostIds = new Set<number>();
    const rows = (allRows as any[]).filter((r) => {
      if (seenPostIds.has(r.ID)) return false;
      seenPostIds.add(r.ID);
      return true;
    });

    console.log(`--- ${blog.domain}: ${rows.length} candidate rows ---`);
    for (const row of rows as any[]) {
      const url: string = row.meta_value;
      const m = url.match(/^https?:\/\/([^/]+)\//);
      const urlDomain = m ? m[1] : null;
      if (!urlDomain || urlDomain === blog.domain) continue; // not cross-site
      if (!networkDomains.has(urlDomain)) {
        externalDomain++;
        continue;
      }

      const collection = row.post_type === "post" ? "posts" : "pages";
      const existing = await payload.find({
        collection,
        where: { and: [{ site: { equals: site.id } }, { wpPostId: { equals: row.ID } }] },
        limit: 1,
      });
      if (existing.docs.length === 0) continue;
      const doc: any = existing.docs[0];
      if (doc.titleBackgroundImage) {
        alreadySet++;
        continue;
      }

      const byFilenameKey = await getByFilenameKey(urlDomain);
      const wpAttachmentId = resolveAttachmentIdFromUrl(url, byFilenameKey);
      if (wpAttachmentId === undefined) {
        unresolved++;
        continue;
      }
      const payloadMediaId = (mediaMap[urlDomain] || {})[wpAttachmentId];
      if (payloadMediaId === undefined) {
        notFoundInPayload++;
        continue;
      }

      try {
        await payload.update({ collection, id: doc.id, data: { titleBackgroundImage: payloadMediaId } });
        fixed++;
      } catch (err) {
        console.log(`  ERROR (${collection}/${doc.id}): ${(err as Error).message.slice(0, 200)}`);
      }
    }
    console.log(`  running totals:`, { fixed, alreadySet, externalDomain, unresolved, notFoundInPayload });
  }

  console.log("FINAL:", { fixed, alreadySet, externalDomain, unresolved, notFoundInPayload });
  await conn.end();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
