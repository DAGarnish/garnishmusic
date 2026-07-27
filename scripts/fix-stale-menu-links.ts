import { getPayload } from "payload";
import config from "../payload.config";

type Node = { label?: string; url?: string; newTab?: boolean; children?: Node[] };

// Header/footer mainMenu trees were scraped from live WordPress nav_menu_item
// data and, like the redirect exports, captured a handful of URLs from
// before certain pages' rewrite slugs were renamed. Verified live on
// production (each source ultimately 301s to these, or the destination is
// simply the current 200 URL):
const REPLACEMENTS: Record<string, string> = {
  "https://edu.garnishmusicproduction.com/music/dave-garnish/": "https://edu.garnishmusicproduction.com/courses/dave-garnish/",
  "https://edu.garnishmusicproduction.com/live-online/": "https://edu.garnishmusicproduction.com/online-music-production/",
  "https://edu.garnishmusicproduction.com/live-online": "https://edu.garnishmusicproduction.com/online-music-production/",
  "https://bcn.garnishmusicproduction.com/music/ibiza-dj-bootcamp/": "https://bcn.garnishmusicproduction.com/courses/ibiza-dj-bootcamp/",
  "https://edu.garnishmusicproduction.com/uk-bachelors-degree/": "https://edu.garnishmusicproduction.com/college-bachelors-degrees/",
};

function fixTree(nodes: Node[]): { changed: boolean; nodes: Node[] } {
  let changed = false;
  const out = (nodes || []).map((n) => {
    const copy: Node = { ...n };
    if (copy.url && REPLACEMENTS[copy.url]) {
      console.log(`  ${copy.label}: ${copy.url} -> ${REPLACEMENTS[copy.url]}`);
      copy.url = REPLACEMENTS[copy.url];
      changed = true;
    }
    if (copy.children?.length) {
      const res = fixTree(copy.children);
      copy.children = res.nodes;
      if (res.changed) changed = true;
    }
    return copy;
  });
  return { changed, nodes: out };
}

async function main() {
  const payload = await getPayload({ config });
  const sites = await payload.find({ collection: "sites", limit: 100 });

  let sitesFixed = 0;
  for (const site of sites.docs as any[]) {
    if (!site.mainMenu?.length) continue;
    const { changed, nodes } = fixTree(site.mainMenu);
    if (!changed) continue;
    console.log(`SITE ${site.domain}:`);
    await payload.update({ collection: "sites", id: site.id, data: { mainMenu: nodes } });
    sitesFixed++;
  }

  console.log(`\nDONE. Sites fixed: ${sitesFixed}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
