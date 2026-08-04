import { getPayload } from "payload";
import config from "../payload.config";

// A second, separate site-wide CSS source that backfill-site-custom-css.ts
// never captured: the "Simple Custom CSS and JS" plugin, which injects its
// own <style> blocks (wrapped in <!-- start/end Simple Custom CSS and JS -->
// comments, no id attribute - distinct from WordPress core's own
// <style id="wp-custom-css"> Customizer output that backfill-site-custom-
// css.ts already scrapes). Confirmed against production: this is where
// utility classes like .img-bg-1, .custom-box-1/2, .btn-grand, .bg-1/.bg-2
// live - e.g. la's /courses/pro-tools-course/ "Course Highlights"/
// "Prerequisites" boxes depend on .img-bg-1 p's white background-color +
// border-radius, which was entirely missing from our migrated CSS, leaving
// raw text over an unmasked photo. Confirmed present identically on the
// site's homepage too (not page-scoped), so scraping once per site and
// merging into the same sites.customCss field the layout already renders
// is sufficient - no new frontend wiring needed.
//
// Placed BEFORE the existing (Customizer) customCss content in the merged
// string because that's production's own cascade order (Simple Custom CSS
// and JS's <style> tags appear earlier in <head> than <style id="wp-custom-
// css">), which matters when two rules share specificity.

const BLOCK_RE = /<!-- start Simple Custom CSS and JS -->([\s\S]*?)<!-- end Simple Custom CSS and JS -->/g;
const STYLE_RE = /<style[^>]*>([\s\S]*?)<\/style>/g;

function extractSimpleCustomCss(html: string): string {
  const parts: string[] = [];
  for (const blockMatch of html.matchAll(BLOCK_RE)) {
    const block = blockMatch[1];
    for (const styleMatch of block.matchAll(STYLE_RE)) {
      const css = styleMatch[1].trim();
      if (css) parts.push(css);
    }
  }
  return parts.join("\n\n");
}

async function main() {
  const onlyDomain = process.argv[2];
  const payload = await getPayload({ config });

  const allSites = await payload.find({ collection: "sites", limit: 100 });
  const sites = onlyDomain ? allSites.docs.filter((s: any) => s.domain === onlyDomain) : allSites.docs;

  for (const site of sites as any[]) {
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
      const scraped = extractSimpleCustomCss(html);
      if (!scraped) {
        console.log("SKIP (no Simple Custom CSS and JS block found)");
        continue;
      }

      const existing: string = site.customCss || "";
      // Idempotent: skip if this site's already been merged (rerun-safe).
      if (existing.includes(scraped)) {
        console.log(`SKIP (already merged, ${scraped.length} chars)`);
        continue;
      }

      const merged = existing ? `${scraped}\n\n${existing}` : scraped;
      await payload.update({
        collection: "sites",
        id: site.id,
        data: { customCss: merged },
      });
      console.log(`OK (+${scraped.length} chars, total ${merged.length})`);
    } catch (err) {
      console.log(`ERROR: ${(err as Error).message.slice(0, 150)}`);
    }
  }

  process.exit(0);
}

main();
