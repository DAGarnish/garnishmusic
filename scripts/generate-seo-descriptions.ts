import { getPayload } from "payload";
import config from "../payload.config";
import fs from "fs";

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/&#8211;|&#8212;/g, "-");
}

function plainTextFromRaw(raw: string): string {
  const noShortcodes = raw.replace(/\[\/?[a-zA-Z_][a-zA-Z0-9_]*(?:\s[^\]]*)?\]/g, " ");
  const noTags = noShortcodes.replace(/<[^>]+>/g, " ");
  const decoded = decodeEntities(noTags);
  return decoded.replace(/\s+/g, " ").trim();
}

function truncate(text: string, maxLen = 160, minLen = 60): string {
  let t = text.replace(/^Bio\s+/, "").trim();
  if (t.length <= maxLen) return t;
  const window = t.slice(0, maxLen + 1);
  const lastSentenceEnd = Math.max(window.lastIndexOf(". "), window.lastIndexOf("! "), window.lastIndexOf("? "));
  if (lastSentenceEnd >= minLen) return window.slice(0, lastSentenceEnd + 1).trim();
  const lastSpace = window.slice(0, maxLen).lastIndexOf(" ");
  return (lastSpace >= minLen ? window.slice(0, lastSpace) : window.slice(0, maxLen)).trim().replace(/[,;:-]$/, "") + "...";
}

// Manual descriptions for pages with no usable extractable text (WooCommerce
// functional pages, affiliate portal, internal test/debug pages, thin
// Lorem-Ipsum stub pages, and the few real pages worth a hand-written
// description rather than an auto-truncated one).
const MANUAL: Record<number, string> = {
  // la
  2317: "Internal test build of Garnish's homepage template - not a live public page.",
  2290: "Explore Garnish Music Production's programs in Los Angeles - academies, courses, and private instruction in music production and DJing.",
  2276: "Garnish's Comprehensive Academy in Los Angeles - a full music production and DJ curriculum for students starting from the ground up.",
  2275: "Music production and DJ training at Garnish Music Production School in Los Angeles.",
  2271: "Book your music production or DJ course at Garnish Music Production School in Los Angeles.",
  2263: "News, tips, and stories from Garnish Music Production School in Los Angeles.",
  2314: "Meet the studios, brands, and organizations Garnish Music Production partners with in Los Angeles.",
  2308: "Log in to the Garnish Music Production Los Angeles affiliate portal.",
  2307: "Register as an affiliate for Garnish Music Production School in Los Angeles.",
  2306: "Join the Garnish Music Production Los Angeles store affiliate program.",
  2273: "Manage your Garnish Music Production Los Angeles account, orders, and course bookings.",
  2272: "Secure checkout for Garnish Music Production School course bookings in Los Angeles.",
  2270: "Internal test page - not a live public page.",
  2269: "Browse courses and merchandise in the Garnish Music Production Los Angeles store.",
  2262: "Real student testimonials from Garnish Music Production School in Los Angeles.",
  2261: "Internal legacy test page - not a live public page.",
  2379: "Cole Nystrom began his career as an Assistant Engineer at the world class Echobar Studios, alongside seasoned Multi-Platinum engineers Bob Horn and Erik Reichers.",
  2368: "SongCraft Pro is Garnish LA's Ultimate Hit Songwriter Producer Program - for artists, songwriters, producers, and DJs who want to write and produce release-ready hit records.",
  2287: "Apply to Garnish Music Production School's Comprehensive Academy in Los Angeles - fill out the form to get started.",
  2285: "Read real reviews from Garnish Music Production School students in Los Angeles.",
  2281: "Book a two-to-three-hour DJ group session with friends, family, or coworkers - a fun alternative to the usual brunch or happy hour, at Garnish Music Production School in Los Angeles.",
  2297: "See Garnish Music Production School's upcoming course schedule in Los Angeles and enroll in an upcoming class.",
  2299: "Pay your Garnish Music Production Los Angeles course fees via Venmo.",
  2292: "Start producing the electronic music you love in Garnish's intimate Urban Music Academy classes in Los Angeles.",
  2324: "Garnish Los Angeles is operated by Loud Boy Music LLC. Read our terms covering course locations, bookings, and policies.",
  2293: "Garnish Music Production's privacy policy - how we collect, use, and protect your personal data.",
  2283: "A two-day, hands-on iOS Deployment Essentials course at Garnish Music Production School's Los Angeles facility.",
  // mia
  2548: "Meet the studios, brands, and organizations Garnish Music Production partners with in Miami.",
  2542: "Log in to the Garnish Music Production Miami affiliate portal.",
  2541: "Register as an affiliate for Garnish Music Production School in Miami.",
  2540: "Join the Garnish Music Production Miami store affiliate program.",
  2532: "Explore Garnish Music Production's programs in Miami - academies, courses, and private instruction in music production and DJing.",
  2518: "Garnish's Comprehensive Academy in Miami - a full music production and DJ curriculum for students starting from the ground up.",
  2517: "Music production and DJ training at Garnish Music Production School in Miami.",
  2515: "Manage your Garnish Music Production Miami account, orders, and course bookings.",
  2514: "Secure checkout for Garnish Music Production School course bookings in Miami.",
  2513: "Review your cart before checking out at Garnish Music Production School in Miami.",
  2512: "Book your music production or DJ course at Garnish Music Production School in Miami.",
  2511: "Internal test page - not a live public page.",
  2510: "Browse courses and merchandise in the Garnish Music Production Miami store.",
  2506: "Service policies and support information for Garnish Music Production School students in Miami.",
  2505: "Get in touch with Garnish Music Production School in Miami - studio address, phone number, and directions to book your free consultation.",
  2504: "News, tips, and stories from Garnish Music Production School in Miami.",
  2503: "Real student testimonials from Garnish Music Production School in Miami.",
  2529: "Apply to Garnish Music Production School's Comprehensive Academy in Miami - fill out the form to get started.",
  2528: "As a certified training provider for Apple, Garnish Miami is endorsed to proctor exams in a range of Apple-certified subjects.",
  2527: "Read real reviews from Garnish Music Production School students in Miami.",
  2523: "Book a two-to-three-hour DJ group session with friends, family, or coworkers - a fun alternative to the usual brunch or happy hour, at Garnish Music Production School in Miami.",
  2537: "See Garnish Music Production School's upcoming course schedule in Miami and enroll in an upcoming class.",
  2534: "Start producing the electronic music you love in Garnish's intimate Urban Music Academy classes in Miami.",
  2535: "Garnish Music Production's privacy policy - how we collect, use, and protect your personal data.",
  2525: "A two-day, hands-on iOS Deployment Essentials course at Garnish Music Production School's Miami facility.",
};

