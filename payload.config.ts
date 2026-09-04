import { postgresAdapter } from "@payloadcms/db-postgres";
import { s3Storage } from "@payloadcms/storage-s3";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import path from "path";
import { buildConfig } from "payload";
import { fileURLToPath } from "url";
import sharp from "sharp";

import { Sites } from "./collections/Sites";
import { Users } from "./collections/Users";
import { Media } from "./collections/Media";
import { Categories } from "./collections/Categories";
import { Tags } from "./collections/Tags";
import { Pages } from "./collections/Pages";
import { Posts } from "./collections/Posts";
import { Products } from "./collections/Products";
import { Customers } from "./collections/Customers";
import { Orders } from "./collections/Orders";
import { FormSubmissions } from "./collections/FormSubmissions";
import { Redirects } from "./collections/Redirects";
import { Testimonials } from "./collections/Testimonials";
import { HeroSliders } from "./collections/HeroSliders";
import { Partners } from "./globals/Partners";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: Users.slug,
  },
  collections: [
    Sites,
    Users,
    Media,
    Categories,
    Tags,
    Pages,
    Posts,
    Products,
    Customers,
    Orders,
    FormSubmissions,
    Redirects,
    Testimonials,
    HeroSliders,
  ],
  globals: [Partners],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.POSTGRES_URI,
      connectionTimeoutMillis: 10000,
      statement_timeout: 30000,
      query_timeout: 30000,
      idle_in_transaction_session_timeout: 30000,
    },
  }),
  plugins: [
    s3Storage({
      collections: {
        // Without this, every media doc's `url` field (and each of its
        // `sizes.*.url`) stays Payload's own local-upload path,
        // "/api/media/file/<filename>" - which next.config.ts's own
        // redirects() then 307s straight to this same S3 bucket, since
        // Payload's actual (access-controlled) file route is never reached.
        // That's a needless extra round trip on every single image on every
        // page (confirmed via Pingdom: 37 redirects, one per image).
        // Media's own read access is already public (`access.read: () =>
        // true`), so there's no real access control being bypassed here -
        // this just makes the field resolve straight to the real S3 URL
        // instead of bouncing through the redirect first.
        media: { disablePayloadAccessControl: true },
      },
      bucket: process.env.S3_BUCKET || "",
      config: {
        region: process.env.S3_REGION,
        // Needed for generateURL (used by disablePayloadAccessControl above)
        // to build a real URL - it has no other way to derive the S3
        // endpoint from just a region. Path-style (bucket in the path, not
        // the host) rather than virtual-hosted-style since generateURL's own
        // template always inserts "/<bucket>/" itself - confirmed both
        // styles serve identical content from this bucket.
        endpoint: `https://s3.${process.env.S3_REGION}.amazonaws.com`,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
        },
      },
    }),
  ],
});
