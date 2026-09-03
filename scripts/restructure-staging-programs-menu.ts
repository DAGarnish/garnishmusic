import { getPayload } from "payload";
import config from "../payload.config";

// User request: split "Express Classes" (16 items) into two groups under
// "Music Production Programs" - the 5 DAW-specific ones (Ableton Live,
// Logic Pro, Logic Pro Self Paced, FL Studio, Pro Tools) renamed "Beginner
// Classes" and moved right after "Comprehensive Programs" (with "Others"
// staying right after it, same relative order as before); the remaining
// 11 more-specialized courses become a new "Intermediate Classes" group at
// the end. Mirrors la's own real nav structure (Beginner Classes /
// Intermediate Classes), which this was modeled on. staging-only.
const DAW_LABELS = ["Ableton Live", "Logic Pro", "Logic Pro Self Paced", "FL Studio", "Pro Tools"];

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
  const expressIdx = programs.children.findIndex((n: any) => n.label === "Express Classes");
  if (expressIdx === -1) {
    console.error("could not find 'Express Classes' - aborting", JSON.stringify(programs.children, null, 2));
    process.exit(1);
  }
  const express = programs.children[expressIdx];
  const dawItems = express.children.filter((c: any) => DAW_LABELS.includes(c.label));
  const restItems = express.children.filter((c: any) => !DAW_LABELS.includes(c.label));
  if (dawItems.length !== DAW_LABELS.length) {
    console.error(
      "expected all 5 DAW labels to be found - aborting",
      dawItems.map((c: any) => c.label)
    );
    process.exit(1);
  }

  const beginnerClasses = { ...express, label: "Beginner Classes", children: dawItems };
  const intermediateClasses = { url: "#", label: "Intermediate Classes", newTab: false, children: restItems };

  // Remove the old "Express Classes" entry, then rebuild the top-level
  // children order: ..., Comprehensive Programs, Beginner Classes, Others,
  // ..., Intermediate Classes (appended at the very end).
  const withoutExpress = programs.children.filter((_: any, i: number) => i !== expressIdx);
  const comprehensiveIdx = withoutExpress.findIndex((n: any) => n.label === "Comprehensive Programs");
  const reordered = [
    ...withoutExpress.slice(0, comprehensiveIdx + 1),
    beginnerClasses,
    ...withoutExpress.slice(comprehensiveIdx + 1),
    intermediateClasses,
  ];
  programs.children = reordered;

  await payload.update({ collection: "sites", id: site.id, data: { mainMenu: menu } });
  console.log(
    "updated staging's Music Production Programs menu:",
    programs.children.map((c: any) => `${c.label} (${c.children.length})`)
  );
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
