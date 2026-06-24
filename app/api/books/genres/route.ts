import { prisma } from "@/lib/prisma";
import { parseGenres } from "@/lib/utils";

export async function GET() {
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
  return Response.json(Array.from(allGenres).sort());
}
