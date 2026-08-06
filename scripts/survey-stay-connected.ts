import { getPayload } from "payload";
import config from "../payload.config";

async function main() {
  const payload = await getPayload({ config });
  const collections = ["pages", "posts", "products"] as const;
  
  let totalFound = 0;

  for (const collection of collections) {
    let hasNextPage = true;
    let page = 1;

    while (hasNextPage) {
      const result = await payload.find({
        collection,
        where: { wpRawContent: { contains: "Stay Connected" } },
        limit: 100,
        page,
        depth: 0
      });

      for (const doc of result.docs) {
        if (doc.wpRawContent && typeof doc.wpRawContent === 'string') {
          const contentStr = doc.wpRawContent;
          const match = contentStr.match(/\[vc[^\]]+\][^\[]*<h[1-6]>(?:<strong>)?Stay Connected(?:<\/strong>)?<\/h[1-6]>[\s\S]*?(?:MailChimp|mc_embed_signup)[\s\S]*?\[\/vc[^\]]+\]/i);
          
          if (!match) {
             console.log(`Mismatch on ${collection} id ${doc.id} (slug: ${doc.slug}). Context:`);
             const idx = contentStr.toLowerCase().indexOf("stay connected");
             console.log(contentStr.substring(Math.max(0, idx - 100), Math.min(contentStr.length, idx + 400)));
             console.log("--------------------");
          }
        }
      }

      totalFound += result.docs.length;
      hasNextPage = result.hasNextPage;
      page++;
    }
  }

  console.log(`Total documents containing "Stay Connected": ${totalFound}`);
  process.exit(0);
}

main().catch(console.error);
