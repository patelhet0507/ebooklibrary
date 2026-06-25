import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-auth"

export async function GET(request: NextRequest) {
  return withAuth(async () => {
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get("period") || "month"
    const now = new Date()

    let startDate: Date
    switch (period) {
      case "week":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
        break
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      case "day":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      default: // month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    const prevStartDate = new Date(startDate)
    prevStartDate.setMonth(prevStartDate.getMonth() - 1)

    const [
      revenueAgg,
      prevRevenueAgg,
      totalUsers,
      newUsersThisPeriod,
      totalBooks,
      totalOrders,
      avgOrderValue,
      topSellingBooks,
      revenueByCategory,
      userGrowth,
    ] = await Promise.all([
      prisma.transaction.aggregate({
        where: { type: "PURCHASE", created_at: { gte: startDate } },
        _sum: { total_amount: true },
      }),
      prisma.transaction.aggregate({
        where: { type: "PURCHASE", created_at: { gte: prevStartDate, lt: startDate } },
        _sum: { total_amount: true },
      }),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.user.count({ where: { role: "CUSTOMER", created_at: { gte: startDate } } }),
      prisma.book.count(),
      prisma.transaction.count({ where: { type: "PURCHASE", created_at: { gte: startDate } } }),
      prisma.transaction.aggregate({
        where: { type: "PURCHASE", created_at: { gte: startDate } },
        _avg: { total_amount: true },
      }),
      prisma.transaction.groupBy({
        by: ["book_id"],
        where: { type: "PURCHASE", created_at: { gte: startDate } },
        _sum: { total_amount: true, quantity: true },
        orderBy: { _sum: { total_amount: "desc" } },
        take: 10,
      }),
      prisma.transaction.groupBy({
        by: ["book_id"],
        where: { type: "PURCHASE", created_at: { gte: startDate } },
        _sum: { total_amount: true },
        orderBy: { _sum: { total_amount: "desc" } },
      }),
      prisma.user.groupBy({
        by: ["created_at"],
        where: { role: "CUSTOMER", created_at: { gte: startDate } },
        _count: { id: true },
        orderBy: { created_at: "asc" },
      }),
    ])

    const bookIds = topSellingBooks.map((b: { book_id: string; _sum: { total_amount: number | null; quantity: number | null } }) => b.book_id)
    const books = await prisma.book.findMany({
      where: { id: { in: bookIds } },
      select: { id: true, title: true, author: true, cover_image: true },
    })
    const bookMap = new Map(books.map((b: { id: string; title: string; author: string; cover_image: string | null }) => [b.id, b]))

    return NextResponse.json({
      period,
      revenue: revenueAgg._sum.total_amount || 0,
      revenueChange: prevRevenueAgg._sum.total_amount
        ? ((revenueAgg._sum.total_amount || 0) - (prevRevenueAgg._sum.total_amount || 0)) / (prevRevenueAgg._sum.total_amount || 1)
        : 0,
      totalUsers,
      newUsers: newUsersThisPeriod,
      totalBooks,
      totalOrders,
      avgOrderValue: avgOrderValue._avg.total_amount || 0,
      topSellingBooks: topSellingBooks.map((b: { book_id: string; _sum: { total_amount: number | null; quantity: number | null } }) => ({
        ...(bookMap.get(b.book_id) as object | undefined),
        revenue: b._sum.total_amount,
        quantity: b._sum.quantity,
      })),
      userGrowth: userGrowth.map((u: { created_at: Date; _count: { id: number } }) => ({
        date: u.created_at,
        count: u._count.id,
      })),
    })
  }, request, ["MODERATOR"])
}