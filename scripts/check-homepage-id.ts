import { getPayload } from 'payload';
import config from '../payload.config';

async function main() {
  const payload = await getPayload({ config });
  
  const sites = await payload.find({
    collection: 'sites',
    where: { slug: { equals: 'tyo' } },
    limit: 1
  });
  
  const site = sites.docs[0];
  console.log('tyo homepageWpId:', site?.homepageWpId);
  
  if (site?.homepageWpId) {
      const page = await payload.find({
          collection: 'pages',
          where: { wpPostId: { equals: site.homepageWpId } },
          limit: 1
      });
      if (page.docs[0]) {
          console.log('Homepage title:', page.docs[0].title);
          console.log('Homepage slug:', page.docs[0].slug);
          console.log('Has Open House?', page.docs[0].wpRawContent?.includes('Open House'));
          console.log('Has open-house?', page.docs[0].wpRawContent?.includes('open-house'));
          const oh = page.docs[0].wpRawContent?.match(/open[- ]house/i);
          console.log('Regex match?', oh);
      }
  }
  
  process.exit(0);
}
main().catch(console.error);
