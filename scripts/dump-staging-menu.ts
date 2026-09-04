import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  const sites = await payload.find({ collection: "sites", where: { slug: { equals: "staging" } }, limit: 1 });
  const site = sites.docs[0] as any;
  console.log(JSON.stringify(site.mainMenu, null, 2));
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
