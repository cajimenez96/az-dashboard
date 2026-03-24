import { PrismaClient, Role, Profile } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('👤 Seeding users...');

  const password = await bcrypt.hash('admin123', 10);

  const users = [
    {
      email: 'admin@azmarketing.com',
      name: 'Super Admin',
      role: Role.SUPERADMIN,
      profile: Profile.DEVELOPER,
    },
    {
      email: 'marketing@azmarketing.com',
      name: 'Marketing User',
      role: Role.USER,
      profile: Profile.MARKETER,
    },
    {
      email: 'dev@azmarketing.com',
      name: 'Developer User',
      role: Role.USER,
      profile: Profile.DEVELOPER,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        ...user,
        password,
      },
    });
  }

  console.log('✅ Users seeded');
}

main().finally(() => prisma.$disconnect());
