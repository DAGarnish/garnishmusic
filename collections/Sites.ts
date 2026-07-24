import type { CollectionConfig } from "payload";

export const Sites: CollectionConfig = {
  slug: "sites",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "domain", "wpBlogId"],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "domain",
      type: "text",
      required: true,
      unique: true,
      admin: {
        description:
          "Production domain, e.g. www.garnishmusicproduction.com",
      },
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      admin: {
        description: "URL-safe identifier used for local routing, e.g. ny",
      },
    },
    {
      name: "isMainSite",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "wpBlogId",
      type: "number",
      admin: {
        description: "Original WordPress multisite blog_id, for migration traceability",
      },
    },
    {
      name: "wpTablePrefix",
      type: "text",
      admin: {
        description: "Original WordPress table prefix used for this blog's tables",
      },
    },
    {
      name: "mainMenu",
      type: "json",
      admin: {
        description:
          "Nested navigation tree migrated from this site's real WordPress nav_menu_item data: [{ label, url, newTab, children: [...] }]",
      },
    },
    {
      name: "footerCopyright",
      type: "textarea",
      admin: {
        description: "Site-specific footer copyright/address text, migrated from WordPress",
      },
    },
    {
      name: "homepageWpId",
      type: "number",
      admin: {
        description:
          "WordPress page_on_front option value for this blog. The Page with matching wpPostId is this site's homepage.",
      },
    },
  ],
};
