import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://ebooklibrary-five.vercel.app";

  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily" as const, priority: 1 },
    { url: `${baseUrl}/browse`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 },
    { url: `${baseUrl}/auth/login`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${baseUrl}/auth/register`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.3 },
  ];

  let bookPages: MetadataRoute.Sitemap = [];
  try {
    const { prisma } = await import("@/lib/prisma");
    const books: { id: string; updated_at: Date | null }[] = await prisma.book.findMany({
      select: { id: true, updated_at: true },
      take: 1000,
    });
    bookPages = books.map((book) => ({
      url: `${baseUrl}/books/${book.id}`,
      lastModified: book.updated_at || new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    // fail silently - sitemap works without books
  }

  return [...staticPages, ...bookPages];
}
