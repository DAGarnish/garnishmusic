import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });

  // Are staging's Categories/Tags/Products truly separate doc IDs from mia's,
  // or does staging just not have independent tag docs at all (0 tags)?
  const [miaCats, stagingCats] = await Promise.all([
    payload.find({ collection: "categories", where: { site: { equals: 17 } }, limit: 200, depth: 0 }),
    payload.find({ collection: "categories", where: { site: { equals: 24 } }, limit: 200, depth: 0 }),
  ]);
  const miaCatIds = new Set((miaCats.docs as any[]).map((c) => c.id));
  const stagingCatIds = new Set((stagingCats.docs as any[]).map((c) => c.id));
  const overlap = [...stagingCatIds].filter((id) => miaCatIds.has(id));
  console.log(`categories: mia ids sample=${[...miaCatIds].slice(0,5)} staging ids sample=${[...stagingCatIds].slice(0,5)} overlapping-id-count=${overlap.length}`);

  // Products
  const [miaProd, stagingProd] = await Promise.all([
    payload.find({ collection: "products", where: { site: { equals: 17 } }, limit: 50, depth: 0 }),
    payload.find({ collection: "products", where: { site: { equals: 24 } }, limit: 50, depth: 0 }),
  ]);
  const miaProdIds = new Set((miaProd.docs as any[]).map((p) => p.id));
  const stagingProdIds = new Set((stagingProd.docs as any[]).map((p) => p.id));
  console.log(`products: mia ids sample=${[...miaProdIds].slice(0,5)} staging ids sample=${[...stagingProdIds].slice(0,5)} overlap=${[...stagingProdIds].filter(id=>miaProdIds.has(id)).length}`);

  // Does any OTHER site's pages/hero-sliders reference a media doc owned by site 17?
  // Sample: check hero-sliders across ALL sites for any slide.image that is one of mia's media ids
  const miaMedia = await payload.find({ collection: "media", where: { site: { equals: 17 } }, limit: 500, depth: 0 });
  const miaMediaIds = new Set((miaMedia.docs as any[]).map((m) => m.id));
  console.log(`\nmia media doc count=${miaMediaIds.size}, sample ids=${[...miaMediaIds].slice(0,10)}`);

  const allSliders = await payload.find({ collection: "hero-sliders", limit: 200, depth: 0 });
  for (const s of allSliders.docs as any[]) {
    const refsMiaMedia = (s.slides || []).filter((sl: any) => typeof sl.image === "number" && miaMediaIds.has(sl.image));
    if (refsMiaMedia.length > 0 && s.site !== 17) {
      console.log(`  hero-slider id=${s.id} site=${s.site} alias=${s.alias} references mia(site17)-owned media ids: ${refsMiaMedia.map((sl:any)=>sl.image)}`);
    }
  }

  // Also check other sites' Pages wpRawContent for /api/media/file/ referencing mia-owned filenames
  const miaMediaFilenames = new Set((miaMedia.docs as any[]).map((m: any) => m.filename).filter(Boolean));
  console.log(`\nmia media filename sample: ${[...miaMediaFilenames].slice(0,5)}`);

  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
