import { getWpConnection, tablePrefixForBlog, BASE_PREFIX } from "./wp-db";

async function main() {
  const conn = await getWpConnection();
  const [blogs] = await conn.query<any[]>(`SELECT blog_id, domain FROM ${BASE_PREFIX}blogs ORDER BY blog_id;`);
  let galleryTotal = 0;
  let edgtfBgTotal = 0;
  for (const blog of blogs as any[]) {
    const prefix = tablePrefixForBlog(blog.blog_id);
    const [[g]] = await conn.query<any[]>(
      `SELECT COUNT(*) c FROM ${prefix}postmeta WHERE meta_key = 'mkd_portfolio-image-gallery' AND meta_value != '';`
    );
    const [[e]] = await conn.query<any[]>(
      `SELECT COUNT(*) c FROM ${prefix}postmeta WHERE meta_key = 'edgtf_title_area_background_image_meta' AND meta_value != '';`
    );
    galleryTotal += g.c;
    edgtfBgTotal += e.c;
  }
  console.log("mkd_portfolio-image-gallery total:", galleryTotal);
  console.log("edgtf_title_area_background_image_meta total:", edgtfBgTotal);
  await conn.end();
}
main();
