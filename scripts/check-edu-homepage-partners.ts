import { getPayload } from "payload";
import configPromise from "../payload.config";

async function run() {
  const config = await configPromise;
  const payload = await getPayload({ config });
  
  const sites = await payload.find({ collection: "sites", where: { slug: { equals: "edu" } } });
  const edu = sites.docs[0];
  
  const homepage = await payload.find({
    collection: "pages",
    where: { and: [ { site: { equals: edu.id } }, { wpPostId: { equals: edu.homepageWpId } } ] }
  });
  
  const content = homepage.docs[0].wpRawContent || "";
  
  const idx = content.indexOf("heading-some-of-our-partners");
  if (idx !== -1) {
     console.log(content.slice(Math.max(0, idx - 400), idx + 200));
  } else {
     console.log("Not found");
  }
  process.exit(0);
}
run();
