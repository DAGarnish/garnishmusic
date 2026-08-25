import { getPayload } from "payload";
import configPromise from "../payload.config";

async function run() {
  const config = await configPromise;
  const payload = await getPayload({ config });

  const media = await payload.find({
    collection: "media",
    where: { filename: { like: "fabfilter" } },
    limit: 50,
  });
  console.log(`Found ${media.docs.length} media items matching "fabfilter":`);
  for (const m of media.docs as any[]) {
    console.log(m.id, m.filename, m.url, m.width, "x", m.height);
  }

  // Also check current hero image fields on mixing-mastering / mastering pages
  const sites = await payload.find({ collection: "sites", limit: 100 });
  const pdx = sites.docs.find((s: any) => s.slug === "pdx");
  for (const slug of ["courses/mixing-mastering", "courses/mastering"]) {
    const pages = await payload.find({
      collection: "pages",
      where: { and: [{ site: { equals: pdx!.id } }, { slug: { equals: slug } }] },
      limit: 1,
      depth: 1,
    });
    const doc: any = pages.docs[0];
    console.log(`\n${slug}:`);
    console.log("titleBackgroundImage:", doc?.titleBackgroundImage?.filename, doc?.titleBackgroundImage?.url);
    console.log("featuredImage:", doc?.featuredImage?.filename, doc?.featuredImage?.url);
  }

  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
