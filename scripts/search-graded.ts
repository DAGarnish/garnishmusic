import { getPayload } from "payload";
import config from "../payload.config";
import fs from "fs";
import path from "path";

const envPath = path.resolve(".env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1]] = match[2];
    }
  });
}

async function main() {
  const payload = await getPayload({ config });
  
  const collections = ["pages", "products"];
  
  for (const collection of collections) {
    const result = await payload.find({
      collection: collection as any,
      limit: 100,
      where: {
        or: [
          { wpRawContent: { contains: "Graded in London" } },
          { wpRawContent: { contains: "music production grades" } },
          { wpRawContent: { contains: "Music Production Grades" } }
        ]
      }
    });
    
    console.log(`Found ${result.docs.length} in ${collection}`);
    for (const doc of result.docs) {
      console.log(`- ${doc.title} (${doc.slug}) - ID: ${doc.id}`);
      
      const content = doc.wpRawContent;
      const matches1 = content.match(/.{0,50}Graded in London.{0,50}/gi);
      if (matches1) console.log("   Matches 1:", matches1);
      
      const matches2 = content.match(/.{0,50}music production grades.{0,50}/gi);
      if (matches2) console.log("   Matches 2:", matches2);
    }
  }

  process.exit(0);
}

main().catch(console.error);
