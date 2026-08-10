import { getPayload } from "payload";
import configPromise from "../payload.config";

async function run() {
  const config = await configPromise;
  const payload = await getPayload({ config });
  
  // Find edu site
  const sites = await payload.find({
    collection: "sites",
    where: { slug: { equals: "edu" } }
  });
  
  if (!sites.docs.length) return;
  const edu = sites.docs[0];
  
  // Find edu homepage
  const homepage = await payload.find({
    collection: "pages",
    where: {
      and: [
        { site: { equals: edu.id } },
        { wpPostId: { equals: edu.homepageWpId } }
      ]
    }
  });
  
  if (!homepage.docs.length) {
    console.log("Homepage not found");
    return;
  }
  
  const page = homepage.docs[0];
  let content = page.wpRawContent || "";
  
  console.log("Original content matches:", content.match(/\[vc_row[^\]]*\][\s\S]*?BA \(Hons\) Pathway[\s\S]*?\[\/vc_row\]/gi)?.length || 0);
  
  const regex = /\[vc_row[^\]]*\](?:(?!\[\/?vc_row\])[\s\S])*?BA \(Hons\) Pathway(?:(?!\[\/?vc_row\])[\s\S])*?\[\/vc_row\]/gi;
  
  if (regex.test(content)) {
    content = content.replace(regex, "");
    await payload.update({
      collection: "pages",
      id: page.id,
      data: { wpRawContent: content }
    });
    console.log("Removed from edu homepage!");
  } else {
    // Try fallback regex
    const fallbackRegex = /\[vc_row[^\]]*\][\s\S]*?BA \(Hons\) Pathway(?: \| Music Production)?[\s\S]*?\[\/vc_row\]/i;
    const match = content.match(fallbackRegex);
    if (match) {
        // We have to be careful with greedy matching if there are multiple vc_rows.
        // Let's just use string indexOf to manually find the row bounds.
        const idx = content.indexOf("BA (Hons) Pathway | Music Production");
        if (idx !== -1) {
           const startIdx = content.lastIndexOf("[vc_row", idx);
           const endIdx = content.indexOf("[/vc_row]", idx) + "[/vc_row]".length;
           if (startIdx !== -1 && endIdx > startIdx) {
               content = content.slice(0, startIdx) + content.slice(endIdx);
               await payload.update({
                 collection: "pages",
                 id: page.id,
                 data: { wpRawContent: content }
               });
               console.log("Removed via string indexing from edu homepage!");
           }
        } else {
           console.log("String not found");
        }
    } else {
        console.log("Fallback regex didn't match");
    }
  }
  process.exit(0);
}
run();
