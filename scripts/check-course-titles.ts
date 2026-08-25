import { getPayload } from "payload";
import configPromise from "../payload.config";

async function run() {
  const config = await configPromise;
  const payload = await getPayload({ config });
  const sites = await payload.find({ collection: "sites", limit: 100 });
  const pdx = sites.docs.find((s: any) => s.slug === "pdx");

  const pages = await payload.find({
    collection: "pages",
    where: { site: { equals: pdx!.id } },
    limit: 300,
    depth: 0,
  });
  const bad = pages.docs.filter((d: any) => d.title && !/portland/i.test(d.title) && /\|/.test(d.title));
  console.log("Titles with a | but NOT Portland:");
  for (const d of bad as any[]) console.log(d.slug, "->", d.title);

  console.log("\nAll course/program titles (for sanity check):");
  for (const d of pages.docs as any[]) {
    if (d.slug.startsWith("courses/") || ["academy", "ableton-producer", "logic-producer", "private-instruction"].includes(d.slug)) {
      console.log(d.slug, "->", d.title);
    }
  }
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
