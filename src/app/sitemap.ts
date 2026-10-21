import type { MetadataRoute } from "next";
import { allModules } from "@/lib/curriculum";

const SITE = "https://usapho.one";

/** The pages worth finding from a search: the course, every module, the bank. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE, priority: 1 },
    { url: `${SITE}/guide`, priority: 0.9 },
    { url: `${SITE}/problems`, priority: 0.8 },
    { url: `${SITE}/contributors`, priority: 0.3 },
    ...allModules().map(({ module }) => ({
      url: `${SITE}/guide/${module.slug}`,
      priority: 0.7,
    })),
  ];
}
