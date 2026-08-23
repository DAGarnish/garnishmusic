import { getPayload } from "payload";
import config from "../payload.config";
import fs from "fs";
import path from "path";

const envPath = path.resolve(".env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) process.env[match[1]] = match[2];
  });
}

const PRODUCT_ID = 70;

async function main() {
  const payload = await getPayload({ config });

  const before = await payload.findByID({ collection: "products", id: PRODUCT_ID, depth: 0 });
  const raw = (before as any).wpRawContent as string;

  const oldOpen = '<details style="margin-bottom: 2rem;">\n<summary style="cursor: pointer; text-align: center; font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem; color: #ce1713;">View Course Schedule & Details</summary>\n<div style="padding: 1rem; background: rgba(0,0,0,0.02); border-radius: 8px;">';
  const oldClose = '\n</div>\n</details>';

  if (!raw.includes(oldOpen)) {
    console.log("Could not find details wrappers to replace.");
    process.exit(1);
  }

  let newContent = raw.replace(oldOpen, '');
  newContent = newContent.replace(oldClose, '');

  await payload.update({
    collection: "products",
    id: PRODUCT_ID,
    data: { wpRawContent: newContent },
  });

  console.log("Updated product", PRODUCT_ID, "removed disclosure panel wrapper from DB.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
