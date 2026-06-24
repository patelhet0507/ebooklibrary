import { clearAuthCookie } from "@/lib/auth";

export async function POST() {
  await clearAuthCookie();
  return Response.json({ message: "Logged out" });
}