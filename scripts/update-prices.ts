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

function processContent(content: string, localCurrency: string): string {
    if (!content) return content;
    
    let newContent = content;
    const toDelete = ["USA", "EU", "UK"].filter(c => c !== localCurrency);

    // 1. Delete rows for other currencies
    for (const prefix of toDelete) {
        // Matches <p...> USA: $123 </p> (or div, h1-6)
        const regex = new RegExp(`<(p|div|h[1-6])[^>]*>(?:(?!<\\/\\1>)[\\s\\S])*?\\b${prefix}:\\s*(?:\\$|€|£|\\d)(?:(?!<\\/\\1>)[\\s\\S])*?<\\/\\1>\\s*`, 'gi');
        newContent = newContent.replace(regex, '');
    }

    // 2. Remove the prefix from the local currency row
    const keepRegex = new RegExp(`(<(?:p|div|h[1-6])[^>]*>(?:<[^>]+>)*\\s*)\\b${localCurrency}:\\s*(<[^>]+>\\s*)?`, 'gi');
    newContent = newContent.replace(keepRegex, '$1$2');

    return newContent;
}

async function main() {
  const payload = await getPayload({ config });
  
  // First, map sites
  const sites = await payload.find({ collection: "sites", limit: 100 });
  const siteCurrencyMap: Record<number, string> = {};
  const siteSlugMap: Record<number, string> = {};
  
  for (const site of sites.docs) {
      let currency = "USA";
      if (site.slug === "www") currency = "UK";
      if (["bcn", "ber", "lis"].includes(site.slug as string)) currency = "EU";
      
      siteCurrencyMap[site.id as number] = currency;
      siteSlugMap[site.id as number] = site.slug as string;
  }
  
  // We'll update pages
  let totalUpdated = 0;
  
  const pages = await payload.find({
      collection: "pages",
      limit: 1000,
      where: {
          or: [
              { wpRawContent: { contains: "USA:" } },
              { wpRawContent: { contains: "EU:" } },
              { wpRawContent: { contains: "UK:" } }
          ]
      }
  });
  
  for (const page of pages.docs) {
      if (!page.site) continue;
      
      // page.site can be an object or ID depending on depth, usually ID if not populated
      const siteId = typeof page.site === 'object' ? page.site.id : page.site;
      const siteSlug = siteSlugMap[siteId as number];
      
      if (siteSlug === "edu") {
          console.log(`Skipping edu page: ${page.slug}`);
          continue;
      }
      
      const localCurrency = siteCurrencyMap[siteId as number];
      if (!localCurrency) continue;
      
      const newContent = processContent(page.wpRawContent as string, localCurrency);
      
      if (newContent !== page.wpRawContent) {
          console.log(`Updating ${siteSlug} page ${page.slug} (keeping ${localCurrency})`);
          await payload.update({
              collection: "pages",
              id: page.id,
              data: {
                  wpRawContent: newContent
              }
          });
          totalUpdated++;
      }
  }
  
  console.log(`Total pages updated: ${totalUpdated}`);
  process.exit(0);
}

main().catch(console.error);
