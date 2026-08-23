import { getPayload } from "payload";
import config from "../payload.config";
import fs from "fs";
import path from "path";

const envPath = path.resolve(".env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) process.env[match[1]] = match[2];
  });
}

async function main() {
  const payload = await getPayload({ config });

  // Get mia site
  const sites = await payload.find({
    collection: "sites",
    where: { slug: { equals: "mia" } },
    depth: 0,
  });
  const miaSiteId = sites.docs[0].id;

  const courseRes = await payload.find({
    collection: "pages",
    where: { and: [{ slug: { equals: "courses/electronic-dj-course" } }, { site: { equals: miaSiteId } }] },
    depth: 0,
  });
  
  const courseId = courseRes.docs[0].id;
  let content = courseRes.docs[0].wpRawContent as string;

  // Regex to remove the first button block. It's a <p style="text-align: center;">...<picture...See-Schedule.../picture></a></p>
  const firstBtnRegex = /<p style="text-align: center;"><a href="[^"]*product\/electronic-music-dj-course\/"[^>]*><picture[\s\S]*?<\/picture><\/a><\/p>/g;
  
  // Regex to remove the second button block. It's an <img> inside an <a>.
  const secondBtnRegex = /<a href="[^"]*product\/electronic-music-dj-course\/"[^>]*><img[^>]*See-Schedule[^>]*><\/a>/g;

  content = content.replace(firstBtnRegex, "");
  content = content.replace(secondBtnRegex, "");

  await payload.update({
    collection: "pages",
    id: courseId,
    data: { wpRawContent: content },
  });

  console.log("Removed buttons from course", courseId);
  process.exit(0);
}

main().catch(console.error);
