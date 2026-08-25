import { getPayload } from "payload";
import configPromise from "../payload.config";

async function run() {
  const config = await configPromise;
  const payload = await getPayload({ config });
  const sites = await payload.find({ collection: "sites", limit: 100 });
  const pdx = sites.docs.find((s: any) => s.slug === "pdx");

  const sliders = await payload.find({
    collection: "hero-sliders",
    where: { site: { equals: pdx!.id } },
    limit: 20,
    depth: 1,
  });
  for (const s of sliders.docs as any[]) {
    console.log(`--- alias: ${s.alias} (${s.slides?.length ?? 0} slides) ---`);
    for (const slide of s.slides || []) {
      console.log("  image:", typeof slide.image === "object" ? slide.image?.url : slide.image);
      for (const l of slide.layers || []) {
        console.log("    layer text:", l.text);
      }
    }
  }
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
