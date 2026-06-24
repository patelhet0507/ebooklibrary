import { prisma } from "@/lib/prisma"
import { config } from "@/lib/config"
import { sendReturnApprovedNotification, sendReturnRejectedNotification } from "@/lib/email"
import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-auth"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ transaction_id: string }> }
) {
  return withAuth(async () => {
    const { transaction_id } = await params

    const transaction = await prisma.transaction.findUnique({
      where: { id: transaction_id },
      include: {
        book: true,
        customer: true,
      },
    })

    if (!transaction) {
      return NextResponse.json({ detail: "Transaction not found" }, { status: 404 });
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

    return NextResponse.json({ message: "Return request rejected" });
  }, ["MODERATOR"])
}