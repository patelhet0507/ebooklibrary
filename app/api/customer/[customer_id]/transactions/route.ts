import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customer_id: string }> }
) {
  return withAuth(async (session) => {
    const { customer_id } = await params
    if (session.role !== "CUSTOMER" && session.userId !== customer_id) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 403 });
    }

    type TxnRow = {
      id: string; book_id: string; customer_id: string; type: string;
      quantity: number; total_amount: number; rental_days: number | null;
      due_date: Date | null; returned_at: Date | null;
      return_requested_at: Date | null; created_at: Date;
      payment: { id: string } | null;
    };

    const transactions: TxnRow[] = await prisma.transaction.findMany({
      where: { customer_id },
      include: { payment: true },
      orderBy: { created_at: "desc" },
    })

    const result = transactions.map(({ payment, ...t }) => ({
      ...t,
      payment_id: payment?.id ?? null,
    }))

    return NextResponse.json(result);
  }, ["CUSTOMER"])
}