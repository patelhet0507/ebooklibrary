import { prisma } from "@/lib/prisma"
import { config } from "@/lib/config"
import { NextRequest, NextResponse } from "next/server"
import { stringifyGenres } from "@/lib/utils"
import { withAuth } from "@/lib/api-auth"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ book_id: string }> }
) {
  return withAuth(async () => {
    const { book_id } = await params
    const existing = await prisma.book.findUnique({ where: { id: book_id } })
    if (!existing) {
      return NextResponse.json({ detail: "Book not found" }, { status: 404 });
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}
    if (body.title !== undefined) data.title = body.title
    if (body.author !== undefined) data.author = body.author
    if (body.isbn !== undefined) data.isbn = body.isbn
    if (body.description !== undefined) data.description = body.description
    if (body.language !== undefined) data.language = body.language
    if (body.genres !== undefined) data.genre = stringifyGenres(body.genres)
    if (body.cover_image !== undefined) data.cover_image = body.cover_image
    if (body.price !== undefined) data.price = body.price
    if (body.rental_price_per_day !== undefined) data.rental_price_per_day = body.rental_price_per_day
    if (body.stock !== undefined) data.stock = body.stock

    const book = await prisma.book.update({
      where: { id: book_id },
      data,
      include: { images: true },
    })

    return NextResponse.json(book);
  }, ["MODERATOR"])
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ book_id: string }> }
) {
  return withAuth(async () => {
    const { book_id } = await params
    await prisma.book.delete({ where: { id: book_id } })
    return new NextResponse(null, { status: 204 });
  }, ["MODERATOR"])
}