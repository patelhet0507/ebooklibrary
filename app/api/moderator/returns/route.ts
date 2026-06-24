import { prisma } from "@/lib/prisma"
import { config } from "@/lib/config"
import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-auth"

export async function GET(request: NextRequest) {
  return withAuth(async (session, req) => {
    type TxnWithRelations = {
      id: string; book_id: string; customer_id: string; type: string;
      quantity: number; total_amount: number; rental_days: number | null;
      due_date: Date | null; returned_at: Date | null;
      return_requested_at: Date | null; created_at: Date;
      book: { title: string }; customer: { name: string };
    };

    const transactions: TxnWithRelations[] = await prisma.transaction.findMany({
      where: {
        return_requested_at: { not: null },
        returned_at: null,
      },
      include: {
        book: { select: { title: true } },
        customer: { select: { name: true } },
      },
      orderBy: { return_requested_at: "desc" },
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
      due_date: t.due_date?.toISOString(),
      return_requested_at: t.return_requested_at?.toISOString(),
      returned_at: t.returned_at?.toISOString(),
      created_at: t.created_at.toISOString(),
    }))

    return NextResponse.json(result);
  }, request, ["MODERATOR"])
}