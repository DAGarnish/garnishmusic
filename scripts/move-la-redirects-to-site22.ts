import { getPayload } from "payload";
import config from "../payload.config";

// Same bug as mia's (see scripts/move-mia-redirects-to-site24.ts): la's
// real 301 redirects were left tagged site: 16 (la-old) when la's own
// staging-clone cutover to site 22 happened on 2026-08-25, so none of them
// have fired on the live la.garnishmusicproduction.com domain since - a
// live URL now 404s or falls through to the plain trailing-slash 308
// instead of reaching its real destination. Re-points those existing
// docs' own site field from 16 to 22 rather than deleting/duplicating
// them. site 22 currently has zero redirects of its own, so there's no
// overlap to worry about.
async function main() {
  const payload = await getPayload({ config });

  const before = await payload.find({ collection: "redirects", where: { site: { equals: 16 } }, limit: 500, depth: 0 });
  console.log(`redirects currently on site 16 (la-old): ${before.totalDocs}`);

  let moved = 0;
  for (const doc of before.docs as any[]) {
    await payload.update({ collection: "redirects", id: doc.id, data: { site: 22 } });
    moved++;
  }
  console.log(`moved ${moved} redirects from site 16 -> site 22`);

  const after16 = await payload.find({ collection: "redirects", where: { site: { equals: 16 } }, limit: 0, depth: 0 });
  const after22 = await payload.find({ collection: "redirects", where: { site: { equals: 22 } }, limit: 0, depth: 0 });
  console.log(`after: site 16=${after16.totalDocs} site 22=${after22.totalDocs}`);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
