import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  
  const pages = await payload.find({
    collection: "pages",
    limit: 1000,
    where: { wpRawContent: { like: "padding-bottom: 64px" } }
  });
  
  let totalUpdated = 0;
  
  for (const page of pages.docs) {
    if (page.wpRawContent && page.wpRawContent.includes('padding-bottom: 64px !important;}"][vc_column][mkd_portfolio_list')) {
      const updatedContent = page.wpRawContent.replace(
        /padding-bottom: 64px !important;\}"]\[vc_column\]\[mkd_portfolio_list/g,
        'padding-bottom: 32px !important;}"][vc_column][mkd_portfolio_list'
      );
      
      if (updatedContent !== page.wpRawContent) {
        console.log(`Updating page: ${page.slug} (ID: ${page.id})`);
        await payload.update({
          collection: "pages",
          id: page.id,
          data: { wpRawContent: updatedContent }
        });
        totalUpdated++;
      }
    }
  }

  console.log(`Updated ${totalUpdated} pages.`);
  process.exit(0);
}

main().catch(console.error);
