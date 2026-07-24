import { getWpConnection } from "./wp-db";

async function main() {
  const conn = await getWpConnection();
  const [rows] = await conn.query<any[]>(
    `SELECT post_content FROM D0QbVivoEg_posts WHERE post_type IN ('page','post') AND post_status='publish';`
  );

  const shortcodeCounts = new Map<string, number>();
  const imageAttrShortcodes = new Set<string>();

  for (const row of rows as any[]) {
    const content: string = row.post_content || "";
    for (const m of content.matchAll(/\[([a-zA-Z_][a-zA-Z0-9_]*)/g)) {
      const tag = m[1];
      shortcodeCounts.set(tag, (shortcodeCounts.get(tag) || 0) + 1);
    }
    for (const m of content.matchAll(/\[([a-zA-Z_][a-zA-Z0-9_]*)\s[^\]]*\bimage="(\d+)"/g)) {
      imageAttrShortcodes.add(m[1]);
    }
    for (const m of content.matchAll(/\[([a-zA-Z_][a-zA-Z0-9_]*)\s[^\]]*\bimg="(\d+)"/g)) {
      imageAttrShortcodes.add(m[1]);
    }
  }

  const sorted = [...shortcodeCounts.entries()].sort((a, b) => b[1] - a[1]);
  console.log("Top 40 shortcode tags by frequency:");
  console.log(sorted.slice(0, 40).map(([tag, c]) => `${tag} (${c})`).join(", "));

  console.log("\nShortcodes with image=\"ID\" or img=\"ID\" attribute:");
  console.log([...imageAttrShortcodes].join(", "));

  await conn.end();
}
main();
