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

  const body = await request.json()

  await prisma.transaction.update({
    where: { id: transaction_id },
    data: { return_requested_at: null },
  })

  sendReturnRejectedNotification(
    transaction.customer.email,
    transaction.customer.name,
    transaction.book.title,
    body.reason || "No reason provided"
  )

  return Response.json({ message: "Return request rejected" })
}
