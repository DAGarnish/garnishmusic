import { getPayload } from "payload";
import config from "../payload.config";

// proxy.ts resolves the live "mia" domain to site 24 now (see
// scripts/swap-mia-staging-slugs.ts), but mia's real 301 redirects are
// still tagged site: 17 (the archived mia-old) - so none of them currently
// fire on the live domain. Re-points every one of those existing docs'
// own `site` field from 17 to 24 rather than deleting/duplicating them, so
// they follow the live "mia" identity the same way the slug/domain swap
// did. Leaves site 24's own pre-existing single placeholder redirect (a
// staging-only doc, not one of mia's real ones) alone.
async function main() {
  const payload = await getPayload({ config });

  const before = await payload.find({ collection: "redirects", where: { site: { equals: 17 } }, limit: 500, depth: 0 });
  console.log(`redirects currently on site 17: ${before.totalDocs}`);

  let moved = 0;
  for (const doc of before.docs as any[]) {
    await payload.update({ collection: "redirects", id: doc.id, data: { site: 24 } });
    moved++;
  }
  console.log(`moved ${moved} redirects from site 17 -> site 24`);

  const after17 = await payload.find({ collection: "redirects", where: { site: { equals: 17 } }, limit: 0, depth: 0 });
  const after24 = await payload.find({ collection: "redirects", where: { site: { equals: 24 } }, limit: 0, depth: 0 });
  console.log(`after: site 17=${after17.totalDocs} site 24=${after24.totalDocs}`);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
