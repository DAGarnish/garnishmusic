import type { CollectionConfig } from "payload";
import path from "path";
import { fileURLToPath } from "url";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export const Media: CollectionConfig = {
  slug: "media",
  admin: {
    useAsTitle: "alt",
  },
  access: {
    read: () => true,
  },
  upload: {
    staticDir: path.resolve(dirname, "../media"),
    mimeTypes: ["image/*", "application/pdf", "video/*"],
    imageSizes: [
      { name: "thumbnail", width: 300, height: undefined, position: "centre" },
      { name: "medium", width: 800, height: undefined, position: "centre" },
      { name: "large", width: 1600, height: undefined, position: "centre" },
    ],
  },
  fields: [
    {
      name: "alt",
      type: "text",
    },
    {
      name: "site",
      type: "relationship",
      relationTo: "sites",
      admin: {
        description: "Which site this media originally belonged to",
      },
    },
    {
      name: "wpAttachmentId",
      type: "number",
      admin: {
        description: "Original WordPress attachment post ID, for migration traceability",
      },
    },
    {
      name: "wpSourceUrl",
      type: "text",
      admin: {
        description: "Original WordPress file URL, for migration reference",
      },
    },
  ],
};
