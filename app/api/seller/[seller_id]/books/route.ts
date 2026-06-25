import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { BookCreate } from "@/lib/api"
import { randomUUID } from "crypto"
import { stringifyGenres } from "@/lib/utils"
import { withAuth } from "@/lib/api-auth"
import { notifyUsersOnNewBook } from "@/lib/book-notify"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ seller_id: string }> }
) {
  return withAuth(async (session, req) => {
    const { seller_id } = await params
    if (session.role !== "SELLER" && session.userId !== seller_id) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 403 });
    }
    const books = await prisma.book.findMany({ where: { seller_id } })
    return NextResponse.json(books);
  }, request, ["SELLER", "MODERATOR"])
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ seller_id: string }> }
) {
  return withAuth(async (session, req) => {
    try {
      const { seller_id } = await params
      if (session.role !== "SELLER" && session.userId !== seller_id) {
        return NextResponse.json({ detail: "Unauthorized" }, { status: 403 });
      }
      const body: BookCreate = await req.json()

      let slug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "book"

      const existing = await prisma.book.findUnique({ where: { slug } })
      if (existing) {
        slug = `${slug}-${Date.now()}`
      }

      const book = await prisma.book.create({
        data: {
          id: randomUUID(),
          seller_id,
          title: body.title,
          author: body.author,
          isbn: body.isbn,
          description: body.description,
          language: body.language,
          genre: body.genres ? stringifyGenres(body.genres) : undefined,
          cover_image: body.cover_image,
          price: body.price,
          rental_price_per_day: body.rental_price_per_day,
          stock: body.stock,
          slug,
        },
      })
      notifyUsersOnNewBook(book.id)
      return NextResponse.json(book, { status: 201 });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create book"
      return NextResponse.json({ detail: message }, { status: 500 });
    }
  }, request, ["SELLER"])
}