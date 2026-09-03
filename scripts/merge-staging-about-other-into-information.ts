import { getPayload } from "payload";
import config from "../payload.config";

// User request: under "About", "Locations" stays its own dropdown group;
// everything else (the current "Information" group plus "Other" group)
// merges into one group titled "Information". Leaves About with just 2
// groups (Information, Locations) instead of 3 (Information, Locations,
// Other) - with the shared 2-column mega-menu split (ceil(n/2)), that
// puts each in its own column. staging-only.
async function main() {
  const payload = await getPayload({ config });

  const sites = await payload.find({ collection: "sites", where: { slug: { equals: "staging" } }, limit: 1 });
  const site = sites.docs[0] as any;
  if (!site) {
    console.error("no 'staging' site found - aborting");
    process.exit(1);
  }

  const menu = JSON.parse(JSON.stringify(site.mainMenu || []));
  const about = menu.find((n: any) => n.label === "About");
  if (!about) {
    console.error("could not find 'About' - aborting");
    process.exit(1);
  }
  const infoIdx = about.children.findIndex((n: any) => n.label === "Information");
  const otherIdx = about.children.findIndex((n: any) => n.label === "Other");
  if (infoIdx === -1 || otherIdx === -1) {
    console.error("could not find 'Information' or 'Other' - aborting", JSON.stringify(about.children, null, 2));
    process.exit(1);
  }

  about.children[infoIdx].children.push(...about.children[otherIdx].children);
  about.children = about.children.filter((_: any, i: number) => i !== otherIdx);

  await payload.update({ collection: "sites", id: site.id, data: { mainMenu: menu } });
  console.log(
    "updated staging's About menu:",
    about.children.map((c: any) => `${c.label} (${c.children.length})`)
  );
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
