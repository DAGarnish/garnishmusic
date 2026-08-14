import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

const BUCKET = process.env.S3_BUCKET!;
const REGION = process.env.S3_REGION!;

const DIR =
  "/private/tmp/claude-501/-Users-garnish-Documents-GMP-garnishmusic/19682142-b491-4c07-93cf-7ee77cb9ebc7/scratchpad/img-audit";

const FILES = [
  "CDJs-Lit-Match-Color.webp",
  "DJ-GIRLL-Match-Color-40-1600x660.webp",
  "DRAMATIC-DJ-Match-Color.webp",
  "Female-DJ-Blur-2.webp",
];

async function main() {
  const client = new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  });

  for (const file of FILES) {
    const key = file; // upload at bucket root, same convention as existing PNGs
    const body = fs.readFileSync(path.join(DIR, file));

    // Refuse to clobber an existing object - these must be new keys.
    try {
      await client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
      console.error(`ABORT: ${key} already exists in bucket - not overwriting.`);
      process.exit(1);
    } catch (err: any) {
      if (err.name !== "NotFound" && err.$metadata?.httpStatusCode !== 404) {
        throw err;
      }
    }

    await client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: body,
        ContentType: "image/webp",
      })
    );
    console.log(`Uploaded ${key} (${(body.length / 1024).toFixed(0)}KB)`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
