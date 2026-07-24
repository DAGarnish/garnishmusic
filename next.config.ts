import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

const nextConfig: NextConfig = {
  // Trailing slashes are enforced manually in proxy.ts instead of via the
  // global `trailingSlash: true` option, because that option also rewrites
  // /api/* routes and breaks Payload's REST API. skipTrailingSlashRedirect
  // disables Next's own (conflicting) automatic trailing-slash redirects
  // entirely, so only proxy.ts's logic applies.
  skipTrailingSlashRedirect: true,
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
