import { getPayload } from 'payload';
import config from '../payload.config';
import fs from 'fs';

async function main() {
  const payload = await getPayload({ config });
  
  const page = await payload.find({
      collection: 'pages',
      where: { wpPostId: { equals: 5271 } },
      limit: 1
  });
  
  if (page.docs[0]) {
      fs.writeFileSync('tyo_homepage.txt', page.docs[0].wpRawContent || '');
      console.log('Saved');
  }
  
  process.exit(0);
}
main().catch(console.error);
