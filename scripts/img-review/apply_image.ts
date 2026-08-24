import { getPayload } from "payload";
import fs from "fs";
import path from "path";

const envPath = path.resolve(".env");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf8").split("\n").forEach((line) => {
    const m = line.match(/^([^=]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2];
  });
}

async function main() {
  const config = (await import(path.resolve("payload.config"))).default;
  const payload = await getPayload({ config });

  // Accepts pairs: postId1 mediaId1 postId2 mediaId2 ...
  const args = process.argv.slice(2).map(Number);
  for (let i = 0; i < args.length; i += 2) {
    const postId = args[i];
    const mediaId = args[i + 1];
    const p: any = await payload.update({ collection: "posts", id: postId, data: { featuredImage: mediaId } as any });
    console.log(`post ${postId} "${p.title}" -> featuredImage=${mediaId}`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
