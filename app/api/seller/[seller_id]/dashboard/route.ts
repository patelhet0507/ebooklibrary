import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ seller_id: string }> }
) {
  return withAuth(async (session, req) => {
    const { seller_id } = await params
    if (session.role !== "SELLER" && session.userId !== seller_id) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 403 });
    }
    const purchases: { total_amount: number }[] = await prisma.transaction.findMany({
      where: { book: { seller_id }, type: "PURCHASE" },
    })
    const total_earnings = purchases.reduce((sum, t) => sum + t.total_amount, 0)
    const total_sales = purchases.length
    const finesResult = await prisma.fine.aggregate({
      where: {
        status: "PENDING",
        transaction: { book: { seller_id } },
      },
      _sum: { amount: true },
    })
    const pending_fines = finesResult._sum.amount || 0
    const active_returns = await prisma.transaction.count({
      where: {
        book: { seller_id },
        type: "RETURN",
        returned_at: null,
      },
    })
    return NextResponse.json({ total_earnings, total_sales, pending_fines, active_returns });
  }, request, ["SELLER"])
}