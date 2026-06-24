import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"
import { withAuth } from "@/lib/api-auth"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ customer_id: string; fine_id: string }> }
) {
  return withAuth(async (session) => {
    const { customer_id, fine_id } = await params
    if (session.role !== "CUSTOMER" && session.userId !== customer_id) {
      return Response.json({ detail: "Unauthorized" }, { status: 403 })
    }

    const fine = await prisma.fine.findUnique({ where: { id: fine_id } })
    if (!fine || fine.user_id !== customer_id) {
      return Response.json({ detail: "Fine not found" }, { status: 404 })
    }
    if (fine.status !== "PENDING") {
      return Response.json({ detail: "Fine is not pending" }, { status: 400 })
    }

    const updated = await prisma.fine.update({
      where: { id: fine_id },
      data: { status: "PAID", paid_at: new Date() },
    })

    return Response.json(updated)
  }, ["CUSTOMER"])
}