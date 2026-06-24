import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"
import { withAuth } from "@/lib/api-auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ seller_id: string }> }
) {
  return withAuth(async (session) => {
    const { seller_id } = await params
    if (session.role !== "SELLER" && session.userId !== seller_id) {
      return Response.json({ detail: "Unauthorized" }, { status: 403 })
    }
    type ReturnRequestRow = {
      id: string; book_id: string; customer_id: string; type: string;
      quantity: number; total_amount: number; rental_days: number | null;
      due_date: Date | null; return_requested_at: Date | null;
      created_at: Date; returned_at: Date | null;
      book: { title: string }; customer: { name: string };
    };

    const transactions: ReturnRequestRow[] = await prisma.transaction.findMany({
      where: {
        book: { seller_id },
        type: "RENT",
        return_requested_at: { not: null },
        returned_at: null,
      },
      include: {
        book: { select: { title: true } },
        customer: { select: { name: true } },
      },
    })
    const result = transactions.map((t) => ({
      id: t.id,
      book_id: t.book_id,
      book_title: t.book.title,
      customer_id: t.customer_id,
      customer_name: t.customer.name,
      type: t.type,
      quantity: t.quantity,
      total_amount: t.total_amount,
      rental_days: t.rental_days,
      due_date: t.due_date,
      return_requested_at: t.return_requested_at,
      created_at: t.created_at,
    }))
    return Response.json(result)
  }, ["SELLER"])
}