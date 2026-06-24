import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search");
  const genre = searchParams.get("genre");
  const language = searchParams.get("language");
  const skip = Math.max(0, parseInt(searchParams.get("skip") || "0"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));

  const where: Record<string, unknown> = { stock: { gt: 0 } };
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { author: { contains: search, mode: "insensitive" } },
    ];
  }
  if (genre) where.genre = { contains: genre, mode: "insensitive" };
  if (language) where.language = language;

  const books = await prisma.book.findMany({
    where: where as any,
    include: { images: true },
    skip,
    take: limit,
    orderBy: { created_at: "desc" },
  });
  return Response.json(books);
}
