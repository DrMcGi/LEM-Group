import type { MetadataRoute } from "next";
import { getProperties } from "@/lib/property-store";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lem-accommodation.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const properties = await getProperties();

  return [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...properties.map((property) => ({
      url: `${siteUrl}/properties/${property.id}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
  ];
}