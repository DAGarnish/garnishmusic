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
              equals: "sea"
          }
      }
  });
  
  if (siteQuery.docs.length === 0) {
      console.error("SEA site not found");
      process.exit(1);
  }
  
  const site = siteQuery.docs[0];
  console.log("Current footerCopyrightBottom:", site.footerCopyrightBottom);
  
  const strToRemove = "HK| 10th floor, Yuen Fat Industrial Building, 25 Wang Chiu Rd., Kowloon Bay, Hong Kong";
  
  if (site.footerCopyrightBottom && site.footerCopyrightBottom.includes(strToRemove)) {
      const newBottom = site.footerCopyrightBottom.replace(strToRemove, "").trim();
      
      await payload.update({
          collection: "sites",
          id: site.id,
          data: {
              footerCopyrightBottom: newBottom
          }
      });
      console.log("Updated footerCopyrightBottom successfully.");
  } else if (site.footerCopyright && site.footerCopyright.includes(strToRemove)) {
       const newCopyright = site.footerCopyright.replace(strToRemove, "").trim();
       await payload.update({
           collection: "sites",
           id: site.id,
           data: {
               footerCopyright: newCopyright
           }
       });
       console.log("Updated footerCopyright successfully.");
  } else {
      console.log("String not found in footerCopyright or footerCopyrightBottom.");
  }

  process.exit(0);
}

main().catch(console.error);
