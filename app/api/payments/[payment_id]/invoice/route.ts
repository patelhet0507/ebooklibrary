import { prisma } from "@/lib/prisma"
import { config } from "@/lib/config"
import { NextRequest } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ payment_id: string }> }
) {
  const { payment_id } = await params

  const payment = await prisma.payment.findUnique({
    where: { id: payment_id },
    include: {
      transaction: {
        include: {
          book: { include: { seller: { select: { name: true, email: true } } } },
          customer: { select: { name: true, email: true } },
        },
      },
      user: { select: { name: true, email: true } },
    },
  })

  if (!payment) {
    return Response.json({ detail: "Payment not found" }, { status: 404 })
  }

  const book = payment.transaction.book
  const seller = book.seller as { name: string; email: string } | null
  const isModerator = book.seller_id === "moderator"

  return Response.json({
    payment,
    transaction: payment.transaction,
    book,
    user_name: payment.user.name,
    user_email: payment.user.email,
    seller_name: isModerator ? "Moderator" : (seller?.name || "Unknown"),
    seller_email: isModerator ? "" : (seller?.email || ""),
  })
}
