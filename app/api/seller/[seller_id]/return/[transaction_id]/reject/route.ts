import { prisma } from "@/lib/prisma"
import { sendReturnRejectedNotification } from "@/lib/email"
import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-auth"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ seller_id: string; transaction_id: string }> }
) {
  return withAuth(async (session, req) => {
    const { seller_id, transaction_id } = await params
    if (session.role !== "SELLER" && session.userId !== seller_id) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 403 })
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
    if (!transaction) return NextResponse.json({ detail: "Return request not found" }, { status: 404 })
    const { reason } = await req.json()
    await prisma.transaction.update({
      where: { id: transaction_id },
      data: { return_requested_at: null },
    })
    sendReturnRejectedNotification(transaction.customer.email, transaction.customer.name, transaction.book.title, reason || "No reason provided")
    return NextResponse.json({ message: "Return request rejected" })
  }, request, ["SELLER"])
}