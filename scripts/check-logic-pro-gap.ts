import { getPayload } from 'payload';
import config from '../payload.config';

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
      if (siteSlug === 'la') {
          console.log('ID:', p.id);
          let content = p.wpRawContent || '';
          
          // The empty row: [vc_row content_aligment="center" css=".vc_custom_1518801485572{margin-bottom: 60px !important;}"][vc_column][vc_empty_space][/vc_column][/vc_row]
          if (content.includes('margin-bottom: 60px !important;')) {
              console.log('Found empty 60px row!');
              content = content.replace(/\[vc_row[^\]]*margin-bottom:\s*60px[^\]]*\]\[vc_column\]\[vc_empty_space\]\[\/vc_column\]\[\/vc_row\]/g, '');
              
              await payload.update({
                  collection: 'pages',
                  id: p.id,
                  data: {
                      wpRawContent: content
                  }
              });
              console.log('Removed empty row.');
          }
      }
  }
  
  process.exit(0);
}
main().catch(console.error);
