import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-auth"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (session) => {
    const { id } = await params

    const notification = await prisma.notification.findUnique({ where: { id } })
    if (!notification) {
      return NextResponse.json({ detail: "Notification not found" }, { status: 404 });
    }
    if (session.role !== "CUSTOMER" && session.userId !== notification.user_id) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 403 });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { is_read: true },
    })

    return NextResponse.json(updated)
  }, request, ["CUSTOMER", "MODERATOR", "SELLER"])
}