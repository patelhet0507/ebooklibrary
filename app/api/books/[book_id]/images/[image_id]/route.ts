import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ book_id: string; image_id: string }> }
) {
  const { book_id, image_id } = await params;
  const image = await prisma.bookImage.findUnique({ where: { id: image_id } });
  if (!image) {
    return Response.json({ detail: "Image not found" }, { status: 404 });
  }
  await prisma.bookImage.delete({ where: { id: image_id } });
  if (image.is_primary) {
    const nextImage = await prisma.bookImage.findFirst({
      where: { book_id },
      orderBy: { created_at: "asc" },
    });
    if (nextImage) {
      await prisma.bookImage.update({
        where: { id: nextImage.id },
        data: { is_primary: true },
      });
    }
  }
  return new Response(null, { status: 204 });
}

export async function PUT(
  _request: Request,
  { params }: { params: Promise<{ book_id: string; image_id: string }> }
) {
  const { book_id, image_id } = await params;
  const image = await prisma.bookImage.findUnique({ where: { id: image_id } });
  if (!image) {
    return Response.json({ detail: "Image not found" }, { status: 404 });
  }
  await prisma.bookImage.updateMany({
    where: { book_id, is_primary: true },
    data: { is_primary: false },
  });
  const updated = await prisma.bookImage.update({
    where: { id: image_id },
    data: { is_primary: true },
  });
  return Response.json(updated);
}
