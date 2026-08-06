import { getPayload } from 'payload';
import config from '../payload.config';

async function main() {
  const payload = await getPayload({ config });
  
  const items = await payload.find({
    collection: 'posts', // Check if portfolio items are in 'posts' or 'pages' or 'products'
    limit: 100,
  });
  
  const openHouseItems = items.docs.filter(d => d.title?.toLowerCase().includes('open house') || d.title?.toLowerCase().includes('open-house'));
  for (const item of openHouseItems) {
      console.log(`Found Open House in posts: ${item.title} (slug: ${item.slug}, sites: ${item.sites?.map(s => typeof s === 'object' ? s.slug : s).join(', ')})`);
  }
  
  const portfolios = await payload.find({
     collection: 'portfolios',
     limit: 100
  }).catch(() => ({ docs: [] }));
  
  const ohPort = portfolios.docs.filter(d => d.title?.toLowerCase().includes('open house'));
  for (const item of ohPort) {
      console.log(`Found Open House in portfolios: ${item.title} (slug: ${item.slug}, sites: ${item.sites?.map(s => typeof s === 'object' ? s.slug : s).join(', ')})`);
  }
  
  process.exit(0);
}
main().catch(console.error);
