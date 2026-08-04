import { getPayload } from "payload";
import config from "../payload.config";
import { getWpConnection, tablePrefixForBlog } from "./wp-db";
import https from "https";
import http from "http";

type RawTextLayer = {
  text: string;
  color?: string;
  backgroundColor?: string;
  fontFamily?: string;
  fontSize?: string;
  padding?: string;
  x: number;
  y: number;
  groupOrder: number;
};

function findTextLayers(obj: any, out: RawTextLayer[] = []): RawTextLayer[] {
  if (obj == null || typeof obj !== "object") return out;
  if (obj.type === "text" && typeof obj.text === "string" && obj.text.trim()) {
    const idle = obj.idle || {};
    const color = idle.color?.d?.v;
    const backgroundColor = idle.backgroundColor;
    // Slider Revolution's own desktop padding for this layer (top/right/
    // bottom/left, in px) - e.g. [10,10,10,10]. Only meaningful alongside a
    // real background box, so it's captured here but only applied at render
    // time when backgroundColor is also set.
    const paddingValues = idle.padding?.d?.v;
    out.push({
      text: obj.text,
      color: color && color !== "transparent" ? color : undefined,
      backgroundColor: backgroundColor && backgroundColor !== "transparent" ? backgroundColor : undefined,
      fontFamily: idle.fontFamily || undefined,
      fontSize: idle.fontSize?.d?.v || undefined,
      padding: Array.isArray(paddingValues) ? paddingValues.map((n: number) => `${n}px`).join(" ") : undefined,
      x: parseFloat(obj.position?.x?.d?.v) || 0,
      y: parseFloat(obj.position?.y?.d?.v) || 0,
      groupOrder: obj.group?.groupOrder ?? 0,
    });
  }
  for (const key of Object.keys(obj)) {
    findTextLayers(obj[key], out);
  }
  return out;
}

// Slider Revolution positions each text layer independently by absolute x/y
// offset rather than flowing them like normal document text - reproducing
// that exact freeform geometry isn't practical here, but layers sharing the
// same vertical offset are, in practice, always meant to read as one line
// (e.g. "Contact" + "Us" placed side by side at the same y), while layers at
// different y offsets are separate stacked lines (e.g. "Our" above
// "INSTRUCTORS & MENTORS!"). Grouping by y and ordering by x within a group
// reconstructs that reading order without needing full layout math.
function groupIntoLines(rawLayers: RawTextLayer[]) {
  const groups = new Map<number, RawTextLayer[]>();
  for (const layer of rawLayers) {
    const existing = groups.get(layer.y);
    if (existing) existing.push(layer);
    else groups.set(layer.y, [layer]);
  }

  return [...groups.entries()]
    .sort(([yA, membersA], [yB, membersB]) => {
      if (yA !== yB) return yA - yB;
      const minOrder = (members: RawTextLayer[]) => Math.min(...members.map((m) => m.groupOrder));
      return minOrder(membersA) - minOrder(membersB);
    })
    .map(([, members]) => {
      const ordered = [...members].sort((a, b) => a.x - b.x);
      const text = ordered
        .map((m) => m.text.trim())
        .filter(Boolean)
        .join(" ");
      const first = ordered[0];
      return {
        text,
        color: first.color,
        backgroundColor: first.backgroundColor,
        fontFamily: first.fontFamily,
        fontSize: first.fontSize,
        padding: first.padding,
      };
    })
    .filter((line) => line.text);
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

      const slides: { imageId?: number | string; layers: ReturnType<typeof groupIntoLines> }[] = [];
      for (const row of slideRows as any[]) {
        let imageUrl: string | undefined;
        let lines: ReturnType<typeof groupIntoLines> = [];
        try {
          const params = JSON.parse(row.params);
          imageUrl = params?.bg?.lastLoadedImage?.src;
        } catch {}
        try {
          const layers = JSON.parse(row.layers);
          lines = groupIntoLines(findTextLayers(layers));
        } catch {}
        const altText = lines[0]?.text;

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
                data: { alt: altText || filename, site: site.id, wpSourceUrl: imageUrl },
                file: { data: buffer, mimetype, name: filename, size: buffer.length },
              });
              mediaId = created.id;
            }
          } catch (err) {
            console.log(`  image download failed for ${imageUrl}: ${(err as Error).message}`);
          }
        }

        slides.push({ imageId: mediaId, layers: lines });
      }

      const existingSlider = await payload.find({
        collection: "hero-sliders",
        where: { and: [{ site: { equals: site.id } }, { alias: { equals: alias } }] },
        limit: 1,
      });
      const data = {
        alias,
        site: site.id,
        slides: slides.map((s) => ({ image: s.imageId ?? undefined, layers: s.layers })),
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
