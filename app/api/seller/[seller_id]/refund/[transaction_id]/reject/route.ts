import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ seller_id: string; transaction_id: string }> }
) {
  return withAuth(async (session) => {
    const { seller_id, transaction_id } = await params;
    if (session.role !== "SELLER" && session.userId !== seller_id) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 403 });
    }

    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transaction_id,
        book: { seller_id },
        type: "PURCHASE",
        return_requested_at: { not: null },
        returned_at: null,
      },
      include: {
        book: { select: { title: true } },
        customer: { select: { id: true, name: true } },
      },
    });

    if (!transaction) {
      return NextResponse.json({ detail: "Refund request not found" }, { status: 404 });
    }

    const { reason } = await request.json();

    await prisma.transaction.update({
      where: { id: transaction_id },
      data: {
        return_requested_at: null,
        refund_reason: null,
      },
    });

    const rejectionMessage = reason || "No reason provided";

    await prisma.notification.create({
      data: {
        user_id: transaction.customer_id,
        type: "RETURN_REJECTED",
        title: "Refund Request Rejected",
        message: `Your refund request for "${transaction.book.title}" has been rejected. Seller's note: ${rejectionMessage}`,
        data: JSON.stringify({ transaction_id, book_id: transaction.book_id, reason: rejectionMessage }),
      },
    });

    return NextResponse.json({ message: "Refund request rejected" });
  }, request, ["SELLER"]);
}
