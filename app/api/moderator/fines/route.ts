import { prisma } from "@/lib/prisma"
import { config } from "@/lib/config"
import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-auth"

export async function GET(request: NextRequest) {
  return withAuth(async (session, req) => {
    const status = req.nextUrl.searchParams.get("status")

    const where: Record<string, unknown> = {}
    if (status) where.status = status

    const fines = await prisma.fine.findMany({
      where,
      orderBy: { created_at: "desc" },
    })

    return NextResponse.json(fines)
  }, request, ["MODERATOR"])
}