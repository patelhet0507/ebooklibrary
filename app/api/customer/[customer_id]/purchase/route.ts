import { prisma } from "@/lib/prisma"
import { config } from "@/lib/config"
import { sendPurchaseConfirmation } from "@/lib/email"
import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-auth"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ customer_id: string }> }
) {
  return withAuth(async (session) => {
    const { customer_id } = await params
    if (session.role !== "CUSTOMER" && session.userId !== customer_id) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 403 });
    }

    try {
      const { book_id, quantity } = await request.json()

      const book = await prisma.book.findUnique({ where: { id: book_id } })
      if (!book) {
        return NextResponse.json({ detail: "Book not found" }, { status: 404 });
      }
      if (book.stock < quantity) {
        return NextResponse.json({ detail: "Insufficient stock" }, { status: 400 });
      }

      const customer = await prisma.user.findUnique({ where: { id: customer_id } })
      if (!customer) {
        return NextResponse.json({ detail: "Customer not found" }, { status: 404 });
      }

      const total_amount = book.price * quantity
      const due_date = new Date(Date.now() + config.returnDays * 24 * 60 * 60 * 1000)

      await prisma.book.update({
        where: { id: book_id },
        data: { stock: { decrement: quantity } },
      })

      const transaction = await prisma.transaction.create({
        data: {
          book_id,
          customer_id,
          type: "PURCHASE",
          quantity,
          total_amount,
          due_date,
        },
      })

      if (book.seller_id) {
        await prisma.commission.create({
          data: {
            seller_id: book.seller_id,
            amount: total_amount * config.commissionRate,
            percentage: config.commissionRate * 100,
            description: `Commission on purchase of ${book.title}`,
          },
        })
      }

      sendPurchaseConfirmation(customer.email, customer.name, book.title, total_amount)

      return NextResponse.json(transaction, { status: 201 });
    } catch (error) {
      return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
    }
  }, request)
}