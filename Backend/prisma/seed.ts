import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL must be set before running the seed');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const seedPassword = process.env.SEED_PASSWORD || 'Seed@123456';

const accounts = {
  admin: { email: 'admin@internhub.local', role: 'ADMIN' as const },
  student: { email: 'student@internhub.local', role: 'STUDENT' as const },
  lecturer: { email: 'lecturer@internhub.local', role: 'LECTURER' as const },
  company: { email: 'company@internhub.local', role: 'COMPANY' as const },
};

async function upsertUser(
  email: string,
  role: (typeof accounts)[keyof typeof accounts]['role'],
  passwordHash: string,
) {
  return prisma.user.upsert({
    where: { email },
    update: { role, status: 'ACTIVE', passwordHash },
    create: { email, role, status: 'ACTIVE', passwordHash },
  });
}

async function main() {
  const passwordHash = await bcrypt.hash(
    seedPassword,
    Number(process.env.BCRYPT_ROUNDS || 12),
  );

  const [admin, student, lecturer, company] = await Promise.all([
    upsertUser(accounts.admin.email, accounts.admin.role, passwordHash),
    upsertUser(accounts.student.email, accounts.student.role, passwordHash),
    upsertUser(accounts.lecturer.email, accounts.lecturer.role, passwordHash),
    upsertUser(accounts.company.email, accounts.company.role, passwordHash),
  ]);

  await prisma.studentProfile.upsert({
    where: { userId: student.id },
    update: {
      studentCode: 'SEED-STUDENT-001',
      fullName: 'Nguyễn Sinh Viên',
      major: 'Công nghệ thông tin',
      phone: '0900000001',
      summary: 'Tài khoản sinh viên dùng cho môi trường phát triển.',
      gpa: 3.4,
    },
    create: {
      userId: student.id,
      studentCode: 'SEED-STUDENT-001',
      fullName: 'Nguyễn Sinh Viên',
      major: 'Công nghệ thông tin',
      phone: '0900000001',
      summary: 'Tài khoản sinh viên dùng cho môi trường phát triển.',
      gpa: 3.4,
    },
  });

  await prisma.lecturerProfile.upsert({
    where: { userId: lecturer.id },
    update: {
      fullName: 'Trần Giảng Viên',
      department: 'Khoa Công nghệ thông tin',
      title: 'Giảng viên',
    },
    create: {
      userId: lecturer.id,
      fullName: 'Trần Giảng Viên',
      department: 'Khoa Công nghệ thông tin',
      title: 'Giảng viên',
    },
  });

  await prisma.companyProfile.upsert({
    where: { userId: company.id },
    update: {
      companyName: 'InternHub Demo Company',
      tagline: 'Cơ hội thực tập cho sinh viên',
      description: 'Công ty mẫu dùng để kiểm thử các luồng tuyển thực tập.',
      industry: 'Công nghệ phần mềm',
      website: 'https://example.com',
      address: 'Thành phố Hồ Chí Minh',
      contactEmail: accounts.company.email,
      status: 'APPROVED',
      reviewedById: admin.id,
      reviewedAt: new Date(),
      rejectionReason: null,
    },
    create: {
      userId: company.id,
      companyName: 'InternHub Demo Company',
      tagline: 'Cơ hội thực tập cho sinh viên',
      description: 'Công ty mẫu dùng để kiểm thử các luồng tuyển thực tập.',
      industry: 'Công nghệ phần mềm',
      website: 'https://example.com',
      address: 'Thành phố Hồ Chí Minh',
      contactEmail: accounts.company.email,
      status: 'APPROVED',
      reviewedById: admin.id,
      reviewedAt: new Date(),
    },
  });

  console.log('Seed completed successfully.');
  console.table(
    Object.values(accounts).map(({ email, role }) => ({
      email,
      role,
      password: seedPassword,
    })),
  );
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
