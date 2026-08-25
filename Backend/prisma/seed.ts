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

const seedSkillNames = [
  'TypeScript',
  'JavaScript',
  'React',
  'Node.js',
  'NestJS',
  'PostgreSQL',
  'Prisma',
  'Docker',
  'Git',
  'REST API',
];

const accounts = {
  admin: { email: 'admin@internhub.local', role: 'ADMIN' as const },
  student: { email: 'student@internhub.local', role: 'STUDENT' as const },
  student2: { email: 'student2@internhub.local', role: 'STUDENT' as const },
  lecturer: { email: 'lecturer@internhub.local', role: 'LECTURER' as const },
  lecturer2: { email: 'lecturer2@internhub.local', role: 'LECTURER' as const },
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

  const [admin, student, student2, lecturer, lecturer2, company] =
    await Promise.all([
      upsertUser(accounts.admin.email, accounts.admin.role, passwordHash),
      upsertUser(accounts.student.email, accounts.student.role, passwordHash),
      upsertUser(accounts.student2.email, accounts.student2.role, passwordHash),
      upsertUser(accounts.lecturer.email, accounts.lecturer.role, passwordHash),
      upsertUser(
        accounts.lecturer2.email,
        accounts.lecturer2.role,
        passwordHash,
      ),
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

  await prisma.studentProfile.upsert({
    where: { userId: student2.id },
    update: {
      studentCode: 'SEED-STUDENT-002',
      fullName: 'Nguyễn Sinh Viên 2',
      major: 'Kỹ thuật phần mềm',
      phone: '0900000002',
      summary:
        'Tài khoản sinh viên thứ hai cho fixture placement chưa phân công.',
      gpa: 3.1,
    },
    create: {
      userId: student2.id,
      studentCode: 'SEED-STUDENT-002',
      fullName: 'Nguyễn Sinh Viên 2',
      major: 'Kỹ thuật phần mềm',
      phone: '0900000002',
      summary:
        'Tài khoản sinh viên thứ hai cho fixture placement chưa phân công.',
      gpa: 3.1,
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

  await prisma.lecturerProfile.upsert({
    where: { userId: lecturer2.id },
    update: {
      fullName: 'Lê Giảng Viên 2',
      department: 'Khoa Công nghệ thông tin',
      title: 'Giảng viên',
    },
    create: {
      userId: lecturer2.id,
      fullName: 'Lê Giảng Viên 2',
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

  const seededSkills = await Promise.all(
    seedSkillNames.map((name) =>
      prisma.skill.upsert({
        where: { name },
        update: {},
        create: { name },
        select: { id: true, name: true },
      }),
    ),
  );
  const studentProfile = await prisma.studentProfile.findUniqueOrThrow({
    where: { userId: student.id },
    select: { id: true },
  });
  const student2Profile = await prisma.studentProfile.findUniqueOrThrow({
    where: { userId: student2.id },
    select: { id: true },
  });
  const lecturerProfile = await prisma.lecturerProfile.findUniqueOrThrow({
    where: { userId: lecturer.id },
    select: { id: true },
  });
  const skillByName = new Map(
    seededSkills.map((skill) => [skill.name, skill.id]),
  );
  await prisma.studentSkill.deleteMany({
    where: { studentId: studentProfile.id },
  });
  await prisma.studentSkill.createMany({
    data: [
      {
        studentId: studentProfile.id,
        skillId: skillByName.get('TypeScript')!,
        level: 'ADVANCED',
      },
      {
        studentId: studentProfile.id,
        skillId: skillByName.get('NestJS')!,
        level: 'INTERMEDIATE',
      },
      {
        studentId: studentProfile.id,
        skillId: skillByName.get('PostgreSQL')!,
        level: 'INTERMEDIATE',
      },
      {
        studentId: studentProfile.id,
        skillId: skillByName.get('Git')!,
        level: 'ADVANCED',
      },
    ],
  });

  const semester = await prisma.semester.upsert({
    where: { name: 'Seed Semester 2026' },
    update: {
      startDate: new Date('2026-01-01T00:00:00.000Z'),
      endDate: new Date('2026-12-31T23:59:59.000Z'),
      status: 'ACTIVE',
    },
    create: {
      name: 'Seed Semester 2026',
      startDate: new Date('2026-01-01T00:00:00.000Z'),
      endDate: new Date('2026-12-31T23:59:59.000Z'),
      status: 'ACTIVE',
    },
    select: { id: true },
  });
  await prisma.semester.upsert({
    where: { name: 'Seed Semester 2025' },
    update: {
      startDate: new Date('2025-01-01T00:00:00.000Z'),
      endDate: new Date('2025-06-30T23:59:59.000Z'),
      status: 'COMPLETED',
    },
    create: {
      name: 'Seed Semester 2025',
      startDate: new Date('2025-01-01T00:00:00.000Z'),
      endDate: new Date('2025-06-30T23:59:59.000Z'),
      status: 'COMPLETED',
    },
    select: { id: true },
  });
  await prisma.semester.upsert({
    where: { name: 'Seed Semester 2027' },
    update: {
      startDate: new Date('2027-01-01T00:00:00.000Z'),
      endDate: new Date('2027-06-30T23:59:59.000Z'),
      status: 'UPCOMING',
    },
    create: {
      name: 'Seed Semester 2027',
      startDate: new Date('2027-01-01T00:00:00.000Z'),
      endDate: new Date('2027-06-30T23:59:59.000Z'),
      status: 'UPCOMING',
    },
    select: { id: true },
  });
  const companyProfile = await prisma.companyProfile.findUniqueOrThrow({
    where: { userId: company.id },
    select: { id: true },
  });
  const internship = await prisma.internship.upsert({
    where: { id: 'seed-internship-backend' },
    update: {
      companyId: companyProfile.id,
      semesterId: semester.id,
      title: 'Backend Developer Intern (Seed)',
      department: 'Software Engineering',
      location: 'Ho Chi Minh City',
      workType: 'HYBRID',
      stipend: '8,000,000 VND',
      description: 'Seed internship for backend API and matching verification.',
      requirements: 'NestJS, PostgreSQL, Docker and Git',
      slots: 2,
      filledSlots: 2,
      deadline: new Date('2026-12-01T00:00:00.000Z'),
      startDate: new Date('2026-09-01T00:00:00.000Z'),
      endDate: new Date('2026-12-31T00:00:00.000Z'),
      status: 'OPEN',
    },
    create: {
      id: 'seed-internship-backend',
      companyId: companyProfile.id,
      semesterId: semester.id,
      title: 'Backend Developer Intern (Seed)',
      department: 'Software Engineering',
      location: 'Ho Chi Minh City',
      workType: 'HYBRID',
      stipend: '8,000,000 VND',
      description: 'Seed internship for backend API and matching verification.',
      requirements: 'NestJS, PostgreSQL, Docker and Git',
      slots: 2,
      filledSlots: 2,
      deadline: new Date('2026-12-01T00:00:00.000Z'),
      startDate: new Date('2026-09-01T00:00:00.000Z'),
      endDate: new Date('2026-12-31T00:00:00.000Z'),
      status: 'OPEN',
    },
    select: { id: true },
  });
  await prisma.internshipSkill.deleteMany({
    where: { internshipId: internship.id },
  });
  await prisma.internshipSkill.createMany({
    data: [
      {
        internshipId: internship.id,
        skillId: skillByName.get('NestJS')!,
        isRequired: true,
        weight: 4,
      },
      {
        internshipId: internship.id,
        skillId: skillByName.get('PostgreSQL')!,
        isRequired: true,
        weight: 3,
      },
      {
        internshipId: internship.id,
        skillId: skillByName.get('Docker')!,
        isRequired: true,
        weight: 2,
      },
      {
        internshipId: internship.id,
        skillId: skillByName.get('Git')!,
        isRequired: false,
        weight: 1,
      },
    ],
  });

  const activeApplication = await prisma.application.upsert({
    where: { id: 'seed-application-active' },
    update: {
      studentId: studentProfile.id,
      internshipId: internship.id,
      status: 'ACCEPTED',
      acceptedAt: new Date('2026-08-01T09:00:00.000Z'),
      rejectedAt: null,
      withdrawnAt: null,
    },
    create: {
      id: 'seed-application-active',
      studentId: studentProfile.id,
      internshipId: internship.id,
      coverLetter: 'Seed application with an assigned lecturer.',
      status: 'ACCEPTED',
      acceptedAt: new Date('2026-08-01T09:00:00.000Z'),
    },
    select: { id: true },
  });
  const pendingApplication = await prisma.application.upsert({
    where: { id: 'seed-application-pending' },
    update: {
      studentId: student2Profile.id,
      internshipId: internship.id,
      status: 'ACCEPTED',
      acceptedAt: new Date('2026-08-02T09:00:00.000Z'),
      rejectedAt: null,
      withdrawnAt: null,
    },
    create: {
      id: 'seed-application-pending',
      studentId: student2Profile.id,
      internshipId: internship.id,
      coverLetter: 'Seed application awaiting lecturer assignment.',
      status: 'ACCEPTED',
      acceptedAt: new Date('2026-08-02T09:00:00.000Z'),
    },
    select: { id: true },
  });

  await prisma.applicationStatusHistory.upsert({
    where: { id: 'seed-application-history-active' },
    update: {
      applicationId: activeApplication.id,
      fromStatus: null,
      toStatus: 'ACCEPTED',
      changedById: admin.id,
      note: 'Seed accepted application',
    },
    create: {
      id: 'seed-application-history-active',
      applicationId: activeApplication.id,
      fromStatus: null,
      toStatus: 'ACCEPTED',
      changedById: admin.id,
      note: 'Seed accepted application',
    },
  });
  await prisma.applicationStatusHistory.upsert({
    where: { id: 'seed-application-history-pending' },
    update: {
      applicationId: pendingApplication.id,
      fromStatus: null,
      toStatus: 'ACCEPTED',
      changedById: admin.id,
      note: 'Seed accepted application awaiting assignment',
    },
    create: {
      id: 'seed-application-history-pending',
      applicationId: pendingApplication.id,
      fromStatus: null,
      toStatus: 'ACCEPTED',
      changedById: admin.id,
      note: 'Seed accepted application awaiting assignment',
    },
  });

  const activePlacement = await prisma.internshipPlacement.upsert({
    where: { id: 'seed-placement-active' },
    update: {
      applicationId: activeApplication.id,
      studentId: studentProfile.id,
      companyId: companyProfile.id,
      internshipId: internship.id,
      semesterId: semester.id,
      status: 'ACTIVE',
      startDate: new Date('2026-09-01T00:00:00.000Z'),
      endDate: new Date('2026-12-31T00:00:00.000Z'),
    },
    create: {
      id: 'seed-placement-active',
      applicationId: activeApplication.id,
      studentId: studentProfile.id,
      companyId: companyProfile.id,
      internshipId: internship.id,
      semesterId: semester.id,
      status: 'ACTIVE',
      startDate: new Date('2026-09-01T00:00:00.000Z'),
      endDate: new Date('2026-12-31T00:00:00.000Z'),
    },
    select: { id: true },
  });
  await prisma.internshipPlacement.upsert({
    where: { id: 'seed-placement-pending' },
    update: {
      applicationId: pendingApplication.id,
      studentId: student2Profile.id,
      companyId: companyProfile.id,
      internshipId: internship.id,
      semesterId: semester.id,
      status: 'PENDING',
      startDate: new Date('2026-09-01T00:00:00.000Z'),
      endDate: new Date('2026-12-31T00:00:00.000Z'),
    },
    create: {
      id: 'seed-placement-pending',
      applicationId: pendingApplication.id,
      studentId: student2Profile.id,
      companyId: companyProfile.id,
      internshipId: internship.id,
      semesterId: semester.id,
      status: 'PENDING',
      startDate: new Date('2026-09-01T00:00:00.000Z'),
      endDate: new Date('2026-12-31T00:00:00.000Z'),
    },
    select: { id: true },
  });

  await prisma.supervision.upsert({
    where: { placementId: activePlacement.id },
    update: {
      lecturerId: lecturerProfile.id,
      assignedById: admin.id,
      status: 'ACTIVE',
      completedAt: null,
    },
    create: {
      placementId: activePlacement.id,
      lecturerId: lecturerProfile.id,
      assignedById: admin.id,
      status: 'ACTIVE',
    },
  });

  await prisma.notification.upsert({
    where: { eventKey: 'seed:notification:student2:welcome' },
    update: {
      userId: student2.id,
      type: 'SYSTEM',
      action: 'NONE',
      title: 'Chào mừng bạn đến InternHub',
      content: 'Đây là thông báo mẫu chưa đọc để kiểm tra Notification Center.',
      resourceId: null,
      metadata: { seed: true },
      isRead: false,
      readAt: null,
    },
    create: {
      userId: student2.id,
      eventKey: 'seed:notification:student2:welcome',
      type: 'SYSTEM',
      action: 'NONE',
      title: 'Chào mừng bạn đến InternHub',
      content: 'Đây là thông báo mẫu chưa đọc để kiểm tra Notification Center.',
      metadata: { seed: true },
      isRead: false,
    },
  });
  await prisma.notification.upsert({
    where: { eventKey: 'seed:notification:company:welcome' },
    update: {
      userId: company.id,
      type: 'SYSTEM',
      action: 'NONE',
      title: 'Tài khoản công ty đã sẵn sàng',
      content: 'Đây là thông báo mẫu đã đọc để kiểm tra bộ lọc notification.',
      resourceId: null,
      metadata: { seed: true },
      isRead: true,
      readAt: new Date('2026-08-23T00:00:00.000Z'),
    },
    create: {
      userId: company.id,
      eventKey: 'seed:notification:company:welcome',
      type: 'SYSTEM',
      action: 'NONE',
      title: 'Tài khoản công ty đã sẵn sàng',
      content: 'Đây là thông báo mẫu đã đọc để kiểm tra bộ lọc notification.',
      metadata: { seed: true },
      isRead: true,
      readAt: new Date('2026-08-23T00:00:00.000Z'),
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
