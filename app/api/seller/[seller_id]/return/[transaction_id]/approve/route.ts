import { prisma } from "@/lib/prisma"
import { config } from "@/lib/config"
import { sendReturnApprovedNotification } from "@/lib/email"
import { NextRequest } from "next/server"
import { randomUUID } from "crypto"
import { withAuth } from "@/lib/api-auth"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ seller_id: string; transaction_id: string }> }
) {
  return withAuth(async (session) => {
    const { seller_id, transaction_id } = await params
    if (session.role !== "SELLER" && session.userId !== seller_id) {
      return Response.json({ detail: "Unauthorized" }, { status: 403 })
    }
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transaction_id,
        book: { seller_id },
        type: "RENT",
        return_requested_at: { not: null },
        returned_at: null,
      },
      include: {
        book: true,
        customer: true,
      },
    })
    if (!transaction) return Response.json({ detail: "Return request not found" }, { status: 404 })
    const now = new Date()
    const updated: { payment: { id: string } | null } = await prisma.transaction.update({
      where: { id: transaction_id },
      data: {
        type: "RETURN",
        returned_at: now,
      },
      include: { payment: true },
    })
    await prisma.book.update({
      where: { id: transaction.book_id },
      data: { stock: { increment: transaction.quantity } },
    })
    let fineAmount = 0
    if (transaction.due_date && now > transaction.due_date) {
      const diffMs = now.getTime() - new Date(transaction.due_date).getTime()
      const days_late = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
      fineAmount = days_late * config.finePerDay
      await prisma.fine.create({
        data: {
          id: randomUUID(),
          transaction_id,
          user_id: transaction.customer_id,
          amount: fineAmount,
          days_late,
          status: "PENDING",
        },
      })
    }
    sendReturnApprovedNotification(transaction.customer.email, transaction.customer.name, transaction.book.title, fineAmount)

    const { payment: p, ...txn } = updated
    return Response.json({ ...txn, payment_id: p?.id ?? null })
  }, ["SELLER"])
}