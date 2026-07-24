import type { CollectionConfig } from "payload";

export const Redirects: CollectionConfig = {
  slug: "redirects",
  admin: {
    useAsTitle: "source",
    defaultColumns: ["source", "destination", "statusCode", "site"],
  },
  access: {
    read: () => true,
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
