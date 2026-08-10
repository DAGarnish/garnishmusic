import { getPayload } from "payload";
import configPromise from "../payload.config";

async function run() {
  const config = await configPromise;
  const payload = await getPayload({ config });

  const sites = await payload.find({ collection: "sites", limit: 100 });
  const laSite = sites.docs.find(s => s.domain === "la.localhost:3000" || s.domain === "la.garnishmusicproduction.com" || s.slug === "la");

  const pages = await payload.find({
      collection: "pages",
      where: {
          and: [
              { site: { equals: laSite?.id } },
          ]
      },
      limit: 100
  });

  const home = pages.docs.find(p => p.slug === "home" || p.slug === "homepage" || p.slug === "");
  
  if (home) {
      console.log("Home Page Title:", home.title);
      console.log("Home Page Slug:", home.slug);
      console.log("Includes BELL in wpRawContent?", !!(home.wpRawContent && home.wpRawContent.includes("BELL")));
      if (home.wpRawContent && home.wpRawContent.includes("1115")) {
          console.log("Includes Media ID 1115!");
      }
      // Log some of the raw content
      console.log(home.wpRawContent?.substring(0, 300));
  } else {
      console.log("No home page found! Available slugs:");
      pages.docs.forEach(p => console.log(p.slug));
  }
  process.exit(0);
}
run();
