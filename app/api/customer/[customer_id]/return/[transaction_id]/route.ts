import { prisma } from "@/lib/prisma"
import { sendReturnRequestNotification } from "@/lib/email"
import { NextRequest } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ customer_id: string; transaction_id: string }> }
) {
  try {
    const { customer_id, transaction_id } = await params

    const transaction = await prisma.transaction.findFirst({
      where: { id: transaction_id, customer_id, type: "RENT", returned_at: null },
      include: { book: true },
    })

    if (!transaction) {
      return Response.json({ detail: "Transaction not found" }, { status: 404 })
    }
    if (transaction.return_requested_at) {
      return Response.json({ detail: "Return already requested" }, { status: 400 })
    }

    const updated: { payment: { id: string } | null } = await prisma.transaction.update({
      where: { id: transaction_id },
      data: { return_requested_at: new Date() },
      include: { payment: true },
    })

    const book = transaction.book
    if (book.seller_id && book.seller_id !== "moderator") {
      const [seller, customer] = await Promise.all([
        prisma.user.findUnique({ where: { id: book.seller_id } }),
        prisma.user.findUnique({ where: { id: customer_id } }),
      ])
      if (seller && customer) {
        sendReturnRequestNotification(seller.email, seller.name, book.title, customer.name)
      }
    }

    const { payment, ...txn } = updated
    return Response.json({ ...txn, payment_id: payment?.id ?? null })
  } catch (error) {
    return Response.json({ detail: "Internal server error" }, { status: 500 })
  }
}
