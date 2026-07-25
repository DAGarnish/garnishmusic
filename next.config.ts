import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

const nextConfig: NextConfig = {
  // Trailing slashes are enforced manually in proxy.ts instead of via the
  // global `trailingSlash: true` option, because that option also rewrites
  // /api/* routes and breaks Payload's REST API. skipTrailingSlashRedirect
  // disables Next's own (conflicting) automatic trailing-slash redirects
  // entirely, so only proxy.ts's logic applies.
  skipTrailingSlashRedirect: true,
  // Migrated page/post HTML content has <img> src attributes hardcoded to
  // Payload's old local-disk upload route (baked in during the original
  // WordPress migration, before media moved to S3). Since media now lives in
  // S3 and that route no longer serves files, redirect it straight to S3
  // instead of rewriting every already-migrated content row.
  async redirects() {
    return [
      {
        source: "/api/media/file/:filename",
        destination: `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/:filename`,
        permanent: false,
      },
    ];
  },
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
