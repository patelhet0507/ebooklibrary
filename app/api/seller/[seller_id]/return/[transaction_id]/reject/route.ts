import { prisma } from "@/lib/prisma"
import { sendReturnRejectedNotification } from "@/lib/email"
import { NextRequest } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ seller_id: string; transaction_id: string }> }
) {
  const { seller_id, transaction_id } = await params
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
  const { reason } = await request.json()
  await prisma.transaction.update({
    where: { id: transaction_id },
    data: { return_requested_at: null },
  })
  sendReturnRejectedNotification(transaction.customer.email, transaction.customer.name, transaction.book.title, reason || "No reason provided")
  return Response.json({ message: "Return request rejected" })
}
