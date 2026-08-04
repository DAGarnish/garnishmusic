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
        description:
          "Site-specific footer copyright/address text (top widget), migrated from WordPress. Raw inner HTML of the textwidget div - may contain multiple <p> tags.",
      },
    },
    {
      name: "footerCopyrightBottom",
      type: "textarea",
      admin: {
        description:
          "Site-specific footer copyright/address text (bottom bar widget), migrated from WordPress. Raw inner HTML - on production this is a shared, largely uncustomized widget, so it's identical (and often stale) across most sites; migrated as-is per site rather than corrected.",
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
    {
      name: "customCss",
      type: "textarea",
      admin: {
        description:
          "This site's WordPress Customizer \"Additional CSS\" (theme_mods custom_css, rendered live as <style id=\"wp-custom-css\">) - applies network-wide overrides (e.g. reduced in-content heading sizes) that aren't in any page's own content. Scraped from the live site rather than the custom_css post type table, which can hold multiple stale/duplicate revisions.",
      },
    },
    {
      name: "defaultTitleBackgroundImage",
      type: "upload",
      relationTo: "media",
      admin: {
        description:
          "This site's theme-wide default title-area background image (Buro theme options -> title_area_background_image, stored in wp_options as mkd_options_buro, not per-page postmeta). Falls back for any page whose own titleBackgroundImage isn't set - confirmed against production, where pages with no page-specific title image still show this default (e.g. bcn's /uk-a-level-3-course/).",
      },
    },
  ],
};
