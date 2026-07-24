import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "pages",
    where: { id: { equals: 4 } },
    limit: 1,
    depth: 2,
  });
  const doc = result.docs[0];
  const content = JSON.stringify(doc.content);
  const uploadMatch = content.match(/"type":"upload"[^}]*\}/);
  console.log("Upload node sample:", uploadMatch?.[0]);
  process.exit(0);
}
main();
