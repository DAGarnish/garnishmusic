import { getPayloadClient } from "../lib/get-payload";
import fs from "fs";

async function dumpDB() {
  const payload = await getPayloadClient();
  const products = await payload.find({
    collection: "products",
    limit: 1000,
  });
  fs.writeFileSync("products_dump.json", JSON.stringify(products.docs, null, 2));
  console.log("Done");
  process.exit(0);
}
dumpDB().catch(console.error);
