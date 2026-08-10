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
  const mediaId = media.docs[0]?.id;

  const sites = await payload.find({ collection: "sites", limit: 100 });
  const laSite = sites.docs.find(s => s.domain === "la.localhost:3000" || s.domain === "la.garnishmusicproduction.com" || s.slug === "la");

  const homePage = await payload.find({
      collection: "pages",
      where: {
          and: [
              { site: { equals: laSite.id } },
              { wpPostId: { equals: laSite.homepageWpId } }
          ]
      },
      limit: 1
  });

  const page = homePage.docs[0];
  if (page) {
      console.log("Found LA Home Page:", page.slug, page.title);
      if (page.wpRawContent && page.wpRawContent.includes("1115")) {
         console.log("Found 1115 in wpRawContent!");
         const updated = page.wpRawContent.replace(/\[vc_single_image[^\]]*image="1115"[^\]]*\]/g, "");
         
         if (updated !== page.wpRawContent) {
             console.log("Removed [vc_single_image image=1115] from wpRawContent");
             await payload.update({
                 collection: "pages",
                 id: page.id,
                 data: { wpRawContent: updated }
             });
         } else {
             // Maybe it's not a vc_single_image or formatted differently.
             console.log("Could not replace via regex, here is where it appears:");
             const idx = page.wpRawContent.indexOf("1115");
             console.log(page.wpRawContent.substring(idx - 100, idx + 100));
         }
      } else {
         console.log("1115 not in wpRawContent. Checking Layout blocks.");
         if (page.layout) {
            console.log(JSON.stringify(page.layout).includes("1115"));
         }
      }
  }

  process.exit(0);
}
run();
