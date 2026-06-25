import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customer_id: string }> }
) {
  return withAuth(async (session, req) => {
    const { customer_id } = await params
    if (session.userId !== customer_id) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 403 });
    }

    const fines = await prisma.fine.findMany({
      where: { user_id: customer_id },
      orderBy: { created_at: "desc" },
    })

    return NextResponse.json(fines);
  }, request)
}