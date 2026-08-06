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
  for (const p of tyoPages) {
      console.log(`- ${p.title} (slug: ${p.slug}, id: ${p.id})`);
  }
  
  process.exit(0);
}
main().catch(console.error);
