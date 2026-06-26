import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/utils";
import { createToken, setAuthCookie } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { sendWelcomeEmail } from "@/lib/email";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rl = rateLimit(`register:${ip}`, 3, 60000);
    if (!rl.allowed) {
      return NextResponse.json(
        { detail: `Too many attempts. Try again in ${Math.ceil((rl.resetAt - Date.now()) / 1000)} seconds.` },
        { status: 429 }
      );
    }

    const { email, name, password, role, phone, newsletter, address, city, state, pincode } = await request.json();
    if (!email || !name || !password || !role) {
      return Response.json({ detail: "Missing required fields" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return Response.json({ detail: "Email already registered" }, { status: 409 });
    }
    const user = await prisma.user.create({
      data: { email, name, password: hashPassword(password), role, phone, newsletter: newsletter || false, address, city, state, pincode },
    });
    const { password: _, ...userWithoutPassword } = user;
    const token = await createToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "SELLER" | "CUSTOMER" | "MODERATOR",
    });
    await setAuthCookie(token);
    sendWelcomeEmail(user.email, user.name);
    return Response.json(userWithoutPassword, { status: 201 });
  } catch (err) {
    console.error("[REGISTER ERROR]", err);
    return Response.json({ detail: `Error: ${err instanceof Error ? err.message : "Unknown"}` }, { status: 500 });
  }
}
