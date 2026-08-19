import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

const nextConfig: NextConfig = {
  // Required for app/global-not-found.tsx: this app has two separate root
  // layouts ((frontend) and (payload) admin), so Next.js can't compose a
  // normal global 404 from a single layout - it needs the standalone
  // global-not-found.js convention instead.
  experimental: {
    globalNotFound: true,
  },
  // Trailing slashes are enforced manually in proxy.ts instead of via the
  // global `trailingSlash: true` option, because that option also rewrites
  // /api/* routes and breaks Payload's REST API. skipTrailingSlashRedirect
  // disables Next's own (conflicting) automatic trailing-slash redirects
  // entirely, so only proxy.ts's logic applies.
  skipTrailingSlashRedirect: true,
  // sharp is externalized (see withPayload's serverExternalPackages below)
  // rather than bundled, so Next's output file tracing has to independently
  // discover its native binary to include it in the deployed function.
  // Tracing sometimes fails to pick up optional-dependency platform
  // packages like this one - see the Next.js docs' own worked example for
  // this exact package (node_modules/next/dist/docs/.../output.md) - which
  // surfaced on Vercel as "Failed to load external module sharp-<hash>:
  // Could not load the sharp module using the linux-x64 runtime". Forcing
  // the include here makes it deploy-cache-proof instead of relying on
  // tracing (and Vercel's build cache) getting it right every time.
  outputFileTracingIncludes: {
    "/*": [
      "./node_modules/sharp/**/*",
      "./node_modules/@img/sharp-linux-x64/**/*",
      "./node_modules/@img/sharp-libvips-linux-x64/**/*",
    ],
  },
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
