import { getPayload } from "payload";
import config from "../payload.config";

// Promotes site 24 (staging, mia's edited preview clone) to the live "mia"
// slug/domain, archiving the current live site 17 under "mia-old" first so
// the two never collide on the unique slug/domain fields. No documents are
// deleted or moved - every page/media/testimonial/etc doc keeps its own
// site relationship exactly as-is; only the two Sites docs' own slug/domain
// fields change. Reversible by swapping them back.
async function main() {
  const payload = await getPayload({ config });

  const oldMia = await payload.findByID({ collection: "sites", id: 17 });
  const staging = await payload.findByID({ collection: "sites", id: 24 });
  console.log("before:");
  console.log(`  site 17: slug=${(oldMia as any).slug} domain=${(oldMia as any).domain}`);
  console.log(`  site 24: slug=${(staging as any).slug} domain=${(staging as any).domain}`);

  // Step 1: move today's live mia out of the way first, so its "mia" slug/
  // domain are free before site 24 claims them (both fields are unique).
  await payload.update({
    collection: "sites",
    id: 17,
    data: { slug: "mia-old", domain: "mia-old.garnishmusicproduction.com" },
  });
  console.log("updated site 17 -> mia-old");

  // Step 2: promote staging to the now-free "mia" slug/domain.
  await payload.update({
    collection: "sites",
    id: 24,
    data: { slug: "mia", domain: "mia.garnishmusicproduction.com" },
  });
  console.log("updated site 24 -> mia");

  const oldMiaAfter = await payload.findByID({ collection: "sites", id: 17 });
  const stagingAfter = await payload.findByID({ collection: "sites", id: 24 });
  console.log("\nafter:");
  console.log(`  site 17: slug=${(oldMiaAfter as any).slug} domain=${(oldMiaAfter as any).domain}`);
  console.log(`  site 24: slug=${(stagingAfter as any).slug} domain=${(stagingAfter as any).domain}`);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
