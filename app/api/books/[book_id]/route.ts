import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ book_id: string }> }
) {
  const { book_id } = await params;
  const book = await prisma.book.findUnique({
    where: { id: book_id },
    include: { images: true },
  });
  if (!book) {
    return Response.json({ detail: "Book not found" }, { status: 404 });
  }
  return Response.json(book);
}
