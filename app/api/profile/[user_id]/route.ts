import { prisma } from "@/lib/prisma"
import { config } from "@/lib/config"
import { NextRequest } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  const { user_id } = await params

  const user = await prisma.user.findUnique({ where: { id: user_id } })
  if (!user) {
    return Response.json({ detail: "User not found" }, { status: 404 })
  }

  return Response.json(user)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  const { user_id } = await params

  const existing = await prisma.user.findUnique({ where: { id: user_id } })
  if (!existing) {
    return Response.json({ detail: "User not found" }, { status: 404 })
  }

  const body = await request.json()
  const data: Record<string, unknown> = {}
  if (body.name !== undefined) data.name = body.name
  if (body.phone !== undefined) data.phone = body.phone
  if (body.address !== undefined) data.address = body.address
  if (body.city !== undefined) data.city = body.city
  if (body.state !== undefined) data.state = body.state
  if (body.pincode !== undefined) data.pincode = body.pincode

  const user = await prisma.user.update({
    where: { id: user_id },
    data,
  })

  return Response.json(user)
}
