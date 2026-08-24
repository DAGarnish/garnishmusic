import { getPayload } from "payload";
import fs from "fs";
import path from "path";

const envPath = path.resolve(".env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) process.env[match[1]] = match[2];
  });
}

// Curated set of edu blog categories worth their own homepage tile + archive
// page - picked from scripts/list-edu-categories.ts's output by post count
// (>=4) and genuine topic-ness, excluding author-name / admin / meta
// categories (e.g. "Rob Mills", "The Team", "Featured", "Diaries"). Re-run
// this (idempotent - matches on slug) if new categories cross that bar
// later; add them to TOPICS first.
// manualImage: for topics with no post carrying a featuredImage (checked via
// scripts/list-edu-categories.ts's hasImage column), a hand-picked media id
// reused from an existing course/product photo elsewhere in the network's
// library (verified visually before picking - see chat history) rather than
// sourcing anything new.
const TOPICS: { categoryId: number; title: string; renameTo?: string; manualImage?: number }[] = [
  { categoryId: 322, title: "Production" },
  { categoryId: 321, title: "Songwriting" },
  { categoryId: 811, title: "Ableton" },
  { categoryId: 810, title: "Logic Pro", manualImage: 2618 }, // Apple-Logic-Pro-11-Main.png - the auto-picked "logic-pro.jpg" was actually a mislabeled Ableton screenshot
  { categoryId: 814, title: "Mixing & Mastering", manualImage: 3062 }, // Mixing-18.jpg - waveform display
  { categoryId: 815, title: "Music Software", manualImage: 3833 }, // 20130809-DSC_9518.jpg - producer at DAW
  { categoryId: 323, title: "Electronic Music", manualImage: 3942 }, // DJ-Courses-Los-Angeles-16.jpg - hands on CDJ
  { categoryId: 823, title: "Music Business", renameTo: "Music Business", manualImage: 3931 }, // Graduation-scaled-19.jpg
  { categoryId: 822, title: "Composition", renameTo: "Composition", manualImage: 2573 }, // Songwiting-Class-Garnish-LA.png - piano writing session
  { categoryId: 316, title: "Sound Engineering", manualImage: 4223 }, // sound-engineering-cropped.jpg - cropped to remove the source photo's baked-in white border
  { categoryId: 834, title: "Hip-Hop", manualImage: 3057 }, // Hip-Hop-Production-Course-8.jpg - beat pad
  { categoryId: 817, title: "Acoustics", manualImage: 2577 }, // Control-Room-Modern.png - acoustically treated control room
];

async function main() {
  const config = (await import(path.resolve("payload.config"))).default;
  const payload = await getPayload({ config });

  const sitesRes = await payload.find({ collection: "sites", limit: 100, depth: 0 });
  const eduSite = (sitesRes.docs as any[]).find((s) => s.slug === "edu");
  if (!eduSite) throw new Error("edu site not found");

  for (const t of TOPICS) {
    if (t.renameTo) {
      await payload.update({ collection: "categories", id: t.categoryId, data: { name: t.renameTo } as any });
    }
  }

  let blogTopics = await payload.find({
    collection: "categories",
    where: { and: [{ site: { equals: eduSite.id } }, { slug: { equals: "blog-topics" } }] },
    limit: 1,
  });
  let blogTopicsId = blogTopics.docs[0]?.id;
  if (!blogTopicsId) {
    const created = await payload.create({
      collection: "categories",
      data: { name: "Blog Topics", slug: "blog-topics", site: eduSite.id } as any,
    });
    blogTopicsId = created.id;
    console.log(`Created "blog-topics" category (id ${blogTopicsId})`);
  }

  for (const t of TOPICS) {
    const category: any = await payload.findByID({ collection: "categories", id: t.categoryId, depth: 0 });
    const slug = `blog/${category.slug}`;

    const recentWithImage = await payload.find({
      collection: "posts",
      where: {
        and: [
          { site: { equals: eduSite.id } },
          { categories: { in: [t.categoryId] } },
          { featuredImage: { exists: true } },
        ],
      },
      sort: "-publishedDate",
      limit: 1,
      depth: 0,
    });
    const featuredImage = t.manualImage || recentWithImage.docs[0]?.featuredImage || undefined;

    // portfolioCustomTemplate:true is essential here - without it, a page
    // tagged with portfolioCategories falls into the narrow 75/25
    // "instructor/course single" template instead of the full-width one
    // (see app/(frontend)/[[...slug]]/page.tsx's portfolioCategories
    // branch), collapsing the 4-column blog grid down to ~175px wide.
    const wpRawContent = `[vc_row][vc_column][vc_empty_space height="18px"][vc_column_text]
<h1 style="text-align: center;">${t.title}</h1>
[/vc_column_text][vc_empty_space height="18px"][/vc_column][/vc_row][vc_row][vc_column][mkd_blog_list type="simple" category="${category.slug}" number_of_posts="500" order_by="date" order="DESC" number_of_columns="4"][/vc_column][/vc_row]`;

    const existing = await payload.find({
      collection: "pages",
      where: { and: [{ site: { equals: eduSite.id } }, { slug: { equals: slug } }] },
      limit: 1,
    });

    const data: any = {
      title: t.title,
      slug,
      site: eduSite.id,
      portfolioCategories: [blogTopicsId],
      portfolioCustomTemplate: true,
      wpRawContent,
      seo: { metaTitle: `${t.title} Articles - Garnish Music Production School` },
    };
    if (featuredImage) data.featuredImage = featuredImage;

    if (existing.docs[0]) {
      await payload.update({ collection: "pages", id: existing.docs[0].id, data });
      console.log(`Updated page /${slug}/ (id ${existing.docs[0].id})${featuredImage ? "" : " [no image]"}`);
    } else {
      const created = await payload.create({ collection: "pages", data });
      console.log(`Created page /${slug}/ (id ${created.id})${featuredImage ? "" : " [no image]"}`);
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
