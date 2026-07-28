import type { CollectionConfig } from "payload";
import { lexicalEditor } from "@payloadcms/richtext-lexical";

export const Pages: CollectionConfig = {
  slug: "pages",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "site", "status", "slug"],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      type: "text",
      required: true,
      admin: {
        description: "URL path relative to the site, e.g. about-us",
      },
    },
    {
      name: "site",
      type: "relationship",
      relationTo: "sites",
      required: true,
    },
    {
      name: "status",
      type: "select",
      defaultValue: "published",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
      ],
    },
    {
      name: "featuredImage",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "titleBackgroundImage",
      type: "upload",
      relationTo: "media",
      admin: {
        description:
          "Decorative hero/banner image shown behind the page title (WordPress theme's title-area background feature)",
      },
    },
    {
      name: "showTitleArea",
      type: "checkbox",
      defaultValue: true,
      admin: {
        description:
          "WordPress theme's mkd_show_title_area_meta - whether the title/hero bar renders at all, independent of whether a background image is set (a page can show a bare title badge with no image, or hide the title bar entirely even with an image configured)",
      },
    },
    {
      name: "content",
      type: "richText",
      editor: lexicalEditor(),
    },
    {
      name: "excerpt",
      type: "textarea",
      admin: {
        description: "Plain-text fallback excerpt, extracted during migration",
      },
    },
    {
      name: "seo",
      type: "group",
      fields: [
        { name: "metaTitle", type: "text" },
        { name: "metaDescription", type: "textarea" },
        { name: "noindex", type: "checkbox", defaultValue: false },
      ],
    },
    {
      name: "portfolioCategories",
      type: "relationship",
      relationTo: "categories",
      hasMany: true,
      admin: {
        description:
          "WordPress 'portfolio-category' taxonomy terms, used to build mkd_portfolio_list course/instructor grids",
      },
    },
    {
      name: "wpPostId",
      type: "number",
      admin: {
        description: "Original WordPress post ID, for migration traceability",
      },
    },
    {
      name: "wpRawContent",
      type: "textarea",
      maxLength: 500000,
      admin: {
        description:
          "Raw WordPress post_content (with WPBakery shortcodes) preserved for reference/reprocessing",
      },
    },
    {
      name: "customCss",
      type: "textarea",
      admin: {
        description:
          "WPBakery page-level 'Custom CSS' field (_wpb_post_custom_css postmeta) - drives visible sizing/spacing on production that isn't otherwise in the shortcode content",
      },
    },
  ],
};
