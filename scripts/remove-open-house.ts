import { getPayload } from 'payload';
import config from '../payload.config';

async function main() {
  const payload = await getPayload({ config });
  
  const sites = await payload.find({
    collection: 'sites',
    where: { slug: { equals: 'tyo' } },
    limit: 1
  });
  const tyoId = sites.docs[0]?.id;
  
  const pages = await payload.find({
    collection: 'pages',
    where: {
      and: [
        { site: { equals: tyoId } },
        { title: { equals: 'Open House' } }
      ]
    }
  });
  
  console.log(`Found ${pages.docs.length} Open House pages for tyo.`);
  
  for (const page of pages.docs) {
      console.log(`Page: ${page.title} (slug: ${page.slug}, id: ${page.id})`);
      // Update the page to remove portfolioCategories
      if (page.portfolioCategories && page.portfolioCategories.length > 0) {
          console.log('Categories:', page.portfolioCategories.map(c => typeof c === 'object' ? c.name : c));
          await payload.update({
              collection: 'pages',
              id: page.id,
              data: {
                  portfolioCategories: []
              }
          });
          console.log('Removed portfolio categories.');
      }
  }
  
  process.exit(0);
}
main().catch(console.error);
