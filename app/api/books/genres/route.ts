import { prisma } from "@/lib/prisma";
import { parseGenres } from "@/lib/utils";
import { cached, cachedResponse } from "@/lib/cache";

export async function GET() {
  const genres = await cached("genres", async () => {
    const rows: { genre: string | null }[] = await prisma.book.findMany({
      where: { stock: { gt: 0 }, genre: { not: null } },
      select: { genre: true },
    });
    const allGenres = new Set<string>();
    for (const r of rows) {
      for (const g of parseGenres(r.genre)) {
        allGenres.add(g);
      }
    }
    return Array.from(allGenres).sort();
  }, 300_000);

  return cachedResponse(genres, 300);
}
