import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  
  const pages = await payload.find({
    collection: "pages",
    where: {
      slug: {
        equals: "courses/ableton-live-course-london"
      }
    }
  });

  if (pages.docs.length > 0) {
    const raw = pages.docs[0].wpRawContent;
    console.log(raw);
  }
  process.exit(0);
}

main().catch(console.error);
