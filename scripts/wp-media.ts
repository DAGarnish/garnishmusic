import type { Connection } from "mysql2/promise";

export type AttachmentInfo = {
  id: number;
  attachedFile: string; // relative path from uploads/, e.g. 2016/09/foo.png
  guid: string;
  mimeType: string;
  title: string;
};

function baseFilenameKey(filePath: string): string {
  const filename = filePath.split("/").pop() || filePath;
  // strip WordPress size-suffix, e.g. "foo-300x200.png" -> "foo.png"
  const stripped = filename.replace(/-\d+x\d+(?=\.[a-zA-Z0-9]+$)/, "");
  return stripped.toLowerCase();
}

export async function buildAttachmentIndex(conn: Connection, prefix: string) {
  const [rows] = await conn.query<any[]>(
    `SELECT p.ID, p.post_title, p.guid, p.post_mime_type,
            (SELECT meta_value FROM ${prefix}postmeta WHERE post_id = p.ID AND meta_key = '_wp_attached_file' LIMIT 1) AS attached_file
     FROM ${prefix}posts p
     WHERE p.post_type = 'attachment';`
  );

  const byId = new Map<number, AttachmentInfo>();
  const byFilenameKey = new Map<string, number>();

  for (const row of rows as any[]) {
    if (!row.attached_file) continue;
    const info: AttachmentInfo = {
      id: row.ID,
      attachedFile: row.attached_file,
      guid: row.guid,
      mimeType: row.post_mime_type,
      title: row.post_title,
    };
    byId.set(row.ID, info);
    const key = baseFilenameKey(row.attached_file);
    if (!byFilenameKey.has(key)) {
      byFilenameKey.set(key, row.ID);
    }
  }

  return { byId, byFilenameKey };
}

export function resolveAttachmentIdFromUrl(
  url: string,
  byFilenameKey: Map<string, number>
): number | undefined {
  const withoutQuery = url.split("?")[0];
  const key = baseFilenameKey(withoutQuery);
  return byFilenameKey.get(key);
}

export async function findReferencedAttachmentIds(
  conn: Connection,
  prefix: string,
  byFilenameKey: Map<string, number>,
  validIds: Set<number>
): Promise<Set<number>> {
  const referenced = new Set<number>();

  // 1. Featured images (_thumbnail_id) for any post type
  const [thumbRows] = await conn.query<any[]>(
    `SELECT meta_value FROM ${prefix}postmeta WHERE meta_key = '_thumbnail_id';`
  );
  for (const row of thumbRows as any[]) {
    const id = parseInt(row.meta_value, 10);
    if (!Number.isNaN(id)) referenced.add(id);
  }

  // 2. Product image galleries
  const [galleryRows] = await conn.query<any[]>(
    `SELECT meta_value FROM ${prefix}postmeta WHERE meta_key = '_product_image_gallery';`
  );
  for (const row of galleryRows as any[]) {
    if (!row.meta_value) continue;
    for (const idStr of String(row.meta_value).split(",")) {
      const id = parseInt(idStr, 10);
      if (!Number.isNaN(id)) referenced.add(id);
    }
  }

  // 3. wp-image-{id} class references in post_content (pages, posts, products, portfolio-items)
  const [contentRows] = await conn.query<any[]>(
    `SELECT post_content FROM ${prefix}posts WHERE post_status = 'publish' AND post_type IN ('page','post','product','portfolio-item');`
  );
  for (const row of contentRows as any[]) {
    const content: string = row.post_content || "";
    for (const m of content.matchAll(/wp-image-(\d+)/g)) {
      referenced.add(parseInt(m[1], 10));
    }
    for (const m of content.matchAll(/wp-content\/uploads\/([^"'\s)]+)/g)) {
      const id = resolveAttachmentIdFromUrl(m[1], byFilenameKey);
      if (id !== undefined) referenced.add(id);
    }
    // WPBakery shortcode image attributes: [vc_single_image image="123" ...],
    // [mkd_image_with_text image="123" ...], background_image="123" on
    // section/holder shortcodes.
    for (const m of content.matchAll(/\b(?:image|background_image)="(\d+)"/g)) {
      referenced.add(parseInt(m[1], 10));
    }
  }

  // 4. Elementor page data (_elementor_data), URL-based resolution only
  const [elementorRows] = await conn.query<any[]>(
    `SELECT meta_value FROM ${prefix}postmeta WHERE meta_key = '_elementor_data';`
  );
  for (const row of elementorRows as any[]) {
    const data: string = row.meta_value || "";
    for (const m of data.matchAll(/wp-content\\?\/uploads\\?\/([^"'\\]+)/g)) {
      const id = resolveAttachmentIdFromUrl(m[1].replace(/\\/g, ""), byFilenameKey);
      if (id !== undefined) referenced.add(id);
    }
  }

  // 5. Theme's title-area background image (stored as a full URL, not an ID).
  // "mkd_" is the current theme prefix, "edgtf_" is an older theme-framework
  // prefix some sites still carry the same meta under.
  const [titleBgRows] = await conn.query<any[]>(
    `SELECT meta_value FROM ${prefix}postmeta
     WHERE meta_key IN ('mkd_title_area_background_image_meta', 'edgtf_title_area_background_image_meta')
       AND meta_value != '';`
  );
  for (const row of titleBgRows as any[]) {
    const id = resolveAttachmentIdFromUrl(row.meta_value, byFilenameKey);
    if (id !== undefined) referenced.add(id);
  }

  return new Set([...referenced].filter((id) => validIds.has(id)));
}
