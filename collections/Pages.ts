import type { CollectionConfig } from "payload";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { RowBlock } from "../blocks/Row";

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
      name: "titleBackgroundResponsive",
      type: "checkbox",
      defaultValue: true,
      admin: {
        description:
          "WordPress theme's mkd_title_area_background_image_responsive_meta - when false, the title area's background image is rendered as a plain inline background-image on the title bar itself (matching production's 'parallax'/'not-responsive' markup) instead of the default <img>-based responsive markup, which otherwise renders with zero height for these pages (confirmed against production, e.g. mia's /courses/curso-de-dj-espanol/).",
      },
    },
    {
      name: "titleAreaHeight",
      type: "number",
      admin: {
        description:
          "WordPress theme's mkd_title_area_height_meta - explicit pixel height for the title area, only meaningful when titleBackgroundResponsive is false. When absent, production computes this via its own parallax JS; we fall back to a fixed default instead of replicating that.",
      },
    },
    {
      name: "fullWidthTemplate",
      type: "checkbox",
      defaultValue: false,
      admin: {
        description:
          "WordPress's own _wp_page_template meta - true when the page uses the theme's 'full-width.php' template (edge-to-edge .mkd-full-width wrapper, no boxed .mkd-container) instead of the default boxed template. Previously only the homepage got this treatment (hardcoded); any other page built with the Full Width template - e.g. ny's /music-production-academy/ and /programs/logic-pro-x-music-program/ - rendered its rows squeezed into the ~1300px boxed container instead of the edge-to-edge layout production actually uses.",
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
      name: "layout",
      type: "blocks",
      blocks: [RowBlock],
      admin: {
        description: "Native Payload Blocks layout",
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
    {
      name: "hasSidebar",
      type: "checkbox",
      defaultValue: false,
      admin: {
        description:
          "Buro theme's mkd_sidebar_meta (e.g. 'sidebar-25-right') - a page-level layout choice stored in postmeta, entirely separate from the page's own shortcode content. When true, the page renders in a two-column .mkd-two-columns-75-25 layout with the site's widget sidebar (Yelp banner, Recent Posts, Search) alongside the main content instead of full-width.",
      },
    },
    {
      name: "portfolioCustomTemplate",
      type: "checkbox",
      defaultValue: false,
      admin: {
        description:
          "WordPress theme's mkd_portfolio_single_template_meta postmeta ('custom' vs absent/'default') on portfolio-item posts - the real switch between the theme's default two-column image+bio single template and a page that builds its own full-width layout from its shortcode content. Previously approximated by checking for the mkd_elements_holder shortcode in the page's content, which is only correlated with this setting, not it - confirmed wrong on nsh's /courses/ableton-live/ (meta is 'custom', so production renders it full-width) vs /courses/vocal-production/ and /courses/mixing-mastering/ (meta absent, so production renders both with the default two-column template) - both lack mkd_elements_holder, so the old heuristic put all three in the same bucket.",
      },
    },
  ],
};
