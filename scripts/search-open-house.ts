import { getPayload } from 'payload';
import config from '../payload.config';

async function main() {
  const payload = await getPayload({ config });
  
  const categories = await payload.find({
      collection: 'categories',
      limit: 1000
  });
  
  for (const c of categories.docs) {
      if (c.slug?.includes('open') || c.name?.toLowerCase().includes('open')) {
          console.log(`Category: ${c.name} (slug: ${c.slug})`);
      }
  }
  
  const tags = await payload.find({
      collection: 'tags',
      limit: 1000
  });
  
  for (const t of tags.docs) {
      if (t.slug?.includes('open') || t.name?.toLowerCase().includes('open')) {
          console.log(`Tag: ${t.name} (slug: ${t.slug})`);
      }
  }
  
  process.exit(0);
}
main().catch(console.error);
