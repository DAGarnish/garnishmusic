import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mime from "mime-types";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const MEDIA_DIR = path.resolve(dirname, "../media");

const BUCKET = process.env.S3_BUCKET!;
const CONCURRENCY = 20;

const client = new S3Client({
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
});

async function uploadFile(name: string): Promise<void> {
  const filePath = path.join(MEDIA_DIR, name);
  const body = fs.createReadStream(filePath);
  const contentType = mime.lookup(name) || "application/octet-stream";

  const upload = new Upload({
    client,
    params: {
      Bucket: BUCKET,
      Key: name,
      Body: body,
      ContentType: contentType,
    },
  });

  await upload.done();
}

async function main() {
  const files = fs.readdirSync(MEDIA_DIR).filter((f) => {
    return fs.statSync(path.join(MEDIA_DIR, f)).isFile();
  });

  console.log(`Found ${files.length} files to upload to s3://${BUCKET}`);

  let done = 0;
  let failed = 0;
  const failures: string[] = [];

  let cursor = 0;
  async function worker() {
    while (cursor < files.length) {
      const idx = cursor++;
      const name = files[idx];
      try {
        await uploadFile(name);
        done++;
      } catch (err) {
        failed++;
        failures.push(name);
        console.error(`  ERROR uploading ${name}: ${(err as Error).message}`);
      }
      if ((done + failed) % 200 === 0) {
        console.log(`  progress: ${done + failed}/${files.length} (${failed} failed)`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  console.log(`\nDONE. Uploaded: ${done}, Failed: ${failed}`);
  if (failures.length > 0) {
    fs.writeFileSync(
      path.resolve(dirname, "upload-failures.json"),
      JSON.stringify(failures, null, 2)
    );
    console.log(`Failed filenames written to scripts/upload-failures.json`);
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
