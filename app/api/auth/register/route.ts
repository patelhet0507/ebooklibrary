import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/utils";

export async function POST(request: Request) {
  const { email, name, password, role, phone } = await request.json();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return Response.json({ detail: "Email already registered" }, { status: 409 });
  }
  const user: { password: string } = await prisma.user.create({
    data: { email, name, password: hashPassword(password), role, phone },
  });
  const { password: _, ...userWithoutPassword } = user;
  return Response.json(userWithoutPassword, { status: 201 });
}
