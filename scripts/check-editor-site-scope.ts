import { getPayload } from "payload";
import config from "../payload.config";

// One-off check ahead of scripts/promote-staging-to-edu.ts: editor accounts
// are scoped to sites by ID (see lib/access-control.ts / commit 152b6b6),
// not slug, so any editor scoped to site 15 would silently keep editing the
// archived edu-2 content after the cutover instead of the live edu site.
async function main() {
  const payload = await getPayload({ config });
  const res = await payload.find({ collection: "users", limit: 200 });
  for (const u of res.docs as any[]) {
    console.log(`id=${u.id} email=${u.email} roles=${JSON.stringify(u.roles)} sites=${JSON.stringify(u.sites)}`);
  }
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
