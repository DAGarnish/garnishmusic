import { getPayload } from 'payload';
import config from '../payload.config';
import fs from 'fs';

async function main() {
  const payload = await getPayload({ config });
  
  const pages = await payload.find({
      collection: 'pages',
      where: {
          slug: { equals: 'courses/logic-pro-course' }
      },
      limit: 10
  });
  
  for (const p of pages.docs) {
      const siteSlug = typeof p.site === 'object' ? p.site?.slug : p.site;
      console.log(`Page: ${p.title} - Site: ${siteSlug}`);
      if (siteSlug === 'la') {
          fs.writeFileSync('logic-pro-course.txt', p.wpRawContent || '');
      }
  }
  
  process.exit(0);
}
main().catch(console.error);
