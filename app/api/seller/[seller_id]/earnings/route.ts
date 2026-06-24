import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ seller_id: string }> }
) {
  const { seller_id } = await params
  const period = request.nextUrl.searchParams.get("period") || "week"
  const now = new Date()
  let startDate: Date
  if (period === "day") {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  } else if (period === "week") {
    const dayOfWeek = now.getDay()
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek)
  } else if (period === "month") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
  }
  const purchases: { total_amount: number }[] = await prisma.transaction.findMany({
    where: {
      book: { seller_id },
      type: "PURCHASE",
      created_at: { gte: startDate },
    },
  })
  const commissions = await prisma.commission.aggregate({
    where: {
      seller_id,
      created_at: { gte: startDate },
    },
    _sum: { amount: true },
  })
  const earnings = purchases.reduce((sum, t) => sum + t.total_amount, 0)
  return Response.json([{
    period,
    earnings,
    sales_count: purchases.length,
    commission_paid: commissions._sum.amount || 0,
  }])
}
