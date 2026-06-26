import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ customer_id: string; transaction_id: string }> }
) {
  return withAuth(async (session) => {
    const { customer_id, transaction_id } = await params;
    if (session.userId !== customer_id) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 403 });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transaction_id },
      include: { payment: true },
    });

    if (!transaction || transaction.customer_id !== customer_id) {
      return NextResponse.json({ detail: "Transaction not found" }, { status: 404 });
    }

    if (transaction.type !== "PURCHASE") {
      return NextResponse.json({ detail: "Only purchases can be refunded" }, { status: 400 });
    }

    if (transaction.returned_at) {
      return NextResponse.json({ detail: "Already refunded" }, { status: 400 });
    }

    if (transaction.return_requested_at) {
      return NextResponse.json({ detail: "Refund already requested" }, { status: 400 });
    }

    // Check if within 7 days of purchase
    const daysSincePurchase = (Date.now() - new Date(transaction.created_at).getTime()) / 86400000;
    if (daysSincePurchase > 7) {
      return NextResponse.json({ detail: "Refund period has expired (7 days)" }, { status: 400 });
    }

    const { reason } = await request.json();

    const updated = await prisma.transaction.update({
      where: { id: transaction_id },
      data: {
        return_requested_at: new Date(),
        refund_reason: reason || null,
      },
    });

    return NextResponse.json({ success: true });
  }, request);
}
