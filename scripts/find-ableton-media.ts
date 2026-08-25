import { getPayload } from "payload";
import configPromise from "../payload.config";

async function run() {
  const config = await configPromise;
  const payload = await getPayload({ config });

  const media = await payload.find({
    collection: "media",
    where: { filename: { like: "ableton" } },
    limit: 100,
    sort: "-createdAt",
  });
  console.log(`Found ${media.docs.length} media items matching "ableton":`);
  for (const m of media.docs as any[]) {
    console.log(m.id, m.filename, m.width, "x", m.height);
  }

  const sites = await payload.find({ collection: "sites", limit: 100 });
  const pdx = sites.docs.find((s: any) => s.slug === "pdx");
  const pages = await payload.find({
    collection: "pages",
    where: { and: [{ site: { equals: pdx!.id } }, { slug: { equals: "ableton-producer" } }] },
    limit: 1,
    depth: 1,
  });
  const doc: any = pages.docs[0];
  console.log("\ncurrent titleBackgroundImage:", doc?.titleBackgroundImage?.id, doc?.titleBackgroundImage?.filename);
  console.log("current featuredImage:", doc?.featuredImage?.id, doc?.featuredImage?.filename);

  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
