import { getSession, JWTPayload } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function withAuth(
  handler: (session: JWTPayload, request: NextRequest) => Promise<NextResponse>,
  request: NextRequest,
  allowedRoles?: string[]
): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
  }
  const response = await handler(session, request);
  return response;
}

export function authError(message: string, status: number = 400) {
  return NextResponse.json({ detail: message }, { status });
}