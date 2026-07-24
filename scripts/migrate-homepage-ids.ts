import { getPayloadClient } from "../lib/get-payload";
import { tablePrefixForBlog } from "./wp-db";
import fs from "fs";
import readline from "readline";

const DUMP_PATH =
  "/home/abhises/Desktop/davemusic/garnishmusic-local/db-refresh/fresh-dump.sql";

async function findAllPageOnFront(targetTables: Set<string>): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  const rl = readline.createInterface({
    input: fs.createReadStream(DUMP_PATH),
    crlfDelay: Infinity,
  });
  const insertPrefix = "INSERT INTO `";
  let capturingTable: string | null = null;
  for await (const line of rl) {
    if (line.startsWith(insertPrefix)) {
      const tickEnd = line.indexOf("`", insertPrefix.length);
      const table = line.slice(insertPrefix.length, tickEnd);
      capturingTable = targetTables.has(table) ? table : null;
      continue;
    }
    if (capturingTable) {
      const m = line.match(/,'page_on_front','(\d+)'/);
      if (m) result.set(capturingTable, parseInt(m[1], 10));
      if (line.trimEnd().endsWith(";")) capturingTable = null;
    }
  }
  return result;
}

async function main() {
  const payload = await getPayloadClient();
  const sites = await payload.find({ collection: "sites", limit: 100 });

  const tableForSite = new Map<string, any>();
  for (const site of sites.docs) {
    const prefix = tablePrefixForBlog(site.wpBlogId as number);
    tableForSite.set(`${prefix}options`, site);
  }

  const found = await findAllPageOnFront(new Set(tableForSite.keys()));

  for (const [table, site] of tableForSite) {
    const pageOnFront = found.get(table) ?? null;
    console.log(`site ${site.domain} (table ${table}) -> page_on_front=${pageOnFront}`);
    if (pageOnFront) {
      await payload.update({
        collection: "sites",
        id: site.id,
        data: { homepageWpId: pageOnFront },
      });
    }
  }
  process.exit(0);
}

main();
