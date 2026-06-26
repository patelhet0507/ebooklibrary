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

    const searchParams = request.nextUrl.searchParams
    const skip = Math.max(0, parseInt(searchParams.get("skip") || "0"))
    const take = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")))
    const type = searchParams.get("type")

    const where: Record<string, unknown> = { customer_id }
    if (type === "PURCHASE" || type === "RENT") where.type = type

    const [txRows, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take,
        select: {
          id: true, book_id: true, customer_id: true, type: true,
          quantity: true, total_amount: true, rental_days: true,
          due_date: true, returned_at: true, return_requested_at: true,
          refund_reason: true, created_at: true,
          payment: { select: { id: true } },
          book: { select: { title: true } },
        },
        orderBy: { created_at: "desc" },
      }),
      prisma.transaction.count({ where }),
    ])

    const result = (txRows as any[]).map((t) => ({
      id: t.id, book_id: t.book_id, customer_id: t.customer_id,
      type: t.type, quantity: t.quantity, total_amount: t.total_amount,
      rental_days: t.rental_days, due_date: t.due_date,
      returned_at: t.returned_at, return_requested_at: t.return_requested_at,
      refund_reason: t.refund_reason, created_at: t.created_at,
      payment_id: t.payment?.id ?? null,
      book_title: t.book?.title ?? "",
    }))

    return NextResponse.json({ transactions: result, total, skip, take });
  }, request)
}