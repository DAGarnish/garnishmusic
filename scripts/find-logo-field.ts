import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  const site = await payload.findByID({ collection: "sites", id: 28, depth: 0 });
  const json = JSON.stringify(site);
  const idx = json.indexOf("mkd-normal-logo");
  console.log("found at index:", idx);
  if (idx >= 0) console.log(json.slice(Math.max(0, idx - 200), idx + 400));
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
