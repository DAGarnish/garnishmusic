import { getWpConnection, tablePrefixForBlog, BASE_PREFIX } from "./wp-db";

async function safeCount(conn: any, table: string): Promise<number | null> {
  try {
    const [[row]] = await conn.query(`SELECT COUNT(*) c FROM ${table};`) as any;
    return row.c;
  } catch {
    return null;
  }
}

async function main() {
  const conn = await getWpConnection();
  const [blogs] = await conn.query<any[]>(`SELECT blog_id, domain FROM ${BASE_PREFIX}blogs ORDER BY blog_id;`);

  let totalRedirectionItems = 0;
  let totalRankMathRedirects = 0;
  let totalNoindex = 0;
  let totalCanonical = 0;

  for (const blog of blogs as any[]) {
    const prefix = tablePrefixForBlog(blog.blog_id);
    const ri = (await safeCount(conn, `${prefix}redirection_items`)) ?? 0;
    const rmr = (await safeCount(conn, `${prefix}rank_math_redirections`)) ?? 0;

    const [[noindex]] = await conn.query<any[]>(
      `SELECT COUNT(*) c FROM ${prefix}postmeta WHERE meta_key = 'rank_math_robots' AND meta_value LIKE '%noindex%';`
    );
    const [[canonical]] = await conn.query<any[]>(
      `SELECT COUNT(*) c FROM ${prefix}postmeta WHERE meta_key = 'rank_math_canonical_url' AND meta_value != '';`
    );

    console.log(
      `${blog.domain}: redirection_items=${ri} rank_math_redirects=${rmr} noindex=${noindex.c} canonical_override=${canonical.c}`
    );
    totalRedirectionItems += ri;
    totalRankMathRedirects += rmr;
    totalNoindex += noindex.c;
    totalCanonical += canonical.c;
  }

  console.log("\nTOTALS across 21 active sites:");
  console.log("Redirection plugin items:", totalRedirectionItems);
  console.log("RankMath redirects:", totalRankMathRedirects);
  console.log("Pages marked noindex:", totalNoindex);
  console.log("Custom canonical URLs:", totalCanonical);

  await conn.end();
}
main();
