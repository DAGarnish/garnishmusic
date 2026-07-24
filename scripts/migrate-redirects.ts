import { getPayload } from "payload";
import config from "../payload.config";
import { getWpConnection, tablePrefixForBlog } from "./wp-db";

function normalizeSource(raw: string): string {
  let s = raw.trim();
  // Strip a leading domain if present (e.g. accidentally stored with host)
  s = s.replace(/^https?:\/\/[^/]+/, "");
  if (!s.startsWith("/")) s = "/" + s;
  // Strip trailing slash (except root) for consistent matching
  if (s.length > 1 && s.endsWith("/")) s = s.slice(0, -1);
  return s;
}

function extractRankMathPattern(sourcesSerialized: string): { pattern: string; comparison: string } | null {
  const patternMatch = sourcesSerialized.match(/s:7:"pattern";s:\d+:"([^"]*)"/);
  const comparisonMatch = sourcesSerialized.match(/s:10:"comparison";s:\d+:"([^"]*)"/);
  if (!patternMatch) return null;
  return {
    pattern: patternMatch[1],
    comparison: comparisonMatch?.[1] || "exact",
  };
}

async function main() {
  const payload = await getPayload({ config });
  const conn = await getWpConnection();

  const sites = await payload.find({ collection: "sites", limit: 100 });

  let totalCreated = 0;
  let totalSkippedNonExact = 0;

  for (const site of sites.docs) {
    const blogId = site.wpBlogId as number;
    const prefix = tablePrefixForBlog(blogId);
    const seenSources = new Set<string>();
    let siteCount = 0;

    // ===== Redirection plugin =====
    try {
      const [items] = await conn.query<any[]>(
        `SELECT url, match_url, action_data, action_code, regex
         FROM ${prefix}redirection_items WHERE status = 'enabled' AND action_type = 'url';`
      );
      for (const row of items as any[]) {
        if (row.regex) continue; // skip regex rules, only handle exact-path rules
        const source = normalizeSource(row.match_url || row.url);
        if (seenSources.has(source)) continue;
        seenSources.add(source);

        const existing = await payload.find({
          collection: "redirects",
          where: { and: [{ site: { equals: site.id } }, { source: { equals: source } }] },
          limit: 1,
        });
        const data = {
          site: site.id,
          source,
          destination: row.action_data,
          statusCode: row.action_code || 301,
          wpSource: "redirection" as const,
        };
        if (existing.docs.length > 0) {
          await payload.update({ collection: "redirects", id: existing.docs[0].id, data });
        } else {
          await payload.create({ collection: "redirects", data });
        }
        siteCount += 1;
      }
    } catch {
      // table doesn't exist for this site, skip
    }

    // ===== RankMath redirects =====
    try {
      const [items] = await conn.query<any[]>(
        `SELECT sources, url_to, header_code FROM ${prefix}rank_math_redirections WHERE status = 'active';`
      );
      for (const row of items as any[]) {
        const parsed = extractRankMathPattern(row.sources);
        if (!parsed) continue;
        if (parsed.comparison !== "exact") {
          totalSkippedNonExact += 1;
          continue;
        }
        const source = normalizeSource(parsed.pattern);
        if (seenSources.has(source)) continue;
        seenSources.add(source);

        const existing = await payload.find({
          collection: "redirects",
          where: { and: [{ site: { equals: site.id } }, { source: { equals: source } }] },
          limit: 1,
        });
        const data = {
          site: site.id,
          source,
          destination: row.url_to,
          statusCode: row.header_code || 301,
          wpSource: "rankmath" as const,
        };
        if (existing.docs.length > 0) {
          await payload.update({ collection: "redirects", id: existing.docs[0].id, data });
        } else {
          await payload.create({ collection: "redirects", data });
        }
        siteCount += 1;
      }
    } catch {
      // table doesn't exist for this site, skip
    }

    console.log(`${site.domain}: ${siteCount} redirects migrated`);
    totalCreated += siteCount;
  }

  await conn.end();
  console.log(`\nDONE. Total redirects: ${totalCreated}, skipped (non-exact match rules): ${totalSkippedNonExact}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
