import { getPayload } from "payload";
import config from "../payload.config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getWpConnection, tablePrefixForBlog, BASE_PREFIX } from "./wp-db";
import { buildAttachmentIndex, findReferencedAttachmentIds } from "./wp-media";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const WORDPRESS_ROOT = "/home/abhises/Desktop/davemusic/garnishmusic-local/wordpress";
const MAP_FILE = path.resolve(dirname, ".media-map.json");

function uploadsPathForBlog(blogId: number, attachedFile: string): string {
  if (blogId === 1) {
    return path.join(WORDPRESS_ROOT, "wp-content/uploads", attachedFile);
  }
  return path.join(WORDPRESS_ROOT, "wp-content/uploads/sites", String(blogId), attachedFile);
}

function mimeFromExt(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const map: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".pdf": "application/pdf",
  };
  return map[ext] || "application/octet-stream";
}

async function main() {
  const payload = await getPayload({ config });
  const conn = await getWpConnection();

  const onlyDomain = process.argv[2];
  const allSites = await payload.find({ collection: "sites", limit: 100 });
  const sites = onlyDomain
    ? { docs: allSites.docs.filter((s) => s.domain === onlyDomain) }
    : allSites;

  // mediaMap: { [domain]: { [wpAttachmentId]: payloadMediaId } }
  const mediaMap: Record<string, Record<number, number | string>> = fs.existsSync(MAP_FILE)
    ? JSON.parse(fs.readFileSync(MAP_FILE, "utf-8"))
    : {};
  let totalMigrated = 0;
  let totalSkipped = 0;
  let totalAlreadyDone = 0;

  for (const site of sites.docs) {
    const blogId = site.wpBlogId as number;
    const prefix = tablePrefixForBlog(blogId);
    console.log(`\n=== ${site.domain} (blog ${blogId}) ===`);

    const { byId, byFilenameKey } = await buildAttachmentIndex(conn, prefix);
    const validIds = new Set(byId.keys());
    const referenced = await findReferencedAttachmentIds(conn, prefix, byFilenameKey, validIds);

    console.log(`  ${byId.size} total attachments, ${referenced.size} referenced & valid`);

    if (!mediaMap[site.domain]) mediaMap[site.domain] = {};

    for (const attachmentId of referenced) {
      if (mediaMap[site.domain][attachmentId] !== undefined) {
        totalAlreadyDone += 1;
        continue;
      }

      const info = byId.get(attachmentId)!;
      const filePath = uploadsPathForBlog(blogId, info.attachedFile);

      if (!fs.existsSync(filePath)) {
        console.log(`  SKIP (file missing): ${info.attachedFile}`);
        totalSkipped += 1;
        continue;
      }

      try {
        const buffer = fs.readFileSync(filePath);
        const filename = path.basename(filePath);
        const doc = await payload.create({
          collection: "media",
          data: {
            alt: info.title || filename,
            site: site.id,
            wpAttachmentId: attachmentId,
            wpSourceUrl: info.guid,
          },
          file: {
            data: buffer,
            mimetype: mimeFromExt(filePath),
            name: filename,
            size: buffer.length,
          },
        });
        mediaMap[site.domain][attachmentId] = doc.id;
        totalMigrated += 1;
      } catch (err) {
        console.log(`  ERROR uploading ${info.attachedFile}: ${(err as Error).message}`);
        totalSkipped += 1;
      }
    }

    console.log(`  Migrated ${Object.keys(mediaMap[site.domain]).length} media items`);
    fs.writeFileSync(MAP_FILE, JSON.stringify(mediaMap, null, 2));
  }

  await conn.end();
  console.log(`\nDONE. Newly migrated: ${totalMigrated}, already done: ${totalAlreadyDone}, skipped: ${totalSkipped}`);
  console.log(`Media map saved to ${MAP_FILE}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
