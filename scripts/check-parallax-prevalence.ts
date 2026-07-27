import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  for (const col of ["pages", "posts", "products"]) {
    const count = await payload.count({ collection: col as any, where: { wpRawContent: { like: "parallax_background_image" } } });
    console.log(col, "with parallax_background_image:", count.totalDocs);
  }
  process.exit(0);
}
main().catch((err) => { console.error(err); process.exit(1); });
