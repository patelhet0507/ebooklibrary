import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"

type TxnRow = {
  id: string; book_id: string; customer_id: string; type: string;
  quantity: number; total_amount: number; rental_days: number | null;
  due_date: Date | null; returned_at: Date | null;
  return_requested_at: Date | null; created_at: Date;
  payment: { id: string } | null;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customer_id: string }> }
) {
  try {
    const { customer_id } = await params

    const transactions: TxnRow[] = await prisma.transaction.findMany({
      where: { customer_id },
      include: { payment: true },
      orderBy: { created_at: "desc" },
    })

    const result = transactions.map(({ payment, ...t }) => ({
      ...t,
      payment_id: payment?.id ?? null,
    }))

    return Response.json(result)
  } catch (error) {
    return Response.json({ detail: "Internal server error" }, { status: 500 })
  }
}
