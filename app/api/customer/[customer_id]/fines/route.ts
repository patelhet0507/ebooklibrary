import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customer_id: string }> }
) {
  try {
    const { customer_id } = await params

    const fines = await prisma.fine.findMany({
      where: { user_id: customer_id },
      orderBy: { created_at: "desc" },
    })

    return Response.json(fines)
  } catch (error) {
    return Response.json({ detail: "Internal server error" }, { status: 500 })
  }
}
