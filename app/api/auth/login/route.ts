import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/utils";

export async function POST(request: Request) {
  const { email, password } = await request.json();
  const user: { password: string } | null = await prisma.user.findUnique({ where: { email } });
  if (!user || user.password !== hashPassword(password)) {
    return Response.json({ detail: "Invalid email or password" }, { status: 401 });
  }
  const { password: _, ...userWithoutPassword } = user;
  return Response.json(userWithoutPassword);
}
