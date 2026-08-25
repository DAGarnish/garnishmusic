import { getPayload } from "payload";
import configPromise from "../payload.config";

async function run() {
  const config = await configPromise;
  const payload = await getPayload({ config });
  const sites = await payload.find({ collection: "sites", limit: 100 });
  const pdx = sites.docs.find((s: any) => s.slug === "pdx");

  const pages = await payload.find({
    collection: "pages",
    where: { and: [{ site: { equals: pdx!.id } }, { slug: { like: "courses/" } }] },
    limit: 100,
    depth: 0,
  });
  console.log("=== COURSE PAGE SLUGS ===");
  console.log(pages.docs.map((p: any) => p.slug));

  const first: any = pages.docs.find((p: any) => p.slug === "courses/ableton-live") || pages.docs[0];
  console.log("=== SAMPLE PAGE:", first?.slug, "===");
  console.log("fields:", Object.keys(first || {}));
  console.log("title/status/featuredImage/titleBackgroundImage:", first?.title, first?.status, !!first?.featuredImage, !!first?.titleBackgroundImage);
  console.log("wpRawContent length:", first?.wpRawContent?.length);
  console.log("--- wpRawContent (first 6000 chars) ---");
  console.log((first?.wpRawContent || "").slice(0, 6000));
  console.log("--- layout field ---");
  console.log(JSON.stringify(first?.layout, null, 2)?.slice(0, 2000));

  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
