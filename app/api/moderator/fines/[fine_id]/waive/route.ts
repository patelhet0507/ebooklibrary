import { prisma } from "@/lib/prisma"
import { config } from "@/lib/config"
import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api-auth"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ fine_id: string }> }
) {
  return withAuth(async (session, req) => {
    const { fine_id } = await params

    const fine = await prisma.fine.findUnique({ where: { id: fine_id } })
    if (!fine) {
      return NextResponse.json({ detail: "Fine not found" }, { status: 404 });
    }

    if (fine.status !== "PENDING") {
      return NextResponse.json({ detail: "Fine has already been processed" }, { status: 400 });
    }

    await prisma.fine.update({
      where: { id: fine_id },
      data: { status: "WAIVED" },
    })

    return NextResponse.json({ message: "Fine waived successfully" });
  }, request, ["MODERATOR"])
}