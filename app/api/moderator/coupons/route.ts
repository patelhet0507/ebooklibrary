import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-auth"

export async function GET(request: NextRequest) {
  return withAuth(async () => {
    const searchParams = request.nextUrl.searchParams
    const skip = parseInt(searchParams.get("skip") || "0")
    const limit = parseInt(searchParams.get("limit") || "20")

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
      }),
      prisma.coupon.count(),
    ])

    return NextResponse.json({ coupons, total, skip, limit })
  }, request, ["MODERATOR"])
}

export async function POST(request: NextRequest) {
  return withAuth(async () => {
    const body = await request.json()
    const {
      code,
      description,
      discount_type,
      discount_value,
      min_order_amount,
      max_discount,
      usage_limit,
      valid_until,
    } = body

    if (!code || !discount_type || !discount_value) {
      return NextResponse.json({ detail: "code, discount_type, and discount_value are required" }, { status: 400 });
    }

    const existing = await prisma.coupon.findUnique({ where: { code } })
    if (existing) {
      return NextResponse.json({ detail: "Coupon code already exists" }, { status: 409 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        description,
        discount_type,
        discount_value: parseFloat(discount_value),
        min_order_amount: parseFloat(min_order_amount) || 0,
        max_discount: max_discount ? parseFloat(max_discount) : null,
        usage_limit: parseInt(usage_limit) || 1,
        valid_until: valid_until ? new Date(valid_until) : null,
      },
    })

    return NextResponse.json(coupon, { status: 201 })
  }, request, ["MODERATOR"])
}