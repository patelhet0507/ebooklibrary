import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"
import { noCacheResponse } from "@/lib/cache"

const BOOK_SEARCH_SELECT = {
  id: true, title: true, author: true, slug: true, isbn: true,
  description: true, language: true, genre: true, cover_image: true,
  price: true, rental_price_per_day: true, stock: true, seller_id: true,
  avg_rating: true, review_count: true, created_at: true,
} as const

const IMAGE_SELECT = { id: true, url: true, is_primary: true } as const

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("q") || ""
  const author = searchParams.get("author")
  const language = searchParams.get("language")
  const minPrice = searchParams.get("minPrice")
  const maxPrice = searchParams.get("maxPrice")
  const minRating = searchParams.get("minRating")
  const genre = searchParams.get("genre")
  const skip = Math.max(0, parseInt(searchParams.get("skip") || "0"))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")))
  const sortBy = searchParams.get("sortBy") || "relevance"

  const where: Record<string, unknown> = {}

  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { author: { contains: query, mode: "insensitive" } },
      { isbn: { contains: query, mode: "insensitive" } },
    ]
  }
  if (author) where.author = { contains: author, mode: "insensitive" }
  if (language) where.language = language
  if (genre) where.genre = { contains: genre, mode: "insensitive" }
  if (minPrice || maxPrice) {
    where.price = {
      gte: minPrice ? parseFloat(minPrice) : undefined,
      lte: maxPrice ? parseFloat(maxPrice) : undefined,
    }
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
      select: { ...BOOK_SEARCH_SELECT, images: { select: IMAGE_SELECT } },
      orderBy,
    }),
    prisma.book.count({ where }),
  ])

  return noCacheResponse({ books, total, skip, limit })
}