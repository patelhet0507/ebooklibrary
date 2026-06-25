import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-auth"

export async function POST(request: NextRequest) {
  return withAuth(async (session) => {
    const { code, cart_total } = await request.json()

    if (!code) {
      return NextResponse.json({ detail: "Coupon code is required" }, { status: 400 });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (!coupon) {
      return NextResponse.json({ valid: false, detail: "Invalid coupon code" }, { status: 404 });
    }

    if (!coupon.is_active) {
      return NextResponse.json({ valid: false, detail: "Coupon is not active" }, { status: 400 });
    }

    const now = new Date()
    if (coupon.valid_until && coupon.valid_until < now) {
      return NextResponse.json({ valid: false, detail: "Coupon has expired" }, { status: 400 });
    }

    if (coupon.valid_from > now) {
      return NextResponse.json({ valid: false, detail: "Coupon is not yet valid" }, { status: 400 });
    }

    if (coupon.used_count >= coupon.usage_limit) {
      return NextResponse.json({ valid: false, detail: "Coupon usage limit reached" }, { status: 400 });
    }

    if (cart_total !== undefined && cart_total < coupon.min_order_amount) {
      return NextResponse.json(
        { valid: false, detail: `Minimum order amount is ₹${coupon.min_order_amount}` },
        { status: 400 }
      );
    }

    const userUsage = await prisma.couponUsage.findUnique({
      where: { coupon_id_user_id: { coupon_id: coupon.id, user_id: session.userId } },
    })

    if (userUsage) {
      return NextResponse.json({ valid: false, detail: "You have already used this coupon" }, { status: 400 });
    }

    let discount = 0
    if (coupon.discount_type === "PERCENTAGE") {
      discount = (cart_total || 0) * (coupon.discount_value / 100)
      if (coupon.max_discount && discount > coupon.max_discount) {
        discount = coupon.max_discount
      }
    } else {
      discount = coupon.discount_value
    }

    return NextResponse.json({ valid: true, coupon: { ...coupon, discount } })
  }, request)
}