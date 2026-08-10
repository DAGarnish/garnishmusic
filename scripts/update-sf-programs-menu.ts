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
  
  // Revert the "Music Production Courses" top-level nav item to its original state (probably # or /courses)
  const mainMenu = site.mainMenu as any[];
  if (mainMenu) {
      for (const item of mainMenu) {
          if (item.label && item.label.toLowerCase() === "music production courses") {
              if (item.url === "/emp-electronic-music-producer/") {
                  item.url = "#";
                  console.log("Reverted top-level 'Music Production Courses' url to '#'");
              }
          }
          // Check children of top-level items
          if (item.children && Array.isArray(item.children)) {
              for (const child of item.children) {
                  if (child.label && child.label.toLowerCase() === "music production") {
                      child.url = "/emp-electronic-music-producer/";
                      console.log("Updated 'Music Production' inside mainMenu children.");
                  }
              }
          }
      }
  }
  
  // Update footerPrograms if it exists
  const footerPrograms = site.footerPrograms as any[];
  if (footerPrograms) {
      for (const item of footerPrograms) {
          if (item.label && item.label.toLowerCase() === "music production") {
              item.url = "/emp-electronic-music-producer/";
              console.log("Updated 'Music Production' inside footerPrograms.");
          }
      }
  }
  
  // We can just update both fields
  await payload.update({
      collection: "sites",
      id: site.id,
      data: {
          mainMenu,
          footerPrograms
      }
  });
  
  console.log("Updated menus successfully.");
  process.exit(0);
}

main().catch(console.error);
