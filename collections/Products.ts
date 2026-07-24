import type { CollectionConfig } from "payload";
import { lexicalEditor } from "@payloadcms/richtext-lexical";

export const Products: CollectionConfig = {
  slug: "products",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "site", "price", "stockStatus"],
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
  ],
};
