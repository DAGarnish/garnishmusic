import { getPayload } from "payload";
import config from "../payload.config";

// User follow-up: move "Others" to right after "Comprehensive Programs"
// (before "Beginner Classes") - previous order was Accredited,
// Comprehensive Programs, Beginner Classes, Others, Intermediate Classes.
async function main() {
  const payload = await getPayload({ config });

  const sites = await payload.find({ collection: "sites", where: { slug: { equals: "staging" } }, limit: 1 });
  const site = sites.docs[0] as any;
  if (!site) {
    console.error("no 'staging' site found - aborting");
    process.exit(1);
  }

  const menu = JSON.parse(JSON.stringify(site.mainMenu || []));
  const programs = menu.find((n: any) => n.label === "Music Production Programs");
  if (!programs) {
    console.error("could not find 'Music Production Programs' - aborting");
    process.exit(1);
  }
  const othersIdx = programs.children.findIndex((n: any) => n.label === "Others");
  const comprehensiveIdx = programs.children.findIndex((n: any) => n.label === "Comprehensive Programs");
  if (othersIdx === -1 || comprehensiveIdx === -1) {
    console.error("could not find 'Others' or 'Comprehensive Programs' - aborting");
    process.exit(1);
  }

  const [others] = programs.children.splice(othersIdx, 1);
  const insertAt = programs.children.findIndex((n: any) => n.label === "Comprehensive Programs") + 1;
  programs.children.splice(insertAt, 0, others);

  await payload.update({ collection: "sites", id: site.id, data: { mainMenu: menu } });
  console.log(
    "reordered staging's Music Production Programs menu:",
    programs.children.map((c: any) => c.label)
  );
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
