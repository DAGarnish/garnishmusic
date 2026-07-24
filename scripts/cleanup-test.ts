import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  await payload.delete({ collection: "pages", where: { slug: { equals: "lexical-converter-test" } } });
  console.log("Cleaned up test page.");
  process.exit(0);
}
main();
