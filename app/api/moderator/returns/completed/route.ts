import { prisma } from "@/lib/prisma"
import { config } from "@/lib/config"
import { NextRequest } from "next/server"

type TxnWithRelations = {
  id: string; book_id: string; customer_id: string; type: string;
  quantity: number; total_amount: number; rental_days: number | null;
  due_date: Date | null; returned_at: Date | null;
  return_requested_at: Date | null; created_at: Date;
  book: { title: string }; customer: { name: string };
};

export async function GET() {
  const transactions: TxnWithRelations[] = await prisma.transaction.findMany({
    where: {
      type: "RETURN",
      returned_at: { not: null },
    },
    include: {
      book: { select: { title: true } },
      customer: { select: { name: true } },
    },
    orderBy: { returned_at: "desc" },
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

  return Response.json(result)
}
