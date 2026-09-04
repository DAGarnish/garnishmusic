import { getPayload } from "payload";
import config from "../payload.config";

// Promotes site 28 (staging, edu's redesigned-homepage preview clone) to
// the live "edu" slug/domain, archiving the current live site 15 under
// "edu-2" first so the two never collide on the unique slug/domain fields.
// No documents are deleted or moved - every page/post/product/etc doc keeps
// its own site relationship exactly as-is; only the two Sites docs' own
// slug/domain fields change. Reversible by swapping them back. Same pattern
// as scripts/swap-mia-staging-slugs.ts, except edu's staging clone doesn't
// own all of its own page docs (see lib/modern-site-routes.ts's
// STAGING_ROUTES comment) - the matching code changes in
// app/(frontend)/[[...slug]]/page.tsx and friends split "is this the
// preview host" checks (staging -> edu) from "fetch the real underlying
// content" lookups (edu -> edu-2) accordingly, and must ship together with
// this script.
async function main() {
  const payload = await getPayload({ config });

  const oldEdu = await payload.findByID({ collection: "sites", id: 15 });
  const staging = await payload.findByID({ collection: "sites", id: 28 });
  console.log("before:");
  console.log(`  site 15: slug=${(oldEdu as any).slug} domain=${(oldEdu as any).domain}`);
  console.log(`  site 28: slug=${(staging as any).slug} domain=${(staging as any).domain}`);

  // Step 1: move today's live edu out of the way first, so its "edu"
  // slug/domain are free before site 28 claims them (both fields are unique).
  await payload.update({
    collection: "sites",
    id: 15,
    data: { slug: "edu-2", domain: "edu-2.garnishmusicproduction.com" },
  });
  console.log("updated site 15 -> edu-2");

  // Step 2: promote staging to the now-free "edu" slug/domain.
  await payload.update({
    collection: "sites",
    id: 28,
    data: { slug: "edu", domain: "edu.garnishmusicproduction.com" },
  });
  console.log("updated site 28 -> edu");

  const oldEduAfter = await payload.findByID({ collection: "sites", id: 15 });
  const stagingAfter = await payload.findByID({ collection: "sites", id: 28 });
  console.log("\nafter:");
  console.log(`  site 15: slug=${(oldEduAfter as any).slug} domain=${(oldEduAfter as any).domain}`);
  console.log(`  site 28: slug=${(stagingAfter as any).slug} domain=${(stagingAfter as any).domain}`);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
