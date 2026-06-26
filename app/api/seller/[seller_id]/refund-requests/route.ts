import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ seller_id: string }> }
) {
  return withAuth(async (session) => {
    const { seller_id } = await params;
    if (session.role !== "SELLER" && session.userId !== seller_id) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 403 });
    }

    type RefundRequestRow = {
      id: string; book_id: string; customer_id: string; type: string;
      quantity: number; total_amount: number; refund_reason: string | null;
      return_requested_at: Date | null; created_at: Date;
      book: { title: string }; customer: { name: string; email: string };
    };

    const transactions: RefundRequestRow[] = await prisma.transaction.findMany({
      where: {
        book: { seller_id },
        type: "PURCHASE",
        return_requested_at: { not: null },
        returned_at: null,
      },
      include: {
        book: { select: { title: true } },
        customer: { select: { name: true, email: true } },
      },
    });

    const result = transactions.map((t: RefundRequestRow) => ({
      id: t.id,
      book_id: t.book_id,
      book_title: t.book.title,
      customer_id: t.customer_id,
      customer_name: t.customer.name,
      customer_email: t.customer.email,
      type: t.type,
      quantity: t.quantity,
      total_amount: t.total_amount,
      refund_reason: t.refund_reason,
      return_requested_at: t.return_requested_at,
      created_at: t.created_at,
    }));

    return NextResponse.json(result);
  }, request, ["SELLER"]);
}
