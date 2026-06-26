import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find "The Art of War" book
  const book = await prisma.book.findFirst({
    where: {
      OR: [
        { title: { contains: 'Art of War', mode: 'insensitive' } },
        { title: { contains: 'The Art of War', mode: 'insensitive' } }
      ]
    }
  });

  if (!book) {
    console.log('Book "The Art of War" not found');
    return;
  }

  console.log('Found book:', book.title);
  console.log('Current content_url:', book.content_url);

  // Remove content_url
  const updated = await prisma.book.update({
    where: { id: book.id },
    data: { content_url: null }
  });

  console.log('Updated book - content_url removed');
  console.log('Book ID:', updated.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
