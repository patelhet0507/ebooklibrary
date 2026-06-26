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

    await prisma.$transaction(async (tx: any) => {
      await tx.transaction.update({
        where: { id: transaction_id },
        data: { returned_at: new Date() },
      });
      await tx.book.update({
        where: { id: transaction.book_id },
        data: { stock: { increment: transaction.quantity } },
      });
    });

    await prisma.notification.create({
      data: {
        user_id: transaction.customer_id,
        type: "RETURN_APPROVED",
        title: "Refund Approved",
        message: `Your refund request for "${transaction.book.title}" has been approved by the seller.`,
        data: JSON.stringify({ transaction_id, book_id: transaction.book_id }),
      },
    });

    return NextResponse.json({ message: "Refund approved" });
  }, request, ["SELLER"]);
}
