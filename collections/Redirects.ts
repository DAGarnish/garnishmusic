import type { CollectionConfig } from "payload";
import { adminOnly } from "../lib/access-control";

export const Redirects: CollectionConfig = {
  slug: "redirects",
  admin: {
    useAsTitle: "source",
    defaultColumns: ["source", "destination", "statusCode", "site"],
  },
  access: {
    read: () => true,
    // Redirects are network-wide routing/SEO config, not per-site content
    // - admin-only, even for a site's own editor (explicit user request,
    // 2026-09-03).
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    {
      name: "site",
      type: "relationship",
      relationTo: "sites",
      required: true,
    },
    {
      name: "source",
      type: "text",
      required: true,
      admin: {
        description: "Path to match, e.g. /old-page (always compared exact, no regex)",
      },
    },
    {
      name: "destination",
      type: "text",
      required: true,
      admin: {
        description: "Absolute URL or path to redirect to",
      },
    },
    {
      name: "statusCode",
      type: "number",
      defaultValue: 301,
    },
    {
      name: "wpSource",
      type: "select",
      options: [
        { label: "Redirection plugin", value: "redirection" },
        { label: "RankMath", value: "rankmath" },
      ],
      admin: {
        description: "Which WordPress plugin this rule was migrated from",
      },
    },
  ],
};
