import { getPayload } from "payload";
import config from "../payload.config";

// Crawls every real, rendered la/mia page on the local dev server and
// checks the actual HTML response for literal leaked WPBakery/WP shortcode
// text (e.g. "[vc_row]", "[mkd_button ...]", "[woocommerce_cart]") - the
// same class of migration bug found in metaDescription (see
// scripts/generate-seo-descriptions.ts), but here checking whether any made
// it into the visible page itself rather than just an SEO field.
const SHORTCODE_RE =
  /\[\/?(?:vc_|mkd_|rev_slider|woocommerce_|Affiliates|contact-form-7)[a-zA-Z0-9_-]*(?:\s[^\]<>]*)?\]/g;

function stripNonVisible(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
}

async function main() {
  const payload = await getPayload({ config });
  const sites: { label: string; siteId: number; host: string }[] = [
    { label: "la", siteId: 22, host: "http://la.localhost:3000" },
    { label: "mia", siteId: 24, host: "http://mia.localhost:3000" },
  ];

  const hits: any[] = [];
  let checked = 0;

  for (const site of sites) {
    const pages = await payload.find({
      collection: "pages",
      where: { site: { equals: site.siteId } },
      limit: 1000,
      depth: 0,
    });
    const slugs = ["", ...(pages.docs as any[]).map((d) => d.slug)];

    const concurrency = 8;
    let idx = 0;
    async function worker() {
      while (idx < slugs.length) {
        const mySlug = slugs[idx++];
        const url = `${site.host}/${mySlug}${mySlug ? "/" : ""}`;
        checked++;
        try {
          const res = await fetch(url, { signal: AbortSignal.timeout(20000), redirect: "manual" });
          if (res.status >= 300 && res.status < 400) continue; // redirect target isn't this site's own content
          if (!res.ok && res.status !== 404) {
            hits.push({ site: site.label, slug: mySlug || "(home)", url, issue: `HTTP ${res.status}` });
            continue;
          }
          if (res.status === 404) continue;
          const html = await res.text();
          const visible = stripNonVisible(html);
          const matches = visible.match(SHORTCODE_RE);
          if (matches && matches.length) {
            const unique = [...new Set(matches)].slice(0, 8);
            hits.push({ site: site.label, slug: mySlug || "(home)", url, issue: "shortcode-leak", samples: unique, count: matches.length });
          }
        } catch (e: any) {
          hits.push({ site: site.label, slug: mySlug || "(home)", url, issue: `fetch error: ${e.message}` });
        }
      }
    }
    await Promise.all(Array.from({ length: concurrency }, worker));
  }

  console.log(`checked ${checked} URLs, ${hits.length} with issues`);
  console.log(JSON.stringify(hits, null, 2));
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
