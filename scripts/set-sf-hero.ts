import { getPayload } from "payload";
import config from "../payload.config";
import fs from "fs";
import path from "path";

async function main() {
  const payload = await getPayload({ config });
  
  // 1. Find the SF site
  const siteResult = await payload.find({
    collection: "sites",
    where: {
      slug: {
        equals: 'sf',
      },
    },
  });

  if (siteResult.docs.length === 0) {
    console.error("SF site not found.");
    process.exit(1);
  }
  
  const site = siteResult.docs[0];
  console.log("Found site:", site.name, site.id);

  // 2. Upload image
  const imagePath = path.resolve(process.cwd(), "images/San Francisco 303.jpeg");
  if (!fs.existsSync(imagePath)) {
    console.error("Image not found at:", imagePath);
    process.exit(1);
  }

  const mediaResult = await payload.create({
    collection: "media",
    data: {
      alt: "San Francisco Hero",
      site: site.id,
    },
    filePath: imagePath,
  });

  console.log("Created media:", mediaResult.id);

  // 3. Find SF homepage using homepageWpId
  let pageResult = await payload.find({
    collection: "pages",
    where: {
      site: {
        equals: site.id,
      },
      wpPostId: {
        equals: site.homepageWpId,
      },
    },
  });

  if (pageResult.docs.length === 0) {
    console.log("Fallback to finding a page titled Home");
    pageResult = await payload.find({
      collection: "pages",
      where: {
        site: {
          equals: site.id,
        },
        title: {
          contains: "Home",
        },
      },
    });
  }

  if (pageResult.docs.length === 0) {
    console.error("SF Homepage not found.");
    process.exit(1);
  }

  const homepage = pageResult.docs[0];
  console.log("Found homepage:", homepage.id, homepage.title);

  // 4. Update the homepage with the hero image
  await payload.update({
    collection: "pages",
    id: homepage.id,
    data: {
      titleBackgroundImage: mediaResult.id,
    },
  });

  console.log("Updated homepage with new hero image.");
  process.exit(0);
}

main().catch(console.error);
