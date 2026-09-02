import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });

  // Pages
  const [allMiaPages, allStagingPages] = await Promise.all([
    payload.find({ collection: "pages", where: { site: { equals: 17 } }, limit: 500, depth: 0 }),
    payload.find({ collection: "pages", where: { site: { equals: 24 } }, limit: 500, depth: 0 }),
  ]);
  const miaByWp = new Map((allMiaPages.docs as any[]).map((p) => [p.wpPostId, p]));
  console.log("\n=== differing pages ===");
  for (const sp of allStagingPages.docs as any[]) {
    const mp = miaByWp.get(sp.wpPostId);
    if (mp && mp.wpRawContent !== sp.wpRawContent) {
      console.log(`  wpPostId=${sp.wpPostId} slug=${sp.slug} title="${sp.title}" miaLen=${mp.wpRawContent?.length} stagingLen=${sp.wpRawContent?.length}`);
    }
  }

  // Hero sliders
  const [miaSliders, stagingSliders] = await Promise.all([
    payload.find({ collection: "hero-sliders", where: { site: { equals: 17 } }, limit: 20, depth: 0 }),
    payload.find({ collection: "hero-sliders", where: { site: { equals: 24 } }, limit: 20, depth: 0 }),
  ]);
  console.log("\n=== hero-sliders ===");
  for (const ss of stagingSliders.docs as any[]) {
    const ms = (miaSliders.docs as any[]).find((m) => m.alias === ss.alias);
    console.log(`  alias=${ss.alias} mia slides=${JSON.stringify(ms?.slides?.map((s: any) => s.image))} staging slides=${JSON.stringify(ss.slides?.map((s: any) => s.image))}`);
  }

  // Testimonials - compare by author+text since ids differ across the clone
  const [miaT, stagingT] = await Promise.all([
    payload.find({ collection: "testimonials", where: { site: { equals: 17 } }, limit: 200, depth: 0 }),
    payload.find({ collection: "testimonials", where: { site: { equals: 24 } }, limit: 200, depth: 0 }),
  ]);
  const miaTKeys = new Set((miaT.docs as any[]).map((t) => `${t.author}|${t.text}`));
  const stagingOnly = (stagingT.docs as any[]).filter((t) => !miaTKeys.has(`${t.author}|${t.text}`));
  console.log(`\n=== testimonials: mia=${miaT.totalDocs} staging=${stagingT.totalDocs} staging-only(new/edited)=${stagingOnly.length} ===`);
  for (const t of stagingOnly.slice(0, 20)) console.log(`  id=${t.id} author="${t.author}" text="${(t.text || "").slice(0, 60)}"`);

  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
