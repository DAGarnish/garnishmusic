import type { CollectionConfig } from "payload";
import { adminOnly } from "../lib/access-control";

export const Tags: CollectionConfig = {
  slug: "tags",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "site"],
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
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      type: "text",
      required: true,
    },
    {
      name: "site",
      type: "relationship",
      relationTo: "sites",
      required: true,
    },
    {
      name: "wpTermId",
      type: "number",
    },
  ],
};
