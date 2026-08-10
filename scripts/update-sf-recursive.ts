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
  
  let updated = false;

  function updateMenuRecursive(items: any[], inComprehensive: boolean) {
      if (!items || !Array.isArray(items)) return;
      
      for (const item of items) {
          const isComp = inComprehensive || (item.label && item.label.toLowerCase() === "comprehensive programs");
          
          if (isComp && item.label && item.label.toLowerCase() === "music production") {
              item.url = "/emp-electronic-music-producer/";
              updated = true;
              console.log("Found and updated 'Music Production' under 'Comprehensive Programs'");
          }
          
          if (item.children) {
              updateMenuRecursive(item.children, isComp);
          }
      }
  }

  updateMenuRecursive(mainMenu, false);
  
  if (updated) {
      await payload.update({
          collection: "sites",
          id: site.id,
          data: {
              mainMenu
          }
      });
      console.log("Updated menus successfully.");
  } else {
      console.log("Did not find the target link to update.");
  }
  
  process.exit(0);
}

main().catch(console.error);
