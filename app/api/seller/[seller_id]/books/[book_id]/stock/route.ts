import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ seller_id: string; book_id: string }> }
) {
  const { seller_id, book_id } = await params
  const book = await prisma.book.findUnique({ where: { id: book_id } })
  if (!book) return Response.json({ detail: "Book not found" }, { status: 404 })
  if (book.seller_id !== seller_id) return Response.json({ detail: "Forbidden" }, { status: 403 })
  const { quantity, reason } = await request.json()
  let newStock = book.stock
  if (reason === "return") {
    newStock += quantity
  } else if (reason === "sale") {
    if (book.stock < quantity) return Response.json({ detail: "Insufficient stock" }, { status: 400 })
    newStock -= quantity
  }
  const updated = await prisma.book.update({
    where: { id: book_id },
    data: { stock: newStock },
  })
  return Response.json({ new_stock: updated.stock })
}
