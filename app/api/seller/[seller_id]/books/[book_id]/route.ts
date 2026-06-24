import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"
import { BookUpdate } from "@/lib/api"
import { stringifyGenres } from "@/lib/utils"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ seller_id: string; book_id: string }> }
) {
  const { seller_id, book_id } = await params
  const book = await prisma.book.findUnique({ where: { id: book_id } })
  if (!book) return Response.json({ detail: "Book not found" }, { status: 404 })
  if (book.seller_id !== seller_id) return Response.json({ detail: "Forbidden" }, { status: 403 })
  const body: BookUpdate = await request.json()
  const updated = await prisma.book.update({
    where: { id: book_id },
    data: {
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
      slug: body.title
        ? body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "book"
        : undefined,
    },
  })
  return Response.json(updated)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ seller_id: string; book_id: string }> }
) {
  const { seller_id, book_id } = await params
  const book = await prisma.book.findUnique({ where: { id: book_id } })
  if (!book) return Response.json({ detail: "Book not found" }, { status: 404 })
  if (book.seller_id !== seller_id) return Response.json({ detail: "Forbidden" }, { status: 403 })
  await prisma.book.delete({ where: { id: book_id } })
  return new Response(null, { status: 204 })
}
