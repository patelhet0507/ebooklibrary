import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const book = await prisma.book.findUnique({
    where: { slug },
    include: { images: true },
  });
  if (!book) {
    return Response.json({ detail: "Book not found" }, { status: 404 });
  }
  return Response.json(book);
}
