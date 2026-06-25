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
    const unreadOnly = searchParams.get("unread") === "true"
    const limit = parseInt(searchParams.get("limit") || "50")

    const notifications = await prisma.notification.findMany({
      where: {
        user_id: customer_id,
        ...(unreadOnly ? { is_read: false } : {}),
      },
      orderBy: { created_at: "desc" },
      take: limit,
    })

    const unreadCount = await prisma.notification.count({
      where: { user_id: customer_id, is_read: false },
    })

    return NextResponse.json({ notifications, unreadCount })
  }, request, ["CUSTOMER"])
}