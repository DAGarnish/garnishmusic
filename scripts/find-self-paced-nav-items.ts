import { getPayload } from "payload";
import config from "../payload.config";

// Read-only survey: find every nav item (at any depth of mainMenu) across
// every site whose label mentions "self-paced", so we know every exact
// label variant before writing the network-wide removal script.
async function main() {
  const payload = await getPayload({ config });
  const sites = await payload.find({ collection: "sites", limit: 500 });

  function findMatches(items: any[], path: string[]): { path: string[]; label: string }[] {
    if (!items) return [];
    return items.flatMap((item) => {
      const hits: { path: string[]; label: string }[] = [];
      if (typeof item.label === "string" && /self.?paced/i.test(item.label)) {
        hits.push({ path, label: item.label });
      }
      return [...hits, ...findMatches(item.children || [], [...path, item.label])];
    });
  }

  for (const site of sites.docs as any[]) {
    const matches = findMatches(site.mainMenu || [], []);
    if (matches.length > 0) {
      console.log(`site ${site.id} (${site.slug}):`);
      for (const m of matches) {
        console.log(`  ${m.path.join(" > ")} > ${m.label}`);
      }
    }
  }
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
