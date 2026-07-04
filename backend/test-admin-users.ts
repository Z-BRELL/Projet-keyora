import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { role: { in: ['BUYER', 'SELLER'] } },
    orderBy: { createdAt: 'desc' },
    include: {
      loginHistory: {
        orderBy: { timestamp: 'desc' },
        take: 5,
      },
      _count: {
        select: { listings: true, favorites: true, messagesSent: true }
      }
    }
  });

  console.log(users.length, "users found");
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
