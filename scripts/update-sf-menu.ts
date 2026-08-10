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
              equals: "sf"
          }
      }
  });
  
  if (siteQuery.docs.length === 0) {
      console.error("SF site not found");
      process.exit(1);
  }
  
  const site = siteQuery.docs[0];
  const mainMenu = site.mainMenu as any[];
  
  if (!mainMenu) {
      console.error("Main menu not found for SF site");
      process.exit(1);
  }
  
  let updated = false;
  
  for (const item of mainMenu) {
      if (item.label && item.label.toLowerCase() === "music production courses") {
          item.url = "/emp-electronic-music-producer/";
          updated = true;
          console.log("Updated Music Production link!");
      }
  }
  
  if (updated) {
      await payload.update({
          collection: "sites",
          id: site.id,
          data: {
              mainMenu
          }
      });
      console.log("Successfully updated SF menu.");
  } else {
      console.log("Could not find 'Music Production' in the SF menu.");
      console.log("Menu items are:", mainMenu.map(i => i.label).join(", "));
  }

  process.exit(0);
}

main().catch(console.error);
