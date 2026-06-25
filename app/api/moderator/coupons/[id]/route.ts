import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async () => {
    const { id } = await params
    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: { usages: { include: { user: { select: { name: true, email: true } } } } },
    })
    if (!coupon) {
      return NextResponse.json({ detail: "Coupon not found" }, { status: 404 });
    }
    return NextResponse.json(coupon)
  }, request, ["MODERATOR"])
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async () => {
    const { id } = await params
    const body = await request.json()

    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        description: body.description,
        discount_type: body.discount_type,
        discount_value: body.discount_value ? parseFloat(body.discount_value) : undefined,
        min_order_amount: body.min_order_amount ? parseFloat(body.min_order_amount) : undefined,
        max_discount: body.max_discount ? parseFloat(body.max_discount) : undefined,
        usage_limit: body.usage_limit ? parseInt(body.usage_limit) : undefined,
        valid_until: body.valid_until ? new Date(body.valid_until) : undefined,
        is_active: body.is_active,
      },
    })
    return NextResponse.json(coupon)
  }, request, ["MODERATOR"])
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async () => {
    const { id } = await params
    await prisma.coupon.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  }, request, ["MODERATOR"])
}