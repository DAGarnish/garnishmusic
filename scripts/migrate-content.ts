import { getPayload } from "payload";
import config from "../payload.config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getWpConnection, tablePrefixForBlog, BASE_PREFIX } from "./wp-db";
import { buildAttachmentIndex, resolveAttachmentIdFromUrl } from "./wp-media";
import { wpContentToLexical } from "./wp-content-to-lexical";
import { htmlToPlainText } from "./html-to-lexical";
import type { MediaResolver } from "./html-to-lexical";
import { decodeHTML } from "entities";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const MAP_FILE = path.resolve(dirname, ".media-map.json");
const PORTFOLIO_URLS_FILE = path.resolve(dirname, ".portfolio-urls.json");

type MediaMap = Record<string, Record<string, number | string>>;
type PortfolioUrlMap = Record<string, Record<string, string | null>>;

function stripSlashes(p: string): string {
  return p.replace(/^\/+/, "").replace(/\/+$/, "");
}

function getMetaValue(metaRows: any[], postId: number, key: string): string | undefined {
  const row = metaRows.find((r) => r.post_id === postId && r.meta_key === key);
  return row?.meta_value ? decodeHTML(row.meta_value) : undefined;
}

async function main() {
  const payload = await getPayload({ config });
  const conn = await getWpConnection();
  const mediaMap: MediaMap = JSON.parse(fs.readFileSync(MAP_FILE, "utf-8"));
  const portfolioUrls: PortfolioUrlMap = fs.existsSync(PORTFOLIO_URLS_FILE)
    ? JSON.parse(fs.readFileSync(PORTFOLIO_URLS_FILE, "utf-8"))
    : {};

  const onlyDomain = process.argv[2];
  const allSites = await payload.find({ collection: "sites", limit: 100 });
  const sites = onlyDomain ? allSites.docs.filter((s) => s.domain === onlyDomain) : allSites.docs;

  // shared global users table (multisite-wide)
  const [userRows] = await conn.query<any[]>(`SELECT ID, display_name FROM ${BASE_PREFIX}users;`);
  const usersById = new Map<number, string>((userRows as any[]).map((u) => [u.ID, u.display_name]));

  let totals = { pages: 0, posts: 0, products: 0 };

  for (const site of sites) {
    const blogId = site.wpBlogId as number;
    const prefix = tablePrefixForBlog(blogId);
    console.log(`\n=== ${site.domain} (blog ${blogId}) ===`);

    const { byFilenameKey } = await buildAttachmentIndex(conn, prefix);
    const siteMediaMap = mediaMap[site.domain] || {};

    const mediaResolver: MediaResolver = (srcOrMarker: string) => {
      let wpId: number | undefined;
      if (srcOrMarker.startsWith("__wpid__")) {
        wpId = parseInt(srcOrMarker.replace("__wpid__", ""), 10);
      } else {
        wpId = resolveAttachmentIdFromUrl(srcOrMarker, byFilenameKey);
      }
      if (wpId === undefined) return undefined;
      return siteMediaMap[wpId];
    };

    // Preload category/tag lookups for this site
    const existingCategories = await payload.find({
      collection: "categories",
      where: { site: { equals: site.id } },
      limit: 1000,
    });
    const categoryByWpId = new Map<number, number | string>(
      existingCategories.docs.map((c: any) => [c.wpTermId, c.id])
    );
    const existingTags = await payload.find({
      collection: "tags",
      where: { site: { equals: site.id } },
      limit: 1000,
    });
    const tagByWpId = new Map<number, number | string>(
      existingTags.docs.map((t: any) => [t.wpTermId, t.id])
    );

    // ===== PAGES (incl. Buro theme's "portfolio-item" post type, used for
    // course and instructor pages) =====
    const [pages] = await conn.query<any[]>(
      `SELECT ID, post_title, post_name, post_content, post_excerpt, post_date, post_type, post_parent
       FROM ${prefix}posts WHERE post_type IN ('page','portfolio-item') AND post_status='publish';`
    );

    const pageIds = (pages as any[]).map((p) => p.ID);
    let pageMeta: any[] = [];
    if (pageIds.length > 0) {
      const [metaRows] = await conn.query<any[]>(
        `SELECT post_id, meta_key, meta_value FROM ${prefix}postmeta
         WHERE post_id IN (${pageIds.join(",")}) AND meta_key IN
         ('_thumbnail_id','_yoast_wpseo_title','_yoast_wpseo_metadesc','rank_math_title','rank_math_description','mkd_title_area_background_image_meta','edgtf_title_area_background_image_meta','rank_math_robots','_yoast_wpseo_meta-robots-noindex','_wpb_post_custom_css');`
      );
      pageMeta = metaRows as any[];
    }

    // Resolve parent post_name for hierarchical pages (always exactly 1 level deep)
    const parentIds = [...new Set((pages as any[]).filter((p) => p.post_parent).map((p) => p.post_parent))];
    const parentNameById = new Map<number, string>();
    if (parentIds.length > 0) {
      const [parents] = await conn.query<any[]>(
        `SELECT ID, post_name FROM ${prefix}posts WHERE ID IN (${parentIds.join(",")});`
      );
      for (const parent of parents as any[]) {
        parentNameById.set(parent.ID, parent.post_name);
      }
    }

    function computeFullPath(p: any): string {
      const ownSlug = p.post_name || `${p.post_type}-${p.ID}`;
      if (p.post_type === "portfolio-item") {
        const crawled = portfolioUrls[site.domain]?.[String(p.ID)];
        if (crawled) return stripSlashes(crawled);
        return ownSlug; // fallback, shouldn't happen given 0 crawl failures
      }
      if (p.post_parent && parentNameById.has(p.post_parent)) {
        return `${parentNameById.get(p.post_parent)}/${ownSlug}`;
      }
      return ownSlug;
    }

    for (const p of pages as any[]) {
      const existing = await payload.find({
        collection: "pages",
        where: { and: [{ site: { equals: site.id } }, { wpPostId: { equals: p.ID } }] },
        limit: 1,
      });

      const thumbId = getMetaValue(pageMeta, p.ID, "_thumbnail_id");
      const featuredImage = thumbId ? siteMediaMap[parseInt(thumbId, 10)] : undefined;
      const titleBgUrl = getMetaValue(pageMeta, p.ID, "mkd_title_area_background_image_meta") || getMetaValue(pageMeta, p.ID, "edgtf_title_area_background_image_meta");
      const titleBgWpId = titleBgUrl ? resolveAttachmentIdFromUrl(titleBgUrl, byFilenameKey) : undefined;
      const titleBackgroundImage = titleBgWpId !== undefined ? siteMediaMap[titleBgWpId] : undefined;
      const metaTitle =
        getMetaValue(pageMeta, p.ID, "rank_math_title") ||
        getMetaValue(pageMeta, p.ID, "_yoast_wpseo_title");
      const metaDescription =
        getMetaValue(pageMeta, p.ID, "rank_math_description") ||
        getMetaValue(pageMeta, p.ID, "_yoast_wpseo_metadesc");
      const rankMathRobots = getMetaValue(pageMeta, p.ID, "rank_math_robots");
      const yoastNoindex = getMetaValue(pageMeta, p.ID, "_yoast_wpseo_meta-robots-noindex");
      const noindex = Boolean(rankMathRobots?.includes("noindex") || yoastNoindex === "1");
      const customCss = getMetaValue(pageMeta, p.ID, "_wpb_post_custom_css");

      const content = wpContentToLexical(p.post_content, mediaResolver);
      const excerpt = decodeHTML(p.post_excerpt?.trim() || "") || htmlToPlainText(p.post_content).slice(0, 300);
      const fullPath = computeFullPath(p);

      const data = {
        title: decodeHTML(p.post_title?.trim() || "") || p.post_name || `page-${p.ID}`,
        slug: fullPath,
        site: site.id,
        status: "published" as const,
        featuredImage: featuredImage ?? undefined,
        titleBackgroundImage: titleBackgroundImage ?? undefined,
        content,
        excerpt,
        seo: { metaTitle, metaDescription, noindex },
        wpPostId: p.ID,
        wpRawContent: p.post_content,
        customCss: customCss ?? undefined,
      };

      try {
        if (existing.docs.length > 0) {
          await payload.update({ collection: "pages", id: existing.docs[0].id, data });
        } else {
          await payload.create({ collection: "pages", data });
        }
        totals.pages += 1;
      } catch (err) {
        console.log(`  PAGE ERROR (${p.post_title}): ${(err as Error).message.slice(0, 200)}`);
      }
    }
    console.log(`  Pages migrated: ${(pages as any[]).length}`);

    // ===== POSTS =====
    const [posts] = await conn.query<any[]>(
      `SELECT ID, post_title, post_name, post_content, post_excerpt, post_date, post_author
       FROM ${prefix}posts WHERE post_type='post' AND post_status='publish';`
    );
    const postIds = (posts as any[]).map((p) => p.ID);
    let postMeta: any[] = [];
    let postTerms: any[] = [];
    if (postIds.length > 0) {
      const [metaRows] = await conn.query<any[]>(
        `SELECT post_id, meta_key, meta_value FROM ${prefix}postmeta
         WHERE post_id IN (${postIds.join(",")}) AND meta_key IN
         ('_thumbnail_id','_yoast_wpseo_title','_yoast_wpseo_metadesc','rank_math_title','rank_math_description','mkd_title_area_background_image_meta','edgtf_title_area_background_image_meta','rank_math_robots','_yoast_wpseo_meta-robots-noindex');`
      );
      postMeta = metaRows as any[];
      const [termRows] = await conn.query<any[]>(
        `SELECT tr.object_id, tt.taxonomy, tt.term_id
         FROM ${prefix}term_relationships tr
         JOIN ${prefix}term_taxonomy tt ON tt.term_taxonomy_id = tr.term_taxonomy_id
         WHERE tr.object_id IN (${postIds.join(",")}) AND tt.taxonomy IN ('category','post_tag');`
      );
      postTerms = termRows as any[];
    }

    for (const p of posts as any[]) {
      const existing = await payload.find({
        collection: "posts",
        where: { and: [{ site: { equals: site.id } }, { wpPostId: { equals: p.ID } }] },
        limit: 1,
      });
      const thumbId = getMetaValue(postMeta, p.ID, "_thumbnail_id");
      const featuredImage = thumbId ? siteMediaMap[parseInt(thumbId, 10)] : undefined;
      const titleBgUrl = getMetaValue(postMeta, p.ID, "mkd_title_area_background_image_meta") || getMetaValue(postMeta, p.ID, "edgtf_title_area_background_image_meta");
      const titleBgWpId = titleBgUrl ? resolveAttachmentIdFromUrl(titleBgUrl, byFilenameKey) : undefined;
      const titleBackgroundImage = titleBgWpId !== undefined ? siteMediaMap[titleBgWpId] : undefined;
      const metaTitle =
        getMetaValue(postMeta, p.ID, "rank_math_title") ||
        getMetaValue(postMeta, p.ID, "_yoast_wpseo_title");
      const metaDescription =
        getMetaValue(postMeta, p.ID, "rank_math_description") ||
        getMetaValue(postMeta, p.ID, "_yoast_wpseo_metadesc");
      const rankMathRobots = getMetaValue(postMeta, p.ID, "rank_math_robots");
      const yoastNoindex = getMetaValue(postMeta, p.ID, "_yoast_wpseo_meta-robots-noindex");
      const noindex = Boolean(rankMathRobots?.includes("noindex") || yoastNoindex === "1");

      const categories = postTerms
        .filter((t) => t.object_id === p.ID && t.taxonomy === "category")
        .map((t) => categoryByWpId.get(t.term_id))
        .filter((id): id is number | string => id !== undefined);
      const tags = postTerms
        .filter((t) => t.object_id === p.ID && t.taxonomy === "post_tag")
        .map((t) => tagByWpId.get(t.term_id))
        .filter((id): id is number | string => id !== undefined);

      const content = wpContentToLexical(p.post_content, mediaResolver);
      const excerpt = decodeHTML(p.post_excerpt?.trim() || "") || htmlToPlainText(p.post_content).slice(0, 300);

      const data = {
        title: decodeHTML(p.post_title?.trim() || "") || p.post_name || `post-${p.ID}`,
        slug: p.post_name || `post-${p.ID}`,
        site: site.id,
        status: "published" as const,
        author: usersById.get(p.post_author) || undefined,
        publishedDate: p.post_date,
        featuredImage: featuredImage ?? undefined,
        titleBackgroundImage: titleBackgroundImage ?? undefined,
        content,
        excerpt,
        categories,
        tags,
        seo: { metaTitle, metaDescription, noindex },
        wpPostId: p.ID,
      };

      try {
        if (existing.docs.length > 0) {
          await payload.update({ collection: "posts", id: existing.docs[0].id, data });
        } else {
          await payload.create({ collection: "posts", data });
        }
        totals.posts += 1;
      } catch (err) {
        console.log(`  POST ERROR (${p.post_title}): ${(err as Error).message.slice(0, 200)}`);
      }
    }
    console.log(`  Posts migrated: ${(posts as any[]).length}`);

    // ===== PRODUCTS =====
    const [products] = await conn.query<any[]>(
      `SELECT ID, post_title, post_name, post_content, post_excerpt
       FROM ${prefix}posts WHERE post_type='product' AND post_status='publish';`
    );
    const productIds = (products as any[]).map((p) => p.ID);
    let productMeta: any[] = [];
    let productTerms: any[] = [];
    if (productIds.length > 0) {
      const [metaRows] = await conn.query<any[]>(
        `SELECT post_id, meta_key, meta_value FROM ${prefix}postmeta
         WHERE post_id IN (${productIds.join(",")}) AND meta_key IN
         ('_thumbnail_id','_product_image_gallery','_price','_regular_price','_sale_price','_sku','_stock_status','_stock');`
      );
      productMeta = metaRows as any[];
      const [termRows] = await conn.query<any[]>(
        `SELECT tr.object_id, tt.term_id
         FROM ${prefix}term_relationships tr
         JOIN ${prefix}term_taxonomy tt ON tt.term_taxonomy_id = tr.term_taxonomy_id
         WHERE tr.object_id IN (${productIds.join(",")}) AND tt.taxonomy = 'product_cat';`
      );
      productTerms = termRows as any[];
    }

    for (const p of products as any[]) {
      const existing = await payload.find({
        collection: "products",
        where: { and: [{ site: { equals: site.id } }, { wpProductId: { equals: p.ID } }] },
        limit: 1,
      });
      const thumbId = getMetaValue(productMeta, p.ID, "_thumbnail_id");
      const galleryRaw = getMetaValue(productMeta, p.ID, "_product_image_gallery");
      const galleryIds = galleryRaw
        ? galleryRaw.split(",").map((s) => parseInt(s, 10))
        : [];
      const allImageWpIds = [
        ...(thumbId ? [parseInt(thumbId, 10)] : []),
        ...galleryIds,
      ];
      const images = allImageWpIds
        .map((id) => siteMediaMap[id])
        .filter((id): id is number | string => id !== undefined);

      const categories = productTerms
        .filter((t) => t.object_id === p.ID)
        .map((t) => categoryByWpId.get(t.term_id))
        .filter((id): id is number | string => id !== undefined);

      const price = getMetaValue(productMeta, p.ID, "_price");
      const regularPrice = getMetaValue(productMeta, p.ID, "_regular_price");
      const salePrice = getMetaValue(productMeta, p.ID, "_sale_price");
      const sku = getMetaValue(productMeta, p.ID, "_sku");
      const stockStatus = getMetaValue(productMeta, p.ID, "_stock_status");
      const stock = getMetaValue(productMeta, p.ID, "_stock");

      const description = wpContentToLexical(p.post_content, mediaResolver);
      const shortDescription = decodeHTML(p.post_excerpt?.trim() || "") || htmlToPlainText(p.post_content).slice(0, 300);

      const data = {
        name: decodeHTML(p.post_title?.trim() || "") || p.post_name || `product-${p.ID}`,
        slug: `product/${p.post_name || `product-${p.ID}`}`,
        site: site.id,
        sku,
        description,
        shortDescription,
        price: price ? parseFloat(price) : regularPrice ? parseFloat(regularPrice) : undefined,
        salePrice: salePrice ? parseFloat(salePrice) : undefined,
        stockStatus: (stockStatus === "instock" || stockStatus === "outofstock" || stockStatus === "onbackorder"
          ? stockStatus
          : "instock") as "instock" | "outofstock" | "onbackorder",
        stockQuantity: stock ? parseInt(stock, 10) : undefined,
        images,
        categories,
        status: "published" as const,
        wpProductId: p.ID,
      };

      try {
        if (existing.docs.length > 0) {
          await payload.update({ collection: "products", id: existing.docs[0].id, data });
        } else {
          await payload.create({ collection: "products", data });
        }
        totals.products += 1;
      } catch (err) {
        console.log(`  PRODUCT ERROR (${p.post_title}): ${(err as Error).message.slice(0, 200)}`);
      }
    }
    console.log(`  Products migrated: ${(products as any[]).length}`);
  }

  await conn.end();
  console.log(`\nDONE.`, totals);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
