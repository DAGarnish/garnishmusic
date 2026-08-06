import { getPayload } from 'payload';
import config from '../payload.config';
import fs from 'fs';

async function main() {
  const payload = await getPayload({ config });
  
  const pages = await payload.find({
    collection: 'pages',
    limit: 1000,
    depth: 1
  });
  
  const tyoPage = pages.docs.find(p => typeof p.site === 'object' && p.site?.slug === 'tyo' && p.slug === 'home');
  if (tyoPage) {
     fs.writeFileSync('tyo_homepage_content.txt', tyoPage.wpRawContent || '');
     console.log('Saved to tyo_homepage_content.txt');
  } else {
     // what is the tyo homepage slug?
     const tyoHome = pages.docs.find(p => typeof p.site === 'object' && p.site?.slug === 'tyo' && (p.isHome || p.slug === '' || p.slug === '/'));
     if (tyoHome) {
        fs.writeFileSync('tyo_homepage_content.txt', tyoHome.wpRawContent || '');
        console.log('Saved to tyo_homepage_content.txt (slug: ' + tyoHome.slug + ')');
     } else {
        console.log('Not found');
     }
  }
  
  process.exit(0);
}
main().catch(console.error);
