import { prisma } from "@/lib/prisma";
import { cached } from "@/lib/cache";

const BOOK_DETAIL_SELECT = {
  id: true, title: true, author: true, slug: true, isbn: true,
  description: true, language: true, genre: true, cover_image: true,
  content_url: true, price: true, rental_price_per_day: true,
  stock: true, seller_id: true, avg_rating: true, review_count: true,
  created_at: true, updated_at: true,
} as const

const IMAGE_SELECT = { id: true, url: true, is_primary: true } as const

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ book_id: string }> }
) {
  const { book_id } = await params;
  const book = await cached(
    `book:${book_id}`,
    () => prisma.book.findUnique({
      where: { id: book_id },
      select: { ...BOOK_DETAIL_SELECT, images: { select: IMAGE_SELECT } },
    }),
    30_000
  );
  if (!book) {
    return Response.json({ detail: "Book not found" }, { status: 404 });
  }
  return Response.json(book);
}
