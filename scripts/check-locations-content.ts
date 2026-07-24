import { getWpConnection } from "./wp-db";

async function main() {
  const conn = await getWpConnection();
  const [rows] = await conn.query<any[]>(
    `SELECT post_content FROM D0QbVivoEg_posts WHERE ID = 5271;`
  );
  const content = (rows as any[])[0].post_content as string;
  console.log("Total length:", content.length);

  // Find all shortcode tags with image-related attributes
  const imageAttrs = content.match(/\b(image|img|bg_image|background_image)="[^"]*"/g);
  console.log("\nImage-related attributes found:", imageAttrs?.length || 0);
  console.log([...new Set(imageAttrs)].slice(0, 30));

  // Sample a chunk
  console.log("\nFirst 1500 chars:\n", content.slice(0, 1500));

  await conn.end();
}
main();
