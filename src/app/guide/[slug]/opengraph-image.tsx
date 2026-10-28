import { allModules, findModule } from "@/lib/curriculum";
import { OG_SIZE, ogImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return allModules().map(({ module }) => ({ slug: module.slug }));
}

export default function Image({ params }: { params: { slug: string } }) {
  const found = findModule(params.slug);
  if (!found) return ogImage({ eyebrow: "USAPhO Guide", title: "Lesson not found" });
  const { module: mod, division, section } = found;
  return ogImage({
    eyebrow: `${division.name} · ${section.title}`,
    title: mod.title,
    description: mod.description,
  });
}
