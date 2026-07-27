import { getPayload } from "payload";
import config from "../payload.config";

// The earlier /product/ -> /classes/ blanket rename for la.garnishmusicproduction.com
// (fix-la-classes-prefix.ts) incorrectly caught the 13 "/dip-pay" redirects too,
// pointing them at la.../classes/academy-payments/, which doesn't exist - la has
// no academy-payments product at all. Verified live on production: every /dip-pay
// rule (pdx, bh, lis, hou, bcn, sea, tyo, edu, la, mia, hk, ber) resolves to
// https://edu.garnishmusicproduction.com/product/academy-payments/ - correcting
// all 13 (including syd, which has no raw export file but follows the same pattern).

const CORRECT_DESTINATION = "https://edu.garnishmusicproduction.com/product/academy-payments/";

async function main() {
  const payload = await getPayload({ config });

  const redirects = await payload.find({
    collection: "redirects",
    where: { source: { equals: "/dip-pay" } },
    limit: 100,
  });

  let fixed = 0;
  for (const r of redirects.docs as any[]) {
    if (r.destination === CORRECT_DESTINATION) continue;
    await payload.update({ collection: "redirects", id: r.id, data: { destination: CORRECT_DESTINATION } });
    console.log(`FIXED id=${r.id}: ${r.destination} -> ${CORRECT_DESTINATION}`);
    fixed++;
  }

  console.log(`\nDONE. Fixed: ${fixed}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
