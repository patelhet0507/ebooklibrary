require('dotenv').config({ path: './.env' });
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { createHash } = require('crypto');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function hashPassword(password) {
  return createHash("sha256").update(password).digest("hex");
}

async function main() {
  try {
    // Check if users already exist
    const existingUsers = await prisma.user.findMany({
      where: {
        email: {
          in: ['moderator@ebook.com', 'seller@ebook.com', 'customer@ebook.com'],
        },
      },
    });

    const existingEmails = existingUsers.map((u) => u.email);
    const usersToCreate = [
      {
        email: 'moderator@ebook.com',
        name: 'Moderator User',
        password: await hashPassword('0507@het'),
        role: 'MODERATOR',
      },
      {
        email: 'seller@ebook.com',
        name: 'Seller User',
        password: await hashPassword('0507@het'),
        role: 'SELLER',
      },
      {
        email: 'customer@ebook.com',
        name: 'Customer User',
        password: await hashPassword('0507@het'),
        role: 'CUSTOMER',
      },
    ];

    for (const userData of usersToCreate) {
      if (!existingEmails.includes(userData.email)) {
        const user = await prisma.user.create({
          data: userData,
        });
        console.log(`Created user: ${user.email} (${user.role})`);
      } else {
        console.log(`User already exists: ${userData.email}`);
      }
    }

    console.log('\nAll test users created successfully!');
    console.log('\nLogin credentials:');
    console.log('Email: moderator@ebook.com, Password: 0507@het (MODERATOR)');
    console.log('Email: seller@ebook.com, Password: 0507@het (SELLER)');
    console.log('Email: customer@ebook.com, Password: 0507@het (CUSTOMER)');
  } catch (error) {
    console.error('Error creating test users:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();