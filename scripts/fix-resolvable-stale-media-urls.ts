import { getPayload } from "payload";
import config from "../payload.config";

// The other 2 resolvable matches from audit-stale-media-urls.ts: same bug as
// the NY electronic-dj-class page (content still points at the old absolute
// WordPress upload URL instead of the migrated /api/media/file/... path),
// on two already-migrated files. Unlike the 11 other flagged docs, these
// have a confirmed 1:1 Media match, so this is a pure text substitution -
// no missing assets involved.
const FIXES: { collection: "products"; id: number; oldUrl: string; newUrl: string }[] = [
  {
    collection: "products",
    id: 343, // sf site, product/abletonlive101201
    oldUrl:
      "https://la.garnishmusicproduction.com/wp-content/uploads/sites/51/2017/07/Certified-Training-Center-1-1024x100-300x29.gif",
    newUrl: "/api/media/file/Certified-Training-Center-1-1024x100-300x29-1.gif",
  },
  {
    collection: "products",
    id: 164, // ny site, product/logic-production
    oldUrl: "https://ny.garnishmusicproduction.com/wp-content/uploads/sites/9/2017/06/See-Schedule-300x114.gif",
    newUrl: "/api/media/file/See-Schedule-300x114-3.gif",
  },
];

async function main() {
  const payload = await getPayload({ config });

  for (const fix of FIXES) {
    const doc = await payload.findByID({ collection: fix.collection, id: fix.id, depth: 0 });
    const raw = (doc as any).wpRawContent as string;

    const occurrences = raw.split(fix.oldUrl).length - 1;
    if (occurrences !== 1) {
      console.error(`[${fix.collection} ${fix.id}] Expected exactly 1 match for ${fix.oldUrl}, found ${occurrences} - skipping.`);
      continue;
    }

    const updated = raw.replace(fix.oldUrl, fix.newUrl);
    await payload.update({ collection: fix.collection, id: fix.id, data: { wpRawContent: updated } });
    console.log(`[${fix.collection} ${fix.id}] fixed.`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
