import type { MetadataRoute } from "next";

const DEFAULT_DOMAIN = "www.garnishmusicproduction.com";

// Production's robots.txt is byte-identical across every subsite (network-
// wide RankMath config never overridden per-site) - including always
// pointing "Sitemap:" at www's sitemap rather than the current site's own.
// Replicated as-is for parity. /wp-admin/ has no equivalent in this app;
// /admin/ (Payload's admin UI) is the functional equivalent to disallow.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", disallow: ["/admin/"] },
      { userAgent: "SemrushBot", disallow: "/" },
      { userAgent: "Bingbot", disallow: "/" },
      { userAgent: "Yandex", disallow: "/" },
    ],
    sitemap: `https://${DEFAULT_DOMAIN}/sitemap.xml`,
  };
}
