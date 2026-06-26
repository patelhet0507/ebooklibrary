import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== "string") {
      return Response.json({ detail: "Email is required" }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    return Response.json({ exists: !!user });
  } catch (err) {
    console.error("[CHECK-EMAIL ERROR]", err instanceof Error ? err.message : err);
    return Response.json({ detail: "Server error checking email" }, { status: 500 });
  }
}
