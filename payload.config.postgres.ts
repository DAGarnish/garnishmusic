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

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// Migration-time Postgres/Neon config, kept separate from payload.config.ts
// so scripts/migrate-to-neon.ts can run a SQLite-backed instance (source)
// and a Postgres-backed instance (destination) simultaneously in the same
// process. Collections must stay in sync with payload.config.ts by hand.
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
        media: true,
      },
      bucket: process.env.S3_BUCKET || "",
      config: {
        region: process.env.S3_REGION,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
        },
      },
    }),
  ],
});
