import type { Access, FieldAccess } from "payload";

// Every collection in this app previously had no create/update/delete
// access function set at all, which Payload defaults to `() => true` for
// any omitted operation - meaning any authenticated user had full write
// access to every collection network-wide. User request (2026-09-03): a
// per-site "editor" account (e.g. the person who runs mia) who can edit
// that site's own page/product content, but nothing else - not other
// sites' content, not structural fields (slugs/redirects), not any other
// collection (testimonials, media, ...). These are the shared building
// blocks every collection's own access config below is built from, rather
// than repeating the same req.user.roles/sites checks in each file.
function isAdminUser(user: unknown): boolean {
  const roles = (user as { roles?: unknown } | null | undefined)?.roles;
  return Array.isArray(roles) && roles.includes("admin");
}

export const adminOnly: Access = ({ req }) => isAdminUser(req.user);

export const adminFieldOnly: FieldAccess = ({ req }) => isAdminUser(req.user);

// For collections with a required `site` relationship field (Pages,
// Products): admins get full access; a non-admin "editor" is scoped to
// exactly the sites listed on their own user doc (Users.sites) - Payload
// accepts a `where` query back from an Access function for this exact
// purpose (list operations are filtered by it; single-doc operations are
// evaluated against it directly). Empty/missing `sites` means *no* access
// at all here, not "every site" - the opposite of Users.sites' own admin-
// facing field description ("leave empty for all sites"), which describes
// the convenience case for an admin-role account; extending that same
// default to a plain editor account would silently grant full network
// access to anyone whose sites list was left unset by mistake, which is
// exactly the failure mode this whole feature exists to prevent.
// Users.ts's own `update` access: an admin can edit any account; a non-
// admin can only edit their own (Payload applies this Where clause to
// single-doc operations too, not just list ones) - notably still can't
// touch their own `roles`/`sites` fields even then, since those have their
// own field-level `adminFieldOnly` lock (see Users.ts) - otherwise an
// editor could just grant themselves more sites or promote themselves to
// admin via their own account, defeating the point of this whole feature.
export const ownAccountOrAdmin: Access = ({ req }) => {
  if (!req.user) return false;
  if (isAdminUser(req.user)) return true;
  return { id: { equals: req.user.id } };
};

export const siteScopedAccess: Access = ({ req }) => {
  if (!req.user) return false;
  if (isAdminUser(req.user)) return true;
  const sites = (req.user as { sites?: unknown }).sites;
  if (!Array.isArray(sites) || sites.length === 0) return false;
  const siteIds = sites.map((s) => (s && typeof s === "object" ? (s as { id: unknown }).id : s));
  return { site: { in: siteIds } };
};
