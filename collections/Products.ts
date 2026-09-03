import type { CollectionConfig } from "payload";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { adminFieldOnly, adminOnly, siteScopedAccess } from "../lib/access-control";

export const Products: CollectionConfig = {
  slug: "products",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "site", "price", "stockStatus"],
  },
  access: {
    read: () => true,
    // Course schedule/pricing "dates" live in a product's own content
    // (wpRawContent) - same per-site editor scoping as Pages.
    update: siteScopedAccess,
    create: adminOnly,
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
      access: { update: adminFieldOnly },
    },
    {
      name: "site",
      type: "relationship",
      relationTo: "sites",
      required: true,
      access: { update: adminFieldOnly },
    },
    {
      name: "sku",
      type: "text",
    },
    {
      name: "description",
      type: "richText",
      editor: lexicalEditor(),
    },
    {
      name: "shortDescription",
      type: "textarea",
    },
    {
      name: "wpRawContent",
      type: "text",
      admin: {
        description:
          "Raw WPBakery shortcode markup for this product's real body content. WooCommerce products on this network store their actual content in WordPress's post_excerpt field, not post_content (post_content is empty for every product checked network-wide) - migrate-content.ts only ever converted post_content into the description field, leaving description permanently empty and this real content unrendered. Rendered the same way as Pages' wpRawContent, via wpContentToStyledHtml.",
      },
    },
    {
      name: "price",
      type: "number",
    },
    {
      name: "salePrice",
      type: "number",
    },
    {
      name: "currency",
      type: "text",
      defaultValue: "GBP",
    },
    {
      name: "stockStatus",
      type: "select",
      defaultValue: "instock",
      options: [
        { label: "In stock", value: "instock" },
        { label: "Out of stock", value: "outofstock" },
        { label: "On backorder", value: "onbackorder" },
      ],
    },
    {
      name: "stockQuantity",
      type: "number",
    },
    {
      name: "images",
      type: "upload",
      relationTo: "media",
      hasMany: true,
    },
    {
      name: "categories",
      type: "relationship",
      relationTo: "categories",
      hasMany: true,
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
      name: "wpProductId",
      type: "number",
      admin: {
        description: "Original WooCommerce product post ID",
      },
    },
    {
      name: "attributes",
      type: "array",
      admin: {
        description:
          "Visible WooCommerce product attributes (e.g. Registration: Full, Early Bird), for display in an Additional Information section - not tied to per-variation pricing/stock.",
      },
      fields: [
        { name: "name", type: "text", required: true },
        { name: "options", type: "text", required: true },
      ],
    },
    {
      name: "productType",
      type: "select",
      defaultValue: "simple",
      options: [
        { label: "Simple Product", value: "simple" },
        { label: "Variable Product", value: "variable" },
      ],
    },
    {
      name: "variations",
      type: "array",
      admin: {
        condition: (data) => data.productType === "variable",
        description: "Define product variations (e.g. Early Bird, Full Price, different schedules).",
      },
      fields: [
        { name: "name", type: "text", required: true },
        { name: "price", type: "number", required: true },
        { name: "salePrice", type: "number" },
        { name: "sku", type: "text" },
        { name: "stockQuantity", type: "number" },
        {
          name: "attributes",
          type: "array",
          fields: [
            { name: "attributeName", type: "text", required: true, admin: { description: "e.g., 'Registration Fee'" } },
            { name: "attributeValue", type: "text", required: true, admin: { description: "e.g., 'Early Bird'" } },
          ],
        },
      ],
    },
  ],
};
