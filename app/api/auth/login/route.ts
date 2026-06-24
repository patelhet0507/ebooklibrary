import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/utils";
import { createToken, setAuthCookie } from "@/lib/auth";

export async function POST(request: Request) {
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
  setAuthCookie(token);
  return Response.json(userWithoutPassword);
}