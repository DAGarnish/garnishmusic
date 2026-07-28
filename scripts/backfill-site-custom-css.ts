import { getPayload } from "payload";
import config from "../payload.config";

// Scrapes each site's live WordPress Customizer "Additional CSS"
// (rendered as <style id="wp-custom-css">...</style> on every page) and
// stores it on the matching Sites doc. This is a network-wide, per-site
// override (e.g. reduced in-content heading sizes) that was never part of
// migrate-content.ts, since it isn't page content - it's a theme_mods
// option. Scraped from the live site rather than read from the WordPress
// custom_css post type table, which can hold multiple stale/duplicate
// revisions with no reliable way to tell which one is actually active.

async function main() {
  const onlyDomain = process.argv[2];
  const payload = await getPayload({ config });

  const allSites = await payload.find({ collection: "sites", limit: 100 });
  const sites = onlyDomain ? allSites.docs.filter((s) => s.domain === onlyDomain) : allSites.docs;

  for (const site of sites) {
    process.stdout.write(`${site.domain} ... `);
    try {
      const res = await fetch(`https://${site.domain}/`, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; GarnishMigrationBot/1.0)" },
      });
      if (!res.ok) {
        console.log(`SKIP (HTTP ${res.status})`);
        continue;
      }
      const html = await res.text();
      const match = html.match(/<style id=["']wp-custom-css["']>([\s\S]*?)<\/style>/);
      if (!match) {
        console.log("SKIP (no wp-custom-css block found)");
        continue;
      }
      const css = match[1].trim();
      await payload.update({
        collection: "sites",
        id: site.id,
        data: { customCss: css },
      });
      console.log(`OK (${css.length} chars)`);
    } catch (err) {
      console.log(`ERROR: ${(err as Error).message.slice(0, 150)}`);
    }
  }

  process.exit(0);
}

main();
