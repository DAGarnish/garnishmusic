import type { CollectionConfig } from "payload";
import { adminOnly } from "../lib/access-control";

export const Testimonials: CollectionConfig = {
  slug: "testimonials",
  admin: {
    useAsTitle: "author",
    defaultColumns: ["author", "site"],
  },
  access: {
    read: () => true,
    // Admin-only, even for a site's own editor (explicit user request,
    // 2026-09-03 - editors are scoped to Pages/Products only).
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    {
      name: "author",
      type: "text",
      required: true,
    },
    {
      name: "text",
      type: "textarea",
      required: true,
    },
    {
      name: "site",
      type: "relationship",
      relationTo: "sites",
      required: true,
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "categories",
      type: "relationship",
      relationTo: "categories",
      hasMany: true,
    },
    {
      name: "wpPostId",
      type: "number",
    },
  ],
};
