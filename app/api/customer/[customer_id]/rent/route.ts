import { prisma } from "@/lib/prisma"
import { sendRentConfirmation } from "@/lib/email"
import { NextRequest } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ customer_id: string }> }
) {
  try {
    const { customer_id } = await params
    const { book_id, quantity, rental_days } = await request.json()

    const book = await prisma.book.findUnique({ where: { id: book_id } })
    if (!book) {
      return Response.json({ detail: "Book not found" }, { status: 404 })
    }
    if (book.stock < quantity) {
      return Response.json({ detail: "Insufficient stock" }, { status: 400 })
    }
    if (!rental_days || rental_days < 1) {
      return Response.json({ detail: "Rental days must be at least 1" }, { status: 400 })
    }

    const customer = await prisma.user.findUnique({ where: { id: customer_id } })
    if (!customer) {
      return Response.json({ detail: "Customer not found" }, { status: 404 })
    }

    const rental_price = book.rental_price_per_day ?? book.price * 0.1
    const total_amount = rental_price * quantity * rental_days
    const due_date = new Date(Date.now() + rental_days * 24 * 60 * 60 * 1000)

    await prisma.book.update({
      where: { id: book_id },
      data: { stock: { decrement: quantity } },
    })

    const transaction = await prisma.transaction.create({
      data: {
        book_id,
        customer_id,
        type: "RENT",
        quantity,
        rental_days,
        total_amount,
        due_date,
      },
    })

    sendRentConfirmation(customer.email, customer.name, book.title, total_amount, rental_days, due_date.toISOString())

    return Response.json(transaction, { status: 201 })
  } catch (error) {
    return Response.json({ detail: "Internal server error" }, { status: 500 })
  }
}
