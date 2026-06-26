import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/utils";
import { createToken, setAuthCookie } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { sendLoginNotification } from "@/lib/email";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const rl = rateLimit(`login:${ip}`, 5, 60000);
  if (!rl.allowed) {
    return NextResponse.json(
      { detail: `Too many attempts. Try again in ${Math.ceil((rl.resetAt - Date.now()) / 1000)} seconds.` },
      { status: 429 }
    );
  }

  const { email, password } = await request.json();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.password !== hashPassword(password)) {
    return Response.json({ detail: "Invalid email or password" }, { status: 401 });
  }
  const { password: _, ...userWithoutPassword } = user;
  const token = await createToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role as "SELLER" | "CUSTOMER" | "MODERATOR",
  });
  await setAuthCookie(token);
  sendLoginNotification(user.email, user.name);
  return Response.json(userWithoutPassword);
}