import { getPayload } from "payload";
import config from "../payload.config";
import { getWpConnection, tablePrefixForBlog } from "./wp-db";
import https from "https";
import http from "http";

function findTextLayers(obj: any, out: string[] = []): string[] {
  if (obj == null || typeof obj !== "object") return out;
  if (obj.type === "text" && typeof obj.text === "string" && obj.text.trim()) {
    out.push(obj.text);
  }
  for (const key of Object.keys(obj)) {
    findTextLayers(obj[key], out);
  }
  return out;
}

function downloadBuffer(url: string): Promise<Buffer> {
  const lib = url.startsWith("https") ? https : http;
  return new Promise((resolve, reject) => {
    lib
      .get(url, { rejectUnauthorized: false }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          downloadBuffer(res.headers.location).then(resolve, reject);
          return;
        }
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      })
      .on("error", reject);
  });
}

async function main() {
  const payload = await getPayload({ config });
  const conn = await getWpConnection();

  const sites = await payload.find({ collection: "sites", limit: 100 });
  let totalSliders = 0;

  for (const site of sites.docs) {
    const blogId = site.wpBlogId as number;
    const prefix = tablePrefixForBlog(blogId);

    // Find every [rev_slider alias="X"] / [sr7 ... alias="X"] usage across
    // this blog's raw post_content, directly from WordPress (not our
    // already-migrated Payload content) to catch every reference.
    const [posts] = await conn.query<any[]>(
      `SELECT post_content FROM ${prefix}posts WHERE post_content LIKE '%rev_slider%' OR post_content LIKE '%[sr7 %';`
    );
    const aliases = new Set<string>();
    for (const p of posts as any[]) {
      for (const m of (p.post_content as string).matchAll(/\[(?:rev_slider|sr7)[^\]]*\balias="([^"]*)"/g)) {
        if (m[1]) aliases.add(m[1]);
      }
    }
    if (aliases.size === 0) {
      console.log(`${site.domain}: no slider aliases used`);
      continue;
    }

    let tableExists = true;
    try {
      await conn.query(`SELECT 1 FROM ${prefix}revslider_sliders LIMIT 1;`);
    } catch {
      tableExists = false;
    }
    if (!tableExists) {
      console.log(`${site.domain}: no revslider tables, skipping ${aliases.size} alias(es)`);
      continue;
    }

    for (const alias of aliases) {
      const [sliderRows] = await conn.query<any[]>(
        `SELECT id FROM ${prefix}revslider_sliders WHERE alias = ? LIMIT 1;`,
        [alias]
      );
      const slider = (sliderRows as any[])[0];
      if (!slider) {
        console.log(`${site.domain}: alias "${alias}" not found in revslider_sliders`);
        continue;
      }

      const [slideRows] = await conn.query<any[]>(
        `SELECT id, params, layers FROM ${prefix}revslider_slides WHERE slider_id = ? ORDER BY slide_order;`,
        [slider.id]
      );

      const slides: { imageId?: number | string; text?: string }[] = [];
      for (const row of slideRows as any[]) {
        let imageUrl: string | undefined;
        let text: string | undefined;
        try {
          const params = JSON.parse(row.params);
          imageUrl = params?.bg?.lastLoadedImage?.src;
        } catch {}
        try {
          const layers = JSON.parse(row.layers);
          const texts = findTextLayers(layers);
          text = texts[0];
        } catch {}

        let mediaId: number | string | undefined;
        if (imageUrl) {
          try {
            const existing = await payload.find({
              collection: "media",
              where: { wpSourceUrl: { equals: imageUrl } },
              limit: 1,
            });
            if (existing.docs[0]) {
              mediaId = existing.docs[0].id;
            } else {
              const buffer = await downloadBuffer(imageUrl);
              const filename = decodeURIComponent(imageUrl.split("/").pop() || `hero-${row.id}.jpg`);
              const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
              const mimetype = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
              const created = await payload.create({
                collection: "media",
                data: { alt: text || filename, site: site.id, wpSourceUrl: imageUrl },
                file: { data: buffer, mimetype, name: filename, size: buffer.length },
              });
              mediaId = created.id;
            }
          } catch (err) {
            console.log(`  image download failed for ${imageUrl}: ${(err as Error).message}`);
          }
        }

        slides.push({ imageId: mediaId, text });
      }

      const existingSlider = await payload.find({
        collection: "hero-sliders",
        where: { and: [{ site: { equals: site.id } }, { alias: { equals: alias } }] },
        limit: 1,
      });
      const data = {
        alias,
        site: site.id,
        slides: slides.map((s) => ({ image: s.imageId ?? undefined, text: s.text ?? undefined })),
      };
      if (existingSlider.docs[0]) {
        await payload.update({ collection: "hero-sliders", id: existingSlider.docs[0].id, data });
      } else {
        await payload.create({ collection: "hero-sliders", data });
      }
      console.log(`${site.domain}: alias "${alias}" -> ${slides.length} slides migrated`);
      totalSliders += 1;
    }
  }

  await conn.end();
  console.log(`\nDONE. Total hero sliders migrated: ${totalSliders}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
