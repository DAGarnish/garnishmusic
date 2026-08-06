import { getPayload } from 'payload';
import config from '../payload.config';

async function main() {
  const payload = await getPayload({ config });
  
  const sites = await payload.find({
    collection: 'sites',
    limit: 100
  });
  
  console.log('Sites:', sites.docs.map(s => s.slug).join(', '));
  
  process.exit(0);
}
main().catch(console.error);
