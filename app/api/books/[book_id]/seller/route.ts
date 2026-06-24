import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ book_id: string }> }
) {
  const { book_id } = await params;
  const book = await prisma.book.findUnique({
    where: { id: book_id },
    select: { seller_id: true },
  });
  if (!book) {
    return Response.json({ detail: "Book not found" }, { status: 404 });
  }
  if (book.seller_id === "moderator") {
    return Response.json({ name: "Moderator", email: "moderator@ebooklibrary.com" });
  }
  const seller = await prisma.user.findUnique({
    where: { id: book.seller_id! },
    select: { name: true, email: true },
  });
  if (!seller) {
    return Response.json({ detail: "Seller not found" }, { status: 404 });
  }
  return Response.json(seller);
}
