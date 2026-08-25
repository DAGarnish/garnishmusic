import { getPayload } from "payload";
import configPromise from "../payload.config";

async function run() {
  const config = await configPromise;
  const payload = await getPayload({ config });
  const sites = await payload.find({ collection: "sites", limit: 100 });

  for (const slug of ["ny", "pdx"]) {
    const site = sites.docs.find((s: any) => s.slug === slug);
    if (!site) { console.log(`${slug}: NOT FOUND`); continue; }
    const menu = site.mainMenu as any[];
    const about = menu?.find((item: any) => item.label === "About");
    console.log(`\n=== ${slug} "About" menu ===`);
    console.log(JSON.stringify(about, null, 2));
  }
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
