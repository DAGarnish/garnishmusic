import { getWpConnection, tablePrefixForBlog } from "./wp-db";
import { buildAttachmentIndex, findReferencedAttachmentIds } from "./wp-media";

async function main() {
  const conn = await getWpConnection();
  const prefix = tablePrefixForBlog(1);
  const { byId, byFilenameKey } = await buildAttachmentIndex(conn, prefix);
  console.log(`Total attachments in DB: ${byId.size}`);
  const referenced = await findReferencedAttachmentIds(conn, prefix, byFilenameKey);
  console.log(`Referenced attachments found: ${referenced.size}`);
  console.log(`Sample of 10:`, [...referenced].slice(0, 10));
  const valid = [...referenced].filter((id) => byId.has(id));
  const invalid = [...referenced].filter((id) => !byId.has(id));
  console.log(`Valid (exist as attachments): ${valid.length}`);
  console.log(`Invalid/dangling: ${invalid.length}`, invalid.slice(0, 10));
  await conn.end();
}
main();
