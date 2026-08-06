import { getPayload } from 'payload';
import config from '../payload.config';

async function main() {
  const payload = await getPayload({ config });
  
  const pages = await payload.find({
    collection: 'pages',
    limit: 1000,
    depth: 1
  });
  
  const tyoPages = pages.docs.filter(p => typeof p.site === 'object' && p.site?.slug === 'tyo');
  console.log(`Found ${tyoPages.length} pages for tyo.`);
  
  for (const page of tyoPages) {
     if (page.wpRawContent && page.wpRawContent.includes('Open House')) {
         console.log(`Open House found in page ${page.slug} (ID: ${page.id})`);
         const newContent = page.wpRawContent.replace(/\[mkd_portfolio_list[^\]]*?category="open-house"[^\]]*?\]/gi, '');
         console.log('Original contained Open House?', page.wpRawContent.includes('Open House'));
         // Let's actually show the snippet
         const match = page.wpRawContent.match(/.{0,100}Open House.{0,100}/i);
         console.log('Context:', match?.[0]);
     }
  }
  
  process.exit(0);
}
main().catch(console.error);
