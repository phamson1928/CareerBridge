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
  student3: { email: 'student3@internhub.local', role: 'STUDENT' as const },
  student4: { email: 'student4@internhub.local', role: 'STUDENT' as const },
  lecturer: { email: 'lecturer@internhub.local', role: 'LECTURER' as const },
  lecturer2: { email: 'lecturer2@internhub.local', role: 'LECTURER' as const },
  company: { email: 'company@internhub.local', role: 'COMPANY' as const },
};

async function upsertUser(
  email: string,
  role: (typeof accounts)[keyof typeof accounts]['role'],
  passwordHash: string,
  isSuperAdmin = false,
) {
  return prisma.user.upsert({
    where: { email },
    update: { role, status: 'ACTIVE', passwordHash, isSuperAdmin },
    create: { email, role, status: 'ACTIVE', passwordHash, isSuperAdmin, permissions: [] },
  });
}

async function main() {
  const passwordHash = await bcrypt.hash(
    seedPassword,
    Number(process.env.BCRYPT_ROUNDS || 12),
  );

  const [admin, student, student2, student3, student4, lecturer, lecturer2, company] =
    await Promise.all([
      upsertUser(accounts.admin.email, accounts.admin.role, passwordHash, true),
      upsertUser(accounts.student.email, accounts.student.role, passwordHash),
      upsertUser(accounts.student2.email, accounts.student2.role, passwordHash),
      upsertUser(accounts.student3.email, accounts.student3.role, passwordHash),
      upsertUser(accounts.student4.email, accounts.student4.role, passwordHash),
      upsertUser(accounts.lecturer.email, accounts.lecturer.role, passwordHash),
      upsertUser(accounts.lecturer2.email, accounts.lecturer2.role, passwordHash),
      upsertUser(accounts.company.email, accounts.company.role, passwordHash),
    ]);

  await prisma.studentProfile.upsert({
    where: { userId: student.id },
    update: {
      studentCode: 'SEED-STUDENT-001',
      fullName: 'Nguyễn Sinh Viên',
      major: 'Công nghệ thông tin',
      phone: '0900000001',
      summary: 'Sinh viên đang thực tập tuần 7, đã nộp nhiều báo cáo tuần và báo cáo cuối kỳ.',
      gpa: 3.4,
    },
    create: {
      userId: student.id,
      studentCode: 'SEED-STUDENT-001',
      fullName: 'Nguyễn Sinh Viên',
      major: 'Công nghệ thông tin',
      phone: '0900000001',
      summary: 'Sinh viên đang thực tập tuần 7, đã nộp nhiều báo cáo tuần và báo cáo cuối kỳ.',
      gpa: 3.4,
    },
  });

  await prisma.studentProfile.upsert({
    where: { userId: student2.id },
    update: {
      studentCode: 'SEED-STUDENT-002',
      fullName: 'Trần Thị Thu Trang',
      major: 'Kỹ thuật phần mềm',
      phone: '0900000002',
      summary: 'Hồ sơ thực tập mới được duyệt nhận, đang chờ Admin/Giáo vụ phân công giảng viên hướng dẫn.',
      gpa: 3.1,
    },
    create: {
      userId: student2.id,
      studentCode: 'SEED-STUDENT-002',
      fullName: 'Trần Thị Thu Trang',
      major: 'Kỹ thuật phần mềm',
      phone: '0900000002',
      summary: 'Hồ sơ thực tập mới được duyệt nhận, đang chờ Admin/Giáo vụ phân công giảng viên hướng dẫn.',
      gpa: 3.1,
    },
  });

  await prisma.studentProfile.upsert({
    where: { userId: student3.id },
    update: {
      studentCode: 'SEED-STUDENT-003',
      fullName: 'Lê Hoàng Nam',
      major: 'Hệ thống thông tin',
      phone: '0900000003',
      summary: 'Sinh viên mới bắt đầu thực tập tuần 1, chưa nộp báo cáo nào để test luồng nộp mới từ đầu.',
      gpa: 3.2,
    },
    create: {
      userId: student3.id,
      studentCode: 'SEED-STUDENT-003',
      fullName: 'Lê Hoàng Nam',
      major: 'Hệ thống thông tin',
      phone: '0900000003',
      summary: 'Sinh viên mới bắt đầu thực tập tuần 1, chưa nộp báo cáo nào để test luồng nộp mới từ đầu.',
      gpa: 3.2,
    },
  });

  await prisma.studentProfile.upsert({
    where: { userId: student4.id },
    update: {
      studentCode: 'SEED-STUDENT-004',
      fullName: 'Phạm Minh Đức',
      major: 'Khoa học máy tính',
      phone: '0900000004',
      summary: 'Sinh viên đã hoàn tất trọn vẹn 10 tuần thực tập, đã được Doanh nghiệp và Giảng viên nghiệm thu chốt điểm.',
      gpa: 3.6,
    },
    create: {
      userId: student4.id,
      studentCode: 'SEED-STUDENT-004',
      fullName: 'Phạm Minh Đức',
      major: 'Khoa học máy tính',
      phone: '0900000004',
      summary: 'Sinh viên đã hoàn tất trọn vẹn 10 tuần thực tập, đã được Doanh nghiệp và Giảng viên nghiệm thu chốt điểm.',
      gpa: 3.6,
    },
  });

  await prisma.lecturerProfile.upsert({
    where: { userId: lecturer.id },
    update: {
      fullName: 'TS. Trần Giảng Viên',
      department: 'Khoa Công nghệ thông tin',
      title: 'Giảng viên chính',
    },
    create: {
      userId: lecturer.id,
      fullName: 'TS. Trần Giảng Viên',
      department: 'Khoa Công nghệ thông tin',
      title: 'Giảng viên chính',
    },
  });

  await prisma.lecturerProfile.upsert({
    where: { userId: lecturer2.id },
    update: {
      fullName: 'ThS. Lê Giảng Viên 2',
      department: 'Khoa Công nghệ thông tin',
      title: 'Giảng viên',
    },
    create: {
      userId: lecturer2.id,
      fullName: 'ThS. Lê Giảng Viên 2',
      department: 'Khoa Công nghệ thông tin',
      title: 'Giảng viên',
    },
  });

  await prisma.companyProfile.upsert({
    where: { userId: company.id },
    update: {
      companyName: 'InternHub Demo Company',
      businessRegistrationNumber: '0312345678',
      contactPersonName: 'Lê Hoàng Nam',
      contactPhone: '0901234567',
      tagline: 'Cơ hội thực tập công nghệ hàng đầu cho sinh viên',
      description: 'Công ty mẫu dùng để kiểm thử các luồng tuyển dụng, báo cáo tuần và đánh giá thực tập.',
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
      businessRegistrationNumber: '0312345678',
      contactPersonName: 'Lê Hoàng Nam',
      contactPhone: '0901234567',
      tagline: 'Cơ hội thực tập công nghệ hàng đầu cho sinh viên',
      description: 'Công ty mẫu dùng để kiểm thử các luồng tuyển dụng, báo cáo tuần và đánh giá thực tập.',
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
  const student3Profile = await prisma.studentProfile.findUniqueOrThrow({
    where: { userId: student3.id },
    select: { id: true },
  });
  const student4Profile = await prisma.studentProfile.findUniqueOrThrow({
    where: { userId: student4.id },
    select: { id: true },
  });
  const lecturerProfile = await prisma.lecturerProfile.findUniqueOrThrow({
    where: { userId: lecturer.id },
    select: { id: true },
  });
  const lecturer2Profile = await prisma.lecturerProfile.findUniqueOrThrow({
    where: { userId: lecturer2.id },
    select: { id: true },
  });
  const companyProfile = await prisma.companyProfile.findUniqueOrThrow({
    where: { userId: company.id },
    select: { id: true },
  });

  const skillByName = new Map(
    seededSkills.map((skill) => [skill.name, skill.id]),
  );

  // Kỹ năng mẫu cho sinh viên
  await prisma.studentSkill.deleteMany({
    where: { studentId: studentProfile.id },
  });
  await prisma.studentSkill.createMany({
    data: [
      { studentId: studentProfile.id, skillId: skillByName.get('TypeScript')!, level: 'ADVANCED' },
      { studentId: studentProfile.id, skillId: skillByName.get('NestJS')!, level: 'INTERMEDIATE' },
      { studentId: studentProfile.id, skillId: skillByName.get('PostgreSQL')!, level: 'INTERMEDIATE' },
      { studentId: studentProfile.id, skillId: skillByName.get('Git')!, level: 'ADVANCED' },
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

  const internship = await prisma.internship.upsert({
    where: { id: 'seed-internship-backend' },
    update: {
      companyId: companyProfile.id,
      semesterId: semester.id,
      title: 'Backend Developer Intern (10 Tuần)',
      department: 'Software Engineering',
      location: 'Thành phố Hồ Chí Minh',
      workType: 'HYBRID',
      stipend: '8,000,000 VND',
      description: 'Vị trí thực tập Backend chuẩn hóa lộ trình 10 tuần kết hợp báo cáo và nghiệm thu.',
      requirements: 'NestJS, TypeScript, PostgreSQL, Prisma, Git',
      slots: 5,
      filledSlots: 4,
      deadline: new Date('2026-12-01T00:00:00.000Z'),
      startDate: new Date('2026-09-01T00:00:00.000Z'),
      endDate: new Date('2026-12-31T23:59:59.999Z'),
      status: 'OPEN',
    },
    create: {
      id: 'seed-internship-backend',
      companyId: companyProfile.id,
      semesterId: semester.id,
      title: 'Backend Developer Intern (10 Tuần)',
      department: 'Software Engineering',
      location: 'Thành phố Hồ Chí Minh',
      workType: 'HYBRID',
      stipend: '8,000,000 VND',
      description: 'Vị trí thực tập Backend chuẩn hóa lộ trình 10 tuần kết hợp báo cáo và nghiệm thu.',
      requirements: 'NestJS, TypeScript, PostgreSQL, Prisma, Git',
      slots: 5,
      filledSlots: 4,
      deadline: new Date('2026-12-01T00:00:00.000Z'),
      startDate: new Date('2026-09-01T00:00:00.000Z'),
      endDate: new Date('2026-12-31T23:59:59.999Z'),
      status: 'OPEN',
    },
    select: { id: true },
  });

  // Tệp mẫu (File fixtures) cho báo cáo và chứng nhận
  const fileReportW1 = await prisma.file.upsert({
    where: { storageKey: 'seed/student/report_w1.docx' },
    update: { ownerId: student.id, type: 'REPORT' },
    create: {
      id: 'seed-file-report-w1',
      ownerId: student.id,
      type: 'REPORT',
      storageKey: 'seed/student/report_w1.docx',
      originalName: 'BaoCao_Tuan01_NguyenSinhVien.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      sizeBytes: 154200,
    },
  });

  const fileReportW2 = await prisma.file.upsert({
    where: { storageKey: 'seed/student/report_w2.pdf' },
    update: { ownerId: student.id, type: 'REPORT' },
    create: {
      id: 'seed-file-report-w2',
      ownerId: student.id,
      type: 'REPORT',
      storageKey: 'seed/student/report_w2.pdf',
      originalName: 'BaoCao_Tuan02_NguyenSinhVien.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 285400,
    },
  });

  const fileReportW3 = await prisma.file.upsert({
    where: { storageKey: 'seed/student/report_w3.pdf' },
    update: { ownerId: student.id, type: 'REPORT' },
    create: {
      id: 'seed-file-report-w3',
      ownerId: student.id,
      type: 'REPORT',
      storageKey: 'seed/student/report_w3.pdf',
      originalName: 'BaoCao_Tuan03_KienTrucMicroservices.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 312000,
    },
  });

  const fileFinalReport = await prisma.file.upsert({
    where: { storageKey: 'seed/student/final_report.pdf' },
    update: { ownerId: student.id, type: 'REPORT' },
    create: {
      id: 'seed-file-report-final',
      ownerId: student.id,
      type: 'REPORT',
      storageKey: 'seed/student/final_report.pdf',
      originalName: 'QuyenBaoCaoTongKet_ThucTap10Tuan.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1248900,
    },
  });

  const fileCertificate = await prisma.file.upsert({
    where: { storageKey: 'seed/company/internship_certificate.pdf' },
    update: { ownerId: company.id, type: 'CERTIFICATE' },
    create: {
      id: 'seed-file-company-certificate',
      ownerId: company.id,
      type: 'CERTIFICATE',
      storageKey: 'seed/company/internship_certificate.pdf',
      originalName: 'GiayXacNhan_HoanThanhThucTap_InternHub.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 450000,
    },
  });

  // Tệp mẫu cho sinh viên 4 (Đã hoàn tất)
  const fileFinalReportS4 = await prisma.file.upsert({
    where: { storageKey: 'seed/student4/final_report.pdf' },
    update: { ownerId: student4.id, type: 'REPORT' },
    create: {
      id: 'seed-file-s4-final-report',
      ownerId: student4.id,
      type: 'REPORT',
      storageKey: 'seed/student4/final_report.pdf',
      originalName: 'BaoCaoTotNghiep_PhamMinhDuc.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1560000,
    },
  });

  const fileCertificateS4 = await prisma.file.upsert({
    where: { storageKey: 'seed/company/certificate_s4.pdf' },
    update: { ownerId: company.id, type: 'CERTIFICATE' },
    create: {
      id: 'seed-file-s4-certificate',
      ownerId: company.id,
      type: 'CERTIFICATE',
      storageKey: 'seed/company/certificate_s4.pdf',
      originalName: 'GiayChungNhan_PhamMinhDuc_InternHub.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 520000,
    },
  });

  // -------------------------------------------------------------
  // KỊCH BẢN 1: Sinh viên 1 (student@internhub.local)
  // Thực tập ACTIVE, đã nộp nhiều báo cáo tuần (có APPROVED, REJECTED, SUBMITTED)
  // và Báo cáo tổng kết tuần 0 (SUBMITTED).
  // Doanh nghiệp ĐÃ ĐÁNH GIÁ (8.5đ + đính kèm Giấy xác nhận CERTIFICATE).
  // Giảng viên CHƯA ĐÁNH GIÁ => Đang chờ GVHD vào duyệt BC và chấm điểm.
  // -------------------------------------------------------------
  const activeApplication = await prisma.application.upsert({
    where: { id: 'seed-application-active' },
    update: {
      studentId: studentProfile.id,
      internshipId: internship.id,
      status: 'ACCEPTED',
      acceptedAt: new Date('2026-08-01T09:00:00.000Z'),
    },
    create: {
      id: 'seed-application-active',
      studentId: studentProfile.id,
      internshipId: internship.id,
      coverLetter: 'Đơn ứng tuyển vị trí Backend Developer 10 tuần.',
      status: 'ACCEPTED',
      acceptedAt: new Date('2026-08-01T09:00:00.000Z'),
    },
    select: { id: true },
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
      academicStatus: 'ACTIVE',
      startDate: new Date('2026-09-01T00:00:00.000Z'),
      endDate: new Date('2026-12-31T23:59:59.999Z'),
    },
    create: {
      id: 'seed-placement-active',
      applicationId: activeApplication.id,
      studentId: studentProfile.id,
      companyId: companyProfile.id,
      internshipId: internship.id,
      semesterId: semester.id,
      status: 'ACTIVE',
      academicStatus: 'ACTIVE',
      startDate: new Date('2026-09-01T00:00:00.000Z'),
      endDate: new Date('2026-12-31T23:59:59.999Z'),
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

  // Tạo các báo cáo đa dạng trạng thái cho Kịch bản 1:
  // Tuần 1: APPROVED
  await prisma.report.upsert({
    where: { placementId_week: { placementId: activePlacement.id, week: 1 } },
    update: {
      title: 'Báo cáo Tuần 1: Làm quen dự án và thiết lập môi trường',
      content: 'Trong tuần đầu tiên em đã tham gia onboarding tại công ty InternHub, được cấp tài khoản Git và thiết lập môi trường backend NestJS + PostgreSQL.',
      fileId: fileReportW1.id,
      status: 'APPROVED',
      feedback: 'Khởi đầu tốt, tuần tới bám sát task sprint của mentor giao nhé.',
      reviewedAt: new Date('2026-09-08T10:00:00.000Z'),
      submittedAt: new Date('2026-09-07T18:00:00.000Z'),
    },
    create: {
      placementId: activePlacement.id,
      week: 1,
      title: 'Báo cáo Tuần 1: Làm quen dự án và thiết lập môi trường',
      content: 'Trong tuần đầu tiên em đã tham gia onboarding tại công ty InternHub, được cấp tài khoản Git và thiết lập môi trường backend NestJS + PostgreSQL.',
      fileId: fileReportW1.id,
      status: 'APPROVED',
      feedback: 'Khởi đầu tốt, tuần tới bám sát task sprint của mentor giao nhé.',
      reviewedAt: new Date('2026-09-08T10:00:00.000Z'),
      submittedAt: new Date('2026-09-07T18:00:00.000Z'),
    },
  });

  // Tuần 2: APPROVED
  await prisma.report.upsert({
    where: { placementId_week: { placementId: activePlacement.id, week: 2 } },
    update: {
      title: 'Báo cáo Tuần 2: Xây dựng Module Authentication & JWT Guard',
      content: 'Hoàn thành việc triển khai xác thực JWT, refresh token và phân quyền RBAC (Role-based access control) theo đúng tài liệu swagger của công ty.',
      fileId: fileReportW2.id,
      status: 'APPROVED',
      feedback: 'Bài làm rất chỉn chu, kiến trúc code sạch sẽ.',
      reviewedAt: new Date('2026-09-15T11:00:00.000Z'),
      submittedAt: new Date('2026-09-14T20:00:00.000Z'),
    },
    create: {
      placementId: activePlacement.id,
      week: 2,
      title: 'Báo cáo Tuần 2: Xây dựng Module Authentication & JWT Guard',
      content: 'Hoàn thành việc triển khai xác thực JWT, refresh token và phân quyền RBAC (Role-based access control) theo đúng tài liệu swagger của công ty.',
      fileId: fileReportW2.id,
      status: 'APPROVED',
      feedback: 'Bài làm rất chỉn chu, kiến trúc code sạch sẽ.',
      reviewedAt: new Date('2026-09-15T11:00:00.000Z'),
      submittedAt: new Date('2026-09-14T20:00:00.000Z'),
    },
  });

  // Tuần 3: REJECTED (Yêu cầu sinh viên sửa lại)
  await prisma.report.upsert({
    where: { placementId_week: { placementId: activePlacement.id, week: 3 } },
    update: {
      title: 'Báo cáo Tuần 3: Tối ưu truy vấn CSDL PostgreSQL',
      content: 'Em đã tìm hiểu về chỉ mục Indexing và query plan trong Prisma ORM.',
      fileId: fileReportW3.id,
      status: 'REJECTED',
      feedback: 'Nội dung tuần 3 còn sơ sài, em cần bổ sung thêm hình ảnh kết quả chạy EXPLAIN ANALYZE và số liệu benchmark trước/sau khi đánh index nhé.',
      reviewedAt: new Date('2026-09-22T09:30:00.000Z'),
      submittedAt: new Date('2026-09-21T17:00:00.000Z'),
    },
    create: {
      placementId: activePlacement.id,
      week: 3,
      title: 'Báo cáo Tuần 3: Tối ưu truy vấn CSDL PostgreSQL',
      content: 'Em đã tìm hiểu về chỉ mục Indexing và query plan trong Prisma ORM.',
      fileId: fileReportW3.id,
      status: 'REJECTED',
      feedback: 'Nội dung tuần 3 còn sơ sài, em cần bổ sung thêm hình ảnh kết quả chạy EXPLAIN ANALYZE và số liệu benchmark trước/sau khi đánh index nhé.',
      reviewedAt: new Date('2026-09-22T09:30:00.000Z'),
      submittedAt: new Date('2026-09-21T17:00:00.000Z'),
    },
  });

  // Tuần 4: SUBMITTED (Đang chờ Giảng viên duyệt)
  await prisma.report.upsert({
    where: { placementId_week: { placementId: activePlacement.id, week: 4 } },
    update: {
      title: 'Báo cáo Tuần 4: Thiết kế kiến trúc Event-driven và tích hợp Queue',
      content: 'Triển khai hàng đợi xử lý ngầm với Redis BullMQ cho việc gửi email thông báo tự động và quét khớp hồ sơ CV ứng viên.',
      fileId: null,
      status: 'SUBMITTED',
      feedback: null,
      reviewedAt: null,
      submittedAt: new Date('2026-09-28T19:00:00.000Z'),
    },
    create: {
      placementId: activePlacement.id,
      week: 4,
      title: 'Báo cáo Tuần 4: Thiết kế kiến trúc Event-driven và tích hợp Queue',
      content: 'Triển khai hàng đợi xử lý ngầm với Redis BullMQ cho việc gửi email thông báo tự động và quét khớp hồ sơ CV ứng viên.',
      fileId: null,
      status: 'SUBMITTED',
      feedback: null,
      reviewedAt: null,
      submittedAt: new Date('2026-09-28T19:00:00.000Z'),
    },
  });

  // Tuần 5: DRAFT (Bản nháp sinh viên đang soạn)
  await prisma.report.upsert({
    where: { placementId_week: { placementId: activePlacement.id, week: 5 } },
    update: {
      title: 'Báo cáo Tuần 5: Viết Unit Test và Integration Test',
      content: 'Bản thảo nháp nội dung kiểm thử Jest, đang bổ sung mock PrismaService và test controller.',
      fileId: null,
      status: 'DRAFT',
      feedback: null,
      reviewedAt: null,
      submittedAt: null,
    },
    create: {
      placementId: activePlacement.id,
      week: 5,
      title: 'Báo cáo Tuần 5: Viết Unit Test và Integration Test',
      content: 'Bản thảo nháp nội dung kiểm thử Jest, đang bổ sung mock PrismaService và test controller.',
      fileId: null,
      status: 'DRAFT',
      feedback: null,
      reviewedAt: null,
      submittedAt: null,
    },
  });

  // Tuần 0: BÁO CÁO TỔNG KẾT CUỐI KỲ (SUBMITTED, có đính kèm PDF)
  await prisma.report.upsert({
    where: { placementId_week: { placementId: activePlacement.id, week: 0 } },
    update: {
      title: 'Báo Cáo Tổng Kết Thực Tập Tốt Nghiệp 10 Tuần',
      content: 'Tổng kết toàn bộ quá trình thực tập 10 tuần tại InternHub Demo Company. Báo cáo bao gồm kiến trúc giải pháp, công nghệ NestJS + Prisma, các bài học kinh nghiệm và kết quả đạt được.',
      fileId: fileFinalReport.id,
      status: 'SUBMITTED',
      feedback: null,
      reviewedAt: null,
      submittedAt: new Date('2026-10-25T14:00:00.000Z'),
    },
    create: {
      placementId: activePlacement.id,
      week: 0,
      title: 'Báo Cáo Tổng Kết Thực Tập Tốt Nghiệp 10 Tuần',
      content: 'Tổng kết toàn bộ quá trình thực tập 10 tuần tại InternHub Demo Company. Báo cáo bao gồm kiến trúc giải pháp, công nghệ NestJS + Prisma, các bài học kinh nghiệm và kết quả đạt được.',
      fileId: fileFinalReport.id,
      status: 'SUBMITTED',
      feedback: null,
      reviewedAt: null,
      submittedAt: new Date('2026-10-25T14:00:00.000Z'),
    },
  });

  // Doanh nghiệp ĐÃ ĐÁNH GIÁ (8.5 điểm + Nhận xét + Upload Giấy xác nhận)
  await prisma.evaluation.upsert({
    where: { placementId_type: { placementId: activePlacement.id, type: 'COMPANY' } },
    update: {
      evaluatorId: company.id,
      score: 8.5,
      comment: 'Sinh viên Nguyễn Sinh Viên có thái độ học hỏi xuất sắc, nắm bắt nhanh framework NestJS và hoàn thành tốt các module backend được giao đúng tiến độ.',
      certificateFileId: fileCertificate.id,
      submittedAt: new Date('2026-10-28T09:00:00.000Z'),
    },
    create: {
      placementId: activePlacement.id,
      type: 'COMPANY',
      evaluatorId: company.id,
      score: 8.5,
      comment: 'Sinh viên Nguyễn Sinh Viên có thái độ học hỏi xuất sắc, nắm bắt nhanh framework NestJS và hoàn thành tốt các module backend được giao đúng tiến độ.',
      certificateFileId: fileCertificate.id,
      submittedAt: new Date('2026-10-28T09:00:00.000Z'),
    },
  });

  // Xóa đánh giá giảng viên nếu có trước đó để giảng viên vào test chấm điểm
  await prisma.evaluation.deleteMany({
    where: { placementId: activePlacement.id, type: 'LECTURER' },
  });

  // -------------------------------------------------------------
  // KỊCH BẢN 2: Sinh viên 2 (student2@internhub.local)
  // Đợt thực tập PENDING (Chưa phân công giảng viên)
  // Dùng để test màn hình Quản trị viên (Admin) phân công giảng viên.
  // -------------------------------------------------------------
  const pendingApplication = await prisma.application.upsert({
    where: { id: 'seed-application-pending' },
    update: {
      studentId: student2Profile.id,
      internshipId: internship.id,
      status: 'ACCEPTED',
      acceptedAt: new Date('2026-08-02T09:00:00.000Z'),
    },
    create: {
      id: 'seed-application-pending',
      studentId: student2Profile.id,
      internshipId: internship.id,
      coverLetter: 'Đơn ứng tuyển đang chờ phân công giảng viên.',
      status: 'ACCEPTED',
      acceptedAt: new Date('2026-08-02T09:00:00.000Z'),
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
      academicStatus: 'PENDING',
      startDate: new Date('2026-09-01T00:00:00.000Z'),
      endDate: new Date('2026-12-31T23:59:59.999Z'),
    },
    create: {
      id: 'seed-placement-pending',
      applicationId: pendingApplication.id,
      studentId: student2Profile.id,
      companyId: companyProfile.id,
      internshipId: internship.id,
      semesterId: semester.id,
      status: 'PENDING',
      academicStatus: 'PENDING',
      startDate: new Date('2026-09-01T00:00:00.000Z'),
      endDate: new Date('2026-12-31T23:59:59.999Z'),
    },
  });

  await prisma.supervision.deleteMany({
    where: { placementId: 'seed-placement-pending' },
  });

  // -------------------------------------------------------------
  // KỊCH BẢN 3: Sinh viên 3 (student3@internhub.local)
  // Đợt thực tập ACTIVE, MỚI BẮT ĐẦU TUẦN 1, CHƯA NỘP BÁO CÁO NÀO
  // Dùng để test luồng: Sinh viên tạo mới báo cáo Tuần 1 từ đầu.
  // -------------------------------------------------------------
  const newApplication = await prisma.application.upsert({
    where: { id: 'seed-application-new' },
    update: {
      studentId: student3Profile.id,
      internshipId: internship.id,
      status: 'ACCEPTED',
      acceptedAt: new Date(),
    },
    create: {
      id: 'seed-application-new',
      studentId: student3Profile.id,
      internshipId: internship.id,
      coverLetter: 'Sinh viên mới bắt đầu kỳ thực tập.',
      status: 'ACCEPTED',
      acceptedAt: new Date(),
    },
    select: { id: true },
  });

  // Đặt ngày bắt đầu cách đây 3 ngày (trong tuần 1)
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const tenWeeksLater = new Date(threeDaysAgo.getTime() + 10 * 7 * 24 * 60 * 60 * 1000);

  const newPlacement = await prisma.internshipPlacement.upsert({
    where: { id: 'seed-placement-fresh' },
    update: {
      applicationId: newApplication.id,
      studentId: student3Profile.id,
      companyId: companyProfile.id,
      internshipId: internship.id,
      semesterId: semester.id,
      status: 'ACTIVE',
      academicStatus: 'ACTIVE',
      startDate: threeDaysAgo,
      endDate: tenWeeksLater,
    },
    create: {
      id: 'seed-placement-fresh',
      applicationId: newApplication.id,
      studentId: student3Profile.id,
      companyId: companyProfile.id,
      internshipId: internship.id,
      semesterId: semester.id,
      status: 'ACTIVE',
      academicStatus: 'ACTIVE',
      startDate: threeDaysAgo,
      endDate: tenWeeksLater,
    },
    select: { id: true },
  });

  await prisma.supervision.upsert({
    where: { placementId: newPlacement.id },
    update: {
      lecturerId: lecturerProfile.id,
      assignedById: admin.id,
      status: 'ACTIVE',
    },
    create: {
      placementId: newPlacement.id,
      lecturerId: lecturerProfile.id,
      assignedById: admin.id,
      status: 'ACTIVE',
    },
  });

  await prisma.report.deleteMany({
    where: { placementId: newPlacement.id },
  });
  await prisma.evaluation.deleteMany({
    where: { placementId: newPlacement.id },
  });

  // -------------------------------------------------------------
  // KỊCH BẢN 4: Sinh viên 4 (student4@internhub.local)
  // Đợt thực tập ĐÃ HOÀN TẤT (COMPLETED)
  // Đã có 10 tuần báo cáo APPROVED + Báo cáo tổng kết tuần 0 APPROVED.
  // Đã có Đánh giá Doanh nghiệp (9.0đ + Giấy xác nhận) + Đánh giá Giảng viên (9.0đ)
  // => Điểm tổng kết: 9.0/10.
  // Dùng để test: Sinh viên xem Bảng điểm hoàn chỉnh, tải Giấy xác nhận, bấm In;
  // Giảng viên & Admin xem hồ sơ đã nghiệm thu, nút hoàn tất bị khóa.
  // -------------------------------------------------------------
  const completedApplication = await prisma.application.upsert({
    where: { id: 'seed-application-completed' },
    update: {
      studentId: student4Profile.id,
      internshipId: internship.id,
      status: 'ACCEPTED',
      acceptedAt: new Date('2026-06-01T09:00:00.000Z'),
    },
    create: {
      id: 'seed-application-completed',
      studentId: student4Profile.id,
      internshipId: internship.id,
      coverLetter: 'Hồ sơ thực tập hoàn tất xuất sắc.',
      status: 'ACCEPTED',
      acceptedAt: new Date('2026-06-01T09:00:00.000Z'),
    },
    select: { id: true },
  });

  const completedPlacement = await prisma.internshipPlacement.upsert({
    where: { id: 'seed-placement-completed' },
    update: {
      applicationId: completedApplication.id,
      studentId: student4Profile.id,
      companyId: companyProfile.id,
      internshipId: internship.id,
      semesterId: semester.id,
      status: 'COMPLETED',
      academicStatus: 'CLOSED',
      academicClosedAt: new Date('2026-09-01T00:00:00.000Z'),
      startDate: new Date('2026-06-15T00:00:00.000Z'),
      endDate: new Date('2026-08-25T23:59:59.999Z'),
    },
    create: {
      id: 'seed-placement-completed',
      applicationId: completedApplication.id,
      studentId: student4Profile.id,
      companyId: companyProfile.id,
      internshipId: internship.id,
      semesterId: semester.id,
      status: 'COMPLETED',
      academicStatus: 'CLOSED',
      academicClosedAt: new Date('2026-09-01T00:00:00.000Z'),
      startDate: new Date('2026-06-15T00:00:00.000Z'),
      endDate: new Date('2026-08-25T23:59:59.999Z'),
    },
    select: { id: true },
  });

  await prisma.supervision.upsert({
    where: { placementId: completedPlacement.id },
    update: {
      lecturerId: lecturerProfile.id,
      assignedById: admin.id,
      status: 'COMPLETED',
      completedAt: new Date('2026-09-01T00:00:00.000Z'),
    },
    create: {
      placementId: completedPlacement.id,
      lecturerId: lecturerProfile.id,
      assignedById: admin.id,
      status: 'COMPLETED',
      completedAt: new Date('2026-09-01T00:00:00.000Z'),
    },
  });

  // Tạo 10 tuần báo cáo đã APPROVED cho Kịch bản 4
  for (let w = 1; w <= 10; w++) {
    await prisma.report.upsert({
      where: { placementId_week: { placementId: completedPlacement.id, week: w } },
      update: {
        title: `Báo cáo Tuần ${w}: Hoàn thành các mục tiêu sprint ${w}`,
        content: `Báo cáo chi tiết công việc tuần ${w} về phát triển và tích hợp hệ thống phần mềm thực tế.`,
        status: 'APPROVED',
        feedback: `Đạt yêu cầu tuần ${w}. Tiếp tục phát huy.`,
        reviewedAt: new Date(`2026-0${Math.min(9, 6 + Math.floor(w / 4))}-15T10:00:00.000Z`),
        submittedAt: new Date(`2026-0${Math.min(9, 6 + Math.floor(w / 4))}-14T18:00:00.000Z`),
      },
      create: {
        placementId: completedPlacement.id,
        week: w,
        title: `Báo cáo Tuần ${w}: Hoàn thành các mục tiêu sprint ${w}`,
        content: `Báo cáo chi tiết công việc tuần ${w} về phát triển và tích hợp hệ thống phần mềm thực tế.`,
        status: 'APPROVED',
        feedback: `Đạt yêu cầu tuần ${w}. Tiếp tục phát huy.`,
        reviewedAt: new Date(`2026-0${Math.min(9, 6 + Math.floor(w / 4))}-15T10:00:00.000Z`),
        submittedAt: new Date(`2026-0${Math.min(9, 6 + Math.floor(w / 4))}-14T18:00:00.000Z`),
      },
    });
  }

  // Báo cáo tổng kết cuối kỳ (week = 0) APPROVED
  await prisma.report.upsert({
    where: { placementId_week: { placementId: completedPlacement.id, week: 0 } },
    update: {
      title: 'Báo cáo Tổng kết Thực tập Cuối kỳ (10 Tuần)',
      content: 'Quyển báo cáo thực tập chi tiết toàn diện 10 tuần, kiến trúc hệ thống và kết quả nghiệm thu tại doanh nghiệp.',
      fileId: fileFinalReportS4.id,
      status: 'APPROVED',
      feedback: 'Quyển báo cáo trình bày rất chuyên nghiệp, cấu trúc rõ ràng.',
      reviewedAt: new Date('2026-08-28T10:00:00.000Z'),
      submittedAt: new Date('2026-08-26T14:00:00.000Z'),
    },
    create: {
      placementId: completedPlacement.id,
      week: 0,
      title: 'Báo cáo Tổng kết Thực tập Cuối kỳ (10 Tuần)',
      content: 'Quyển báo cáo thực tập chi tiết toàn diện 10 tuần, kiến trúc hệ thống và kết quả nghiệm thu tại doanh nghiệp.',
      fileId: fileFinalReportS4.id,
      status: 'APPROVED',
      feedback: 'Quyển báo cáo trình bày rất chuyên nghiệp, cấu trúc rõ ràng.',
      reviewedAt: new Date('2026-08-28T10:00:00.000Z'),
      submittedAt: new Date('2026-08-26T14:00:00.000Z'),
    },
  });

  // Đánh giá Doanh nghiệp (9.0đ + Giấy chứng nhận có mộc)
  await prisma.evaluation.upsert({
    where: { placementId_type: { placementId: completedPlacement.id, type: 'COMPANY' } },
    update: {
      evaluatorId: company.id,
      score: 9.0,
      comment: 'Thực tập sinh Phạm Minh Đức có kỹ năng xuất sắc, làm việc độc lập tốt và đóng góp lớn cho sản phẩm của công ty.',
      certificateFileId: fileCertificateS4.id,
      submittedAt: new Date('2026-08-29T09:00:00.000Z'),
    },
    create: {
      placementId: completedPlacement.id,
      type: 'COMPANY',
      evaluatorId: company.id,
      score: 9.0,
      comment: 'Thực tập sinh Phạm Minh Đức có kỹ năng xuất sắc, làm việc độc lập tốt và đóng góp lớn cho sản phẩm của công ty.',
      certificateFileId: fileCertificateS4.id,
      submittedAt: new Date('2026-08-29T09:00:00.000Z'),
    },
  });

  // Đánh giá Giảng viên (9.0đ)
  await prisma.evaluation.upsert({
    where: { placementId_type: { placementId: completedPlacement.id, type: 'LECTURER' } },
    update: {
      evaluatorId: lecturer.id,
      score: 9.0,
      comment: 'Sinh viên nộp đầy đủ 10 báo cáo tuần đúng hạn, quyển báo cáo tổng kết đạt chuẩn chất lượng đồ án thực tập.',
      submittedAt: new Date('2026-08-30T10:00:00.000Z'),
    },
    create: {
      placementId: completedPlacement.id,
      type: 'LECTURER',
      evaluatorId: lecturer.id,
      score: 9.0,
      comment: 'Sinh viên nộp đầy đủ 10 báo cáo tuần đúng hạn, quyển báo cáo tổng kết đạt chuẩn chất lượng đồ án thực tập.',
      submittedAt: new Date('2026-08-30T10:00:00.000Z'),
    },
  });

  console.log('✅ Seed dữ liệu kiểm thử quy trình thực tập 10 tuần thành công!');
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
    console.error('❌ Seed thất bại:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
