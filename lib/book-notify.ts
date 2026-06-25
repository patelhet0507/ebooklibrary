import { prisma } from "@/lib/prisma"
import { parseGenres } from "@/lib/utils"

export async function notifyUsersOnNewBook(bookId: string) {
  const book = await prisma.book.findUnique({ where: { id: bookId } })
  if (!book || !book.genre) return

  const genres = parseGenres(book.genre)
  if (genres.length === 0) return

  const userSet = new Set<string>()

  for (const genre of genres) {
    const matchingBooks = await prisma.book.findMany({
      where: { genre: { contains: genre, mode: "insensitive" } },
      select: { id: true },
    })
    const matchingIds = matchingBooks.map((b: { id: string }) => b.id)

    if (matchingIds.length === 0) continue

    const txnUsers = await prisma.transaction.findMany({
      where: {
        book_id: { in: matchingIds },
        type: { in: ["PURCHASE", "RENT"] },
      },
      select: { customer_id: true },
      distinct: ["customer_id"],
    })

    for (const t of txnUsers) {
      userSet.add(t.customer_id)
    }
  }

  const userIds = [...userSet]
  if (userIds.length === 0) return

  const data = await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      user_id: userId,
      type: "NEW_RELEASE",
      title: `New ${genres[0]} book available`,
      message: `"${book.title}" by ${book.author} has just been added to the library. Check it out!`,
      data: JSON.stringify({ book_id: book.id, genres }),
    })),
  })

  return data
}
