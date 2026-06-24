import { prisma } from "@/lib/prisma"
import { config } from "@/lib/config"
import { sendReturnApprovedNotification, sendReturnRejectedNotification } from "@/lib/email"
import { NextRequest } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ transaction_id: string }> }
) {
  const { transaction_id } = await params

  const transaction = await prisma.transaction.findUnique({
    where: { id: transaction_id },
    include: {
      book: true,
      customer: true,
    },
  })

  if (!transaction) {
    return Response.json({ detail: "Transaction not found" }, { status: 404 })
  }

  let daysLate = 0
  let fineAmount = 0
  if (transaction.due_date && new Date() > transaction.due_date) {
    daysLate = Math.floor(
      (new Date().getTime() - transaction.due_date.getTime()) / (1000 * 60 * 60 * 24)
    )
    fineAmount = daysLate * config.finePerDay

    if (fineAmount > 0) {
      await prisma.fine.create({
        data: {
          id: crypto.randomUUID(),
          transaction_id: transaction.id,
          user_id: transaction.customer_id,
          amount: fineAmount,
          days_late: daysLate,
          status: "PENDING",
        },
      })
    }
  }

  const updated: { payment: { id: string } | null } = await prisma.transaction.update({
    where: { id: transaction_id },
    data: {
      type: "RETURN",
      returned_at: new Date(),
    },
    include: { payment: true },
  })
  await prisma.book.update({
    where: { id: transaction.book_id },
    data: { stock: { increment: transaction.quantity } },
  })

  sendReturnApprovedNotification(
    transaction.customer.email,
    transaction.customer.name,
    transaction.book.title,
    fineAmount
  )

  const { payment: p, ...txn } = updated
  return Response.json({ ...txn, payment_id: p?.id ?? null })
}
