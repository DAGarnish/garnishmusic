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
  const pages = await payload.find({ collection: 'pages', where: { slug: { like: 'advanced-mastering' } } });
  if (pages.docs.length > 0) {
     const page = pages.docs[0];
     console.log('Title Image ID:', page.titleBackgroundImage);
     if (page.titleBackgroundImage) {
        const media = await payload.findByID({ collection: 'media', id: typeof page.titleBackgroundImage === 'string' ? page.titleBackgroundImage : page.titleBackgroundImage.id });
        console.log('Media:', media.filename, media.width, media.height, media.filesize);
     } else {
        console.log('No title background image set on this page. Might be using site default.');
     }
  } else {
     console.log('Page not found');
  }
  process.exit(0);
}

main().catch(console.error);
