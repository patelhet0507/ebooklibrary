import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ book_id: string }> }
) {
  const { book_id } = await params;
  const images = await prisma.bookImage.findMany({
    where: { book_id },
    orderBy: { created_at: "asc" },
  });
  return Response.json(images);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ book_id: string }> }
) {
  const { book_id } = await params;
  const { url } = await request.json();
  const existingCount = await prisma.bookImage.count({ where: { book_id } });
  const image = await prisma.bookImage.create({
    data: {
      id: randomUUID(),
      book_id,
      url,
      is_primary: existingCount === 0,
    },
  });
  return Response.json(image, { status: 201 });
}
