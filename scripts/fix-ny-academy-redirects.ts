import { getPayload } from "payload";
import config from "../payload.config";

// Both of these on ny.garnishmusicproduction.com used to be their own
// standalone program pages; production has since consolidated both into
// a single page. Verified live: both source URLs on production now
// 301 (via an extra hop) to /music-production-academy/, which is 200.
// Pointing directly at the final canonical destination instead of the
// stale intermediate one.

const fixes: Record<string, string> = {
  "/programs/emp-electronic-music-producer": "https://ny.garnishmusicproduction.com/music-production-academy/",
  "/programs/songwriting-music-producer": "https://ny.garnishmusicproduction.com/music-production-academy/",
};

async function main() {
  const payload = await getPayload({ config });
  const sites = await payload.find({ collection: "sites", where: { domain: { equals: "ny.garnishmusicproduction.com" } }, limit: 1 });
  const nySite = sites.docs[0];
  if (!nySite) throw new Error("ny site not found");

  for (const [source, destination] of Object.entries(fixes)) {
    const found = await payload.find({
      collection: "redirects",
      where: { and: [{ site: { equals: nySite.id } }, { source: { equals: source } }] },
      limit: 10,
    });
    for (const r of found.docs as any[]) {
      console.log(`BEFORE id=${r.id} source=${source} dest=${r.destination}`);
      await payload.update({ collection: "redirects", id: r.id, data: { destination } });
      console.log(`FIXED  id=${r.id} source=${source} -> ${destination}`);
    }
  }
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
