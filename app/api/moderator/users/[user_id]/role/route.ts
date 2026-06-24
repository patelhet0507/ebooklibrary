import { prisma } from "@/lib/prisma"
import { config } from "@/lib/config"
import { NextRequest } from "next/server"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  const { user_id } = await params
  const role = request.nextUrl.searchParams.get("role")
  if (!role) return Response.json({ detail: "Role is required" }, { status: 400 })

  await prisma.user.update({
    where: { id: user_id },
    data: { role },
  })

  return Response.json({ message: `User role changed to ${role}` })
}
