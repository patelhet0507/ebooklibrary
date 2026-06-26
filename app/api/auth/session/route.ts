import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const rl = rateLimit(`session:${ip}`, 30, 60000);
  if (!rl.allowed) {
    return NextResponse.json(
      { detail: `Too many attempts. Try again in ${Math.ceil((rl.resetAt - Date.now()) / 1000)} seconds.` },
      { status: 429 }
    );
  }
  const session = await getSession();
  if (!session) {
    return Response.json({ user: null });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, role: true, phone: true, address: true, city: true, state: true, pincode: true, xp: true, level: true, newsletter: true, created_at: true },
  });
  return Response.json({ user });
}