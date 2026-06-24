import { prisma } from "@/lib/prisma"
import { config } from "@/lib/config"
import { NextRequest } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  const { user_id } = await params

  const payments = await prisma.payment.findMany({
    where: { user_id },
    orderBy: { created_at: "desc" },
  })

  return Response.json(payments)
}
