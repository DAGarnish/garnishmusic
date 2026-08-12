import { getPayload } from "payload";
import config from "../payload.config";

import fs from "fs";
import path from "path";

const envPath = path.resolve(".env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1]] = match[2];
    }
  });
}

async function main() {
  const payload = await getPayload({ config });
  
  const siteQuery = await payload.find({
      collection: "sites",
      where: {
          slug: {
              equals: "edu"
          }
      }
  });
  
  if (siteQuery.docs.length === 0) {
      console.error("EDU site not found");
      process.exit(1);
  }
  
  const site = siteQuery.docs[0];
  
  const menuPath = path.resolve(process.cwd(), "menu-edu.json");
  const menuContent = fs.readFileSync(menuPath, "utf8");
  const mainMenu = JSON.parse(menuContent);
  
  await payload.update({
      collection: "sites",
      id: site.id,
      data: {
          mainMenu
      }
  });
  console.log("Successfully updated EDU menu from menu-edu.json.");

  process.exit(0);
}

main().catch(console.error);
