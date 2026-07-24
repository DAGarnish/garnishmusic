import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  const result = await payload.delete({ collection: "media", where: { id: { greater_than: 0 } } });
  console.log(`Deleted ${result.docs?.length ?? "?"} media docs.`);
  process.exit(0);
}
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
