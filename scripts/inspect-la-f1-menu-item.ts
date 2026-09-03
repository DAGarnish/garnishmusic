import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  const sites = await payload.find({ collection: "sites", where: { slug: { in: ["la", "la-old"] } }, limit: 5 });
  for (const site of sites.docs as any[]) {
    console.log(`\n=== ${site.slug} ===`);
    const dump = (items: any[], depth = 0) => {
      for (const item of items) {
        console.log("  ".repeat(depth) + `- "${item.label}" url=${item.url} newTab=${item.newTab}`);
        if (Array.isArray(item.children) && item.children.length > 0) dump(item.children, depth + 1);
      }
    };
    dump(site.mainMenu || []);
  }
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
