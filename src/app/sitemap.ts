import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXTAUTH_URL ?? "https://chartaalba.com";
  const now = new Date();

  return [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/top`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/digest`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/videos`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/circles`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${baseUrl}/help`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
