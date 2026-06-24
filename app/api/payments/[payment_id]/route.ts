import { prisma } from "@/lib/prisma"
import { config } from "@/lib/config"
import { NextRequest } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ payment_id: string }> }
) {
  const { payment_id } = await params

  const payment = await prisma.payment.findUnique({ where: { id: payment_id } })
  if (!payment) {
    return Response.json({ detail: "Payment not found" }, { status: 404 })
  }

  return Response.json(payment)
}
