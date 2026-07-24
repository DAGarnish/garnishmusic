import { getPayload } from "payload";
import config from "../payload.config";
import { getWpConnection, tablePrefixForBlog } from "./wp-db";

type RawItem = {
  ID: number;
  post_title: string;
  menu_order: number;
  url: string | null;
  type: string | null;
  object_id: string | null;
  menu_parent: string | null;
  target: string | null;
};

type MenuNode = {
  label: string;
  url: string;
  newTab: boolean;
  children: MenuNode[];
};

function findMainMenuTermId(themeModsValue: string): number | null {
  const match = themeModsValue.match(/s:15:"main-navigation";i:(\d+);/);
  return match ? parseInt(match[1], 10) : null;
}

async function buildMenuTree(
  conn: any,
  prefix: string,
  termId: number,
  payload: any,
  siteId: number | string
): Promise<MenuNode[]> {
  const [items] = await conn.query<RawItem[]>(
    `SELECT p.ID, p.post_title, p.menu_order,
       (SELECT meta_value FROM ${prefix}postmeta WHERE post_id=p.ID AND meta_key='_menu_item_url') as url,
       (SELECT meta_value FROM ${prefix}postmeta WHERE post_id=p.ID AND meta_key='_menu_item_type') as type,
       (SELECT meta_value FROM ${prefix}postmeta WHERE post_id=p.ID AND meta_key='_menu_item_object_id') as object_id,
       (SELECT meta_value FROM ${prefix}postmeta WHERE post_id=p.ID AND meta_key='_menu_item_menu_item_parent') as menu_parent,
       (SELECT meta_value FROM ${prefix}postmeta WHERE post_id=p.ID AND meta_key='_menu_item_target') as target
     FROM ${prefix}posts p
     JOIN ${prefix}term_relationships tr ON tr.object_id = p.ID
     WHERE tr.term_taxonomy_id = (
       SELECT term_taxonomy_id FROM ${prefix}term_taxonomy WHERE term_id = ${termId}
     ) AND p.post_type = 'nav_menu_item'
     ORDER BY p.menu_order;`
  );

  const rows = items as unknown as RawItem[];

  // Resolve blank titles + urls for post_type items via the referenced post.
  // WP's own _menu_item_url is usually empty for these (it relies on
  // object_id to resolve the CURRENT permalink dynamically at render time),
  // and that permalink is NOT just "/{post_name}" - pages can be nested
  // under a parent, and portfolio-items (courses) live under "/courses/..."
  // per the production-crawled URL map. So resolve against the already
  // -migrated Payload content (which has the real computed full path in its
  // slug field) instead of reconstructing it from raw WP data here.
  const objectIds = rows
    .filter((r) => r.type === "post_type" && r.object_id)
    .map((r) => r.object_id);
  const resolvedPosts = new Map<string, { title: string; slug: string }>();
  if (objectIds.length > 0) {
    const [posts] = await conn.query<any[]>(
      `SELECT ID, post_title, post_name FROM ${prefix}posts WHERE ID IN (${objectIds.join(",")});`
    );
    for (const p of posts as any[]) {
      resolvedPosts.set(String(p.ID), { title: p.post_title, slug: p.post_name });
    }

    const wpIds = objectIds.map((id) => parseInt(id, 10));
    for (const [collection, idField] of [
      ["pages", "wpPostId"],
      ["posts", "wpPostId"],
      ["products", "wpProductId"],
    ] as const) {
      const migrated = await payload.find({
        collection,
        where: { and: [{ site: { equals: siteId } }, { [idField]: { in: wpIds } }] },
        limit: wpIds.length,
        depth: 0,
      });
      for (const doc of migrated.docs as any[]) {
        const existing = resolvedPosts.get(String(doc[idField]));
        if (existing) existing.slug = doc.slug;
      }
    }
  }

  const nodesById = new Map<number, MenuNode & { _id: number; _parent: number }>();
  for (const row of rows) {
    let label = row.post_title?.trim() || "";
    let url = row.url?.trim() || "";

    if (row.type === "post_type" && row.object_id) {
      const resolved = resolvedPosts.get(row.object_id);
      if (resolved) {
        if (!label) label = resolved.title;
        // Always prefer the real migrated slug over WP's own stored
        // _menu_item_url when we have one - WP's stored value can itself be
        // stale/incomplete (see above), while the migrated slug is the
        // actual full path this app resolves content by.
        url = `/${resolved.slug}`;
      }
    }
    if (!label) label = "(untitled)";
    if (!url) url = "#";

    nodesById.set(row.ID, {
      _id: row.ID,
      _parent: parseInt(row.menu_parent || "0", 10),
      label,
      url,
      newTab: row.target === "_blank",
      children: [],
    });
  }

  const roots: MenuNode[] = [];
  for (const node of nodesById.values()) {
    if (node._parent && nodesById.has(node._parent)) {
      nodesById.get(node._parent)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const strip = (n: MenuNode & { _id?: number; _parent?: number }): MenuNode => ({
    label: n.label,
    url: n.url,
    newTab: n.newTab,
    children: n.children.map(strip),
  });

  return roots.map(strip);
}

async function main() {
  const payload = await getPayload({ config });
  const conn = await getWpConnection();

  const sites = await payload.find({ collection: "sites", limit: 100 });

  for (const site of sites.docs) {
    const blogId = site.wpBlogId as number;
    const prefix = tablePrefixForBlog(blogId);

    const [rows] = await conn.query<any[]>(
      `SELECT option_value FROM ${prefix}options WHERE option_name = 'theme_mods_buro' LIMIT 1;`
    );
    const themeMods = (rows as any[])[0]?.option_value;
    if (!themeMods) {
      console.log(`${site.domain}: no theme_mods_buro found, skipping`);
      continue;
    }

    const termId = findMainMenuTermId(themeMods);
    if (!termId) {
      console.log(`${site.domain}: no main-navigation location found, skipping`);
      continue;
    }

    const tree = await buildMenuTree(conn, prefix, termId, payload, site.id);
    console.log(`${site.domain}: menu term ${termId}, ${tree.length} top-level items`);

    await payload.update({
      collection: "sites",
      id: site.id,
      data: { mainMenu: tree },
    });
  }

  await conn.end();
  console.log("\nDONE.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
