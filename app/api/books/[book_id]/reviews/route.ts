import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

type ReviewWithUser = {
  id: string;
  book_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: Date;
  user: { name: string };
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ book_id: string }> }
) {
  const { book_id } = await params;
  const reviews: ReviewWithUser[] = await prisma.review.findMany({
    where: { book_id },
    include: { user: { select: { name: true } } },
    orderBy: { created_at: "desc" },
  });
  return Response.json(
    reviews.map(r => ({ ...r, user_name: r.user.name, user: undefined }))
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ book_id: string }> }
) {
  const { book_id } = await params;
  const user_id = request.nextUrl.searchParams.get("user_id");
  if (!user_id) {
    return Response.json({ detail: "user_id query parameter is required" }, { status: 400 });
  }
  const { rating, comment } = await request.json();
  if (rating < 1 || rating > 5) {
    return Response.json({ detail: "Rating must be between 1 and 5" }, { status: 400 });
  }
  const existing = await prisma.review.findFirst({
    where: { book_id, user_id },
  });
  if (existing) {
    return Response.json({ detail: "You have already reviewed this book" }, { status: 409 });
  }
  const user = await prisma.user.findUnique({
    where: { id: user_id },
    select: { name: true },
  });
  if (!user) {
    return Response.json({ detail: "User not found" }, { status: 404 });
  }
  const review: ReviewWithUser = await prisma.review.create({
    data: { book_id, user_id, rating, comment },
    include: { user: { select: { name: true } } },
  });
  return Response.json(
    { ...review, user_name: review.user.name, user: undefined },
    { status: 201 }
  );
}
