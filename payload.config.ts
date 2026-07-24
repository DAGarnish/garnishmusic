import { sqliteAdapter } from "@payloadcms/db-sqlite";
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
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI || "file:./garnishmusic.db",
    },
  }),
});
