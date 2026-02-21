import { PrismaClient, Gender, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data (optional, useful for seeding fresh)
  await prisma.giving.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.member.deleteMany();
  await prisma.family.deleteMany();
  await prisma.region.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.user.deleteMany();

  // --- Seed Branches ---
  const branch1 = await prisma.branch.create({
    data: {
      name: 'Central Branch',
    },
  });

  const branch2 = await prisma.branch.create({
    data: {
      name: 'West Branch',
    },
  });

  // --- Seed Regions ---
  const region1 = await prisma.region.create({
    data: {
      name: 'Region A',
      branchId: branch1.id,
    },
  });

  await prisma.region.create({
    data: {
      name: 'Region B',
      branchId: branch1.id,
    },
  });

  await prisma.region.create({
    data: {
      name: 'Region C',
      branchId: branch2.id,
    },
  });

  // --- Seed Families ---
  const families: Awaited<ReturnType<typeof prisma.family.create>>[] = [];
  for (let i = 0; i < 5; i++) {
    const family = await prisma.family.create({
      data: {
        familyName: 'testing family name',
        address: 'testing address',
        regionId: region1.id,
      },
    });
    families.push(family);
  }

  // --- Seed Members ---
  const members: Awaited<ReturnType<typeof prisma.member.create>>[] = [];
  for (const family of families) {
    for (let i = 0; i < 10; i++) {
      const member = await prisma.member.create({
        data: {
          name: `testing fullname member ${i}`,
          gender: i % 2 === 0 ? Gender.MALE : Gender.FEMALE,
          birthDate: '2026-02-21T19:03:24.480Z',
          phone: '12390231021',
          email: 'danjdw@dsad.com',
          familyId: family.id,
        },
      });
      members.push(member);
    }
  }

  // --- Seed Attendance ---
  await prisma.attendance.createMany({
    data: [
      {
        serviceDate: new Date('2026-02-22T09:00:00'),
        serviceType: 'Sunday Service',
        maleCount: 20,
        femaleCount: 25,
        totalCount: 45,
      },
      {
        serviceDate: new Date('2026-02-22T17:00:00'),
        serviceType: 'Evening Service',
        maleCount: 15,
        femaleCount: 18,
        totalCount: 33,
      },
    ],
  });

  // --- Seed Giving ---
  for (const member of members.slice(0, 5)) {
    await prisma.giving.create({
      data: {
        memberId: member.id,
        amount: 50_000,
        category: 'Donation',
        givingDate: new Date(),
      },
    });
  }

  // --- Seed Users ---
  await prisma.user.createMany({
    data: [
      {
        email: 'admin@example.com',
        password: 'admin123', // In production, hash this!
        role: Role.ADMIN,
      },
      {
        email: 'staff@example.com',
        password: 'staff123',
        role: Role.STAFF,
      },
      {
        email: 'finance@example.com',
        password: 'finance123',
        role: Role.FINANCE,
      },
    ],
  });

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
