import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL must be set');

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const prefix = 'UAT-AI-20260910';
const studentEmail = 'uat-ai-student@internhub.local';
const companyEmail = 'uat-ai-company@internhub.local';
const studentPassword = 'UatAi@123456';
const skillNames = [
  `${prefix}-TypeScript`,
  `${prefix}-NestJS`,
  `${prefix}-PostgreSQL`,
  `${prefix}-React`,
  `${prefix}-Python`,
];

async function cleanup() {
  const student = await prisma.studentProfile.findFirst({
    where: { user: { email: studentEmail } },
    select: { id: true },
  });
  if (student) {
    await prisma.internshipRecommendationCache.deleteMany({
      where: { studentId: student.id },
    });
    await prisma.application.deleteMany({ where: { studentId: student.id } });
  }

  await prisma.internshipSkill.deleteMany({
    where: { internship: { title: { startsWith: prefix } } },
  });
  await prisma.internship.deleteMany({
    where: { title: { startsWith: prefix } },
  });
  await prisma.user.deleteMany({
    where: { email: { in: [studentEmail, companyEmail] } },
  });
  await prisma.semester.deleteMany({ where: { name: `${prefix}-Semester` } });
  await prisma.skill.deleteMany({ where: { name: { in: skillNames } } });

  const [users, internships, semesters, skills] = await Promise.all([
    prisma.user.count({ where: { email: { in: [studentEmail, companyEmail] } } }),
    prisma.internship.count({ where: { title: { startsWith: prefix } } }),
    prisma.semester.count({ where: { name: `${prefix}-Semester` } }),
    prisma.skill.count({ where: { name: { in: skillNames } } }),
  ]);
  if (users + internships + semesters + skills > 0) {
    throw new Error('UAT cleanup verification failed');
  }
}

async function create() {
  await cleanup();
  const passwordHash = await bcrypt.hash(studentPassword, 12);
  const [studentUser, companyUser] = await Promise.all([
    prisma.user.create({
      data: {
        email: studentEmail,
        passwordHash,
        role: 'STUDENT',
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        email: companyEmail,
        passwordHash,
        role: 'COMPANY',
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      },
    }),
  ]);

  const student = await prisma.studentProfile.create({
    data: {
      userId: studentUser.id,
      studentCode: `${prefix}-STUDENT`,
      fullName: 'UAT AI Student',
      major: 'Software Engineering',
      summary: 'Backend-focused student building TypeScript, NestJS and PostgreSQL services.',
      gpa: 3.6,
      projects: {
        create: {
          title: 'Internship platform API',
          description: 'Built NestJS REST APIs with TypeScript, PostgreSQL, Prisma and JWT authentication.',
        },
      },
      jobPreference: {
        create: {
          desiredRoles: ['Backend Developer', 'Fullstack Developer'],
          preferredLocations: ['Ho Chi Minh City'],
          preferredWorkTypes: ['Hybrid'],
        },
      },
    },
  });
  const skills = await Promise.all(
    skillNames.map((name) => prisma.skill.create({ data: { name } })),
  );
  const byName = new Map(skills.map((skill) => [skill.name, skill.id]));
  await prisma.studentSkill.createMany({
    data: [
      { studentId: student.id, skillId: byName.get(`${prefix}-TypeScript`)!, level: 'EXPERT' },
      { studentId: student.id, skillId: byName.get(`${prefix}-NestJS`)!, level: 'ADVANCED' },
      { studentId: student.id, skillId: byName.get(`${prefix}-PostgreSQL`)!, level: 'INTERMEDIATE' },
    ],
  });

  const company = await prisma.companyProfile.create({
    data: {
      userId: companyUser.id,
      companyName: `${prefix} Company`,
      status: 'APPROVED',
      industry: 'Software',
    },
  });
  const now = new Date();
  const semester = await prisma.semester.create({
    data: {
      name: `${prefix}-Semester`,
      status: 'ACTIVE',
      startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
    },
  });
  const deadline = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);
  const createInternship = async (
    suffix: string,
    internshipSkills: Array<{ name: string; required: boolean; weight: number }>,
    overrides: { status?: 'OPEN' | 'CLOSED'; filledSlots?: number; deadline?: Date } = {},
  ) =>
    prisma.internship.create({
      data: {
        companyId: company.id,
        semesterId: semester.id,
        title: `${prefix} ${suffix}`,
        department: 'Engineering',
        location: 'Ho Chi Minh City',
        workType: 'Hybrid',
        description: 'Internship opportunity for software engineering students.',
        requirements: 'Build reliable software and collaborate with the engineering team.',
        slots: 2,
        filledSlots: overrides.filledSlots ?? 0,
        deadline: overrides.deadline ?? deadline,
        status: overrides.status ?? 'OPEN',
        skills: {
          create: internshipSkills.map((item) => ({
            skillId: byName.get(`${prefix}-${item.name}`)!,
            isRequired: item.required,
            weight: item.weight,
          })),
        },
      },
    });

  await createInternship('Backend Platform Intern', [
    { name: 'TypeScript', required: true, weight: 5 },
    { name: 'NestJS', required: true, weight: 4 },
    { name: 'PostgreSQL', required: true, weight: 3 },
  ]);
  await createInternship('Fullstack Web Intern', [
    { name: 'TypeScript', required: true, weight: 5 },
    { name: 'React', required: false, weight: 2 },
  ]);
  await createInternship('Data Engineering Intern', [
    { name: 'Python', required: true, weight: 5 },
    { name: 'PostgreSQL', required: true, weight: 3 },
  ]);
  await createInternship('General Software Intern', []);
  const applied = await createInternship('Already Applied Intern', [
    { name: 'TypeScript', required: true, weight: 5 },
  ]);
  await prisma.application.create({
    data: { studentId: student.id, internshipId: applied.id, status: 'PENDING' },
  });
  await createInternship('Closed Intern', [{ name: 'TypeScript', required: true, weight: 2 }], { status: 'CLOSED' });
  await createInternship('Full Intern', [{ name: 'TypeScript', required: true, weight: 2 }], { filledSlots: 2 });
  await createInternship('Expired Intern', [{ name: 'TypeScript', required: true, weight: 2 }], { deadline: new Date(now.getTime() - 60_000) });

  console.log(JSON.stringify({ prefix, studentEmail, expectedEligibleCount: 4 }));
}

async function main() {
  const command = process.argv[2];
  try {
    if (command === 'create') await create();
    else if (command === 'cleanup') {
      await cleanup();
      console.log(JSON.stringify({ prefix, cleaned: true }));
    } else {
      throw new Error(
        'Usage: npm exec tsx -- scripts/ai-recommendation-uat.ts <create|cleanup>',
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
