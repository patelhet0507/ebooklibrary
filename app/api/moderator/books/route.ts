import { prisma } from "@/lib/prisma"
import { config } from "@/lib/config"
import { randomUUID } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { stringifyGenres } from "@/lib/utils"
import { withAuth } from "@/lib/api-auth"
import { notifyUsersOnNewBook } from "@/lib/book-notify"
import { cacheInvalidate, cacheDel } from "@/lib/cache"

export async function GET(request: NextRequest) {
  return withAuth(async (session, req) => {
    const searchParams = req.nextUrl.searchParams
    const search = searchParams.get("search")
    const genre = searchParams.get("genre")
    const language = searchParams.get("language")
    const skip = parseInt(searchParams.get("skip") || "0")
    const limit = parseInt(searchParams.get("limit") || "20")

    const where: Record<string, unknown> = {}
    if (search) where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { author: { contains: search, mode: "insensitive" } },
    ]
    if (genre) where.genre = { contains: genre, mode: "insensitive" }
    if (language) where.language = language

    const books = await prisma.book.findMany({
      where,
      skip,
      take: limit,
      include: { images: true },
      orderBy: { created_at: "desc" },
    })

    return NextResponse.json(books)
  }, request, ["MODERATOR"])
}

export async function POST(request: NextRequest) {
  return withAuth(async (session, req) => {
    const body = await req.json()
    let slug = body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "book"

    const existing = await prisma.book.findUnique({ where: { slug } })
    if (existing) {
      slug = `${slug}-${Date.now()}`
    }

    const book = await prisma.book.create({
      data: {
        id: randomUUID(),
        title: body.title,
        author: body.author,
        isbn: body.isbn,
        slug,
        description: body.description,
        language: body.language,
        genre: body.genres ? stringifyGenres(body.genres) : undefined,
        cover_image: body.cover_image,
        price: body.price,
        rental_price_per_day: body.rental_price_per_day,
        stock: body.stock,
        seller_id: "moderator",
      },
      include: { images: true },
    })

    notifyUsersOnNewBook(book.id)
    cacheInvalidate("genres")
    cacheInvalidate("languages")

    return NextResponse.json(book, { status: 201 })
  }, request, ["MODERATOR"])
}