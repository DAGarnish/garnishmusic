import { getPayload } from "payload";
import config from "../payload.config";

// Finds every Pages/Products doc whose wpRawContent still points at an
// absolute *.garnishmusicproduction.com/wp-content/uploads/... URL instead
// of the migrated /api/media/file/... path - the same bug class that broke
// the NY electronic-dj-class page's background images once that site's
// domain started being served by this app instead of the old WordPress.
// Any site whose domain hasn't cut over yet is not currently broken, but
// will break the same way the moment it does, so this reports every match
// regardless of site.

const URL_RE = /https?:\/\/[a-z0-9.-]*garnishmusicproduction\.com\/wp-content\/uploads\/[^\s"'\)]+/gi;

async function collectMediaBySourceUrl(payload: any) {
  const map = new Map<string, string>();
  let page = 1;
  for (;;) {
    const res = await payload.find({ collection: "media", limit: 500, page, depth: 0 });
    for (const doc of res.docs) {
      if (doc.wpSourceUrl) map.set(doc.wpSourceUrl, doc.url);
    }
    if (!res.hasNextPage) break;
    page++;
  }
  return map;
}

async function auditCollection(payload: any, collection: "pages" | "products", mediaBySource: Map<string, string>) {
  let page = 1;
  const results: { id: number; site: number; slug: string; matches: { raw: string; withoutQuery: string; resolved: string | null }[] }[] = [];
  for (;;) {
    const res = await payload.find({ collection, limit: 200, page, depth: 0 });
    for (const doc of res.docs) {
      const raw = doc.wpRawContent as string | undefined;
      if (!raw) continue;
      const found = [...raw.matchAll(URL_RE)].map((m) => m[0]);
      if (found.length === 0) continue;
      const matches = found.map((raw) => {
        const withoutQuery = raw.split("?")[0];
        const resolved = mediaBySource.get(raw) || mediaBySource.get(withoutQuery) || null;
        return { raw, withoutQuery, resolved };
      });
      results.push({ id: doc.id, site: doc.site, slug: doc.slug, matches });
    }
    if (!res.hasNextPage) break;
    page++;
  }
  return results;
}

async function main() {
  const payload = await getPayload({ config });
  const mediaBySource = await collectMediaBySourceUrl(payload);
  console.log("media docs with wpSourceUrl:", mediaBySource.size);

  const pagesResults = await auditCollection(payload, "pages", mediaBySource);
  const productsResults = await auditCollection(payload, "products", mediaBySource);

  const all = [...pagesResults.map((r) => ({ ...r, collection: "pages" })), ...productsResults.map((r) => ({ ...r, collection: "products" }))];

  const totalUrls = all.reduce((sum, r) => sum + r.matches.length, 0);
  const resolvedUrls = all.reduce((sum, r) => sum + r.matches.filter((m) => m.resolved).length, 0);
  const unresolvedUrls = totalUrls - resolvedUrls;

  console.log(`docs affected: ${all.length}`);
  console.log(`total stale urls: ${totalUrls} (resolved: ${resolvedUrls}, unresolved: ${unresolvedUrls})`);
  console.log("");

  for (const r of all) {
    console.log(`[${r.collection}] id=${r.id} site=${r.site} slug=${r.slug}`);
    for (const m of r.matches) {
      console.log(`  ${m.resolved ? "OK  " : "MISS"} ${m.raw} ${m.resolved ? "-> " + m.resolved : "(no media match)"}`);
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
