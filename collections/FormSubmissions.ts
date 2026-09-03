import type { CollectionConfig } from "payload";
import { adminOnly } from "../lib/access-control";

export const FormSubmissions: CollectionConfig = {
  slug: "form-submissions",
  admin: {
    useAsTitle: "formName",
    defaultColumns: ["formName", "site", "submittedAt"],
  },
  access: {
    read: () => true,
    // Admin-only, even for a site's own editor (explicit user request,
    // 2026-09-03 - editors are scoped to Pages/Products only).
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    {
      name: "formName",
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
      name: "submissionData",
      type: "json",
      admin: {
        description: "Full submitted field data as key/value pairs",
      },
    },
    {
      name: "submittedAt",
      type: "date",
    },
    {
      name: "status",
      type: "text",
    },
    {
      name: "wpFormId",
      type: "number",
      admin: {
        description: "Original Fluent Forms form ID",
      },
    },
    {
      name: "wpSubmissionId",
      type: "number",
      admin: {
        description: "Original Fluent Forms submission ID",
      },
    },
  ],
};
