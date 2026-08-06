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
          
          // I previously removed `[vc_empty_space]` after the portfolio slider.
          // The end of the first row now looks like: `[mkd_portfolio_slider type="gallery" image_size="square" portfolios_shown="4" category="logic, sound design, projects"][/vc_column][/vc_row]`
          // Let's add `[vc_empty_space height="32px"]` right before `[/vc_column][/vc_row]`
          if (content.includes('category="logic, sound design, projects"][/vc_column]')) {
              console.log('Found the spot to add 32px space!');
              content = content.replace(/category="logic, sound design, projects"\]\[\/vc_column\]/g, 'category="logic, sound design, projects"][vc_empty_space height="32px"][/vc_column]');
              
              await payload.update({
                  collection: 'pages',
                  id: p.id,
                  data: {
                      wpRawContent: content
                  }
              });
              console.log('Added 32px space back.');
          }
      }
  }
  
  process.exit(0);
}
main().catch(console.error);
