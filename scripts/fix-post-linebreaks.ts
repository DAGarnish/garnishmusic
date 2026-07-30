import { getPayload } from "payload";
import config from "../payload.config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getWpConnection, tablePrefixForBlog, BASE_PREFIX } from "./wp-db";
import { buildAttachmentIndex, resolveAttachmentIdFromUrl } from "./wp-media";
import { wpContentToLexical } from "./wp-content-to-lexical";
import type { MediaResolver } from "./html-to-lexical";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const MAP_FILE = path.resolve(dirname, ".media-map.json");

type MediaMap = Record<string, Record<string, number | string>>;

// A post_content is affected by the wpautop migration bug (fixed in
// html-to-lexical.ts / wp-shortcode-render.ts) if a vc_column_text block
// contains a blank-line-separated "paragraph" that was never wrapped in a
// real <p> tag - i.e. it was relying on WordPress's wpautop() to add the
// break at render time, which nothing in this migration replicated before.
// Confirmed against production (e.g. /privacy-policy/'s numbered sections
// and lettered sub-points, which are each their own <p> live) - 827
// pages/portfolio-items self-heal via the wp-shortcode-render.ts fix since
// they render live from wpRawContent, but the 219 affected `posts` bake
// their content into a Lexical field at migration time and needed this
// one-off reprocessing pass.
function isAffected(content: string): boolean {
  const blocks = content.split(/\[vc_column_text[^\]]*\]/).slice(1);
  return blocks.some((b) => {
    const body = b.split("[/vc_column_text]")[0];
    return /\r?\n\s*\r?\n/.test(body) && !/<p[ >]/.test(body);
  });
}

async function main() {
  const payload = await getPayload({ config });
  const conn = await getWpConnection();
  const mediaMap: MediaMap = JSON.parse(fs.readFileSync(MAP_FILE, "utf-8"));

  const allSites = await payload.find({ collection: "sites", limit: 100 });
  const [blogs]: any = await conn.query(`SELECT blog_id, domain FROM ${BASE_PREFIX}blogs ORDER BY blog_id`);

  let totalFixed = 0;
  let totalErrors = 0;

  for (const blog of blogs as any[]) {
    const site = allSites.docs.find((s) => s.domain === blog.domain);
    if (!site) continue;

    const prefix = tablePrefixForBlog(blog.blog_id);
    const [posts]: any = await conn.query(
      `SELECT ID, post_title, post_content FROM ${prefix}posts WHERE post_type = 'post' AND post_status = 'publish' AND post_content LIKE '%vc_column_text%'`
    );

    const affected = (posts as any[]).filter((p) => isAffected(p.post_content));
    if (affected.length === 0) continue;

    const { byFilenameKey } = await buildAttachmentIndex(conn, prefix);
    const siteMediaMap = mediaMap[site.domain] || {};
    const mediaResolver: MediaResolver = (srcOrMarker: string) => {
      let wpId: number | undefined;
      if (srcOrMarker.startsWith("__wpid__")) {
        wpId = parseInt(srcOrMarker.replace("__wpid__", ""), 10);
      } else {
        wpId = resolveAttachmentIdFromUrl(srcOrMarker, byFilenameKey);
      }
      if (wpId === undefined) return undefined;
      return siteMediaMap[wpId];
    };

    console.log(`\n=== ${site.domain}: ${affected.length} affected posts ===`);

    for (const p of affected) {
      const existing = await payload.find({
        collection: "posts",
        where: { and: [{ site: { equals: site.id } }, { wpPostId: { equals: p.ID } }] },
        limit: 1,
      });
      if (existing.docs.length === 0) {
        console.log(`  SKIP (not found in Payload): ${p.post_title}`);
        continue;
      }
      try {
        const content = wpContentToLexical(p.post_content, mediaResolver);
        await payload.update({ collection: "posts", id: existing.docs[0].id, data: { content } });
        totalFixed++;
      } catch (err) {
        totalErrors++;
        console.log(`  ERROR (${p.post_title}): ${(err as Error).message.slice(0, 200)}`);
      }
    }
  }

  console.log(`\nDONE. Fixed ${totalFixed} posts, ${totalErrors} errors.`);
  await conn.end();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
