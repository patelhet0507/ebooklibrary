import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("q") || ""
  const author = searchParams.get("author")
  const language = searchParams.get("language")
  const minPrice = searchParams.get("minPrice")
  const maxPrice = searchParams.get("maxPrice")
  const minRating = searchParams.get("minRating")
  const genre = searchParams.get("genre")
  const skip = parseInt(searchParams.get("skip") || "0")
  const limit = parseInt(searchParams.get("limit") || "20")
  const sortBy = searchParams.get("sortBy") || "relevance"

  const where: Record<string, unknown> = {}

  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { author: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
      { isbn: { contains: query, mode: "insensitive" } },
    ]
  }
  if (author) where.author = { contains: author, mode: "insensitive" }
  if (language) where.language = language
  if (genre) where.genre = { contains: genre, mode: "insensitive" }
  if (minPrice || maxPrice) {
    where.price = { gte: minPrice ? parseFloat(minPrice) : undefined, lte: maxPrice ? parseFloat(maxPrice) : undefined }
  }
  if (minRating) where.avg_rating = { gte: parseFloat(minRating) }

  const orderBy: Record<string, string> = {}
  switch (sortBy) {
    case "price_asc": orderBy.price = "asc"; break
    case "price_desc": orderBy.price = "desc"; break
    case "rating": orderBy.avg_rating = "desc"; break
    case "newest": orderBy.created_at = "desc"; break
    case "popular": orderBy.review_count = "desc"; break
    default: orderBy.created_at = "desc"
  }

  const [books, total] = await Promise.all([
    prisma.book.findMany({
      where,
      skip,
      take: limit,
      include: { images: true },
      orderBy,
    }),
    prisma.book.count({ where }),
  ])

  return NextResponse.json({ books, total, skip, limit })
}