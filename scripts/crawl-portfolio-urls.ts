import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getWpConnection, tablePrefixForBlog, BASE_PREFIX } from "./wp-db";

const execFileAsync = promisify(execFile);
const dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.resolve(dirname, ".portfolio-urls.json");

const CLOUDFLARE_IP = "172.67.213.69";
const CONCURRENCY = 12;

async function resolveCanonical(domain: string, wpId: number): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync("curl", [
      "-sS",
      "-o",
      "/dev/null",
      "-D",
      "-",
      "--resolve",
      `${domain}:443:${CLOUDFLARE_IP}`,
      "--max-time",
      "10",
      `https://${domain}/?p=${wpId}&post_type=portfolio-item`,
    ]);
    const match = stdout.match(/^location:\s*(\S+)/im);
    if (!match) return null;
    const url = new URL(match[1]);
    return url.pathname;
  } catch {
    return null;
  }
}

async function processBatch<T, R>(items: T[], fn: (item: T) => Promise<R>, concurrency: number): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
    console.log(`  progress: ${Math.min(i + concurrency, items.length)}/${items.length}`);
  }
  return results;
}

async function main() {
  const conn = await getWpConnection();
  const [blogs] = await conn.query<any[]>(`SELECT blog_id, domain FROM ${BASE_PREFIX}blogs ORDER BY blog_id;`);

  const results: Record<string, Record<number, string | null>> = fs.existsSync(OUT_FILE)
    ? JSON.parse(fs.readFileSync(OUT_FILE, "utf-8"))
    : {};

  for (const blog of blogs as any[]) {
    const prefix = tablePrefixForBlog(blog.blog_id);
    const [items] = await conn.query<any[]>(
      `SELECT ID FROM ${prefix}posts WHERE post_type='portfolio-item' AND post_status='publish';`
    );
    const ids = (items as any[]).map((r) => r.ID);
    if (ids.length === 0) continue;

    if (!results[blog.domain]) results[blog.domain] = {};
    const todo = ids.filter((id) => results[blog.domain][id] === undefined);

    console.log(`\n${blog.domain}: ${ids.length} portfolio-items, ${todo.length} to crawl`);

    const resolved = await processBatch(
      todo,
      async (id) => ({ id, path: await resolveCanonical(blog.domain, id) }),
      CONCURRENCY
    );
    for (const r of resolved) {
      results[blog.domain][r.id] = r.path;
    }
    fs.writeFileSync(OUT_FILE, JSON.stringify(results, null, 2));
  }

  await conn.end();

  let total = 0;
  let failed = 0;
  for (const domain in results) {
    for (const id in results[domain]) {
      total += 1;
      if (!results[domain][id]) failed += 1;
    }
  }
  console.log(`\nDONE. Total: ${total}, failed to resolve: ${failed}`);
  console.log(`Saved to ${OUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
