import { prisma } from "@/lib/prisma";
import { cached, cachedResponse } from "@/lib/cache";

type LanguageRow = { language: string | null };

export async function GET() {
  const languages = await cached("languages", async () => {
    const rows: LanguageRow[] = await prisma.book.findMany({
      where: { stock: { gt: 0 }, language: { not: null } },
      select: { language: true },
      distinct: ["language"],
      orderBy: { language: "asc" },
    });
    return rows.map((l) => l.language);
  }, 300_000);

  return cachedResponse(languages, 300);
}
