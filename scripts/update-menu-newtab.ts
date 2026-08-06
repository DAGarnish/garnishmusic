import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  
  const sites = await payload.find({
    collection: "sites",
    limit: 100
  });

  let totalUpdated = 0;

  function updateMenu(menu: any[]): boolean {
    let updated = false;
    for (const item of menu) {
      if (item.label === "Online Community") {
        if (!item.newTab) {
          item.newTab = true;
          updated = true;
        }
      }
      if (item.children && Array.isArray(item.children)) {
        if (updateMenu(item.children)) {
          updated = true;
        }
      }
    }
    return updated;
  }

  for (const site of sites.docs) {
    let siteUpdated = false;
    
    const updatedSiteData: any = {};

    if (site.mainMenu && Array.isArray(site.mainMenu)) {
      if (updateMenu(site.mainMenu)) {
        siteUpdated = true;
        updatedSiteData.mainMenu = site.mainMenu;
      }
    }

    if (site.footerMenu && Array.isArray(site.footerMenu)) {
      if (updateMenu(site.footerMenu)) {
        siteUpdated = true;
        updatedSiteData.footerMenu = site.footerMenu;
      }
    }

    if (siteUpdated) {
      console.log(`Updating site ID: ${site.id}`);
      await payload.update({
        collection: "sites",
        id: site.id,
        data: updatedSiteData
      });
      totalUpdated++;
    }
  }

  console.log(`Updated ${totalUpdated} sites.`);
  process.exit(0);
}

main().catch(console.error);
