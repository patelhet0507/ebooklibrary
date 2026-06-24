import { prisma } from "@/lib/prisma"
import { config } from "@/lib/config"
import { NextRequest } from "next/server"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ fine_id: string }> }
) {
  const { fine_id } = await params

  const fine = await prisma.fine.findUnique({ where: { id: fine_id } })
  if (!fine) {
    return Response.json({ detail: "Fine not found" }, { status: 404 })
  }

  if (fine.status !== "PENDING") {
    return Response.json({ detail: "Fine has already been processed" }, { status: 400 })
  }

  await prisma.fine.update({
    where: { id: fine_id },
    data: { status: "WAIVED" },
  })

  return Response.json({ message: "Fine waived successfully" })
}
