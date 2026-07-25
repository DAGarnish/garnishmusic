import { getPayload } from "payload";
import { Client } from "pg";
import sqliteConfig from "../payload.config";
import postgresConfig from "../payload.config.postgres";

const PAGE_SIZE = 200;

const S3_BASE_URL = `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com`;

function s3Url(filename: string | null | undefined): string | null {
  return filename ? `${S3_BASE_URL}/${filename}` : null;
}

async function migrateMedia(sourcePayload: any, pgClient: Client, sitesMap: Map<any, any>): Promise<Map<any, any>> {
  const idMap = new Map<any, any>();
  let page = 1;
  let total = 0;
  let migrated = 0;

  while (true) {
    const result = await sourcePayload.find({ collection: "media", limit: PAGE_SIZE, page, depth: 0 });
    total = result.totalDocs;
    if (result.docs.length === 0) break;

    for (const doc of result.docs) {
      const oldId = doc.id;
      try {
        const siteId = doc.site ? remapId(sitesMap, typeof doc.site === "object" ? doc.site.id : doc.site) : null;
        const sizes = doc.sizes || {};

        const res = await pgClient.query(
          `INSERT INTO media (
            alt, site_id, wp_attachment_id, wp_source_url,
            url, thumbnail_u_r_l, filename, mime_type, filesize, width, height, focal_x, focal_y,
            sizes_thumbnail_url, sizes_thumbnail_width, sizes_thumbnail_height, sizes_thumbnail_mime_type, sizes_thumbnail_filesize, sizes_thumbnail_filename,
            sizes_medium_url, sizes_medium_width, sizes_medium_height, sizes_medium_mime_type, sizes_medium_filesize, sizes_medium_filename,
            sizes_large_url, sizes_large_width, sizes_large_height, sizes_large_mime_type, sizes_large_filesize, sizes_large_filename
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31)
          RETURNING id`,
          [
            doc.alt ?? null,
            siteId ?? null,
            doc.wpAttachmentId ?? null,
            doc.wpSourceUrl ?? null,
            s3Url(doc.filename),
            null,
            doc.filename ?? null,
            doc.mimeType ?? null,
            doc.filesize ?? null,
            doc.width ?? null,
            doc.height ?? null,
            doc.focalX ?? null,
            doc.focalY ?? null,
            s3Url(sizes.thumbnail?.filename),
            sizes.thumbnail?.width ?? null,
            sizes.thumbnail?.height ?? null,
            sizes.thumbnail?.mimeType ?? null,
            sizes.thumbnail?.filesize ?? null,
            sizes.thumbnail?.filename ?? null,
            s3Url(sizes.medium?.filename),
            sizes.medium?.width ?? null,
            sizes.medium?.height ?? null,
            sizes.medium?.mimeType ?? null,
            sizes.medium?.filesize ?? null,
            sizes.medium?.filename ?? null,
            s3Url(sizes.large?.filename),
            sizes.large?.width ?? null,
            sizes.large?.height ?? null,
            sizes.large?.mimeType ?? null,
            sizes.large?.filesize ?? null,
            sizes.large?.filename ?? null,
          ]
        );
        idMap.set(oldId, res.rows[0].id);
        migrated++;
      } catch (err) {
        console.error(`  ERROR migrating media id=${oldId}: ${(err as Error).message.slice(0, 300)}`);
      }
    }

    console.log(`  media: ${migrated}/${total} migrated (page ${page})`);
    if (!result.hasNextPage) break;
    page++;
  }

  return idMap;
}

function remapId(map: Map<any, any>, oldId: any): any {
  if (oldId == null) return oldId;
  const mapped = map.get(oldId);
  if (mapped === undefined) {
    console.warn(`  WARN: no mapping found for id ${oldId}`);
    return undefined;
  }
  return mapped;
}

function remapRelation(map: Map<any, any>, value: any): any {
  if (value == null) return undefined;
  if (Array.isArray(value)) {
    return value.map((v) => remapRelation(map, v)).filter((v) => v !== undefined);
  }
  const id = typeof value === "object" ? value.id : value;
  return remapId(map, id);
}

async function migrateCollection(
  sourcePayload: any,
  destPayload: any,
  collection: string,
  transform: (doc: any) => any
): Promise<Map<any, any>> {
  const idMap = new Map<any, any>();
  let page = 1;
  let total = 0;
  let migrated = 0;

  while (true) {
    const result = await sourcePayload.find({ collection, limit: PAGE_SIZE, page, depth: 0 });
    total = result.totalDocs;
    if (result.docs.length === 0) break;

    for (const doc of result.docs) {
      const oldId = doc.id;
      try {
        const data = transform(doc);
        const created = await destPayload.create({ collection, data });
        idMap.set(oldId, created.id);
        migrated++;
      } catch (err) {
        console.error(`  ERROR migrating ${collection} id=${oldId}: ${(err as Error).message.slice(0, 300)}`);
      }
    }

    console.log(`  ${collection}: ${migrated}/${total} migrated (page ${page})`);
    if (!result.hasNextPage) break;
    page++;
  }

  return idMap;
}

