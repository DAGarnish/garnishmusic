import { getWpConnection, tablePrefixForBlog, BASE_PREFIX } from "./wp-db";

async function safeCount(conn: any, table: string): Promise<number | null> {
  try {
    const [[row]] = await conn.query<any[]>(`SELECT COUNT(*) c FROM ${table};`);
    return row.c;
  } catch {
    return null;
  }
}

async function main() {
  const conn = await getWpConnection();
  const [blogs] = await conn.query<any[]>(
    `SELECT blog_id, domain FROM ${BASE_PREFIX}blogs ORDER BY blog_id;`
  );

  let totals = {
    pages: 0,
    posts: 0,
    attachments: 0,
    products: 0,
    orders: 0,
    forms: 0,
    submissions: 0,
  };

  for (const blog of blogs as any[]) {
    const p = tablePrefixForBlog(blog.blog_id);
    const pages = (await safeCount(conn, `${p}posts WHERE post_type='page' AND post_status='publish'`)) ?? 0;
    const posts = (await safeCount(conn, `${p}posts WHERE post_type='post' AND post_status='publish'`)) ?? 0;
    const attachments = (await safeCount(conn, `${p}posts WHERE post_type='attachment'`)) ?? 0;
    const products = (await safeCount(conn, `${p}posts WHERE post_type='product' AND post_status='publish'`)) ?? 0;
    const orders = await safeCount(conn, `${p}wc_orders`);
    const forms = await safeCount(conn, `${p}fluentform_forms`);
    const submissions = await safeCount(conn, `${p}fluentform_submissions`);

    console.log(
      `${blog.domain}\tpages=${pages}\tposts=${posts}\tattachments=${attachments}\tproducts=${products}\torders=${orders ?? "N/A"}\tforms=${forms ?? "N/A"}\tsubmissions=${submissions ?? "N/A"}`
    );

    totals.pages += pages;
    totals.posts += posts;
    totals.attachments += attachments;
    totals.products += products;
    totals.orders += orders ?? 0;
    totals.forms += forms ?? 0;
    totals.submissions += submissions ?? 0;
  }

  console.log("\nTOTALS:", totals);
  await conn.end();
}

main();
