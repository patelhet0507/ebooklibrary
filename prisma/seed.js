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

    // Seed demo coupons
    const coupons = [
      { code: 'WELCOME20', description: 'Welcome offer - 20% off your first order', discount_type: 'PERCENTAGE', discount_value: 20, min_order_amount: 100, max_discount: 200, usage_limit: 500, valid_until: new Date('2027-12-31') },
      { code: 'FLAT50', description: 'Flat ₹50 off on any order', discount_type: 'FIXED', discount_value: 50, min_order_amount: 200, usage_limit: 1000 },
      { code: 'BOOKWORM30', description: '30% off for book lovers', discount_type: 'PERCENTAGE', discount_value: 30, min_order_amount: 300, max_discount: 500, usage_limit: 200, valid_until: new Date('2026-12-31') },
      { code: 'READER10', description: '10% off any book', discount_type: 'PERCENTAGE', discount_value: 10, min_order_amount: 0, max_discount: 100, usage_limit: 2000 },
      { code: 'SUMMER100', description: 'Summer sale - ₹100 off orders above ₹500', discount_type: 'FIXED', discount_value: 100, min_order_amount: 500, usage_limit: 300, valid_until: new Date('2026-09-30') },
      { code: 'NEWUSER15', description: '15% off for new users', discount_type: 'PERCENTAGE', discount_value: 15, min_order_amount: 150, max_discount: 150, usage_limit: 1 },
      { code: 'BOOKSALE', description: 'Special book sale - ₹75 off', discount_type: 'FIXED', discount_value: 75, min_order_amount: 350, usage_limit: 150 },
      { code: 'GIFT25', description: 'Gift voucher - 25% off', discount_type: 'PERCENTAGE', discount_value: 25, min_order_amount: 200, max_discount: 300, usage_limit: 50, valid_until: new Date('2026-12-31') },
    ];

    for (const coupon of coupons) {
      await prisma.coupon.upsert({
        where: { code: coupon.code },
        update: {},
        create: {
          ...coupon,
          is_active: true,
        },
      });
    }
    console.log('\nSeeded demo coupons');
  } catch (error) {
    console.error('Error creating test users:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();