async function main() {
  console.log("Connecting to source (SQLite) and destination (Neon Postgres)...");
  // getPayload() caches its instance globally keyed by `key` (defaulting to
  // "default"), so calling it twice without distinct keys would silently
  // return the SAME cached (SQLite) instance for both source and dest.
  const source = await getPayload({ config: sqliteConfig, key: "sqlite-source" });
  const dest = await getPayload({ config: postgresConfig, key: "postgres-dest" });
  const pgClient = new Client({
    connectionString: process.env.POSTGRES_URI,
    connectionTimeoutMillis: 10000,
    statement_timeout: 30000,
    query_timeout: 30000,
  });
  await pgClient.connect();

  const maps: Record<string, Map<any, any>> = {};

  console.log("\n=== sites ===");
  maps.sites = await migrateCollection(source, dest, "sites", (d) => {
    const { id, createdAt, updatedAt, ...rest } = d;
    return rest;
  });

  console.log("\n=== users ===");
  maps.users = await migrateCollection(source, dest, "users", (d) => {
    const { id, createdAt, updatedAt, sites, ...rest } = d;
    return { ...rest, sites: remapRelation(maps.sites, sites) };
  });

  console.log("\n=== media ===");
  // Payload's create() requires an actual `file:` for upload collections, which
  // we don't want to re-run through sharp for 12k files. Files are already
  // uploaded to S3 directly (scripts/upload-media-to-s3.ts), so insert rows via
  // raw SQL referencing the S3 URLs instead of going through payload.create().
  maps.media = await migrateMedia(source, pgClient, maps.sites);

  console.log("\n=== categories ===");
  maps.categories = await migrateCollection(source, dest, "categories", (d) => {
    const { id, createdAt, updatedAt, site, ...rest } = d;
    return { ...rest, site: remapRelation(maps.sites, site) };
  });

  console.log("\n=== tags ===");
  maps.tags = await migrateCollection(source, dest, "tags", (d) => {
    const { id, createdAt, updatedAt, site, ...rest } = d;
    return { ...rest, site: remapRelation(maps.sites, site) };
  });

  console.log("\n=== pages ===");
  maps.pages = await migrateCollection(source, dest, "pages", (d) => {
    const { id, createdAt, updatedAt, site, featuredImage, titleBackgroundImage, portfolioCategories, ...rest } = d;
    return {
      ...rest,
      site: remapRelation(maps.sites, site),
      featuredImage: remapRelation(maps.media, featuredImage),
      titleBackgroundImage: remapRelation(maps.media, titleBackgroundImage),
      portfolioCategories: remapRelation(maps.categories, portfolioCategories),
    };
  });

  console.log("\n=== posts ===");
  maps.posts = await migrateCollection(source, dest, "posts", (d) => {
    const { id, createdAt, updatedAt, site, featuredImage, titleBackgroundImage, categories, tags, ...rest } = d;
    return {
      ...rest,
      site: remapRelation(maps.sites, site),
      featuredImage: remapRelation(maps.media, featuredImage),
      titleBackgroundImage: remapRelation(maps.media, titleBackgroundImage),
      categories: remapRelation(maps.categories, categories),
      tags: remapRelation(maps.tags, tags),
    };
  });

  console.log("\n=== products ===");
  maps.products = await migrateCollection(source, dest, "products", (d) => {
    const { id, createdAt, updatedAt, site, images, categories, ...rest } = d;
    return {
      ...rest,
      site: remapRelation(maps.sites, site),
      images: remapRelation(maps.media, images),
      categories: remapRelation(maps.categories, categories),
    };
  });

  console.log("\n=== testimonials ===");
  maps.testimonials = await migrateCollection(source, dest, "testimonials", (d) => {
    const { id, createdAt, updatedAt, site, image, categories, ...rest } = d;
    return {
      ...rest,
      site: remapRelation(maps.sites, site),
      image: remapRelation(maps.media, image),
      categories: remapRelation(maps.categories, categories),
    };
  });

  console.log("\n=== hero-sliders ===");
  maps.heroSliders = await migrateCollection(source, dest, "hero-sliders", (d) => {
    const { id, createdAt, updatedAt, site, slides, ...rest } = d;
    return {
      ...rest,
      site: remapRelation(maps.sites, site),
      slides: (slides || []).map((s: any) => ({
        text: s.text,
        image: remapRelation(maps.media, s.image),
      })),
    };
  });

  console.log("\n=== redirects ===");
  maps.redirects = await migrateCollection(source, dest, "redirects", (d) => {
    const { id, createdAt, updatedAt, site, ...rest } = d;
    return { ...rest, site: remapRelation(maps.sites, site) };
  });

  console.log("\n=== customers ===");
  maps.customers = await migrateCollection(source, dest, "customers", (d) => {
    const { id, createdAt, updatedAt, site, ...rest } = d;
    return { ...rest, site: remapRelation(maps.sites, site) };
  });

  console.log("\n=== form-submissions ===");
  maps.formSubmissions = await migrateCollection(source, dest, "form-submissions", (d) => {
    const { id, createdAt, updatedAt, site, ...rest } = d;
    return { ...rest, site: remapRelation(maps.sites, site) };
  });

  console.log("\n=== orders ===");
  maps.orders = await migrateCollection(source, dest, "orders", (d) => {
    const { id, createdAt, updatedAt, site, customer, lineItems, ...rest } = d;
    return {
      ...rest,
      site: remapRelation(maps.sites, site),
      customer: remapRelation(maps.customers, customer),
      lineItems: (lineItems || []).map((li: any) => ({
        ...li,
        product: remapRelation(maps.products, li.product),
      })),
    };
  });

  console.log("\nDONE. Summary:");
  for (const [name, map] of Object.entries(maps)) {
    console.log(`  ${name}: ${map.size} migrated`);
  }
  await pgClient.end();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
