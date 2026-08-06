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
          // Let's modify the page's wpRawContent to remove the vc_empty_space
          let content = p.wpRawContent || '';
          
          // Replace `[vc_empty_space][/vc_column][/vc_row]` after the portfolio slider with `[/vc_column][/vc_row]`
          content = content.replace(/\[mkd_portfolio_slider[^\]]*\]\s*\[vc_empty_space\]/g, (match) => {
             return match.replace('[vc_empty_space]', '');
          });
          
          await payload.update({
              collection: 'pages',
              id: p.id,
              data: {
                  wpRawContent: content
              }
          });
          console.log('Removed vc_empty_space after portfolio slider.');
      }
  }
  
  process.exit(0);
}
main().catch(console.error);
