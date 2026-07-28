import { getPayload } from "payload";
import config from "../payload.config";
import fs from "fs";
import path from "path";

// Fixes the ~100 confirmed wrong-image cases found by the media-mapping
// audit, all on the "www" site. Root cause (see audit report): www's
// original migrate-media.ts run corrupted a chunk of the WP-attachment ->
// Payload-media-doc mapping, so many pages' featuredImage/titleBackgroundImage
// point at a real Payload doc that just isn't the right photo. This script
// re-derives each page's *correct* image directly from the real WordPress
// upload files on disk (bypassing the corrupted .media-map.json entirely),
// uploads each unique correct image exactly once, and repoints the affected
// page fields directly.

const WORDPRESS_ROOT = "/home/abhises/Desktop/davemusic/garnishmusic-local/wordpress";
const REPORT_PATH = "/tmp/media-audit-highconfidence.json";

type BugEntry = {
  site: string;
  kind: string;
  slug: string;
  field: "featuredImage" | "titleBackgroundImage";
  oursFilename: string;
  oursWpAttachmentId: string;
  realWpAttachmentId?: number;
  realFilename?: string;
  realUrl?: string;
};

function mimeFromExt(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const map: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
  };
  return map[ext] || "application/octet-stream";
}

// Resolves a bug entry's *correct* target to a local filesystem path,
// independent of which blog it actually lives under - a few of these
// legitimately point cross-site at edu's own uploads (WP multisite allows
// referencing another blog's media by full URL), so this parses the actual
// URL/path rather than assuming blog 1.
function resolveLocalPath(entry: BugEntry): string | null {
  if (entry.realFilename) {
    return path.join(WORDPRESS_ROOT, "wp-content/uploads", entry.realFilename);
  }
  if (entry.realUrl) {
    if (entry.realUrl.includes("vangard.edge-themes.com")) return null; // no real fix possible
    const marker = "/wp-content/uploads/";
    const idx = entry.realUrl.indexOf(marker);
    if (idx === -1) return null;
    const rest = entry.realUrl.slice(idx + marker.length);
    return path.join(WORDPRESS_ROOT, "wp-content/uploads", rest);
  }
  return null;
}

async function main() {
  const payload = await getPayload({ config });

  const allBugs: BugEntry[] = JSON.parse(fs.readFileSync(REPORT_PATH, "utf-8"));
  const bugs = allBugs.filter((b) => b.site === "www.garnishmusicproduction.com");
  console.log(`${bugs.length} bug entries for www`);

  const sitesRes = await payload.find({ collection: "sites", where: { domain: { equals: "www.garnishmusicproduction.com" } }, limit: 1 });
  const wwwSite = sitesRes.docs[0];
  if (!wwwSite) throw new Error("www site not found");

  // Cache: local file path -> uploaded Payload media doc id (avoid
  // re-uploading the same correct image once per bug entry that needs it).
  const uploadedByPath = new Map<string, number | string>();

  let fixed = 0;
  let skippedNoFile = 0;
  let skippedPlaceholder = 0;
  let errors = 0;

  for (const bug of bugs) {
    const localPath = resolveLocalPath(bug);
    if (!localPath) {
      skippedPlaceholder += 1;
      console.log(`  SKIP (placeholder/unresolvable): ${bug.slug} [${bug.field}]`);
      continue;
    }

    try {
      let docId = uploadedByPath.get(localPath);
      if (docId === undefined) {
        if (!fs.existsSync(localPath)) {
          console.log(`  SKIP (file missing on disk): ${localPath}`);
          skippedNoFile += 1;
          continue;
        }
        const buffer = fs.readFileSync(localPath);
        const filename = path.basename(localPath);
        const doc = await payload.create({
          collection: "media",
          data: {
            alt: filename,
            site: wwwSite.id,
            wpAttachmentId: bug.realWpAttachmentId ?? undefined,
            wpSourceUrl: bug.realUrl ?? `https://www.garnishmusicproduction.com/wp-content/uploads/${bug.realFilename}`,
          },
          file: { data: buffer, mimetype: mimeFromExt(localPath), name: filename, size: buffer.length },
        });
        docId = doc.id;
        uploadedByPath.set(localPath, docId);
        console.log(`  uploaded ${filename} -> media #${docId}`);
      }

      const pageRes = await payload.find({
        collection: "pages",
        where: { and: [{ site: { equals: wwwSite.id } }, { slug: { equals: bug.slug } }] },
        limit: 1,
      });
      const pageDoc = pageRes.docs[0];
      if (!pageDoc) {
        console.log(`  SKIP (page not found): ${bug.slug}`);
        continue;
      }

      await payload.update({
        collection: "pages",
        id: pageDoc.id,
        data: { [bug.field]: docId },
      });
      fixed += 1;
      console.log(`  fixed ${bug.slug} [${bug.field}] -> media #${docId}`);
    } catch (err) {
      errors += 1;
      console.log(`  ERROR on ${bug.slug} [${bug.field}]: ${(err as Error).message.slice(0, 200)}`);
    }
  }

  console.log(`\nDONE. fixed=${fixed} skippedNoFile=${skippedNoFile} skippedPlaceholder=${skippedPlaceholder} errors=${errors} uniqueUploads=${uploadedByPath.size}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
