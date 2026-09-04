import { getPayload } from "payload";
import config from "../payload.config";

// Rewrites every literal "/api/media/file/<filename>" URL baked into
// wpRawContent (pages/products) to point straight at S3 instead - that
// path only ever 307-redirects there anyway (see next.config.ts's own
// redirects(), and payload.config.ts's disablePayloadAccessControl for the
// same fix applied to dynamically-read media fields). Confirmed via
// scripts/count-hardcoded-media-file-urls.ts: 4676 URLs across 831 pages,
// 13 across 4 products - each one currently costs a wasted redirect round
// trip on every pageview.
//
// Pass --write to actually apply; with no args this only reports what
// would change (first 5 sample rewrites per collection), so the pattern
// can be sanity-checked against real content before touching 835 docs.

const RE = /\/api\/media\/file\/([^\s"'\)]+)/g;
const REPLACEMENT = "https://s3.us-east-2.amazonaws.com/garnishmusic-media/$1";

async function processCollection(payload: any, collection: string, write: boolean) {
  let page = 1;
  let docsChanged = 0;
  let urlsChanged = 0;
  let samplesShown = 0;
  for (;;) {
    const res = await payload.find({ collection, limit: 200, page, depth: 0 });
    for (const doc of res.docs as any[]) {
      const raw = doc.wpRawContent as string | undefined;
      if (!raw) continue;
      const matches = raw.match(RE);
      if (!matches || matches.length === 0) continue;
      const updated = raw.replace(RE, REPLACEMENT);
      docsChanged++;
      urlsChanged += matches.length;
      if (samplesShown < 5) {
        const before = matches[0];
        const after = before.replace(RE, REPLACEMENT);
        console.log(`  [${collection}] id=${doc.id} slug=${doc.slug} example: ${before} -> ${after}`);
        samplesShown++;
      }
      if (write) {
        await payload.update({ collection, id: doc.id, data: { wpRawContent: updated }, depth: 0 });
      }
    }
    if (!res.hasNextPage) break;
    page++;
  }
  return { docsChanged, urlsChanged };
}

async function main() {
  const write = process.argv.includes("--write");
  const payload = await getPayload({ config });

  console.log(write ? "WRITING changes..." : "DRY RUN (pass --write to apply)");
  console.log("");

  const pages = await processCollection(payload, "pages", write);
  console.log(`pages: ${pages.docsChanged} docs, ${pages.urlsChanged} urls`);

  const products = await processCollection(payload, "products", write);
  console.log(`products: ${products.docsChanged} docs, ${products.urlsChanged} urls`);

  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
