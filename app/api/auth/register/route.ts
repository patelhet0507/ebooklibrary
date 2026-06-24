import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/utils";
import { createToken, setAuthCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const { email, name, password, role, phone } = await request.json();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return Response.json({ detail: "Email already registered" }, { status: 409 });
  }
  const user = await prisma.user.create({
    data: { email, name, password: hashPassword(password), role, phone },
  });
  const { password: _, ...userWithoutPassword } = user;
  const token = await createToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role as "SELLER" | "CUSTOMER" | "MODERATOR",
  });
  await setAuthCookie(token);
  return Response.json(userWithoutPassword, { status: 201 });
}