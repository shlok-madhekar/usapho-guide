import type { findModule } from "@/lib/curriculum";

/**
 * schema.org data for a lesson page, so search engines can read it as a free
 * learning resource (with its length, level and licence) and show where it
 * sits in the course as a breadcrumb.
 */
const SITE = "https://usapho.one";

type Found = NonNullable<ReturnType<typeof findModule>>;

export function lessonJsonLd({ module: mod, division, section }: Found) {
  const url = `${SITE}/guide/${mod.slug}`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "LearningResource",
      name: mod.title,
      description: mod.description,
      url,
      inLanguage: "en",
      learningResourceType: "Lesson",
      educationalLevel: "High school",
      timeRequired: `PT${mod.minutes}M`,
      isAccessibleForFree: true,
      license: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
      about: `${division.name}: ${section.title}`,
      isPartOf: { "@type": "WebSite", name: "USAPhO Guide", url: SITE },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Course", item: `${SITE}/guide` },
        { "@type": "ListItem", position: 2, name: mod.title, item: url },
      ],
    },
  ];
}

/** JSON for a <script> tag: "<" escaped so a title can never close the tag. */
export const jsonLdScript = (data: unknown) =>
  JSON.stringify(data).replace(/</g, "\\u003c");
