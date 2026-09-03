import { getPayload } from "payload";
import config from "../payload.config";

function findMatches(menu: any[], path: string[] = []): any[] {
  let out: any[] = [];
  for (const item of menu) {
    const label = (item.label || "").toLowerCase();
    if (label.includes("f1") && label.includes("visa")) {
      out.push({ path: [...path, item.label], url: item.url, newTab: item.newTab });
    }
    if (item.children && Array.isArray(item.children)) {
      out = out.concat(findMatches(item.children, [...path, item.label]));
    }
  }
  return out;
}

async function main() {
  const payload = await getPayload({ config });
  const sites = await payload.find({ collection: "sites", limit: 100 });
  for (const site of sites.docs as any[]) {
    if (!site.mainMenu) continue;
    const matches = findMatches(site.mainMenu);
    if (matches.length > 0) {
      console.log(`\n${site.slug} (${site.name}):`);
      for (const m of matches) console.log("  ", JSON.stringify(m));
    }
  }
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