async function main() {
  const payload = await getPayload({ config });
  const out: any[] = [];

  for (const [label, siteId] of [["la", 22], ["mia", 24]] as const) {
    const pages = await payload.find({ collection: "pages", where: { site: { equals: siteId } }, limit: 1000, depth: 0 });
    for (const doc of pages.docs as any[]) {
      const desc = (doc.seo?.metaDescription || "").trim();
      const looksLikeShortcode = /\[vc_|\[mkd_|\[\/vc_|\[\/mkd_|\[Affiliates|\[woocommerce/i.test(desc);
      const needsFix = !desc || looksLikeShortcode || desc.length < 20;
      if (!needsFix) continue;

      if (MANUAL[doc.id]) {
        out.push({ id: doc.id, site: label, slug: doc.slug, title: doc.title, source: "manual", newDesc: MANUAL[doc.id] });
        continue;
      }

      const fromRaw = plainTextFromRaw(doc.wpRawContent || "");
      const fromCurrent = plainTextFromRaw(desc);
      const best = fromRaw.length > 40 ? fromRaw : fromCurrent;
      const newDesc = truncate(best);
      out.push({
        id: doc.id,
        site: label,
        slug: doc.slug,
        title: doc.title,
        source: fromRaw.length > 40 ? "wpRawContent" : "currentDesc",
        newDesc,
      });
    }
  }

  const stillEmpty = out.filter((o) => !o.newDesc || o.newDesc.length < 20);
  fs.writeFileSync("/tmp/seo-generated.json", JSON.stringify(out, null, 2));
  console.log("total:", out.length, "| still empty/too-short after generation:", stillEmpty.length);
  if (stillEmpty.length) console.log(JSON.stringify(stillEmpty, null, 2));
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
