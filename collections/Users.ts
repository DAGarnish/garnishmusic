import type { CollectionConfig } from "payload";
import { adminFieldOnly, adminOnly, ownAccountOrAdmin } from "../lib/access-control";

export const Users: CollectionConfig = {
  slug: "users",
  admin: {
    useAsTitle: "email",
  },
  auth: true,
  access: {
    read: () => true,
    // Only admins can create new accounts - a per-site editor can update
    // their own account (e.g. name/password), but not anyone else's, and
    // not their own `roles`/`sites` (see those fields' own access below) -
    // otherwise they could just grant themselves more sites or promote
    // themselves to admin.
    create: adminOnly,
    update: ownAccountOrAdmin,
    delete: adminOnly,
  },
  fields: [
    {
      name: "name",
      type: "text",
    },
    {
      name: "roles",
      type: "select",
      hasMany: true,
      defaultValue: ["editor"],
      access: { update: adminFieldOnly },
      options: [
        { label: "Admin", value: "admin" },
        { label: "Editor", value: "editor" },
      ],
    },
    {
      name: "sites",
      type: "relationship",
      relationTo: "sites",
      hasMany: true,
      access: { update: adminFieldOnly },
      admin: {
        description:
          "Sites this editor can manage (Pages/Products only - see collections' own access config). Leave empty for an admin-role account (full access to every site); for an editor-role account, empty means no access to any site's content, not every site.",
      },
    },
  ],
};
