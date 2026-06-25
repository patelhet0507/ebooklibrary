import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-auth"
import type { JWTPayload } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  return withAuth(async (session: JWTPayload) => {
    const { user_id } = await params
    if (session.userId !== user_id) {
      return NextResponse.json({ detail: "Forbidden" }, { status: 403 })
    }

    const user = await prisma.user.findUnique({ where: { id: user_id } })
    if (!user) {
      return NextResponse.json({ detail: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  }, request)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  return withAuth(async (session: JWTPayload) => {
    const { user_id } = await params
    if (session.userId !== user_id) {
      return NextResponse.json({ detail: "Forbidden" }, { status: 403 })
    }

    const existing = await prisma.user.findUnique({ where: { id: user_id } })
    if (!existing) {
      return NextResponse.json({ detail: "User not found" }, { status: 404 })
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

    return NextResponse.json(user)
  }, request)
}
