import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaPg } from '@prisma/adapter-pg';
import { AdminPermission } from '../src/common/constants/admin-permissions.constants';
import {
  PrismaClient,
  Role,
  UserStatus,
  SemesterStatus,
  FileType,
  InternshipReportReasonCode,
  InternshipReportStatus,
  EvaluationType,
} from '../src/generated/prisma/client';

import { facultiesData, skillNames } from './seed-data/faculties-skills.data';
import { lecturersData } from './seed-data/lecturers.data';
import { companiesData } from './seed-data/companies.data';
import { studentsData } from './seed-data/students.data';
import { internshipsData } from './seed-data/internships.data';
import { applicationsData } from './seed-data/applications.data';
import { placementsData } from './seed-data/placements.data';
import {
  conversationsData,
  notificationsData,
  supportRequestsData,
} from './seed-data/interactions.data';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL must be set before running the seed');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const SEED_PASSWORD = process.env.SEED_PASSWORD || 'Seed@123456';

async function main() {
  console.log('🚀 Bắt đầu quá trình khởi tạo dữ liệu Seed Data cho CareerBridge...');
  console.log(`🔑 Mật khẩu mặc định cho các tài khoản seed: "${SEED_PASSWORD}"`);

  // Hash password một lần duy nhất với 10 rounds để tối ưu tốc độ seed
  const defaultPasswordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  // =========================================================================
  // 1. KHOA & NGÀNH ĐÀO TẠO ĐẠI HỌC BÁCH KHOA (FACULTIES & MAJORS)
  // =========================================================================
  console.log('📚 [1/15] Khởi tạo Khoa và Ngành đào tạo Đại học Bách Khoa...');

  const facultyMap = new Map<string, string>();
  const majorMap = new Map<string, { id: string; name: string }>();

  for (const f of facultiesData) {
    const faculty = await prisma.faculty.upsert({
      where: { code: f.code },
      update: { name: f.name, description: f.description, isActive: true },
      create: { code: f.code, name: f.name, description: f.description, isActive: true },
    });
    facultyMap.set(f.code, faculty.id);

    for (const m of f.majors) {
      const major = await prisma.major.upsert({
        where: { code: m.code },
        update: { facultyId: faculty.id, name: m.name, description: m.description, isActive: true },
        create: { facultyId: faculty.id, code: m.code, name: m.name, description: m.description, isActive: true },
      });
      majorMap.set(m.code, { id: major.id, name: major.name });
    }
  }

  // =========================================================================
  // 2. KỸ NĂNG CHUYÊN MÔN TOÀN DIỆN (SKILLS)
  // =========================================================================
  console.log('🛠️ [2/15] Khởi tạo danh mục Kỹ năng chuyên môn bao quát các ngành...');

  const skillMap = new Map<string, string>();
  for (const name of skillNames) {
    const s = await prisma.skill.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    skillMap.set(name, s.id);
  }

  // =========================================================================
  // 3. HỌC KỲ VÀ DÒNG THỜI GIAN (SEMESTERS)
  // =========================================================================
  console.log('📅 [3/15] Khởi tạo các Học kỳ theo dòng thời gian chuẩn...');

  const semestersData = [
    {
      name: 'Học kỳ 1 (2025 - 2026) - Kỳ Thu',
      startDate: new Date('2025-09-01T00:00:00.000Z'),
      endDate: new Date('2025-12-31T23:59:59.000Z'),
      status: SemesterStatus.COMPLETED,
    },
    {
      name: 'Học kỳ 2 (2025 - 2026) - Kỳ Xuân',
      startDate: new Date('2026-01-01T00:00:00.000Z'),
      endDate: new Date('2026-04-30T23:59:59.000Z'),
      status: SemesterStatus.COMPLETED,
    },
    {
      name: 'Học kỳ Hè (2025 - 2026)',
      startDate: new Date('2026-05-01T00:00:00.000Z'),
      endDate: new Date('2026-08-31T23:59:59.000Z'),
      status: SemesterStatus.COMPLETED,
    },
    {
      name: 'Học kỳ 1 (2026 - 2027) - Kỳ Thu [Hiện tại]',
      startDate: new Date('2026-09-01T00:00:00.000Z'),
      endDate: new Date('2026-12-31T23:59:59.000Z'),
      status: SemesterStatus.MONITORING,
    },
    {
      name: 'Học kỳ 2 (2026 - 2027) - Kỳ Xuân [Đang tuyển dụng]',
      startDate: new Date('2026-12-01T00:00:00.000Z'),
      endDate: new Date('2027-03-31T23:59:59.000Z'),
      status: SemesterStatus.RECRUITING,
    },
    {
      name: 'Học kỳ Hè (2026 - 2027) [Sắp diễn ra]',
      startDate: new Date('2027-04-01T00:00:00.000Z'),
      endDate: new Date('2027-07-31T23:59:59.000Z'),
      status: SemesterStatus.UPCOMING,
    },
  ];

  const semesterMap = new Map<string, string>();
  for (const s of semestersData) {
    const sem = await prisma.semester.upsert({
      where: { name: s.name },
      update: { startDate: s.startDate, endDate: s.endDate, status: s.status },
      create: s,
    });
    semesterMap.set(s.name, sem.id);
  }

  // Helper hàm tạo hoặc lấy User
  async function upsertUser(
    email: string,
    role: Role,
    status: UserStatus = UserStatus.ACTIVE,
    emailVerifiedAt: Date | null = new Date('2025-01-15T08:00:00Z'),
    isSuperAdmin = false,
    permissions: string[] = [],
  ) {
    return prisma.user.upsert({
      where: { email },
      update: {
        role,
        status,
        emailVerifiedAt,
        passwordHash: defaultPasswordHash,
        isSuperAdmin,
        permissions,
      },
      create: {
        email,
        role,
        status,
        emailVerifiedAt,
        passwordHash: defaultPasswordHash,
        isSuperAdmin,
        permissions,
      },
    });
  }

  // =========================================================================
  // 4. QUẢN TRỊ VIÊN HỆ THỐNG (SUPER ADMIN & SUB-ADMINS)
  // =========================================================================
  console.log('👤 [4/15] Khởi tạo tài khoản Quản trị viên (Super Admin & Sub-Admins)...');

  // 1. Quản trị viên tối cao (Super Admin)
  const adminUser = await upsertUser(
    'admin@careerbridge.edu.vn',
    Role.ADMIN,
    UserStatus.ACTIVE,
    new Date('2025-01-15T08:00:00Z'),
    true,
    [],
  );

  // 2. Sub-Admin: Giáo vụ Đào tạo & Thực tập
  const academicAdmin = await upsertUser(
    'academic.admin@careerbridge.edu.vn',
    Role.ADMIN,
    UserStatus.ACTIVE,
    new Date('2025-01-15T08:00:00Z'),
    false,
    [AdminPermission.DASHBOARD, AdminPermission.PLACEMENTS, AdminPermission.SEMESTERS, AdminPermission.SUPPORT],
  );

  // 3. Sub-Admin: Quan hệ Doanh nghiệp
  const corporateAdmin = await upsertUser(
    'corporate.admin@careerbridge.edu.vn',
    Role.ADMIN,
    UserStatus.ACTIVE,
    new Date('2025-01-15T08:00:00Z'),
    false,
    [AdminPermission.DASHBOARD, AdminPermission.COMPANIES, AdminPermission.INTERNSHIPS],
  );

  // 4. Sub-Admin: Hỗ trợ Sinh viên (Helpdesk)
  await upsertUser(
    'support.admin@careerbridge.edu.vn',
    Role.ADMIN,
    UserStatus.ACTIVE,
    new Date('2025-01-15T08:00:00Z'),
    false,
    [AdminPermission.SUPPORT],
  );

  // =========================================================================
  // 5. GIẢNG VIÊN ĐẠI HỌC BÁCH KHOA (LECTURERS - 10 GIẢNG VIÊN ĐỦ 6 KHOA)
  // =========================================================================
  console.log('👨‍🏫 [5/15] Khởi tạo tài khoản Giảng viên các khoa...');

  const lecturerProfileMap = new Map<string, { id: string; userId: string; fullName: string }>();

  for (const l of lecturersData) {
    const user = await upsertUser(l.email, Role.LECTURER);
    const facultyId = facultyMap.get(l.facultyCode);
    const profile = await prisma.lecturerProfile.upsert({
      where: { userId: user.id },
      update: {
        fullName: l.fullName,
        department: l.department,
        facultyId,
        title: l.title,
      },
      create: {
        userId: user.id,
        fullName: l.fullName,
        department: l.department,
        facultyId,
        title: l.title,
      },
    });
    lecturerProfileMap.set(l.email, { id: profile.id, userId: user.id, fullName: l.fullName });
  }

  // =========================================================================
  // 6. DOANH NGHIỆP THỰC TẾ (COMPANIES - 20 DOANH NGHIỆP HÀNG ĐẦU)
  // =========================================================================
  console.log('🏢 [6/15] Khởi tạo 20 Doanh nghiệp thực tế với đầy đủ trạng thái...');

  const companyProfileMap = new Map<string, { id: string; userId: string; companyName: string }>();

  for (const c of companiesData) {
    const user = await upsertUser(c.email, Role.COMPANY);

    let reviewedById: string | null = null;
    if (c.reviewedByAdminRole === 'SUPER_ADMIN') {
      reviewedById = adminUser.id;
    } else if (c.reviewedByAdminRole === 'ACADEMIC_ADMIN') {
      reviewedById = academicAdmin.id;
    } else if (c.reviewedByAdminRole === 'CORPORATE_ADMIN') {
      reviewedById = corporateAdmin.id;
    }

    const profile = await prisma.companyProfile.upsert({
      where: { userId: user.id },
      update: {
        companyName: c.companyName,
        businessRegistrationNumber: c.businessRegistrationNumber,
        contactPersonName: c.contactPersonName,
        contactPhone: c.contactPhone,
        tagline: c.tagline,
        description: c.description,
        industry: c.industry,
        website: c.website,
        address: c.address,
        contactEmail: c.email,
        status: c.status,
        reviewedById,
        reviewedAt: c.reviewedAt,
        rejectionReasonCode: c.rejectionReasonCode,
        rejectionReason: c.rejectionReason,
        submittedAt: c.submittedAt,
        reviewDueAt: c.reviewDueAt,
        reviewChecklist: c.reviewChecklist ?? undefined,
        suspensionReasonCode: c.suspensionReasonCode,
        suspensionReason: c.suspensionReason,
        suspendedAt: c.suspendedAt,
        autoAiScanEnabled: c.autoAiScanEnabled ?? false,
      },
      create: {
        userId: user.id,
        companyName: c.companyName,
        businessRegistrationNumber: c.businessRegistrationNumber,
        contactPersonName: c.contactPersonName,
        contactPhone: c.contactPhone,
        tagline: c.tagline,
        description: c.description,
        industry: c.industry,
        website: c.website,
        address: c.address,
        contactEmail: c.email,
        status: c.status,
        reviewedById,
        reviewedAt: c.reviewedAt,
        rejectionReasonCode: c.rejectionReasonCode,
        rejectionReason: c.rejectionReason,
        submittedAt: c.submittedAt,
        reviewDueAt: c.reviewDueAt,
        reviewChecklist: c.reviewChecklist ?? undefined,
        suspensionReasonCode: c.suspensionReasonCode,
        suspensionReason: c.suspensionReason,
        suspendedAt: c.suspendedAt,
        autoAiScanEnabled: c.autoAiScanEnabled ?? false,
      },
    });
    companyProfileMap.set(c.email, { id: profile.id, userId: user.id, companyName: c.companyName });
  }

  // =========================================================================
  // 7. HỒ SƠ SINH VIÊN BÁCH KHOA (STUDENTS - 36 SINH VIÊN ĐỦ 20 NGÀNH)
  // =========================================================================
  console.log('🎓 [7/15] Khởi tạo 36 hồ sơ Sinh viên Đại học Bách Khoa...');

  const studentProfileMap = new Map<string, { id: string; userId: string; fullName: string; studentCode: string }>();
  const studentCvMap = new Map<string, string>();

  // Helper upload CV to Supabase Storage and upsert into File table
  async function uploadCvFile(filePath: string, originalName: string, storageKey: string, ownerId: string) {
    const buffer = fs.readFileSync(filePath);
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;
    const bucket = process.env.FILES_BUCKET || 'internhub-files';

    if (supabaseUrl && serviceKey) {
      try {
        const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${storageKey}`;
        const res = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${serviceKey}`,
            apikey: serviceKey,
            'Content-Type': 'application/pdf',
            'x-upsert': 'true',
          },
          body: buffer,
        });
        if (!res.ok) {
          console.warn(`⚠️ [Supabase] Warning upload ${storageKey}:`, res.status, await res.text());
        }
      } catch (err) {
        console.warn(`⚠️ [Supabase] Lỗi kết nối khi upload ${storageKey}:`, err);
      }
    }

    const file = await prisma.file.upsert({
      where: { storageKey },
      update: {
        ownerId,
        type: FileType.CV,
        originalName,
        mimeType: 'application/pdf',
        sizeBytes: buffer.length,
      },
      create: {
        ownerId,
        type: FileType.CV,
        storageKey,
        originalName,
        mimeType: 'application/pdf',
        sizeBytes: buffer.length,
      },
    });

    return file;
  }

  const candidates = [
    path.resolve(process.cwd(), 'prisma/seed-data/cvs'),
    path.resolve(__dirname, '../../prisma/seed-data/cvs'),
    path.resolve(__dirname, 'seed-data/cvs'),
    path.resolve(__dirname, '../seed-data/cvs'),
  ];
  const cvDir = candidates.find((dir) => fs.existsSync(dir)) || candidates[0];
  let availablePdfs: string[] = [];
  if (fs.existsSync(cvDir)) {
    availablePdfs = fs
      .readdirSync(cvDir)
      .filter((f) => f.toLowerCase().endsWith('.pdf'))
      .map((f) => path.join(cvDir, f));
  }

  for (let studentIdx = 0; studentIdx < studentsData.length; studentIdx++) {
    const s = studentsData[studentIdx];
    const user = await upsertUser(s.email, Role.STUDENT);
    const majorInfo = majorMap.get(s.majorCode);

    const profile = await prisma.studentProfile.upsert({
      where: { userId: user.id },
      update: {
        studentCode: s.studentCode,
        fullName: s.fullName,
        major: majorInfo?.name || 'Kỹ thuật Phần mềm',
        majorId: majorInfo?.id,
        phone: s.phone,
        summary: s.summary,
        gpa: s.gpa,
      },
      create: {
        userId: user.id,
        studentCode: s.studentCode,
        fullName: s.fullName,
        major: majorInfo?.name || 'Kỹ thuật Phần mềm',
        majorId: majorInfo?.id,
        phone: s.phone,
        summary: s.summary,
        gpa: s.gpa,
      },
    });
    studentProfileMap.set(s.email, { id: profile.id, userId: user.id, fullName: s.fullName, studentCode: s.studentCode });

    // Upload & gán CV cho sinh viên
    let assignedPdfPath: string | null = null;
    let originalCvName = 'CV.pdf';

    const preferredCvName = s.cvFileName;
    if (preferredCvName) {
      const match = availablePdfs.find((p) => path.basename(p) === preferredCvName);
      if (match) {
        assignedPdfPath = match;
        originalCvName = preferredCvName;
      }
    }

    if (!assignedPdfPath && availablePdfs.length > 0) {
      const pool = availablePdfs.filter((p) => !path.basename(p).includes('PhamHoangSon'));
      const activePool = pool.length > 0 ? pool : availablePdfs;
      assignedPdfPath = activePool[studentIdx % activePool.length];
      originalCvName = path.basename(assignedPdfPath);
    }

    if (assignedPdfPath) {
      const safeStorageKey = `seed/cvs/${s.studentCode}_${originalCvName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/_+/g, '_')}`;

      const cvFile = await uploadCvFile(assignedPdfPath, originalCvName, safeStorageKey, user.id);
      await prisma.studentProfile.update({
        where: { id: profile.id },
        data: { cvFileId: cvFile.id },
      });
      studentCvMap.set(profile.id, cvFile.id);
    }

    // Cập nhật Skills
    await prisma.studentSkill.deleteMany({ where: { studentId: profile.id } });
    for (const sk of s.skills) {
      const skId = skillMap.get(sk.name);
      if (skId) {
        await prisma.studentSkill.create({
          data: { studentId: profile.id, skillId: skId, level: sk.level },
        });
      }
    }

    // Cập nhật Projects
    await prisma.studentProject.deleteMany({ where: { studentId: profile.id } });
    for (const p of s.projects) {
      await prisma.studentProject.create({
        data: {
          studentId: profile.id,
          title: p.title,
          description: p.description,
          repositoryUrl: p.repositoryUrl ?? null,
          demoUrl: p.demoUrl ?? null,
          startedAt: p.startedAt,
          endedAt: p.endedAt,
        },
      });
    }

    // Cập nhật Job Preferences
    await prisma.studentJobPreference.upsert({
      where: { studentId: profile.id },
      update: {
        desiredRoles: s.desiredRoles,
        preferredLocations: s.preferredLocations,
        preferredWorkTypes: s.preferredWorkTypes,
      },
      create: {
        studentId: profile.id,
        desiredRoles: s.desiredRoles,
        preferredLocations: s.preferredLocations,
        preferredWorkTypes: s.preferredWorkTypes,
      },
    });
  }

  // =========================================================================
  // 8. TÀI KHOẢN TRẠNG THÁI KIỂM THỬ ĐẶC BIỆT (USER STATUSES)
  // =========================================================================
  console.log('🔒 [8/15] Khởi tạo tài khoản kiểm thử các trạng thái UserStatus...');

  const unverifiedUser = await upsertUser(
    'user.unverified@careerbridge.edu.vn',
    Role.STUDENT,
    UserStatus.PENDING_VERIFICATION,
    null,
  );
  await prisma.verificationToken.deleteMany({ where: { userId: unverifiedUser.id } });
  await prisma.verificationToken.create({
    data: {
      userId: unverifiedUser.id,
      token: 'demo-unverified-token-careerbridge-2026',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  await upsertUser('user.banned@careerbridge.edu.vn', Role.STUDENT, UserStatus.BANNED);
  await upsertUser('user.inactive@careerbridge.edu.vn', Role.STUDENT, UserStatus.INACTIVE);

  // =========================================================================
  // 9. MẪU TIN TUYỂN DỤNG (INTERNSHIP TEMPLATES)
  // =========================================================================
  console.log('📋 [9/15] Khởi tạo Internship Templates cho Doanh nghiệp...');

  const fptComp = companyProfileMap.get('fpt.software@fpt.com')!;
  const boschComp = companyProfileMap.get('bosch.recruitment@bosch.com')!;

  await prisma.internshipTemplate.upsert({
    where: { companyId_name: { companyId: fptComp.id, name: 'Template Backend Intern Standard' } },
    update: {},
    create: {
      companyId: fptComp.id,
      name: 'Template Backend Intern Standard',
      title: 'Kỹ sư Thực tập Backend (Node.js/NestJS/TypeScript)',
      department: 'Global Delivery Unit 1 (GDU1)',
      location: 'F-Town 3, Khu Công nghệ cao TP. Thủ Đức, TP. Hồ Chí Minh',
      workType: 'Toàn thời gian (On-site)',
      stipend: '6,000,000 - 8,500,000 VNĐ/tháng',
      description: 'Tham gia phát triển hệ thống Backend phục vụ khách hàng doanh nghiệp quốc tế. Được đào tạo quy trình Agile/Scrum và kiến trúc hệ thống hiện đại.',
      requirements: 'Sinh viên năm 3 hoặc năm cuối chuyên ngành CNTT, Kỹ thuật Phần mềm. Nắm vững lập trình hướng đối tượng, cơ sở dữ liệu quan hệ và kiến thức RESTful API.',
      slotsDefault: 5,
    },
  });

  await prisma.internshipTemplate.upsert({
    where: { companyId_name: { companyId: boschComp.id, name: 'Template Embedded Intern Standard' } },
    update: {},
    create: {
      companyId: boschComp.id,
      name: 'Template Embedded Intern Standard',
      title: 'Thực tập sinh Lập trình Nhúng & Hệ thống Ô tô (Embedded C/C++)',
      department: 'Cross-Domain Computing Solutions (XC)',
      location: 'Tòa nhà E-Town Central, 11 Đoàn Văn Bơ, Quận 4, TP. Hồ Chí Minh',
      workType: 'Toàn thời gian (On-site)',
      stipend: '7,000,000 - 9,000,000 VNĐ/tháng',
      description: 'Lập trình firmware nhúng trên vi điều khiển ARM Cortex-M, kiểm thử phần mềm ECU ô tô theo quy trình ASPICE quốc tế.',
      requirements: 'Sinh viên ngành Điện tử - Viễn thông, Kỹ thuật Máy tính, Cơ điện tử. Thành thạo C/C++ Embedded, giao thức truyền thông SPI, I2C, UART.',
      slotsDefault: 3,
    },
  });

  // =========================================================================
  // 10. TIN TUYỂN DỤNG THỰC TẾ (INTERNSHIPS - 37 TIN TOÀN DIỆN 20 NGÀNH)
  // =========================================================================
  console.log('📢 [10/15] Khởi tạo 37 Tin tuyển dụng thực tế bao quát 20 ngành...');

  const internshipMap = new Map<string, string>();

  for (const it of internshipsData) {
    const comp = companyProfileMap.get(it.companyEmail);
    if (!comp) {
      console.warn(`⚠️ Không tìm thấy công ty: ${it.companyEmail}`);
      continue;
    }
    const semId = semesterMap.get(it.semesterName);
    if (!semId) {
      console.warn(`⚠️ Không tìm thấy học kỳ: ${it.semesterName}`);
      continue;
    }

    let moderatedById: string | null = null;
    if (it.moderatedByAdminRole === 'SUPER_ADMIN') {
      moderatedById = adminUser.id;
    } else if (it.moderatedByAdminRole === 'CORPORATE_ADMIN') {
      moderatedById = corporateAdmin.id;
    }

    const record = await prisma.internship.upsert({
      where: { id: it.id },
      update: {
        companyId: comp.id,
        semesterId: semId,
        title: it.title,
        department: it.department,
        location: it.location,
        workType: it.workType,
        stipend: it.stipend,
        description: it.description,
        requirements: it.requirements,
        slots: it.slots,
        filledSlots: it.filledSlots,
        deadline: it.deadline,
        startDate: it.startDate,
        endDate: it.endDate,
        status: it.status,
        moderationReasonCode: it.moderationReasonCode,
        moderationReason: it.moderationReason,
        moderatedById,
        moderatedAt: it.moderatedAt,
      },
      create: {
        id: it.id,
        companyId: comp.id,
        semesterId: semId,
        title: it.title,
        department: it.department,
        location: it.location,
        workType: it.workType,
        stipend: it.stipend,
        description: it.description,
        requirements: it.requirements,
        slots: it.slots,
        filledSlots: it.filledSlots,
        deadline: it.deadline,
        startDate: it.startDate,
        endDate: it.endDate,
        status: it.status,
        moderationReasonCode: it.moderationReasonCode,
        moderationReason: it.moderationReason,
        moderatedById,
        moderatedAt: it.moderatedAt,
      },
    });
    internshipMap.set(it.id, record.id);

    // Kỹ năng yêu cầu cho tin
    await prisma.internshipSkill.deleteMany({ where: { internshipId: record.id } });
    for (const skName of it.skills) {
      const skId = skillMap.get(skName);
      if (skId) {
        await prisma.internshipSkill.create({
          data: { internshipId: record.id, skillId: skId, isRequired: true, weight: 2 },
        });
      }
    }

    // Ngành mục tiêu
    await prisma.internshipMajor.deleteMany({ where: { internshipId: record.id } });
    for (const mCode of it.majors) {
      const mInfo = majorMap.get(mCode);
      if (mInfo) {
        await prisma.internshipMajor.create({
          data: { internshipId: record.id, majorId: mInfo.id },
        });
      }
    }
  }

  // =========================================================================
  // 11. ĐƠN ỨNG TUYỂN (APPLICATIONS - 50 ĐƠN BAO PHỦ 9 TRẠNG THÁI & AI SCAN)
  // =========================================================================
  console.log('📝 [11/15] Khởi tạo 50 Đơn ứng tuyển bao phủ 9 trạng thái nghiệp vụ & AI Scan...');

  for (const a of applicationsData) {
    const student = studentProfileMap.get(a.studentEmail);
    if (!student) {
      console.warn(`⚠️ Không tìm thấy sinh viên: ${a.studentEmail}`);
      continue;
    }
    const itId = internshipMap.get(a.internshipId);
    if (!itId) {
      console.warn(`⚠️ Không tìm thấy tin tuyển dụng: ${a.internshipId}`);
      continue;
    }

    const cvFileId = studentCvMap.get(student.id) || null;

    const app = await prisma.application.upsert({
      where: { id: a.id },
      update: {
        studentId: student.id,
        internshipId: itId,
        cvFileId,
        coverLetter: a.coverLetter,
        status: a.status,
        matchScore: a.matchScore,
        aiScore: a.aiScore,
        companyFeedback: a.companyFeedback,
        rejectionReason: a.rejectionReason,
        appliedAt: a.appliedAt,
        acceptedAt: a.acceptedAt,
        rejectedAt: a.rejectedAt,
        withdrawnAt: a.withdrawnAt,
        offeredAt: a.offeredAt,
        offerExpiresAt: a.offerExpiresAt,
        offerMessage: a.offerMessage,
        respondedAt: a.respondedAt,
      },
      create: {
        id: a.id,
        studentId: student.id,
        internshipId: itId,
        cvFileId,
        coverLetter: a.coverLetter,
        status: a.status,
        matchScore: a.matchScore,
        aiScore: a.aiScore,
        companyFeedback: a.companyFeedback,
        rejectionReason: a.rejectionReason,
        appliedAt: a.appliedAt,
        acceptedAt: a.acceptedAt,
        rejectedAt: a.rejectedAt,
        withdrawnAt: a.withdrawnAt,
        offeredAt: a.offeredAt,
        offerExpiresAt: a.offerExpiresAt,
        offerMessage: a.offerMessage,
        respondedAt: a.respondedAt,
      },
    });

    // Lịch phỏng vấn
    if (a.interview) {
      await prisma.applicationInterview.upsert({
        where: { applicationId: app.id },
        update: {
          scheduledAt: a.interview.scheduledAt,
          mode: a.interview.mode,
          meetingLink: a.interview.meetingLink,
          location: a.interview.location,
          contactName: a.interview.contactName,
          contactEmail: a.interview.contactEmail,
          contactPhone: a.interview.contactPhone,
          note: a.interview.note,
        },
        create: {
          applicationId: app.id,
          scheduledAt: a.interview.scheduledAt,
          mode: a.interview.mode,
          meetingLink: a.interview.meetingLink,
          location: a.interview.location,
          contactName: a.interview.contactName,
          contactEmail: a.interview.contactEmail,
          contactPhone: a.interview.contactPhone,
          note: a.interview.note,
        },
      });
    }

    // Email logs
    if (a.emailLogs && a.emailLogs.length > 0) {
      await prisma.emailLog.deleteMany({ where: { applicationId: app.id } });
      for (const el of a.emailLogs) {
        await prisma.emailLog.create({
          data: {
            applicationId: app.id,
            type: el.type,
            to: el.to,
            subject: el.subject,
            html: el.html,
            status: el.status,
            sentAt: el.sentAt,
          },
        });
      }
    }

    // AI Scan Job
    if (a.aiScan) {
      const itRec = await prisma.internship.findUnique({ where: { id: itId }, select: { companyId: true } });
      const compId = itRec?.companyId || fptComp.id;

      await prisma.aiScanJob.upsert({
        where: { applicationId: app.id },
        update: {
          status: a.aiScan.status,
          aiScore: a.aiScan.aiScore,
          recommendation: a.aiScan.recommendation,
          experienceYears: a.aiScan.experienceYears,
          extractedSkills: a.aiScan.extractedSkills,
          matchedSkills: a.aiScan.matchedSkills,
          missingSkills: a.aiScan.missingSkills,
          strengths: a.aiScan.strengths,
          weaknesses: a.aiScan.weaknesses,
          summary: a.aiScan.summary,
          completedAt: new Date(),
        },
        create: {
          applicationId: app.id,
          companyId: compId,
          status: a.aiScan.status,
          aiScore: a.aiScan.aiScore,
          recommendation: a.aiScan.recommendation,
          experienceYears: a.aiScan.experienceYears,
          extractedSkills: a.aiScan.extractedSkills,
          matchedSkills: a.aiScan.matchedSkills,
          missingSkills: a.aiScan.missingSkills,
          strengths: a.aiScan.strengths,
          weaknesses: a.aiScan.weaknesses,
          summary: a.aiScan.summary,
          completedAt: new Date(),
        },
      });
    }
  }

  // =========================================================================
  // 12. PLACEMENTS, SUPERVISIONS, REPORTS & EVALUATIONS (12 PLACEMENTS)
  // =========================================================================
  console.log('📊 [12/15] Khởi tạo 12 Đợt thực tập, Giám sát, 80+ Báo cáo tuần & 8 Đánh giá 2 bên...');

  for (const pl of placementsData) {
    const student = studentProfileMap.get(pl.studentEmail);
    const comp = companyProfileMap.get(pl.companyEmail);
    const itId = internshipMap.get(pl.internshipId);
    const semId = semesterMap.get(pl.semesterName);

    if (!student || !comp || !itId || !semId) {
      console.warn(`⚠️ Lỗi ánh xạ Placement: ${pl.applicationId}`);
      continue;
    }

    const placementRecord = await prisma.internshipPlacement.upsert({
      where: { applicationId: pl.applicationId },
      update: {
        status: pl.status,
        academicStatus: pl.academicStatus,
        startDate: pl.startDate,
        endDate: pl.endDate,
        academicClosedAt: pl.academicClosedAt,
      },
      create: {
        applicationId: pl.applicationId,
        studentId: student.id,
        companyId: comp.id,
        internshipId: itId,
        semesterId: semId,
        status: pl.status,
        academicStatus: pl.academicStatus,
        startDate: pl.startDate,
        endDate: pl.endDate,
        academicClosedAt: pl.academicClosedAt,
      },
    });

    // Supervision (Phân công Giảng viên hướng dẫn)
    if (pl.supervision) {
      const lecturer = lecturerProfileMap.get(pl.supervision.lecturerEmail);
      if (lecturer) {
        await prisma.supervision.upsert({
          where: { placementId: placementRecord.id },
          update: {
            lecturerId: lecturer.id,
            assignedById: academicAdmin.id,
            status: pl.supervision.status,
            assignedAt: pl.supervision.assignedAt,
            completedAt: pl.supervision.completedAt,
          },
          create: {
            placementId: placementRecord.id,
            lecturerId: lecturer.id,
            assignedById: academicAdmin.id,
            status: pl.supervision.status,
            assignedAt: pl.supervision.assignedAt,
            completedAt: pl.supervision.completedAt,
          },
        });
      }
    } else {
      // Đảm bảo không có supervision nếu là UNASSIGNED
      await prisma.supervision.deleteMany({ where: { placementId: placementRecord.id } });
    }

    // Reports (Báo cáo tuần)
    for (const r of pl.reports) {
      await prisma.report.upsert({
        where: { placementId_week: { placementId: placementRecord.id, week: r.week } },
        update: {
          title: r.title,
          content: r.content,
          status: r.status,
          feedback: r.feedback,
          submittedAt: r.submittedAt || new Date('2026-09-15T00:00:00Z'),
          reviewedAt: r.reviewedAt,
        },
        create: {
          placementId: placementRecord.id,
          week: r.week,
          title: r.title,
          content: r.content,
          status: r.status,
          feedback: r.feedback,
          submittedAt: r.submittedAt || new Date('2026-09-15T00:00:00Z'),
          reviewedAt: r.reviewedAt,
        },
      });
    }

    // Đánh giá Doanh nghiệp
    if (pl.companyEvaluation) {
      await prisma.evaluation.upsert({
        where: { placementId_type: { placementId: placementRecord.id, type: EvaluationType.COMPANY } },
        update: {
          evaluatorId: comp.userId,
          score: pl.companyEvaluation.score,
          criteria: pl.companyEvaluation.criteria,
          comment: pl.companyEvaluation.comment,
          submittedAt: pl.companyEvaluation.submittedAt,
        },
        create: {
          placementId: placementRecord.id,
          evaluatorId: comp.userId,
          type: EvaluationType.COMPANY,
          score: pl.companyEvaluation.score,
          criteria: pl.companyEvaluation.criteria,
          comment: pl.companyEvaluation.comment,
          submittedAt: pl.companyEvaluation.submittedAt,
        },
      });
    }

    // Đánh giá Giảng viên
    if (pl.lecturerEvaluation && pl.supervision) {
      const lecturer = lecturerProfileMap.get(pl.supervision.lecturerEmail);
      if (lecturer) {
        await prisma.evaluation.upsert({
          where: { placementId_type: { placementId: placementRecord.id, type: EvaluationType.LECTURER } },
          update: {
            evaluatorId: lecturer.userId,
            score: pl.lecturerEvaluation.score,
            criteria: pl.lecturerEvaluation.criteria,
            comment: pl.lecturerEvaluation.comment,
            submittedAt: pl.lecturerEvaluation.submittedAt,
          },
          create: {
            placementId: placementRecord.id,
            evaluatorId: lecturer.userId,
            type: EvaluationType.LECTURER,
            score: pl.lecturerEvaluation.score,
            criteria: pl.lecturerEvaluation.criteria,
            comment: pl.lecturerEvaluation.comment,
            submittedAt: pl.lecturerEvaluation.submittedAt,
          },
        });
      }
    }
  }

  // =========================================================================
  // 13. HỘI THOẠI & TIN NHẮN CHAT (CONVERSATIONS & MESSAGES)
  // =========================================================================
  console.log('💬 [13/15] Khởi tạo các Hội thoại Chat thực tế...');

  for (const conv of conversationsData) {
    const student = studentProfileMap.get(conv.studentEmail);
    if (!student) continue;

    let companyId: string | null = null;
    if (conv.companyEmail) {
      const comp = companyProfileMap.get(conv.companyEmail);
      if (comp) companyId = comp.id;
    }

    let lecturerId: string | null = null;
    if (conv.lecturerEmail) {
      const lec = lecturerProfileMap.get(conv.lecturerEmail);
      if (lec) lecturerId = lec.id;
    }

    if (conv.applicationId) {
      const cRecord = await prisma.conversation.upsert({
        where: { applicationId: conv.applicationId },
        update: {
          studentId: student.id,
          companyId,
          lecturerId,
        },
        create: {
          applicationId: conv.applicationId,
          studentId: student.id,
          companyId,
          lecturerId,
        },
      });

      await prisma.message.deleteMany({ where: { conversationId: cRecord.id } });
      for (const m of conv.messages) {
        let senderId = student.userId;
        if (conv.companyEmail && m.senderEmail === conv.companyEmail) {
          const comp = companyProfileMap.get(conv.companyEmail);
          if (comp) senderId = comp.userId;
        } else if (conv.lecturerEmail && m.senderEmail === conv.lecturerEmail) {
          const lec = lecturerProfileMap.get(conv.lecturerEmail);
          if (lec) senderId = lec.userId;
        }

        await prisma.message.create({
          data: {
            conversationId: cRecord.id,
            senderId,
            content: m.content,
            readAt: new Date(),
          },
        });
      }
    }
  }

  // =========================================================================
  // 14. THÔNG BÁO HỆ THỐNG & HỖ TRỢ SINH VIÊN (NOTIFICATIONS & SUPPORT)
  // =========================================================================
  console.log('🔔 [14/15] Khởi tạo Thông báo hệ thống và Yêu cầu hỗ trợ...');

  // Notifications
  for (const n of notificationsData) {
    let targetUserId = adminUser.id;
    if (n.userEmail === 'admin@careerbridge.edu.vn') {
      targetUserId = adminUser.id;
    } else if (n.userEmail === 'corporate.admin@careerbridge.edu.vn') {
      targetUserId = corporateAdmin.id;
    } else if (studentProfileMap.has(n.userEmail)) {
      targetUserId = studentProfileMap.get(n.userEmail)!.userId;
    } else if (companyProfileMap.has(n.userEmail)) {
      targetUserId = companyProfileMap.get(n.userEmail)!.userId;
    } else if (lecturerProfileMap.has(n.userEmail)) {
      targetUserId = lecturerProfileMap.get(n.userEmail)!.userId;
    }

    await prisma.notification.upsert({
      where: { eventKey: n.eventKey },
      update: {
        userId: targetUserId,
        type: n.type,
        action: n.action,
        title: n.title,
        content: n.content,
        isRead: n.isRead,
      },
      create: {
        userId: targetUserId,
        type: n.type,
        action: n.action,
        title: n.title,
        content: n.content,
        eventKey: n.eventKey,
        isRead: n.isRead,
      },
    });
  }

  // Support Requests
  for (const sr of supportRequestsData) {
    const student = studentProfileMap.get(sr.studentEmail);
    if (!student) continue;

    // Kiểm tra đã tồn tại request cùng tiêu đề chưa để tránh nhân đôi
    const existing = await prisma.supportRequest.findFirst({
      where: { studentId: student.id, title: sr.title },
    });

    if (!existing) {
      await prisma.supportRequest.create({
        data: {
          studentId: student.id,
          title: sr.title,
          content: sr.content,
          status: sr.status,
          adminReply: sr.adminReply ?? null,
          repliedById: sr.adminReply ? academicAdmin.id : null,
          repliedAt: sr.repliedAt ?? null,
        },
      });
    }
  }

  // =========================================================================
  // 15. LƯỢT XEM TIN (VIEWS), BÁO CÁO VI PHẠM & AUDIT LOGS
  // =========================================================================
  console.log('🚨 [15/15] Khởi tạo Lượt xem tin, Báo cáo vi phạm và Nhật ký kiểm toán...');

  // Báo cáo vi phạm tin lừa đảo
  const scamInternship = await prisma.internship.findUnique({
    where: { id: 'seed-internship-rejected-scam' },
    select: { id: true },
  });
  const stDuy = studentProfileMap.get('student.jobseeking@student.hcmut.edu.vn');

  if (scamInternship && stDuy) {
    const existingRep = await prisma.internshipReport.findFirst({
      where: { internshipId: scamInternship.id, studentId: stDuy.id },
    });
    if (!existingRep) {
      await prisma.internshipReport.create({
        data: {
          internshipId: scamInternship.id,
          studentId: stDuy.id,
          reasonCode: InternshipReportReasonCode.FEE_CHARGED,
          reasonDetail: 'Em liên hệ ứng tuyển thì phía đơn vị yêu cầu em chuyển khoản 500k tiền cọc tài liệu và giữ chỗ làm việc, có dấu hiệu thu phí trái quy định.',
          status: InternshipReportStatus.RESOLVED,
          reviewedById: adminUser.id,
          reviewedAt: new Date('2026-11-03T11:00:00Z'),
          adminNotes: 'Đã xác minh phản ánh của sinh viên là chính xác. Quản trị viên đã hạ tin và chuyển trạng thái tin tuyển dụng sang REJECTED.',
        },
      });
    }
  }

  // Khởi tạo Lượt xem tin tuyển dụng (InternshipView) và cập nhật viewCount cho các tin OPEN
  const activeStudents = Array.from(studentProfileMap.values()).slice(0, 15);
  const openInternships = await prisma.internship.findMany({
    where: { status: 'OPEN' },
    select: { id: true },
  });

  for (let i = 0; i < openInternships.length; i++) {
    const it = openInternships[i];
    // Mỗi tin tuyển dụng được xem bởi 5-10 sinh viên khác nhau
    const viewerSlice = activeStudents.slice(0, 5 + (i % 8));
    for (const v of viewerSlice) {
      await prisma.internshipView.upsert({
        where: { internshipId_viewerUserId: { internshipId: it.id, viewerUserId: v.userId } },
        update: { lastViewedAt: new Date() },
        create: {
          internshipId: it.id,
          viewerUserId: v.userId,
          firstViewedAt: new Date('2026-11-01T08:00:00Z'),
          lastViewedAt: new Date(),
        },
      });
    }

    // Cập nhật viewCount và uniqueViewerCount trực quan cho tin
    const uniqueViewers = viewerSlice.length;
    const totalViews = uniqueViewers * 4 + 12; // Mô phỏng sinh viên quay lại xem nhiều lần
    await prisma.internship.update({
      where: { id: it.id },
      data: {
        uniqueViewerCount: uniqueViewers,
        viewCount: totalViews,
      },
    });
  }

  // Audit Logs
  const auditLogsData = [
    {
      userId: adminUser.id,
      action: 'COMPANY_APPROVED',
      entity: 'CompanyProfile',
      entityId: fptComp.id,
      metadata: { companyName: fptComp.companyName, status: 'APPROVED' },
    },
    {
      userId: adminUser.id,
      action: 'INTERNSHIP_REJECTED',
      entity: 'Internship',
      entityId: 'seed-internship-rejected-scam',
      metadata: { reason: 'UNAUTHORIZED_FEE', details: 'Thu phí sinh viên trái quy định' },
    },
    {
      userId: academicAdmin.id,
      action: 'SUPERVISION_ASSIGNED',
      entity: 'Supervision',
      entityId: 'seed-app-long-fpt-accepted',
      metadata: { student: 'Nguyễn Hoàng Long', lecturer: 'PGS.TS. Phạm Hoàng Anh' },
    },
    {
      userId: corporateAdmin.id,
      action: 'COMPANY_REVIEW_REQUESTED',
      entity: 'CompanyProfile',
      entityId: 'seed-company-kms',
      metadata: { companyName: 'KMS Technology', status: 'PENDING' },
    },
  ];

  for (const log of auditLogsData) {
    await prisma.auditLog.create({
      data: {
        userId: log.userId,
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        metadata: log.metadata,
        ipAddress: '127.0.0.1',
      },
    });
  }

  console.log('✨ QUÁ TRÌNH SEED DỮ LIỆU ĐÃ HOÀN TẤT THÀNH CÔNG RỰC RỠ!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi xảy ra trong quá trình seed dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
