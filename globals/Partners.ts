import type { GlobalConfig } from "payload";

// The "Some of our partners" logo strip is the same 12 brands/links on
// every site network-wide - it was copy-pasted as raw WPBakery content onto
// 38 separate pages in WordPress, all identical (confirmed against every
// instance found). One shared global instead of 38 duplicated copies means
// a single edit updates every page that shows it (see renderPartners in
// scripts/wp-shortcode-render.ts).
export const Partners: GlobalConfig = {
  slug: "partners",
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "logos",
      type: "array",
      fields: [
        {
          name: "image",
          type: "upload",
          relationTo: "media",
          required: true,
        },
        {
          name: "name",
          type: "text",
        },
        {
          name: "link",
          type: "text",
        },
      ],
    },
  ],
};
