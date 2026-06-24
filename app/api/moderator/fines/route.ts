import { prisma } from "@/lib/prisma"
import { config } from "@/lib/config"
import { NextRequest } from "next/server"
import { withAuth } from "@/lib/api-auth"

export async function GET(request: NextRequest) {
  return withAuth(async () => {
    const status = request.nextUrl.searchParams.get("status")

    const where: Record<string, unknown> = {}
    if (status) where.status = status

    const fines = await prisma.fine.findMany({
      where,
      orderBy: { created_at: "desc" },
    })

    return Response.json(fines)
  }, ["MODERATOR"])
}