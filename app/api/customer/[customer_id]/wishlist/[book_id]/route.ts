import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-auth"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ customer_id: string; book_id: string }> }
) {
  return withAuth(async (session) => {
    const { customer_id, book_id } = await params
    if (session.userId !== customer_id) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 403 });
    }

    await prisma.wishlist.delete({
      where: { user_id_book_id: { user_id: customer_id, book_id } },
    })

    return new NextResponse(null, { status: 204 })
  }, request)
}