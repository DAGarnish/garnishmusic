import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

const BUCKET = process.env.S3_BUCKET!;
const REGION = process.env.S3_REGION!;
const KEY = "DJ-GIRLL-Match-Color-40-1600x660.png"; // referenced directly by Site's titleBackgroundImage relation - key must stay the same

const FILE_PATH = path.join(
  "/private/tmp/claude-501/-Users-garnish-Documents-GMP-garnishmusic/19682142-b491-4c07-93cf-7ee77cb9ebc7/scratchpad/img-audit",
  "DJ-GIRLL-Match-Color-40-1600x660.webp"
);

async function main() {
  const client = new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  });

  const body = fs.readFileSync(FILE_PATH);
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: KEY,
      Body: body,
      ContentType: "image/webp", // S3 serves this regardless of the .png key, and the /api/media/file route 307s straight to S3
    })
  );
  console.log(`Overwrote ${KEY} with WebP bytes (${(body.length / 1024).toFixed(0)}KB)`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
