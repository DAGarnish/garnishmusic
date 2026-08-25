import { getPayload } from "payload";
import configPromise from "../payload.config";

async function run() {
  const config = await configPromise;
  const payload = await getPayload({ config });
  const sites = await payload.find({ collection: "sites", limit: 100 });
  const edu = sites.docs.find((s: any) => s.slug === "edu");

  const cats = await payload.find({
    collection: "categories",
    where: { site: { equals: edu!.id } },
    limit: 200,
  });
  for (const c of cats.docs as any[]) {
    console.log(c.id, "|", c.title, "|", c.slug);
  }
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
