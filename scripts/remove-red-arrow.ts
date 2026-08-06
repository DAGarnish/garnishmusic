import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  
  const pages = await payload.find({
    collection: "pages",
    limit: 1000,
    where: { wpRawContent: { like: "fa-angle-down" } }
  });
  
  let totalUpdated = 0;
  
  // Regex to match the elements holder containing the angle-down icon
  const regex = /\[mkd_elements_holder\]\[mkd_elements_holder_item[^\]]*\]\[mkd_icon_with_text[^\]]*fa_icon="fa-angle-down"[^\]]*\]\[\/mkd_elements_holder_item\]\[\/mkd_elements_holder\]/g;
  
  for (const page of pages.docs) {
    if (page.wpRawContent && page.wpRawContent.includes('fa-angle-down')) {
      const updatedContent = page.wpRawContent.replace(regex, '');
      
      if (updatedContent !== page.wpRawContent) {
        console.log(`Updating page: ${page.slug} (ID: ${page.id}) - Removed arrow`);
        await payload.update({
          collection: "pages",
          id: page.id,
          data: { wpRawContent: updatedContent }
        });
        totalUpdated++;
      } else {
        console.log(`Page matched but regex didn't replace anything: ${page.slug}`);
      }
    }
  }

  console.log(`Removed the arrow from ${totalUpdated} pages.`);
  process.exit(0);
}

main().catch(console.error);
