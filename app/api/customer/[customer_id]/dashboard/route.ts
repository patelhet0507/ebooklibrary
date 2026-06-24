import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customer_id: string }> }
) {
  return withAuth(async (session, req) => {
    const { customer_id } = await params
    if (session.role !== "CUSTOMER" && session.userId !== customer_id) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({ where: { id: customer_id } })
    if (!user) {
      return NextResponse.json({ detail: "Customer not found" }, { status: 404 });
    }

    const purchaseAgg = await prisma.transaction.aggregate({
      where: { customer_id, type: "PURCHASE" },
      _sum: { total_amount: true },
    })
    const totalPurchases = await prisma.transaction.count({ where: { customer_id, type: "PURCHASE" } })
    const booksReturned = await prisma.transaction.count({ where: { customer_id, type: "RETURN" } })
    const pendingFineAgg = await prisma.fine.aggregate({
      where: { user_id: customer_id, status: "PENDING" },
      _sum: { amount: true },
    })
    const ownedBooks = await prisma.transaction.count({ where: { customer_id, type: "PURCHASE", returned_at: null } })
    const activeRentals = await prisma.transaction.count({ where: { customer_id, type: "RENT", returned_at: null } })
    const overdueRentals = await prisma.transaction.count({
      where: { customer_id, type: "RENT", returned_at: null, due_date: { lt: new Date() } },
    })

    const dashboard = {
      total_spent: purchaseAgg._sum.total_amount ?? 0,
      total_purchases: totalPurchases,
      books_returned: booksReturned,
      pending_fines: pendingFineAgg._sum.amount ?? 0,
      owned_books: ownedBooks,
      active_rentals: activeRentals,
      overdue_rentals: overdueRentals,
      xp: user.xp,
      level: user.level,
    }

    return NextResponse.json(dashboard);
  }, request, ["CUSTOMER"])
}