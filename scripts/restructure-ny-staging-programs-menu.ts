import { getPayload } from "payload";
import config from "../payload.config";

// User request (2026-09-04): under "Music Production & DJ Programs", move
// "DJ & More" to sit right after "Comprehensive Programs" (left side of the
// nav), and split "Express Classes" (16 items) into two new groups on the
// right - the 5 DAW-specific courses (Ableton Production, Logic Pro
// Production, Logic Self-Paced Online, Pro Tools, FL Studio) become
// "Beginner Classes", the remaining 11 more-specialized ones (including
// "Ableton Live for DJs", which teaches DJ technique in Ableton rather than
// the DAW itself) become "Intermediate Classes". Mirrors the exact same
// restructure already done for la's own staging build (see
// scripts/restructure-staging-programs-menu.ts) - same DAW/rest split
// logic, just NY's own real labels. staging-only DB write (site 29, ny's
// clone).
const DAW_LABELS = ["Ableton Production", "Logic Pro Production", "Logic Self-Paced Online", "Pro Tools", "FL Studio"];

async function main() {
  const payload = await getPayload({ config });

  const sites = await payload.find({ collection: "sites", where: { slug: { equals: "staging" } }, limit: 1 });
  const site = sites.docs[0] as any;
  if (!site) {
    console.error("no 'staging' site found - aborting");
    process.exit(1);
  }

  const menu = JSON.parse(JSON.stringify(site.mainMenu || []));
  const programs = menu.find((n: any) => n.label === "Music Production & DJ Programs");
  if (!programs) {
    console.error("could not find 'Music Production & DJ Programs' - aborting", menu.map((n: any) => n.label));
    process.exit(1);
  }

  const expressIdx = programs.children.findIndex((n: any) => n.label === "Express Classes");
  const djMoreIdx = programs.children.findIndex((n: any) => n.label === "DJ & More");
  const comprehensiveIdx = programs.children.findIndex((n: any) => n.label === "Comprehensive Programs");
  if (expressIdx === -1 || djMoreIdx === -1 || comprehensiveIdx === -1) {
    console.error(
      "could not find one of Express Classes / DJ & More / Comprehensive Programs - aborting",
      programs.children.map((n: any) => n.label)
    );
    process.exit(1);
  }

  const express = programs.children[expressIdx];
  const djMore = programs.children[djMoreIdx];
  const dawItems = express.children.filter((c: any) => DAW_LABELS.includes(c.label));
  const restItems = express.children.filter((c: any) => !DAW_LABELS.includes(c.label));
  if (dawItems.length !== DAW_LABELS.length) {
    console.error("expected all 5 DAW labels to be found - aborting", dawItems.map((c: any) => c.label));
    process.exit(1);
  }

  const beginnerClasses = { ...express, label: "Beginner Classes", children: dawItems };
  const intermediateClasses = { url: "#", label: "Intermediate Classes", newTab: false, children: restItems };

  // Remove the old Express Classes and DJ & More entries from their
  // current positions, then rebuild the column order: Accredited,
  // Comprehensive Programs, DJ & More, Beginner Classes, Intermediate
  // Classes.
  const remaining = programs.children.filter((_: any, i: number) => i !== expressIdx && i !== djMoreIdx);
  const newComprehensiveIdx = remaining.findIndex((n: any) => n.label === "Comprehensive Programs");
  programs.children = [
    ...remaining.slice(0, newComprehensiveIdx + 1),
    djMore,
    ...remaining.slice(newComprehensiveIdx + 1),
    beginnerClasses,
    intermediateClasses,
  ];

  await payload.update({ collection: "sites", id: site.id, data: { mainMenu: menu } });
  console.log(
    "updated staging's Music Production & DJ Programs menu:",
    programs.children.map((c: any) => `${c.label} (${c.children.length})`)
  );
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
