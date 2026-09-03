import type { CollectionConfig } from "payload";
import { adminOnly } from "../lib/access-control";

export const Orders: CollectionConfig = {
  slug: "orders",
  admin: {
    useAsTitle: "orderNumber",
    defaultColumns: ["orderNumber", "site", "status", "total", "orderDate"],
  },
  access: {
    read: () => true,
    // Admin-only - real order/payment records, never in scope for a
    // per-site content editor (explicit user request, 2026-09-03).
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    {
      name: "orderNumber",
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
      name: "customer",
      type: "relationship",
      relationTo: "customers",
    },
    {
      name: "status",
      type: "select",
      defaultValue: "pending",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Processing", value: "processing" },
        { label: "On hold", value: "on-hold" },
        { label: "Completed", value: "completed" },
        { label: "Cancelled", value: "cancelled" },
        { label: "Refunded", value: "refunded" },
        { label: "Failed", value: "failed" },
      ],
    },
    {
      name: "lineItems",
      type: "array",
      fields: [
        {
          name: "product",
          type: "relationship",
          relationTo: "products",
        },
        { name: "variationId", type: "text" },
        { name: "variationName", type: "text" },
        { name: "name", type: "text" },
        { name: "quantity", type: "number" },
        { name: "price", type: "number" },
        { name: "total", type: "number" },
      ],
    },
    {
      name: "subtotal",
      type: "number",
    },
    {
      name: "shippingTotal",
      type: "number",
    },
    {
      name: "taxTotal",
      type: "number",
    },
    {
      name: "total",
      type: "number",
    },
    {
      name: "currency",
      type: "text",
      defaultValue: "GBP",
    },
    {
      name: "orderDate",
      type: "date",
    },
    {
      name: "billingAddress",
      type: "group",
      fields: [
        { name: "firstName", type: "text" },
        { name: "lastName", type: "text" },
        { name: "address1", type: "text" },
        { name: "address2", type: "text" },
        { name: "city", type: "text" },
        { name: "state", type: "text" },
        { name: "postcode", type: "text" },
        { name: "country", type: "text" },
        { name: "email", type: "text" },
        { name: "phone", type: "text" },
      ],
    },
    {
      name: "shippingAddress",
      type: "group",
      fields: [
        { name: "firstName", type: "text" },
        { name: "lastName", type: "text" },
        { name: "address1", type: "text" },
        { name: "address2", type: "text" },
        { name: "city", type: "text" },
        { name: "state", type: "text" },
        { name: "postcode", type: "text" },
        { name: "country", type: "text" },
      ],
    },
    {
      name: "wpOrderId",
      type: "number",
      admin: {
        description: "Original WooCommerce order ID",
      },
    },
  ],
};
