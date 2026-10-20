import type { MetadataRoute } from "next";

/** Keep crawlers on the course and off the API and per-account pages. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/edit", "/account", "/login", "/progress"],
    },
    sitemap: "https://usapho.one/sitemap.xml",
  };
}
