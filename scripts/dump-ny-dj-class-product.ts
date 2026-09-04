import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  const doc: any = await payload.findByID({ collection: "products", id: 160, depth: 1 });
  const raw = doc.wpRawContent as string;
  const cleaned = raw.replace(/\[mkd_icon[^\]]*\]/g, "→");
  console.log(cleaned.slice(3800, 6200));
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
