const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding categories...');
  
  await prisma.category.createMany({
    data: [
      { name: 'Salary', type: 'INCOME' },
      { name: 'Food & Dining', type: 'EXPENSE' },
      { name: 'Rent', type: 'EXPENSE' },
      { name: 'Utilities', type: 'EXPENSE' },
      { name: 'Entertainment', type: 'EXPENSE' }
    ],
    skipDuplicates: true
  });

  console.log('Categories seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });