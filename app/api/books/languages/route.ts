import { prisma } from "@/lib/prisma";

type LanguageRow = { language: string | null };

export async function GET() {
  const languages: LanguageRow[] = await prisma.book.findMany({
    where: { stock: { gt: 0 }, language: { not: null } },
    select: { language: true },
    distinct: ["language"],
    orderBy: { language: "asc" },
  });
  return Response.json(languages.map((l) => l.language));
}
