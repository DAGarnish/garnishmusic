import { getPayload } from "payload";
import configPromise from "../payload.config";

async function run() {
  const config = await configPromise;
  const payload = await getPayload({ config });
  const sites = await payload.find({ collection: "sites", limit: 100 });
  const pdx = sites.docs.find((s: any) => s.slug === "pdx");

  const pages = await payload.find({
    collection: "pages",
    where: { and: [{ site: { equals: pdx!.id } }, { slug: { like: "courses/" } }] },
    limit: 100,
    depth: 1,
  });

  const instructorSlugs = [
    "james-ting","matthew-engst","vision-wong","jamaal-taylor","loren-moore",
    "appu-krishnan","cosmic-quest","zack-johnson","michael-hatsis","casey-k",
    "darryl-swann","matthew-kratz-aka-kraddy","darren-burgos","daniel-rosenwald",
    "vasco-ispirian","josh-brooks-pzb","eddie-grey","ellis-dj-dynamix-tenza",
    "pj-sledge","josh-garcia-aka-modus","dito-godwin","adam-moseley",
    "jerry-diphillippo","johnny-njo","pete-griffin","mark-v-sheldon-a-k-a-havoc-razor",
    "dave-garnish",
  ];

  for (const doc of pages.docs as any[]) {
    const shortSlug = doc.slug.replace("courses/", "");
    if (!instructorSlugs.includes(shortSlug)) continue;
    const cats = (doc.portfolioCategories || []).map((c: any) => (typeof c === "object" ? c.title : c));
    console.log({
      slug: doc.slug,
      title: doc.title,
      status: doc.status,
      hasFeaturedImage: !!doc.featuredImage,
      featuredImageUrl: doc.featuredImage?.url,
      cats,
      wpRawContentLen: doc.wpRawContent?.length || 0,
      excerptLen: doc.excerpt?.length || 0,
    });
  }
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
