import { getPayload } from "payload";
import config from "../payload.config";
import { getWpConnection, tablePrefixForBlog } from "./wp-db";
import https from "https";
import http from "http";

// The theme's title-area banner falls back to a site-wide default image
// when a page has no title image of its own (Buro theme option
// "title_area_background_image", stored in wp_options as mkd_options_buro -
// NOT page postmeta, which is all the original page migration ever read).
// Missing this fallback meant every page without its own title image
// showed a bare title bar instead of the real default studio photo
// (confirmed against production - bcn's /uk-a-level-3-course/).
function extractBuroOption(serialized: string, key: string): string | undefined {
  const marker = `"${key}";s:`;
  const idx = serialized.indexOf(marker);
  if (idx === -1) return undefined;
  const m = serialized.slice(idx).match(new RegExp(`^"${key}";s:(\\d+):"`));
  if (!m) return undefined;
  const start = idx + m[0].length;
  const value = serialized.slice(start, start + Number(m[1]));
  return value || undefined;
}

function downloadBuffer(url: string): Promise<Buffer> {
  const lib = url.startsWith("https") ? https : http;
  return new Promise((resolve, reject) => {
    lib
      .get(url, { rejectUnauthorized: false }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          downloadBuffer(res.headers.location).then(resolve, reject);
          return;
        }
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      })
      .on("error", reject);
  });
}

async function main() {
  const payload = await getPayload({ config });
  const conn = await getWpConnection();

  const sites = await payload.find({ collection: "sites", limit: 100 });
  let updated = 0;

  for (const site of sites.docs) {
    const blogId = site.wpBlogId as number | undefined;
    if (!blogId) {
      console.log(`${site.domain}: skipped (no wpBlogId)`);
      continue;
    }
    const prefix = tablePrefixForBlog(blogId);

    let imageUrl: string | undefined;
    try {
      const [rows] = await conn.query<any[]>(
        `SELECT option_value FROM ${prefix}options WHERE option_name = 'mkd_options_buro' LIMIT 1;`
      );
      const serialized = (rows as any[])[0]?.option_value;
      imageUrl = serialized ? extractBuroOption(serialized, "title_area_background_image") : undefined;
    } catch (err) {
      console.log(`${site.domain}: SKIP (${(err as Error).message.slice(0, 100)})`);
      continue;
    }

    if (!imageUrl) {
      console.log(`${site.domain}: no default title background set`);
      continue;
    }

    try {
      const existing = await payload.find({
        collection: "media",
        where: { wpSourceUrl: { equals: imageUrl } },
        limit: 1,
      });
      let mediaId: number | string;
      if (existing.docs[0]) {
        mediaId = existing.docs[0].id;
      } else {
        const buffer = await downloadBuffer(imageUrl);
        const filename = decodeURIComponent(imageUrl.split("/").pop() || `title-bg-${site.id}.jpg`);
        const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
        const mimetype = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
        const created = await payload.create({
          collection: "media",
          data: { alt: "Default title background", site: site.id, wpSourceUrl: imageUrl },
          file: { data: buffer, mimetype, name: filename, size: buffer.length },
        });
        mediaId = created.id;
      }
      await payload.update({ collection: "sites", id: site.id, data: { defaultTitleBackgroundImage: mediaId } });
      updated += 1;
      console.log(`${site.domain}: set default title background -> ${imageUrl}`);
    } catch (err) {
      console.log(`${site.domain}: FAILED (${(err as Error).message.slice(0, 150)})`);
    }
  }

  await conn.end();
  console.log(`\nDONE. Updated ${updated}/${sites.docs.length} sites.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
