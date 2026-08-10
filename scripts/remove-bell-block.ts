import { getPayload } from "payload";
import configPromise from "../payload.config";

async function run() {
  const config = await configPromise;
  const payload = await getPayload({ config });

  const media = await payload.find({
      collection: "media",
      where: {
          filename: { equals: "BELL.jpg" }
      },
      limit: 1
  });

  if (media.docs.length > 0) {
      console.log("Found media ID:", media.docs[0].id);
      const mediaId = media.docs[0].id;
      
      const sites = await payload.find({ collection: "sites", limit: 100 });
      const laSite = sites.docs.find(s => s.domain === "la.localhost:3000" || s.domain === "la.garnishmusicproduction.com" || s.slug === "la");
      
      const pages = await payload.find({
          collection: "pages",
          where: { site: { equals: laSite.id } },
          limit: 100
      });

      for (const page of pages.docs) {
          if (page.layout && Array.isArray(page.layout)) {
              let changed = false;
              
              // We need to recursively search or just stringify and see if it has the media ID
              const layoutStr = JSON.stringify(page.layout);
              if (layoutStr.includes(String(mediaId)) || layoutStr.includes("BELL.jpg")) {
                  console.log("Found bell in layout of page:", page.slug);
                  
                  // Simple approach: if it's a specific block, remove it.
                  // But layout can be deeply nested (Row -> Column -> ImageBlock)
                  // Let's recursively remove the image block or rawHtml block containing it.
                  
                  // Wait, it might be easier to just remove it manually or see its structure first.
                  console.log(JSON.stringify(page.layout, null, 2).substring(0, 500));
              }
          }
          if (page.wpRawContent && (page.wpRawContent.includes("BELL.jpg") || page.wpRawContent.includes(String(mediaId)))) {
              console.log("Found in wpRawContent for", page.slug);
          }
      }
  }

  process.exit(0);
}
run();
