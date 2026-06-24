import { prisma } from "@/lib/prisma"
import { config } from "@/lib/config"
import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-auth"

export async function GET() {
  return withAuth(async () => {
    const earningsAgg = await prisma.transaction.aggregate({ where: { type: "PURCHASE" }, _sum: { total_amount: true } })
    const salesCount = await prisma.transaction.count({ where: { type: "PURCHASE" } })
    const pendingFinesAgg = await prisma.fine.aggregate({ where: { status: "PENDING" }, _sum: { amount: true } })
    const activeReturns = await prisma.transaction.count({ where: { type: "PURCHASE", returned_at: null } })
    const totalBooks = await prisma.book.count()
    const totalUsers = await prisma.user.count()
    const totalSellers = await prisma.user.count({ where: { role: "SELLER" } })
    const totalCustomers = await prisma.user.count({ where: { role: "CUSTOMER" } })
    const commissionAgg = await prisma.commission.aggregate({ _sum: { amount: true } })

    return NextResponse.json({
      total_earnings: earningsAgg._sum.total_amount || 0,
      total_sales: salesCount,
      pending_fines: pendingFinesAgg._sum.amount || 0,
      active_returns: activeReturns,
      total_books: totalBooks,
      total_users: totalUsers,
      total_sellers: totalSellers,
      total_customers: totalCustomers,
      total_commission: commissionAgg._sum.amount || 0,
    })
  }, ["MODERATOR"])
}