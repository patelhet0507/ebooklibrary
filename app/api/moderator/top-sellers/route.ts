import { prisma } from "@/lib/prisma"
import { config } from "@/lib/config"
import { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const period = searchParams.get("period") || "week"
  const limit = parseInt(searchParams.get("limit") || "10")

  const now = new Date()
  let startDate: Date
  switch (period) {
    case "month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case "year":
      startDate = new Date(now.getFullYear(), 0, 1)
      break
    case "week":
    default:
      startDate = new Date(now)
      startDate.setDate(now.getDate() - now.getDay())
      startDate.setHours(0, 0, 0, 0)
      break
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      type: "PURCHASE",
      created_at: { gte: startDate },
    },
    include: {
      book: { select: { seller_id: true } },
    },
  })

  const sellerMap = new Map<string, { total_sales: number; books_sold: number }>()

  for (const t of transactions) {
    const sellerId = t.book.seller_id
    if (!sellerId || sellerId === "moderator") continue
    const current = sellerMap.get(sellerId) || { total_sales: 0, books_sold: 0 }
    current.total_sales += t.total_amount
    current.books_sold += t.quantity
    sellerMap.set(sellerId, current)
  }

  const sellerIds = Array.from(sellerMap.keys())
  const sellers: { id: string; name: string }[] = await prisma.user.findMany({
    where: { id: { in: sellerIds } },
    select: { id: true, name: true },
  })

  const sellerNameMap = new Map(sellers.map((s) => [s.id, s.name]))

  const result = Array.from(sellerMap.entries())
    .map(([seller_id, data]) => ({
      seller_id,
      seller_name: sellerNameMap.get(seller_id) || "Unknown",
      total_sales: data.total_sales,
      books_sold: data.books_sold,
    }))
    .sort((a, b) => b.total_sales - a.total_sales)
    .slice(0, limit)

  return Response.json(result)
}
