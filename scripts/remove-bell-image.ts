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
          if (page.wp_raw_content && page.wp_raw_content.includes(String(mediaId))) {
              console.log("Found media ID in page:", page.slug);
              const idx = page.wp_raw_content.indexOf(String(mediaId));
              console.log("Snippet:", page.wp_raw_content.substring(Math.max(0, idx - 100), Math.min(page.wp_raw_content.length, idx + 100)));
              
              // Remove the shortcode
              // Assuming it's something like [vc_single_image image="3492" img_size="full" alignment="center" onclick="custom_link" link="..."]
              // A regex to remove the whole shortcode:
              const updated = page.wp_raw_content.replace(new RegExp(`\\[vc_single_image[^\\]]*image="${mediaId}"[^\\]]*\\]`), "");
              if (updated !== page.wp_raw_content) {
                  console.log("Successfully removed shortcode from wp_raw_content");
                  await payload.update({
                      collection: "pages",
                      id: page.id,
                      data: { wp_raw_content: updated }
                  });
              }
          }
      }
  }

  process.exit(0);
}
run();
