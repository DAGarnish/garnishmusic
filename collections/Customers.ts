import type { CollectionConfig } from "payload";

export const Customers: CollectionConfig = {
  slug: "customers",
  admin: {
    useAsTitle: "email",
    defaultColumns: ["email", "firstName", "lastName", "site"],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "email",
      type: "email",
      required: true,
    },
    {
      name: "firstName",
      type: "text",
    },
    {
      name: "lastName",
      type: "text",
    },
    {
      name: "site",
      type: "relationship",
      relationTo: "sites",
    },
    {
      name: "billingAddress",
      type: "group",
      fields: [
        { name: "address1", type: "text" },
        { name: "address2", type: "text" },
        { name: "city", type: "text" },
        { name: "state", type: "text" },
        { name: "postcode", type: "text" },
        { name: "country", type: "text" },
        { name: "phone", type: "text" },
      ],
    },
    {
      name: "shippingAddress",
      type: "group",
      fields: [
        { name: "address1", type: "text" },
        { name: "address2", type: "text" },
        { name: "city", type: "text" },
        { name: "state", type: "text" },
        { name: "postcode", type: "text" },
        { name: "country", type: "text" },
      ],
    },
    {
      name: "wpUserId",
      type: "number",
      admin: {
        description: "Original WordPress user ID",
      },
    },
  ],
};
