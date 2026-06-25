import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-auth"

async function checkOwnership(session: { userId: string }, customer_id: string) {
  if (session.userId !== customer_id) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 403 });
  }
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customer_id: string }> }
) {
  return withAuth(async (session) => {
    const { customer_id } = await params
    const authErr = await checkOwnership(session, customer_id)
    if (authErr) return authErr

    const wishlist = await prisma.wishlist.findMany({
      where: { user_id: customer_id },
      include: { book: { include: { images: true } } },
      orderBy: { created_at: "desc" },
    })

    return NextResponse.json(wishlist)
  }, request)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ customer_id: string }> }
) {
  return withAuth(async (session) => {
    const { customer_id } = await params
    const authErr = await checkOwnership(session, customer_id)
    if (authErr) return authErr

    const { book_id } = await request.json()
    if (!book_id) {
      return NextResponse.json({ detail: "book_id is required" }, { status: 400 });
    }

    const existing = await prisma.wishlist.findUnique({
      where: { user_id_book_id: { user_id: customer_id, book_id } },
    })
    if (existing) {
      return NextResponse.json({ detail: "Already in wishlist" }, { status: 409 });
    }

    const wishlist = await prisma.wishlist.create({
      data: { user_id: customer_id, book_id },
      include: { book: { include: { images: true } } },
    })

    return NextResponse.json(wishlist, { status: 201 })
  }, request)
}