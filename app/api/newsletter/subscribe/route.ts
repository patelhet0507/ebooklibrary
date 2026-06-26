import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNewsletterConfirmation } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ detail: "Invalid email address" }, { status: 400 });
    }

    const session = await getSession();
    if (session) {
      try {
        await prisma.user.update({
          where: { id: session.userId },
          data: { newsletter: true },
        });
      } catch (dbError) {
        console.error("[NEWSLETTER] Failed to save subscription to DB:", dbError);
      }
    }

    await sendNewsletterConfirmation(email);
    return NextResponse.json({ detail: "Subscribed successfully" });
  } catch (error) {
    return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
  }
}
