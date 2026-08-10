import { getPayload } from "payload";
import configPromise from "../payload.config";

async function run() {
  const config = await configPromise;
  const payload = await getPayload({ config });

  const sites = await payload.find({ collection: "sites", limit: 100 });
  const laSite = sites.docs.find(s => s.domain === "la.localhost:3000" || s.domain === "la.garnishmusicproduction.com" || s.slug === "la");

  const homePage = await payload.find({
      collection: "pages",
      where: {
          and: [
              { site: { equals: laSite.id } },
              { slug: { equals: "locations" } }
          ]
      },
      limit: 1
  });

  const page = homePage.docs[0];
  if (page && page.wpRawContent) {
      console.log("Checking wpRawContent for bell...");
      // Let's just remove the entire shortcode that contains the contact map link
      const updated = page.wpRawContent.replace(/\[vc_single_image[^\]]*los-angeles-la-contact-map[^\]]*\]/gi, "");
      
      if (updated !== page.wpRawContent) {
          console.log("Found and removed shortcode!");
          await payload.update({
              collection: "pages",
              id: page.id,
              data: { wpRawContent: updated }
          });
      } else {
          // If it's HTML, remove the <p><a><figure>...
          // We can find it by looking for the link
          const match = page.wpRawContent.match(/<a[^>]*los-angeles-la-contact-map[^>]*>.*?<\/a>/i);
          if (match) {
              console.log("Found html link!");
              const updated2 = page.wpRawContent.replace(/<a[^>]*los-angeles-la-contact-map[^>]*>.*?<\/a>/i, "");
              await payload.update({
                  collection: "pages",
                  id: page.id,
                  data: { wpRawContent: updated2 }
              });
          } else {
             console.log("Could not find contact map link!");
             const idx = page.wpRawContent.toLowerCase().indexOf("los-angeles-la-contact-map");
             console.log(page.wpRawContent.substring(Math.max(0, idx - 100), Math.min(page.wpRawContent.length, idx + 100)));
          }
      }
  }

  process.exit(0);
}
run();
