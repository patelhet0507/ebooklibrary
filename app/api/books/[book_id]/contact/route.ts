import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { withAuth } from "@/lib/api-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ book_id: string }> }
) {
  return withAuth(async (_session, req) => {
    const { book_id } = await params;
    const body = await req.json();
    const { message, customer_name, customer_phone, customer_address } = body;

    if (!message?.trim()) {
      return NextResponse.json({ detail: "Message is required" }, { status: 400 });
    }

    const book = await prisma.book.findUnique({
      where: { id: book_id },
      select: { title: true, seller_id: true },
    });

    if (!book) {
      return NextResponse.json({ detail: "Book not found" }, { status: 404 });
    }

    let sellerEmail: string;
    if (book.seller_id === "moderator") {
      sellerEmail = "moderator@ebooklibrary.com";
    } else {
      const seller = await prisma.user.findUnique({
        where: { id: book.seller_id! },
        select: { email: true },
      });
      if (!seller) {
        return NextResponse.json({ detail: "Seller not found" }, { status: 404 });
      }
      sellerEmail = seller.email;
    }

    const html = `
      <h2>New Customer Inquiry</h2>
      <p>A customer has sent a message regarding a book you have listed on E-Book Library.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
      <h3>Customer Details</h3>
      <p><strong>Name:</strong> ${customer_name}</p>
      <p><strong>Phone:</strong> ${customer_phone || "Not provided"}</p>
      <p><strong>Address:</strong> ${customer_address || "Not provided"}</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
      <h3>Book Details</h3>
      <p><strong>Title:</strong> ${book.title}</p>
      <p><strong>Book ID:</strong> ${book_id}</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
      <h3>Message</h3>
      <p>${message}</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
      <p style="color:#6b7280;font-size:12px;">Sent via E-Book Library contact form</p>
    `;

    await sendEmail(sellerEmail, `Customer Inquiry - ${book.title}`, html);

    return NextResponse.json({ success: true });
  }, request);
}
