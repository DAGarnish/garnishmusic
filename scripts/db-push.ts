import { getPayload } from "payload";
import configPromise from "../payload.config";

async function run() {
  const config = await configPromise;
  config.db.push = true; // force push
  await getPayload({ config });
  console.log("DB Push complete");
  process.exit(0);
}
run();
