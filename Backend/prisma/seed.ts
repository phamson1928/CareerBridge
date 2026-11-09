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
  CompanyStatus,
  CompanyRejectionReasonCode,
  CompanySuspensionReasonCode,
  SemesterStatus,
  InternshipStatus,
  InternshipModerationReasonCode,
  InternshipReportReasonCode,
  InternshipReportStatus,
  AiScanStatus,
  AiCandidateRecommendation,
  ApplicationStatus,
  InterviewMode,
  EmailLogType,
  EmailLogStatus,
  PlacementStatus,
  AcademicMonitoringStatus,
  ReportStatus,
  SupervisionStatus,
  EvaluationType,
  FileType,
  SkillLevel,
  SupportRequestStatus,
  NotificationType,
  NotificationAction,
} from '../src/generated/prisma/client';

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
  console.log('📚 [1/12] Khởi tạo Khoa và Ngành đào tạo Đại học Bách Khoa...');

  const facultiesData = [
    {
      code: 'BK-CSE',
      name: 'Khoa Khoa học và Kỹ thuật Máy tính',
      description: 'Đào tạo kỹ sư hàng đầu về Khoa học Máy tính, Kỹ thuật Phần mềm, Hệ thống Thông tin, An toàn Thông tin và Trí tuệ Nhân tạo.',
      majors: [
        { code: 'BK-CS', name: 'Khoa học Máy tính', description: 'Nghiên cứu cấu trúc dữ liệu, thuật toán, nền tảng tính toán và lý thuyết khoa học máy tính.' },
        { code: 'BK-SE', name: 'Kỹ thuật Phần mềm', description: 'Quy trình phát triển phần mềm chuẩn công nghiệp, kiến trúc hệ thống và kiểm thử chất lượng.' },
        { code: 'BK-IS', name: 'Hệ thống Thông tin', description: 'Phân tích thiết kế hệ thống thông tin quản lý, cơ sở dữ liệu lớn và giải pháp chuyển đổi số.' },
        { code: 'BK-NET', name: 'Mạng Máy tính và An toàn Thông tin', description: 'An ninh mạng, kiểm thử xâm nhập, kiến trúc mạng doanh nghiệp và hạ tầng điện toán đám mây.' },
        { code: 'BK-AI', name: 'Khoa học Dữ liệu và Trí tuệ Nhân tạo', description: 'Học máy, xử lý ngôn ngữ tự nhiên, thị giác máy tính và phân tích dữ liệu chuyên sâu.' },
      ],
    },
    {
      code: 'BK-FEEE',
      name: 'Khoa Điện - Điện tử',
      description: 'Trung tâm đào tạo kỹ sư Điện, Điện tử, Viễn thông, Tự động hóa và Thiết kế vi mạch bán dẫn hàng đầu Việt Nam.',
      majors: [
        { code: 'BK-ECE', name: 'Kỹ thuật Điện tử - Viễn thông', description: 'Xử lý tín hiệu, truyền thông vô tuyến, mạng 5G/6G và hệ thống điện tử cao tần.' },
        { code: 'BK-CA', name: 'Kỹ thuật Điều khiển và Tự động hóa', description: 'Hệ thống điều khiển công nghiệp, PLC, SCADA, robot công nghiệp và tự động hóa dây chuyền sản xuất.' },
        { code: 'BK-IC', name: 'Kỹ thuật Vi điện tử và Thiết kế Vi mạch', description: 'Thiết kế vi mạch tích hợp VLSI/ASIC, công nghệ bán dẫn và kiểm thử chip.' },
        { code: 'BK-EE', name: 'Kỹ thuật Điện', description: 'Hệ thống cung cấp điện, năng lượng tái tạo, lưới điện thông minh Smart Grid và thiết bị điện công nghiệp.' },
      ],
    },
    {
      code: 'BK-FME',
      name: 'Khoa Cơ khí',
      description: 'Đào tạo kỹ sư Cơ điện tử, Chế tạo máy, Kỹ thuật Ô tô và Robot công nghiệp.',
      majors: [
        { code: 'BK-MTR', name: 'Kỹ thuật Cơ điện tử', description: 'Tích hợp cơ khí chính xác, điện tử điều khiển và lập trình nhúng thông minh.' },
        { code: 'BK-ME', name: 'Kỹ thuật Cơ khí', description: 'Thiết kế máy móc, công nghệ chế tạo, gia công CNC chính xác và mô phỏng CAE.' },
        { code: 'BK-AUTO', name: 'Kỹ thuật Ô tô và Xe điện', description: 'Kết cấu ô tô, động cơ điện, hệ thống pin năng lượng BMS và xe tự hành thông minh.' },
        { code: 'BK-ROB', name: 'Kỹ thuật Robot và Hệ thống Thông minh', description: 'Thiết kế kết cấu robot, hệ điều hành robot ROS, cánh tay robot công nghiệp và xe tự hành AGV.' },
      ],
    },
    {
      code: 'BK-FCE',
      name: 'Khoa Kỹ thuật Hóa học',
      description: 'Đào tạo chuyên môn về Kỹ thuật Hóa học, Công nghệ Thực phẩm và Công nghệ Sinh học ứng dụng.',
      majors: [
        { code: 'BK-CHE', name: 'Kỹ thuật Hóa học', description: 'Mô phỏng quy trình hóa học, công nghệ lọc hóa dầu, vật liệu tiên tiến và hóa kỹ thuật.' },
        { code: 'BK-FOOD', name: 'Công nghệ Thực phẩm', description: 'Chế biến và bảo quản thực phẩm, kiểm soát chất lượng QA/QC theo chuẩn HACCP/ISO.' },
        { code: 'BK-BIO', name: 'Công nghệ Sinh học', description: 'Công nghệ lên men, sinh học phân tử, vi sinh ứng dụng và dược phẩm sinh học.' },
      ],
    },
    {
      code: 'BK-SIM',
      name: 'Khoa Quản lý Công nghiệp',
      description: 'Đào tạo cử nhân, kỹ sư về Quản lý Công nghiệp, Chuỗi cung ứng Logistics và Tối ưu hóa vận hành doanh nghiệp.',
      majors: [
        { code: 'BK-IM', name: 'Quản lý Công nghiệp', description: 'Tối ưu hóa sản xuất, quản trị chất lượng Lean/Six Sigma, hoạch định nguồn lực doanh nghiệp ERP.' },
        { code: 'BK-LOG', name: 'Logistics và Quản lý Chuỗi cung ứng', description: 'Quản trị kho vận, chuỗi cung ứng toàn cầu, tối ưu hóa mạng lưới phân phối và vận tải đa phương thức.' },
      ],
    },
    {
      code: 'BK-CIVIL',
      name: 'Khoa Kỹ thuật Xây dựng',
      description: 'Đào tạo kỹ sư Xây dựng dân dụng, công nghiệp, công trình giao thông và kỹ thuật môi trường.',
      majors: [
        { code: 'BK-CE', name: 'Kỹ thuật Xây dựng', description: 'Thiết kế kết cấu bê tông cốt thép, quản lý dự án xây dựng BIM và giám sát thi công công trình.' },
        { code: 'BK-ENV', name: 'Kỹ thuật Môi trường và Đô thị Thông minh', description: 'Xử lý nước cấp và nước thải công nghiệp, quản lý chất thải nguy hại và quy hoạch đô thị xanh.' },
      ],
    },
  ];

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
  console.log('🛠️ [2/12] Khởi tạo danh mục Kỹ năng chuyên môn bao quát các ngành...');

  const skillNames = [
    // Phần mềm & CNTT
    'TypeScript', 'JavaScript', 'React', 'Vue.js', 'Next.js', 'Node.js', 'NestJS', 'Python',
    'Java', 'Spring Boot', 'C++', 'C#', '.NET Core', 'Go', 'PostgreSQL', 'MySQL', 'MongoDB',
    'Redis', 'Docker', 'Kubernetes', 'Git', 'CI/CD', 'AWS', 'RESTful API', 'GraphQL',
    'Microservices', 'Linux/Shell Scripting', 'Software Architecture', 'Unit Testing',
    'Socket.IO', 'Prisma ORM', 'Tailwind CSS', 'React Native', 'Nginx',
    // AI & Dữ liệu
    'Machine Learning', 'Deep Learning', 'PyTorch', 'TensorFlow', 'Computer Vision',
    'Natural Language Processing (NLP)', 'Pandas', 'NumPy', 'Data Analysis', 'SQL & Data Modeling', 'Power BI',
    // Điện tử - Vi mạch & Nhúng
    'C/C++ Embedded', 'RTOS (FreeRTOS)', 'ARM Cortex-M', 'STM32', 'FPGA Design', 'Verilog/VHDL',
    'Altium Designer', 'PCB Layout & Routing', 'Digital Circuit Design', 'UART/I2C/SPI Protocol', 'KiCad',
    // Cơ khí, Ô tô, Tự động hóa & Robot
    'PLC Programming (Siemens/Mitsubishi)', 'SCADA System', 'SolidWorks', 'AutoCAD', 'Catia',
    'CNC Machining', 'ROS (Robot Operating System)', 'Industrial Robotics', 'Mechatronics System Design',
    'Ansys FEA', 'CAN Bus Protocol', 'Electric Vehicle Powertrain', 'MATLAB/Simulink',
    // Hóa học, Sinh học & Thực phẩm
    'Chemical Process Simulation (Aspen Plus)', 'HPLC Analysis', 'Good Laboratory Practice (GLP)',
    'GMP Standards', 'Quality Assurance/Quality Control (QA/QC)', 'Food Processing Technology', 'Fermentation Technology',
    // Quản lý công nghiệp & Logistics
    'Supply Chain Management', 'SAP ERP System', 'Lean Manufacturing', 'Six Sigma',
    'Inventory Optimization', 'Warehouse Management System (WMS)', 'Kaizen & 5S',
    // Xây dựng & Môi trường
    'BIM (Revit)', 'Civil Engineering Design', 'Environmental Impact Assessment',
    // Kỹ năng mềm & Quản trị dự án
    'Agile/Scrum', 'Project Management', 'Technical Report Writing', 'English for Engineering',
    'Teamwork & Communication', 'Problem Solving & Critical Thinking',
  ];

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
  // 3. HỌC KỲ VÀ DÒNG THỜI GIAN (SEMESTERS - QUÁ KHỨ, HIỆN TẠI, TƯƠNG LAI)
  // Quy tắc: Mỗi năm 3 kỳ, mỗi kỳ 4 tháng, tuyển dụng 1 tháng trước khi bắt đầu.
  // =========================================================================
  console.log('📅 [3/12] Khởi tạo các Học kỳ theo dòng thời gian chuẩn...');

  // Mốc thời gian tham chiếu hiện tại là Tháng 11/2026 (2026-11-07)
  const semestersData = [
    // 1. Quá khứ: Học kỳ 1 Năm học 2025 - 2026 (Kỳ Thu 2025)
    // Tuyển dụng: 01/08/2025 -> 31/08/2025 | Thực tập: 01/09/2025 -> 31/12/2025 (4 tháng)
    {
      name: 'Học kỳ 1 (2025 - 2026) - Kỳ Thu',
      startDate: new Date('2025-09-01T00:00:00.000Z'),
      endDate: new Date('2025-12-31T23:59:59.000Z'),
      status: SemesterStatus.COMPLETED,
    },
    // 2. Quá khứ: Học kỳ 2 Năm học 2025 - 2026 (Kỳ Xuân 2026)
    // Tuyển dụng: 01/12/2025 -> 31/12/2025 | Thực tập: 01/01/2026 -> 30/04/2026 (4 tháng)
    {
      name: 'Học kỳ 2 (2025 - 2026) - Kỳ Xuân',
      startDate: new Date('2026-01-01T00:00:00.000Z'),
      endDate: new Date('2026-04-30T23:59:59.000Z'),
      status: SemesterStatus.COMPLETED,
    },
    // 3. Quá khứ: Học kỳ 3 Năm học 2025 - 2026 (Kỳ Hè 2026)
    // Tuyển dụng: 01/04/2026 -> 30/04/2026 | Thực tập: 01/05/2026 -> 31/08/2026 (4 tháng)
    {
      name: 'Học kỳ Hè (2025 - 2026)',
      startDate: new Date('2026-05-01T00:00:00.000Z'),
      endDate: new Date('2026-08-31T23:59:59.000Z'),
      status: SemesterStatus.COMPLETED,
    },
    // 4. HIỆN TẠI (Đang thực tập & theo dõi): Học kỳ 1 Năm học 2026 - 2027 (Kỳ Thu 2026)
    // Tuyển dụng: 01/08/2026 -> 31/08/2026 | Thực tập: 01/09/2026 -> 31/12/2026 (4 tháng)
    // Hiện tại là 07/11/2026 -> Kỳ này đang ở tháng thứ 3 (Tuần 8-10 của các đợt thực tập 10 tuần)
    {
      name: 'Học kỳ 1 (2026 - 2027) - Kỳ Thu [Hiện tại]',
      startDate: new Date('2026-09-01T00:00:00.000Z'),
      endDate: new Date('2026-12-31T23:59:59.000Z'),
      status: SemesterStatus.MONITORING,
    },
    // 5. HIỆN TẠI (Đang mở tuyển dụng): Học kỳ 2 Năm học 2026 - 2027 (Kỳ Xuân 2027)
    // Bắt đầu kỳ: 01/12/2026 -> Kết thúc: 31/03/2027 (4 tháng)
    // Thời gian tuyển dụng (1 tháng trước): 01/11/2026 -> 30/11/2026
    // Ngày 07/11/2026 đang nằm chính xác trong đợt tuyển dụng -> Trạng thái RECRUITING!
    // Các tin tuyển dụng OPEN mở nhận hồ sơ cho kỳ này.
    {
      name: 'Học kỳ 2 (2026 - 2027) - Kỳ Xuân [Đang tuyển dụng]',
      startDate: new Date('2026-12-01T00:00:00.000Z'),
      endDate: new Date('2027-03-31T23:59:59.000Z'),
      status: SemesterStatus.RECRUITING,
    },
    // 6. TƯƠNG LAI: Học kỳ Hè Năm học 2026 - 2027 (Kỳ Hè 2027)
    // Tuyển dụng: 01/03/2027 -> 31/03/2027 | Thực tập: 01/04/2027 -> 31/07/2027 (4 tháng)
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

  const semPastFall = semesterMap.get('Học kỳ 1 (2025 - 2026) - Kỳ Thu')!;
  const semPastSpring = semesterMap.get('Học kỳ 2 (2025 - 2026) - Kỳ Xuân')!;
  const semCurrentActive = semesterMap.get('Học kỳ 1 (2026 - 2027) - Kỳ Thu [Hiện tại]')!;
  const semRecruiting = semesterMap.get('Học kỳ 2 (2026 - 2027) - Kỳ Xuân [Đang tuyển dụng]')!;
  const semFuture = semesterMap.get('Học kỳ Hè (2026 - 2027) [Sắp diễn ra]')!;

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
  // 4. TÀI KHOẢN QUẢN TRỊ VIÊN (SUPER ADMIN & SUB-ADMINS PHÂN QUYỀN)
  // =========================================================================
  console.log('👤 [4/12] Khởi tạo tài khoản Quản trị viên (Super Admin & Sub-Admins)...');

  // 1. Quản trị viên tối cao (Super Admin) - Toàn quyền, độc quyền User Management & Audit Logs
  const adminUser = await upsertUser(
    'admin@careerbridge.edu.vn',
    Role.ADMIN,
    UserStatus.ACTIVE,
    new Date('2025-01-15T08:00:00Z'),
    true, // isSuperAdmin
    [],
  );

  // 2. Admin phụ: Giáo vụ Quản trị Đào tạo & Thực tập (Academic Affairs Sub-Admin)
  // Quyền: Thống kê, Quản lý Thực tập & Giảng viên, Quản lý Đợt thực tập, Hỗ trợ SV
  const academicAdmin = await upsertUser(
    'academic.admin@careerbridge.edu.vn',
    Role.ADMIN,
    UserStatus.ACTIVE,
    new Date('2025-01-15T08:00:00Z'),
    false, // isSuperAdmin
    [
      AdminPermission.DASHBOARD,
      AdminPermission.PLACEMENTS,
      AdminPermission.SEMESTERS,
      AdminPermission.SUPPORT,
    ],
  );

  // 3. Admin phụ: Quan hệ Doanh nghiệp & Tuyển dụng (Corporate Relations Sub-Admin)
  // Quyền: Thống kê, Duyệt & Quản lý Doanh nghiệp, Quản lý Tin tuyển dụng & Kỹ năng
  const corporateAdmin = await upsertUser(
    'corporate.admin@careerbridge.edu.vn',
    Role.ADMIN,
    UserStatus.ACTIVE,
    new Date('2025-01-15T08:00:00Z'),
    false, // isSuperAdmin
    [
      AdminPermission.DASHBOARD,
      AdminPermission.COMPANIES,
      AdminPermission.INTERNSHIPS,
    ],
  );

  // 4. Admin phụ: Tiếp nhận Khiếu nại & Hỗ trợ Sinh viên (Helpdesk Sub-Admin)
  // Quyền: Tiếp nhận & Phản hồi Yêu cầu hỗ trợ sinh viên
  const supportAdmin = await upsertUser(
    'support.admin@careerbridge.edu.vn',
    Role.ADMIN,
    UserStatus.ACTIVE,
    new Date('2025-01-15T08:00:00Z'),
    false, // isSuperAdmin
    [AdminPermission.SUPPORT],
  );

  // =========================================================================
  // 5. TÀI KHOẢN GIẢNG VIÊN ĐẠI HỌC BÁCH KHOA (LECTURERS)
  // =========================================================================
  console.log('👨‍🏫 [5/12] Khởi tạo tài khoản Giảng viên các khoa...');

  const lecturersData = [
    {
      email: 'lecturer.cse@careerbridge.edu.vn',
      fullName: 'PGS.TS. Phạm Hoàng Anh',
      facultyCode: 'BK-CSE',
      department: 'Khoa Khoa học và Kỹ thuật Máy tính',
      title: 'Phó Giáo sư, Giảng viên cao cấp',
    },
    {
      email: 'lecturer.feee@careerbridge.edu.vn',
      fullName: 'TS. Đỗ Quốc Thắng',
      facultyCode: 'BK-FEEE',
      department: 'Khoa Điện - Điện tử',
      title: 'Tiến sĩ, Trưởng bộ môn Vi mạch',
    },
    {
      email: 'lecturer.fme@careerbridge.edu.vn',
      fullName: 'TS. Nguyễn Thanh Tùng',
      facultyCode: 'BK-FME',
      department: 'Khoa Cơ khí',
      title: 'Tiến sĩ, Giảng viên chính Cơ điện tử',
    },
    {
      email: 'lecturer.sim@careerbridge.edu.vn',
      fullName: 'ThS. Lê Hoàng Mai',
      facultyCode: 'BK-SIM',
      department: 'Khoa Quản lý Công nghiệp',
      title: 'Thạc sĩ, Giảng viên Chuỗi cung ứng',
    },
    {
      email: 'lecturer.fce@careerbridge.edu.vn',
      fullName: 'TS. Bùi Minh Triết',
      facultyCode: 'BK-FCE',
      department: 'Khoa Kỹ thuật Hóa học',
      title: 'Tiến sĩ, Giảng viên Công nghệ Thực phẩm',
    },
  ];

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
  // 6. DOANH NGHIỆP THỰC TẾ & CÁC TRẠNG THÁI KIỂM DUYỆT (COMPANIES)
  // =========================================================================
  console.log('🏢 [6/12] Khởi tạo Doanh nghiệp thực tế với đầy đủ trạng thái...');

  const companiesData = [
    // 1. FPT Software - APPROVED
    {
      email: 'fpt.software@fpt.com',
      companyName: 'Công ty TNHH Phần mềm FPT (FPT Software)',
      businessRegistrationNumber: '0101778162',
      contactPersonName: 'Nguyễn Thanh Tùng',
      contactPhone: '02873007575',
      tagline: 'Dẫn đầu chuyển đổi số và công nghệ phần mềm tại Việt Nam',
      description: 'FPT Software là công ty thành viên của Tập đoàn FPT, chuyên cung cấp các giải pháp dịch vụ phần mềm, AI, Cloud và chuyển đổi số cho hàng trăm doanh nghiệp Fortune 500 trên toàn cầu.',
      industry: 'Công nghệ thông tin & Dịch vụ phần mềm',
      website: 'https://fptsoftware.com',
      address: 'F-Town 3, Khu Công nghệ cao TP. Thủ Đức, TP. Hồ Chí Minh',
      status: CompanyStatus.APPROVED,
      reviewedById: adminUser.id,
      reviewedAt: new Date('2025-01-20T09:00:00Z'),
      autoAiScanEnabled: true,
    },
    // 2. Bosch Global Software Technologies - APPROVED
    {
      email: 'bosch.recruitment@bosch.com',
      companyName: 'Công ty TNHH Bosch Global Software Technologies Việt Nam',
      businessRegistrationNumber: '0310469871',
      contactPersonName: 'Trần Minh Đức',
      contactPhone: '02862858888',
      tagline: 'Invented for Life - Phát triển phần mềm và kỹ thuật ô tô thông minh',
      description: 'Trung tâm nghiên cứu và phát triển phần mềm công nghệ cao của Tập đoàn Bosch tại Việt Nam, tập trung vào hệ thống nhúng (Embedded Systems), Automotive IoT, AI và giải pháp di chuyển thông minh.',
      industry: 'Kỹ thuật ô tô, Hệ thống nhúng & IoT',
      website: 'https://www.bosch.com.vn',
      address: 'Tòa nhà E-Town Central, 11 Đoàn Văn Bơ, Quận 4, TP. Hồ Chí Minh',
      status: CompanyStatus.APPROVED,
      reviewedById: adminUser.id,
      reviewedAt: new Date('2025-01-22T14:30:00Z'),
      autoAiScanEnabled: true,
    },
    // 3. Viettel Solutions - APPROVED
    {
      email: 'viettel.solutions@viettel.com.vn',
      companyName: 'Tổng Công ty Giải pháp Doanh nghiệp Viettel (Viettel Solutions)',
      businessRegistrationNumber: '0100109106',
      contactPersonName: 'Lê Quốc Huy',
      contactPhone: '02462778899',
      tagline: 'Tiên phong kiến tạo xã hội số',
      description: 'Đơn vị thành viên của Tập đoàn Công nghiệp - Viễn thông Quân đội Viettel, chuyên cung cấp hạ tầng số, an toàn thông tin mạng (Cybersecurity), điện toán đám mây và trung tâm điều hành thông minh IOC.',
      industry: 'Viễn thông, An ninh mạng & Dịch vụ số',
      website: 'https://solutions.viettel.vn',
      address: 'Tòa nhà Viettel Complex, 285 Cách Mạng Tháng 8, Quận 10, TP. Hồ Chí Minh',
      status: CompanyStatus.APPROVED,
      reviewedById: adminUser.id,
      reviewedAt: new Date('2025-02-05T10:15:00Z'),
      autoAiScanEnabled: true,
    },
    // 4. VinFast Auto - APPROVED
    {
      email: 'vinfast.careers@vinfast.vn',
      companyName: 'Công ty Cổ phần Sản xuất và Kinh doanh VinFast',
      businessRegistrationNumber: '0108035252',
      contactPersonName: 'Phạm Hải Đăng',
      contactPhone: '1900232389',
      tagline: 'Cùng bạn bứt phá mọi giới hạn với xe điện thông minh',
      description: 'Nhà sản xuất ô tô và xe máy điện thông minh toàn cầu thuộc Tập đoàn Vingroup, dẫn đầu về công nghệ pin, trạm sạc và kỹ thuật ô tô điện thế hệ mới.',
      industry: 'Sản xuất Ô tô, Cơ khí chính xác & Năng lượng xanh',
      website: 'https://vinfastauto.com',
      address: 'Khu phức hợp công nghiệp VinFast, Cát Hải, Hải Phòng & VP TP.HCM: Vinhomes Central Park, Bình Thạnh',
      status: CompanyStatus.APPROVED,
      reviewedById: academicAdmin.id,
      reviewedAt: new Date('2025-02-10T16:00:00Z'),
      autoAiScanEnabled: false,
    },
    // 5. Tân Cảng Sài Gòn (Saigon Newport) - APPROVED
    {
      email: 'saigon.newport@saigonnewport.com.vn',
      companyName: 'Tổng Công ty Tân Cảng Sài Gòn (Saigon Newport Corporation)',
      businessRegistrationNumber: '0300445492',
      contactPersonName: 'Võ Thị Tuyết Mai',
      contactPhone: '02837422234',
      tagline: 'Dẫn đầu dịch vụ khai thác cảng và logistics trọn gói tại Việt Nam',
      description: 'Nhà khai thác cảng container lớn nhất Việt Nam với thị phần hơn 50% cả nước, cung cấp chuỗi dịch vụ logistics đa phương thức, quản lý kho bãi hiện đại và giải pháp chuỗi cung ứng toàn diện.',
      industry: 'Cảng biển, Logistics & Quản lý Chuỗi cung ứng',
      website: 'https://saigonnewport.com.vn',
      address: 'Cảng Cát Lái, Đường Nguyễn Thị Định, Cát Lái, TP. Thủ Đức, TP. Hồ Chí Minh',
      status: CompanyStatus.APPROVED,
      reviewedById: adminUser.id,
      reviewedAt: new Date('2025-02-15T11:00:00Z'),
      autoAiScanEnabled: false,
    },
    // 6. KMS Technology - PENDING (Đang chờ Quản trị viên duyệt)
    {
      email: 'kms.recruitment@kms-technology.com',
      companyName: 'Công ty TNHH Phần mềm KMS Technology Việt Nam',
      businessRegistrationNumber: '0309538742',
      contactPersonName: 'Hoàng Trọng Nghĩa',
      contactPhone: '02838486994',
      tagline: 'Engineering Excellence - Phần mềm đẳng cấp thế giới',
      description: 'KMS Technology cung cấp dịch vụ kỹ thuật phần mềm, kiểm thử phần mềm tự động hóa và phát triển sản phẩm công nghệ cho thị trường Hoa Kỳ và toàn cầu.',
      industry: 'Phát triển & Kiểm thử phần mềm (QA)',
      website: 'https://kms-technology.com',
      address: '2 Tản Viên, Phường 2, Quận Tân Bình, TP. Hồ Chí Minh',
      status: CompanyStatus.PENDING,
      submittedAt: new Date('2026-11-02T10:00:00Z'),
      reviewDueAt: new Date('2026-11-09T17:00:00Z'),
      reviewChecklist: {
        legalRepresentativeVerified: true,
        businessRegistrationDocumentClear: true,
        addressVerified: true,
        fieldAlignedWithEducation: true,
      },
    },
    // 7. Công ty Alpha VN - REJECTED (Bị từ chối duyệt)
    {
      email: 'alpha.tech@alphavn.com',
      companyName: 'Công ty Cổ phần Đầu tư Công nghệ Alpha Việt Nam',
      businessRegistrationNumber: '0319988771',
      contactPersonName: 'Vũ Đức Thắng',
      contactPhone: '0938999888',
      tagline: 'Giải pháp thương mại điện tử nhanh chóng',
      description: 'Công ty mới thành lập chuyên phát triển các website bán hàng và ứng dụng marketing.',
      industry: 'Thương mại điện tử & Dịch vụ trực tuyến',
      website: 'https://alphavn-demo.local',
      address: '45/12 Đường Số 8, Linh Xuân, TP. Thủ Đức, TP. Hồ Chí Minh',
      status: CompanyStatus.REJECTED,
      reviewedById: adminUser.id,
      reviewedAt: new Date('2026-10-25T14:00:00Z'),
      rejectionReasonCode: CompanyRejectionReasonCode.DOCUMENT_UNCLEAR,
      rejectionReason: 'Bản scan Giấy chứng nhận đăng ký doanh nghiệp bị mờ, không hiển thị rõ mã số thuế và con dấu pháp nhân. Vui lòng cập nhật bản scan rõ nét để được xem xét lại.',
      submittedAt: new Date('2026-10-24T09:00:00Z'),
    },
    // 8. Công ty NextGen - SUSPENDED (Bị đình chỉ hoạt động)
    {
      email: 'nextgen.hr@nextgensolutions.vn',
      companyName: 'Công ty Cổ phần Giải pháp Số NextGen',
      businessRegistrationNumber: '0318877665',
      contactPersonName: 'Trịnh Hoài Nam',
      contactPhone: '0912334455',
      tagline: 'Phần mềm và truyền thông đa phương tiện',
      description: 'Công ty tư vấn phần mềm và giải pháp chuyển đổi số.',
      industry: 'Công nghệ thông tin',
      website: 'https://nextgensolutions.local',
      address: '128 Điện Biên Phủ, Phường 15, Bình Thạnh, TP. Hồ Chí Minh',
      status: CompanyStatus.SUSPENDED,
      reviewedById: adminUser.id,
      reviewedAt: new Date('2026-03-01T08:00:00Z'),
      suspendedAt: new Date('2026-10-15T16:30:00Z'),
      suspensionReasonCode: CompanySuspensionReasonCode.ABUSIVE_POSTING,
      suspensionReason: 'Doanh nghiệp đăng tải tin tuyển dụng sai lệch thực tế và yêu cầu sinh viên thực tập đóng phí đào tạo trái với quy định của nhà trường.',
    },
    // 9. Công ty Tân Phú Startup - DRAFT (Mới đăng ký, chưa nộp hồ sơ)
    {
      email: 'tanphu.startup@tanphutech.vn',
      companyName: 'Công ty TNHH Khởi nghiệp Công nghệ Tân Phú',
      businessRegistrationNumber: '0317766554',
      contactPersonName: 'Đinh Quốc Hưng',
      contactPhone: '0988112233',
      tagline: 'Giải pháp số cho nông nghiệp thông minh',
      description: 'Startup nghiên cứu cảm biến IoT và ứng dụng điều khiển tưới tiêu tự động trong nông nghiệp.',
      industry: 'IoT Nông nghiệp & Công nghệ phần cứng',
      website: 'https://tanphuiot.local',
      address: '77 Thoại Ngọc Hầu, Phú Thạnh, Tân Phú, TP. Hồ Chí Minh',
      status: CompanyStatus.DRAFT,
    },
  ];

  const companyProfileMap = new Map<string, { id: string; userId: string; companyName: string }>();

  for (const c of companiesData) {
    const user = await upsertUser(c.email, Role.COMPANY);
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
        reviewedById: c.reviewedById,
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
        reviewedById: c.reviewedById,
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

  const fptComp = companyProfileMap.get('fpt.software@fpt.com')!;
  const boschComp = companyProfileMap.get('bosch.recruitment@bosch.com')!;
  const viettelComp = companyProfileMap.get('viettel.solutions@viettel.com.vn')!;
  const vinfastComp = companyProfileMap.get('vinfast.careers@vinfast.vn')!;
  const newportComp = companyProfileMap.get('saigon.newport@saigonnewport.com.vn')!;

  // =========================================================================
  // 7. SINH VIÊN ĐẠI HỌC BÁCH KHOA & HỒ SƠ NĂNG LỰC (STUDENTS)
  // =========================================================================
  console.log('🎓 [7/12] Khởi tạo hồ sơ Sinh viên Đại học Bách Khoa...');

  const studentsData = [
    // 0. Phạm Hoàng Sơn - FullStack / Backend Developer
    {
      email: 'pson4282@gmail.com',
      studentCode: '2314282',
      fullName: 'Phạm Hoàng Sơn',
      majorCode: 'BK-SE',
      phone: '0901234567',
      gpa: 3.65,
      summary:
        '4rd-year IT student with hands-on experience building scalable backend applications using NestJS, TypeScript, PostgreSQL, Redis, and Docker. Experienced in API development, database design, authentication, and VPS deployment. Seeking a Backend Developer Intern role to contribute to real-world products and further develop backend engineering skills.',
      skills: [
        { name: 'NestJS', level: SkillLevel.ADVANCED },
        { name: 'TypeScript', level: SkillLevel.ADVANCED },
        { name: 'Node.js', level: SkillLevel.ADVANCED },
        { name: 'PostgreSQL', level: SkillLevel.ADVANCED },
        { name: 'Redis', level: SkillLevel.INTERMEDIATE },
        { name: 'Docker', level: SkillLevel.INTERMEDIATE },
        { name: 'Git', level: SkillLevel.ADVANCED },
        { name: 'CI/CD', level: SkillLevel.INTERMEDIATE },
        { name: 'RESTful API', level: SkillLevel.ADVANCED },
        { name: 'React', level: SkillLevel.INTERMEDIATE },
        { name: 'Tailwind CSS', level: SkillLevel.ADVANCED },
        { name: 'React Native', level: SkillLevel.INTERMEDIATE },
        { name: 'Prisma ORM', level: SkillLevel.ADVANCED },
        { name: 'Socket.IO', level: SkillLevel.ADVANCED },
        { name: 'Nginx', level: SkillLevel.INTERMEDIATE },
        { name: 'AWS', level: SkillLevel.INTERMEDIATE },
        { name: 'Linux/Shell Scripting', level: SkillLevel.INTERMEDIATE },
      ],
      projects: [
        {
          title: 'TEAMZONEVN — Social Gaming Matchmaking Platform',
          description:
            'Designed PostgreSQL schema with 23 Prisma models, JWT & Google OAuth 2.0 auth, Redis rate limiting & real-time leaderboard, Socket.IO chat & notifications, deployed on AWS EC2 with Docker Compose, Nginx reverse proxy, HTTPS, Supabase Storage, and GitHub Actions CI/CD.',
          repositoryUrl: 'https://github.com/pson4282/teamzonevn',
          demoUrl: 'https://teamzone.vn',
          startedAt: new Date('2026-01-01'),
          endedAt: new Date('2026-07-31'),
        },
        {
          title: 'UTH CLUBS & EVENTS — Club & Event Management System',
          description:
            'Developed RESTful APIs with NestJS & PostgreSQL, RBAC with custom guards, email notifications, cloud storage & image upload, QR Code-based event check-in, AWS EC2 Docker deployment with Nginx & HTTPS, responsive React & Tailwind CSS UI.',
          repositoryUrl: 'https://github.com/pson4282/uth-clubs-events',
          demoUrl: 'https://uth-clubs.edu.vn',
          startedAt: new Date('2025-07-01'),
          endedAt: new Date('2025-12-31'),
        },
      ],
      desiredRoles: ['Backend Developer', 'Fullstack Developer'],
      preferredLocations: ['TP. Hồ Chí Minh'],
      preferredWorkTypes: ['Toàn thời gian (On-site)', 'Hybrid'],
      cvFileName: 'CV_PhamHoangSon_FullStackDeveloper.pdf',
    },
    // 1. Nguyễn Hoàng Long - Đang thực tập tuần 8 tại FPT Software
    {
      email: 'student.interning@student.hcmut.edu.vn',
      studentCode: '2110234',
      fullName: 'Nguyễn Hoàng Long',
      majorCode: 'BK-SE',
      phone: '0903123456',
      gpa: 3.52,
      summary: 'Sinh viên K21 ngành Kỹ thuật Phần mềm, đam mê phát triển hệ thống Backend phân tán, Node.js, NestJS và kiến trúc Microservices. Hiện đang trong tuần 8 của kỳ thực tập tại FPT Software.',
      skills: [
        { name: 'TypeScript', level: SkillLevel.ADVANCED },
        { name: 'NestJS', level: SkillLevel.ADVANCED },
        { name: 'PostgreSQL', level: SkillLevel.ADVANCED },
        { name: 'Docker', level: SkillLevel.INTERMEDIATE },
        { name: 'Git', level: SkillLevel.ADVANCED },
        { name: 'RESTful API', level: SkillLevel.ADVANCED },
      ],
      projects: [
        {
          title: 'Hệ thống Quản lý Bán vé Sự kiện Trực tuyến EventMaster',
          description: 'Xây dựng dịch vụ Backend xử lý đặt vé đồng thời bằng NestJS, Redis Distributed Lock và PostgreSQL. Chịu tải 500 RPS.',
          repositoryUrl: 'https://github.com/hoanglong-bk/event-master-core',
          demoUrl: 'https://eventmaster-demo.dev',
          startedAt: new Date('2025-02-01'),
          endedAt: new Date('2025-05-30'),
        },
      ],
      desiredRoles: ['Backend Developer', 'Fullstack Engineer'],
      preferredLocations: ['TP. Hồ Chí Minh'],
      preferredWorkTypes: ['Toàn thời gian (On-site)', 'Hybrid'],
    },
    // 2. Trần Thị Mai Anh - Đã hoàn thành thực tập kỳ trước tại Bosch (Điểm 9.2)
    {
      email: 'student.completed@student.hcmut.edu.vn',
      studentCode: '2011456',
      fullName: 'Trần Thị Mai Anh',
      majorCode: 'BK-CS',
      phone: '0918765432',
      gpa: 3.78,
      summary: 'Thủ khoa đầu ra K20 ngành Khoa học Máy tính. Đã hoàn thành xuất sắc đợt thực tập 10 tuần tại Bosch GSTV với điểm số 9.2 và được cấp chứng chỉ thực tập loại giỏi.',
      skills: [
        { name: 'Python', level: SkillLevel.ADVANCED },
        { name: 'Machine Learning', level: SkillLevel.ADVANCED },
        { name: 'PyTorch', level: SkillLevel.ADVANCED },
        { name: 'Computer Vision', level: SkillLevel.INTERMEDIATE },
        { name: 'Data Analysis', level: SkillLevel.ADVANCED },
        { name: 'English for Engineering', level: SkillLevel.EXPERT },
      ],
      projects: [
        {
          title: 'Hệ thống Nhận diện Biển báo Giao thông Thời gian thực cho Xe tự hành',
          description: 'Huấn luyện mô hình YOLOv8 trên tập dữ liệu giao thông Việt Nam, tối ưu hóa suy luận chạy trên nền tảng Jetson Nano đạt 35 FPS.',
          repositoryUrl: 'https://github.com/maianh-bk/traffic-sign-detector',
          demoUrl: 'https://ts-vision.ai-bk.vn',
          startedAt: new Date('2025-01-10'),
          endedAt: new Date('2025-04-20'),
        },
      ],
      desiredRoles: ['AI Engineer', 'Computer Vision Specialist'],
      preferredLocations: ['TP. Hồ Chí Minh', 'Đà Nẵng'],
      preferredWorkTypes: ['Hybrid', 'Toàn thời gian (On-site)'],
    },
    // 3. Lê Minh Tuấn - Đã có placement tại Viettel nhưng chưa gán GVHD (Unassigned)
    {
      email: 'student.unassigned@student.hcmut.edu.vn',
      studentCode: '2112567',
      fullName: 'Lê Minh Tuấn',
      majorCode: 'BK-NET',
      phone: '0934567890',
      gpa: 3.35,
      summary: 'Sinh viên K21 ngành Mạng máy tính & An toàn thông tin. Có chứng chỉ CCNA, CEH. Đã trúng tuyển thực tập tại Viettel Solutions và đang chờ nhà trường phân công GVHD.',
      skills: [
        { name: 'Linux/Shell Scripting', level: SkillLevel.ADVANCED },
        { name: 'Python', level: SkillLevel.INTERMEDIATE },
        { name: 'RESTful API', level: SkillLevel.INTERMEDIATE },
        { name: 'Git', level: SkillLevel.INTERMEDIATE },
        { name: 'Teamwork & Communication', level: SkillLevel.ADVANCED },
      ],
      projects: [
        {
          title: 'Hệ thống Giám sát và Phát hiện Tấn công Mạng Nội bộ NetWatch',
          description: 'Thu thập và phân tích lưu lượng gói tin mạng pcap bằng Python Scapy và cảnh báo tấn công Syn Flood qua Telegram Bot.',
          repositoryUrl: 'https://github.com/minhtuan-bk/netwatch-ids',
          startedAt: new Date('2025-09-01'),
          endedAt: new Date('2025-11-15'),
        },
      ],
      desiredRoles: ['Security Analyst', 'Network Engineer'],
      preferredLocations: ['TP. Hồ Chí Minh', 'Hà Nội'],
      preferredWorkTypes: ['Toàn thời gian (On-site)'],
    },
    // 4. Phạm Đức Duy - Đang tìm kiếm việc, hồ sơ hoàn chỉnh, đã nộp đơn
    {
      email: 'student.jobseeking@student.hcmut.edu.vn',
      studentCode: '2210892',
      fullName: 'Phạm Đức Duy',
      majorCode: 'BK-AI',
      phone: '0978123987',
      gpa: 3.65,
      summary: 'Sinh viên K22 ngành Khoa học Dữ liệu & Trí tuệ Nhân tạo. Nền tảng toán giải tích, đại số tuyến tính vững vàng, thành thạo huấn luyện mô hình NLP và LLM finetuning.',
      skills: [
        { name: 'Python', level: SkillLevel.EXPERT },
        { name: 'Natural Language Processing (NLP)', level: SkillLevel.ADVANCED },
        { name: 'PyTorch', level: SkillLevel.ADVANCED },
        { name: 'Machine Learning', level: SkillLevel.ADVANCED },
        { name: 'Pandas', level: SkillLevel.ADVANCED },
        { name: 'Git', level: SkillLevel.ADVANCED },
      ],
      projects: [
        {
          title: 'Trợ lý Trích xuất Thông tin Tài liệu Pháp luật Việt Nam sử dụng RAG',
          description: 'Hệ thống RAG sử dụng LangChain, FAISS Vector DB và mô hình Llama-3-Vietnamese giúp tra cứu văn bản luật nhanh chóng và chính xác.',
          repositoryUrl: 'https://github.com/ducduy-bk/vietnamese-law-rag',
          startedAt: new Date('2026-03-01'),
          endedAt: new Date('2026-07-30'),
        },
      ],
      desiredRoles: ['Data Scientist', 'AI Researcher', 'Machine Learning Engineer'],
      preferredLocations: ['TP. Hồ Chí Minh'],
      preferredWorkTypes: ['Hybrid', 'Từ xa (Remote)'],
    },
    // 5. Vũ Phương Linh - Đã nhận được Offer từ FPT Software
    {
      email: 'student.offered@student.hcmut.edu.vn',
      studentCode: '2213456',
      fullName: 'Vũ Phương Linh',
      majorCode: 'BK-IC',
      phone: '0987654321',
      gpa: 3.71,
      summary: 'Sinh viên nữ K22 ngành Thiết kế Vi mạch bán dẫn. Đã vượt qua vòng phỏng vấn chuyên môn xuất sắc và nhận được thư mời thực tập (Offer) tại FPT Software.',
      skills: [
        { name: 'Digital Circuit Design', level: SkillLevel.ADVANCED },
        { name: 'Verilog/VHDL', level: SkillLevel.ADVANCED },
        { name: 'FPGA Design', level: SkillLevel.INTERMEDIATE },
        { name: 'C/C++ Embedded', level: SkillLevel.INTERMEDIATE },
        { name: 'Altium Designer', level: SkillLevel.INTERMEDIATE },
      ],
      projects: [
        {
          title: 'Thiết kế Bộ Vi xử lý RISC-V 32-bit Đơn kỳ bằng Verilog HDL',
          description: 'Hiện thực tập lệnh RV32I cơ bản, mô phỏng kiểm tra chức năng trên ModelSim và nạp chạy thử nghiệm trên kit FPGA Altera Cyclone IV.',
          repositoryUrl: 'https://github.com/phuonglinh-bk/riscv-single-cycle',
          startedAt: new Date('2026-02-15'),
          endedAt: new Date('2026-06-20'),
        },
      ],
      desiredRoles: ['IC Design Engineer', 'RTL Design Engineer'],
      preferredLocations: ['TP. Hồ Chí Minh', 'Đà Nẵng'],
      preferredWorkTypes: ['Toàn thời gian (On-site)'],
    },
    // 6. Đặng Tuấn Kiệt - Đang có lịch phỏng vấn Online tại Viettel Solutions
    {
      email: 'student.interviewing@student.hcmut.edu.vn',
      studentCode: '2111890',
      fullName: 'Đặng Tuấn Kiệt',
      majorCode: 'BK-MTR',
      phone: '0912987654',
      gpa: 3.44,
      summary: 'Sinh viên K21 ngành Cơ điện tử. Có kinh nghiệm lập trình cánh tay robot, kết nối PLC với hệ thống Scada và lập trình nhúng C/C++.',
      skills: [
        { name: 'Mechatronics System Design', level: SkillLevel.ADVANCED },
        { name: 'C/C++ Embedded', level: SkillLevel.ADVANCED },
        { name: 'ROS (Robot Operating System)', level: SkillLevel.INTERMEDIATE },
        { name: 'PLC Programming (Siemens/Mitsubishi)', level: SkillLevel.INTERMEDIATE },
        { name: 'SolidWorks', level: SkillLevel.ADVANCED },
      ],
      projects: [
        {
          title: 'Cánh tay Robot Phân loại Sản phẩm Công nghiệp 4 Bậc Tự Do',
          description: 'Thiết kế cơ khí SolidWorks, gia công in 3D và điều khiển động cơ servo kết hợp camera AI OpenCV phân loại sản phẩm theo màu sắc.',
          repositoryUrl: 'https://github.com/tuankiet-bk/4dof-sorting-robot',
          startedAt: new Date('2025-10-01'),
          endedAt: new Date('2026-02-28'),
        },
      ],
      desiredRoles: ['Mechatronics Engineer', 'Automation Specialist'],
      preferredLocations: ['TP. Hồ Chí Minh', 'Bình Dương'],
      preferredWorkTypes: ['Toàn thời gian (On-site)'],
    },
    // 7. Bùi Gia Huy - Báo cáo tuần 5 bị GVHD từ chối yêu cầu sửa
    {
      email: 'student.reported@student.hcmut.edu.vn',
      studentCode: '2210567',
      fullName: 'Bùi Gia Huy',
      majorCode: 'BK-AUTO',
      phone: '0945112233',
      gpa: 3.15,
      summary: 'Sinh viên K22 ngành Kỹ thuật Ô tô & Xe điện. Đang thực tập tại VinFast Auto, đang trong quá trình hiệu chỉnh lại báo cáo tuần 5 theo góp ý của giảng viên.',
      skills: [
        { name: 'Electric Vehicle Powertrain', level: SkillLevel.INTERMEDIATE },
        { name: 'CAN Bus Protocol', level: SkillLevel.INTERMEDIATE },
        { name: 'MATLAB/Simulink', level: SkillLevel.INTERMEDIATE },
        { name: 'AutoCAD', level: SkillLevel.ADVANCED },
      ],
      projects: [
        {
          title: 'Mô phỏng Hệ thống Quản lý Nhiệt Khối Pin Xe điện Li-ion trên MATLAB',
          description: 'Xây dựng mô hình tản nhiệt bằng chất lỏng cho cụm pin 48V, đánh giá biến thiên nhiệt độ trong các chu trình lái xe tiêu chuẩn WLTP.',
          repositoryUrl: 'https://github.com/giahuy-bk/ev-bms-thermal-sim',
          startedAt: new Date('2026-01-15'),
          endedAt: new Date('2026-05-15'),
        },
      ],
      desiredRoles: ['Automotive Engineer', 'EV Testing Intern'],
      preferredLocations: ['Hải Phòng', 'Hà Nội', 'TP. Hồ Chí Minh'],
      preferredWorkTypes: ['Toàn thời gian (On-site)'],
    },
    // 8. Võ Thị Bích Ngọc - Đã gửi Support Request đến Quản trị viên
    {
      email: 'student.support@student.hcmut.edu.vn',
      studentCode: '2211234',
      fullName: 'Võ Thị Bích Ngọc',
      majorCode: 'BK-IM',
      phone: '0966445566',
      gpa: 3.62,
      summary: 'Sinh viên K22 ngành Quản lý Công nghiệp. Thành thạo phân tích dữ liệu sản xuất, áp dụng phương pháp Lean/Kaizen tối ưu hóa năng suất nhà máy.',
      skills: [
        { name: 'Lean Manufacturing', level: SkillLevel.ADVANCED },
        { name: 'Six Sigma', level: SkillLevel.INTERMEDIATE },
        { name: 'Kaizen & 5S', level: SkillLevel.ADVANCED },
        { name: 'Data Analysis', level: SkillLevel.ADVANCED },
        { name: 'Power BI', level: SkillLevel.ADVANCED },
      ],
      projects: [
        {
          title: 'Nghiên cứu Cải tiến Quy trình Đóng gói Bằng Phương pháp 5S và Kaizen',
          description: 'Giảm thời gian lãng phí thao tác xuống 18% và nâng cao tỷ lệ an toàn lao động tại xưởng cơ khí thực nghiệm ĐHBK.',
          startedAt: new Date('2026-02-01'),
          endedAt: new Date('2026-05-30'),
        },
      ],
      desiredRoles: ['Industrial Engineer', 'Continuous Improvement Specialist'],
      preferredLocations: ['TP. Hồ Chí Minh', 'Đồng Nai'],
      preferredWorkTypes: ['Toàn thời gian (On-site)'],
    },
    // 9. Hoàng Nhật Minh - Sinh viên mới, chưa nộp đơn
    {
      email: 'student.newbie@student.hcmut.edu.vn',
      studentCode: '2214567',
      fullName: 'Hoàng Nhật Minh',
      majorCode: 'BK-FOOD',
      phone: '0908889991',
      gpa: 3.28,
      summary: 'Sinh viên K22 ngành Công nghệ Thực phẩm. Đang chuẩn bị hoàn thiện hồ sơ năng lực để ứng tuyển vào các tập đoàn FMCG trong đợt tuyển dụng tiếp theo.',
      skills: [
        { name: 'Food Processing Technology', level: SkillLevel.INTERMEDIATE },
        { name: 'Quality Assurance/Quality Control (QA/QC)', level: SkillLevel.INTERMEDIATE },
        { name: 'GMP Standards', level: SkillLevel.INTERMEDIATE },
        { name: 'Good Laboratory Practice (GLP)', level: SkillLevel.ADVANCED },
      ],
      projects: [],
      desiredRoles: ['QA/QC Specialist', 'R&D Food Technologist'],
      preferredLocations: ['TP. Hồ Chí Minh', 'Bình Dương'],
      preferredWorkTypes: ['Toàn thời gian (On-site)'],
    },
    // 10. Đỗ Thùy Dương - Đã hoàn thành thực tập tại Tân Cảng Sài Gòn
    {
      email: 'student.sim@student.hcmut.edu.vn',
      studentCode: '2115678',
      fullName: 'Đỗ Thùy Dương',
      majorCode: 'BK-LOG',
      phone: '0938556677',
      gpa: 3.75,
      summary: 'Sinh viên K21 ngành Logistics & Quản lý Chuỗi cung ứng. Đã hoàn thành đợt thực tập tại Tổng Công ty Tân Cảng Sài Gòn với đánh giá xuất sắc từ công ty và giảng viên.',
      skills: [
        { name: 'Supply Chain Management', level: SkillLevel.EXPERT },
        { name: 'Warehouse Management System (WMS)', level: SkillLevel.ADVANCED },
        { name: 'Inventory Optimization', level: SkillLevel.ADVANCED },
        { name: 'Data Analysis', level: SkillLevel.ADVANCED },
        { name: 'English for Engineering', level: SkillLevel.ADVANCED },
      ],
      projects: [
        {
          title: 'Tối ưu hóa Lịch trình Xếp dỡ Container tại Bãi Cảng Cát Lái',
          description: 'Ứng dụng thuật toán tối ưu hóa tuyến đường di chuyển xe đầu kéo kéo giảm thời gian chờ trung bình 12 phút/chuyến.',
          startedAt: new Date('2025-09-01'),
          endedAt: new Date('2025-12-15'),
        },
      ],
      desiredRoles: ['Logistics Coordinator', 'Supply Chain Analyst'],
      preferredLocations: ['TP. Hồ Chí Minh'],
      preferredWorkTypes: ['Toàn thời gian (On-site)'],
    },
    // 11. Ngô Quốc Bảo - Kỹ thuật Điều khiển & Tự động hóa
    {
      email: 'student.feee@student.hcmut.edu.vn',
      studentCode: '2113890',
      fullName: 'Ngô Quốc Bảo',
      majorCode: 'BK-CA',
      phone: '0977223344',
      gpa: 3.55,
      summary: 'Sinh viên K21 ngành Kỹ thuật Điều khiển & Tự động hóa. Thành thạo lập trình PLC S7-1200/1500, thiết kế giao diện WinCC SCADA và biến tần công nghiệp.',
      skills: [
        { name: 'PLC Programming (Siemens/Mitsubishi)', level: SkillLevel.ADVANCED },
        { name: 'SCADA System', level: SkillLevel.ADVANCED },
        { name: 'Industrial Robotics', level: SkillLevel.INTERMEDIATE },
        { name: 'Electrical Engineering', level: SkillLevel.ADVANCED },
      ],
      projects: [
        {
          title: 'Dây chuyền Đóng chai Tự động Điều khiển bằng PLC Siemens S7-1200',
          description: 'Lập trình logic điều khiển cảm biến tiệm cận, động cơ bước chiết rót và đóng nắp chai chính xác, hiển thị trạng thái trên màn hình HMI KTP700.',
          startedAt: new Date('2025-10-10'),
          endedAt: new Date('2026-03-20'),
        },
      ],
      desiredRoles: ['Automation Engineer', 'Control Systems Specialist'],
      preferredLocations: ['TP. Hồ Chí Minh', 'Đồng Nai', 'Bình Dương'],
      preferredWorkTypes: ['Toàn thời gian (On-site)'],
    },
    // 12. Lý Hoàng Nam - Sinh viên đã từng rút đơn (WITHDRAWN)
    {
      email: 'student.withdrawn@student.hcmut.edu.vn',
      studentCode: '2212345',
      fullName: 'Lý Hoàng Nam',
      majorCode: 'BK-CE',
      phone: '0981335577',
      gpa: 3.22,
      summary: 'Sinh viên K22 ngành Kỹ thuật Xây dựng. Thành thạo mô hình hóa BIM Revit và tính toán kết cấu bằng phần mềm Etabs.',
      skills: [
        { name: 'BIM (Revit)', level: SkillLevel.ADVANCED },
        { name: 'Civil Engineering Design', level: SkillLevel.INTERMEDIATE },
        { name: 'AutoCAD', level: SkillLevel.ADVANCED },
      ],
      projects: [],
      desiredRoles: ['BIM Modeler', 'Site Civil Engineer'],
      preferredLocations: ['TP. Hồ Chí Minh'],
      preferredWorkTypes: ['Toàn thời gian (On-site)'],
    },
  ];

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
    availablePdfs = fs.readdirSync(cvDir)
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

    const preferredCvName = (s as { cvFileName?: string }).cvFileName;
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
      console.log(`📄 Đã gán CV "${originalCvName}" cho sinh viên ${s.fullName} (${s.studentCode})`);
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
          repositoryUrl: (p as { repositoryUrl?: string }).repositoryUrl ?? null,
          demoUrl: (p as { demoUrl?: string }).demoUrl ?? null,
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
  // 8. TÀI KHOẢN TRẠNG THÁI ĐẶC BIỆT (USER STATUSES)
  // =========================================================================
  console.log('🔒 [8/12] Khởi tạo tài khoản kiểm thử các trạng thái UserStatus...');

  // User chưa xác minh email (PENDING_VERIFICATION)
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

  // User bị khóa tài khoản (BANNED)
  await upsertUser('user.banned@careerbridge.edu.vn', Role.STUDENT, UserStatus.BANNED);

  // User ngưng hoạt động (INACTIVE)
  await upsertUser('user.inactive@careerbridge.edu.vn', Role.STUDENT, UserStatus.INACTIVE);

  // =========================================================================
  // 9. MẪU TIN TUYỂN DỤNG (INTERNSHIP TEMPLATES)
  // =========================================================================
  console.log('📋 [9/12] Khởi tạo Internship Templates cho Doanh nghiệp...');

  const fptTemplate = await prisma.internshipTemplate.upsert({
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

  const boschTemplate = await prisma.internshipTemplate.upsert({
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
  // 10. TIN TUYỂN DỤNG THỰC TẾ THEO CÁC HỌC KỲ (INTERNSHIPS)
  // =========================================================================
  console.log('📢 [10/12] Khởi tạo tin tuyển dụng thực tế (Quá khứ, Hiện tại, Tương lai)...');

  // Danh sách tin tuyển dụng đa dạng
  const internshipsData = [
    // ----------------- HỌC KỲ QUÁ KHỨ -----------------
    // 1. FPT Software - Kỳ Thu 2025 (CLOSED)
    {
      id: 'seed-internship-past-fpt-2025',
      companyId: fptComp.id,
      semesterId: semPastFall,
      title: 'Thực tập sinh Phát triển Phần mềm Backend Java/Spring Boot (Kỳ Thu 2025)',
      department: 'Global Delivery Unit',
      location: 'F-Town 3, TP. Thủ Đức, TP. Hồ Chí Minh',
      workType: 'Toàn thời gian (On-site)',
      stipend: '5,500,000 VNĐ/tháng',
      description: 'Tham gia xây dựng các dịch vụ microservices bằng Spring Boot và MySQL phục vụ dự án thanh toán điện tử.',
      requirements: 'Nắm vững Java Core, OOP, SQL, Git cơ bản. Đang theo học chuyên ngành CNTT/KTPM.',
      slots: 4,
      filledSlots: 4,
      deadline: new Date('2025-08-25T23:59:59Z'),
      startDate: new Date('2025-09-15T00:00:00Z'),
      endDate: new Date('2025-11-24T23:59:59Z'),
      status: InternshipStatus.CLOSED,
      skills: ['Java', 'Spring Boot', 'MySQL', 'Git'],
      majors: ['BK-SE', 'BK-CS', 'BK-IS'],
    },
    // 2. Bosch - Kỳ Xuân 2026 (CLOSED) - Đợt Mai Anh đã hoàn thành xuất sắc
    {
      id: 'seed-internship-past-bosch-2026',
      companyId: boschComp.id,
      semesterId: semPastSpring,
      title: 'Thực tập sinh Nghiên cứu Thị giác Máy tính & AI Ô tô (Kỳ Xuân 2026)',
      department: 'Automotive AI Research',
      location: 'E-Town Central, Quận 4, TP. Hồ Chí Minh',
      workType: 'Toàn thời gian (On-site)',
      stipend: '8,000,000 VNĐ/tháng',
      description: 'Nghiên cứu và thử nghiệm các mô hình học sâu (Deep Learning) nhận diện làn đường, biển báo giao thông phục vụ xe tự hành.',
      requirements: 'Thành thạo Python, PyTorch/TensorFlow, OpenCV. Tiếng Anh giao tiếp tốt (IELTS >= 6.5 hoặc tương đương).',
      slots: 2,
      filledSlots: 2,
      deadline: new Date('2025-12-25T23:59:59Z'),
      startDate: new Date('2026-01-15T00:00:00Z'),
      endDate: new Date('2026-03-26T23:59:59Z'),
      status: InternshipStatus.CLOSED,
      skills: ['Python', 'Machine Learning', 'Computer Vision', 'PyTorch', 'English for Engineering'],
      majors: ['BK-CS', 'BK-AI'],
    },
    // 3. Tân Cảng Sài Gòn - Kỳ Thu 2025 (CLOSED) - Đợt Thùy Dương hoàn thành
    {
      id: 'seed-internship-past-newport-2025',
      companyId: newportComp.id,
      semesterId: semPastFall,
      title: 'Thực tập sinh Quản lý Khai thác Bãi Cảng & Logistics (Kỳ Thu 2025)',
      department: 'Phòng Điều hành Khai thác Cảng Cát Lái',
      location: 'Cảng Cát Lái, TP. Thủ Đức, TP. Hồ Chí Minh',
      workType: 'Toàn thời gian (On-site)',
      stipend: '5,000,000 VNĐ/tháng',
      description: 'Hỗ trợ theo dõi luồng container xuất nhập khẩu, phân tích hiệu suất cầu cảng và tối ưu hóa vận tải đường bộ kết nối bãi.',
      requirements: 'Sinh viên ngành Logistics, Quản lý Công nghiệp. Chăm chỉ, tư duy logic, kỹ năng Excel và phân tích dữ liệu tốt.',
      slots: 3,
      filledSlots: 3,
      deadline: new Date('2025-08-20T23:59:59Z'),
      startDate: new Date('2025-09-15T00:00:00Z'),
      endDate: new Date('2025-11-24T23:59:59Z'),
      status: InternshipStatus.CLOSED,
      skills: ['Supply Chain Management', 'Warehouse Management System (WMS)', 'Data Analysis'],
      majors: ['BK-LOG', 'BK-IM'],
    },

    // ----------------- HỌC KỲ HIỆN TẠI (KỲ THU 2026 - MONITORING) -----------------
    // 4. FPT Software - Kỳ Thu 2026 (CLOSED hạn tuyển, SV đang thực tập tuần 8)
    {
      id: 'seed-internship-current-fpt-backend',
      companyId: fptComp.id,
      semesterId: semCurrentActive,
      title: 'Kỹ sư Thực tập Backend Node.js/NestJS (10 Tuần)',
      department: 'Global Delivery Unit 1 (GDU1)',
      location: 'F-Town 3, Khu Công nghệ cao TP. Thủ Đức, TP. Hồ Chí Minh',
      workType: 'Toàn thời gian (On-site)',
      stipend: '7,000,000 VNĐ/tháng',
      description: 'Tham gia xây dựng các dịch vụ Backend phục vụ chuyển đổi số cho tập đoàn tài chính Nhật Bản. Được đào tạo chuyên sâu về TypeScript, NestJS, Docker và kiểm thử tự động.',
      requirements: 'Sinh viên K21 chuyên ngành Kỹ thuật Phần mềm, Khoa học Máy tính. Nắm chắc cấu trúc dữ liệu, RESTful API và cơ sở dữ liệu PostgreSQL.',
      slots: 5,
      filledSlots: 3,
      deadline: new Date('2026-08-25T23:59:59Z'),
      startDate: new Date('2026-09-15T00:00:00Z'),
      endDate: new Date('2026-11-24T23:59:59Z'),
      status: InternshipStatus.CLOSED,
      skills: ['TypeScript', 'NestJS', 'PostgreSQL', 'Docker', 'Git', 'RESTful API'],
      majors: ['BK-SE', 'BK-CS'],
    },
    // 5. VinFast Auto - Kỳ Thu 2026 (CLOSED hạn tuyển, Bùi Gia Huy đang thực tập)
    {
      id: 'seed-internship-current-vinfast-ev',
      companyId: vinfastComp.id,
      semesterId: semCurrentActive,
      title: 'Thực tập sinh Thử nghiệm & Đánh giá Hệ thống Pin Xe điện (BMS)',
      department: 'Khối Nghiên cứu & Phát triển Ô tô (R&D)',
      location: 'Khu công nghiệp VinFast Cát Hải & VP TP.HCM',
      workType: 'Toàn thời gian (On-site)',
      stipend: '8,000,000 VNĐ/tháng',
      description: 'Hỗ trợ các kỹ sư cao cấp chạy mô phỏng chu trình nạp xả pin Li-ion, đo kiểm nhiệt độ và lập trình phân tích dữ liệu xe điện qua mạng CAN Bus.',
      requirements: 'Sinh viên ngành Kỹ thuật Ô tô, Cơ điện tử, Kỹ thuật Điện. Có hiểu biết về giao thức CAN Bus và phần mềm MATLAB/Simulink.',
      slots: 3,
      filledSlots: 2,
      deadline: new Date('2026-08-20T23:59:59Z'),
      startDate: new Date('2026-09-15T00:00:00Z'),
      endDate: new Date('2026-11-24T23:59:59Z'),
      status: InternshipStatus.CLOSED,
      skills: ['Electric Vehicle Powertrain', 'CAN Bus Protocol', 'MATLAB/Simulink', 'AutoCAD'],
      majors: ['BK-AUTO', 'BK-MTR', 'BK-EE'],
    },

    // ----------------- HỌC KỲ TUYỂN DỤNG (KỲ XUÂN 2027 - RECRUITING) -----------------
    // 6. FPT Software - OPEN (Tin mở tuyển dụng hấp dẫn cho sinh viên nộp đơn)
    {
      id: 'seed-internship-recruiting-fpt-fullstack',
      companyId: fptComp.id,
      semesterId: semRecruiting,
      title: 'Thực tập sinh Fullstack Developer (React/NestJS/Cloud)',
      department: 'FPT Software Smart Solutions',
      location: 'F-Town 3, Khu Công nghệ cao TP. Thủ Đức, TP. Hồ Chí Minh',
      workType: 'Toàn thời gian (On-site)',
      stipend: '7,500,000 - 9,000,000 VNĐ/tháng',
      description: 'Cơ hội tuyệt vời dành cho các bạn sinh viên ĐHBK tham gia vào dự án nền tảng SaaS quy mô lớn. Bạn sẽ được làm việc trực tiếp với các chuyên gia giải pháp phần mềm, thực hành CI/CD và kiến trúc Microservices.',
      requirements: 'Thành thạo JavaScript/TypeScript, React hoặc Vue.js phía Frontend; NestJS hoặc Express phía Backend; hiểu biết về Docker, Git và giao tiếp Tiếng Anh tốt.',
      slots: 6,
      filledSlots: 1,
      deadline: new Date('2026-11-25T23:59:59Z'),
      startDate: new Date('2026-12-15T00:00:00Z'),
      endDate: new Date('2027-02-23T23:59:59Z'),
      status: InternshipStatus.OPEN,
      skills: ['TypeScript', 'React', 'NestJS', 'PostgreSQL', 'Docker', 'Git'],
      majors: ['BK-SE', 'BK-CS', 'BK-IS'],
    },
    // 7. Bosch - OPEN (Tin tuyển dụng nhúng ô tô)
    {
      id: 'seed-internship-recruiting-bosch-embedded',
      companyId: boschComp.id,
      semesterId: semRecruiting,
      title: 'Kỹ sư Thực tập Phần mềm Nhúng Ô tô (Automotive Embedded C++)',
      department: 'Automotive Steering & Chassis Systems',
      location: 'E-Town Central, 11 Đoàn Văn Bơ, Quận 4, TP. Hồ Chí Minh',
      workType: 'Toàn thời gian (On-site)',
      stipend: '8,500,000 - 10,000,000 VNĐ/tháng',
      description: 'Phát triển phần mềm điều khiển hệ thống trợ lực lái thông minh EPS cho các hãng xe hàng đầu thế giới. Thực hiện kiểm thử Unit Test, tích hợp hệ thống phần mềm nhúng theo tiêu chuẩn MISRA C và AUTOSAR.',
      requirements: 'Sinh viên năm cuối ngành Điện tử - Viễn thông, Kỹ thuật Máy tính, Cơ điện tử. Nắm chắc ngôn ngữ C/C++ cho vi điều khiển, kiến trúc vi xử lý và hệ thống thời gian thực RTOS.',
      slots: 4,
      filledSlots: 0,
      deadline: new Date('2026-11-28T23:59:59Z'),
      startDate: new Date('2026-12-15T00:00:00Z'),
      endDate: new Date('2027-02-23T23:59:59Z'),
      status: InternshipStatus.OPEN,
      skills: ['C/C++ Embedded', 'RTOS (FreeRTOS)', 'ARM Cortex-M', 'STM32', 'CAN Bus Protocol', 'English for Engineering'],
      majors: ['BK-ECE', 'BK-CA', 'BK-MTR', 'BK-CS'],
    },
    // 8. Viettel Solutions - OPEN (Tin tuyển dụng An toàn thông tin mạng)
    {
      id: 'seed-internship-recruiting-viettel-sec',
      companyId: viettelComp.id,
      semesterId: semRecruiting,
      title: 'Thực tập sinh An toàn Thông tin & Giám sát An ninh Mạng (SOC Analyst)',
      department: 'Trung tâm Giám sát và Điều hành An toàn thông tin (Cyber SOC)',
      location: 'Tòa nhà Viettel Complex, 285 Cách Mạng Tháng 8, Quận 10, TP. Hồ Chí Minh',
      workType: 'Toàn thời gian (On-site)',
      stipend: '7,000,000 - 8,500,000 VNĐ/tháng',
      description: 'Tham gia trực ca vận hành SOC, phân tích sự cố an ninh mạng SIEM, điều tra mã độc cơ bản và đề xuất phương án khắc phục điểm yếu bảo mật cho hệ thống mạng quốc gia.',
      requirements: 'Đam mê lĩnh vực An toàn thông tin, hiểu rõ các giao thức mạng TCP/IP, hệ điều hành Linux và có kỹ năng lập trình Python phân tích log.',
      slots: 3,
      filledSlots: 0,
      deadline: new Date('2026-11-26T23:59:59Z'),
      startDate: new Date('2026-12-15T00:00:00Z'),
      endDate: new Date('2027-02-23T23:59:59Z'),
      status: InternshipStatus.OPEN,
      skills: ['Linux/Shell Scripting', 'Python', 'RESTful API', 'Git'],
      majors: ['BK-NET', 'BK-CS'],
    },
    // 9. VinFast Auto - OPEN (Tin tuyển Cơ điện tử & Tự động hóa)
    {
      id: 'seed-internship-recruiting-vinfast-auto',
      companyId: vinfastComp.id,
      semesterId: semRecruiting,
      title: 'Thực tập sinh Kỹ thuật Robot & Tự động hóa Dây chuyền Lắp ráp',
      department: 'Xưởng Hàn & Lắp ráp Thân vỏ Ô tô Thông minh',
      location: 'Tổ hợp công nghiệp VinFast Cát Hải & Nhà máy liên kết',
      workType: 'Toàn thời gian (On-site)',
      stipend: '8,000,000 VNĐ/tháng',
      description: 'Làm việc cùng các robot công nghiệp ABB, Kuka trong xưởng thân vỏ ô tô tự động hóa 98%. Tham gia bảo trì, tối ưu đường đi của cánh tay robot và hiệu chỉnh PLC.',
      requirements: 'Sinh viên ngành Cơ điện tử, Tự động hóa, Chế tạo máy. Đọc hiểu bản vẽ cơ khí, nắm vững an toàn lao động công nghiệp và lập trình PLC/Robot.',
      slots: 4,
      filledSlots: 0,
      deadline: new Date('2026-11-27T23:59:59Z'),
      startDate: new Date('2026-12-15T00:00:00Z'),
      endDate: new Date('2027-02-23T23:59:59Z'),
      status: InternshipStatus.OPEN,
      skills: ['PLC Programming (Siemens/Mitsubishi)', 'Industrial Robotics', 'Mechatronics System Design', 'SolidWorks'],
      majors: ['BK-MTR', 'BK-CA', 'BK-ROB'],
    },
    // 10. Tân Cảng Sài Gòn - OPEN (Tin tuyển Chuỗi cung ứng & Cảng biển)
    {
      id: 'seed-internship-recruiting-newport-scm',
      companyId: newportComp.id,
      semesterId: semRecruiting,
      title: 'Thực tập sinh Quản lý Chuỗi cung ứng & Dịch vụ Khách hàng Logistics',
      department: 'Phòng Kế hoạch & Dịch vụ Logistics Toàn quốc',
      location: 'Cảng Cát Lái, Đường Nguyễn Thị Định, TP. Thủ Đức, TP. Hồ Chí Minh',
      workType: 'Toàn thời gian (On-site)',
      stipend: '6,000,000 VNĐ/tháng',
      description: 'Tham gia điều phối vận đơn, quản trị kho hàng trung chuyển ICD, lập báo cáo phân tích thời gian quay vòng container và ứng dụng công nghệ cảng biển số e-Port.',
      requirements: 'Sinh viên ngành Logistics & Quản lý Chuỗi cung ứng, Quản lý Công nghiệp. Tiếng Anh thương mại tốt, khả năng chịu áp lực cao và giao tiếp tự tin.',
      slots: 5,
      filledSlots: 0,
      deadline: new Date('2026-11-25T23:59:59Z'),
      startDate: new Date('2026-12-15T00:00:00Z'),
      endDate: new Date('2027-02-23T23:59:59Z'),
      status: InternshipStatus.OPEN,
      skills: ['Supply Chain Management', 'Warehouse Management System (WMS)', 'Inventory Optimization', 'English for Engineering'],
      majors: ['BK-LOG', 'BK-IM'],
    },

    // ----------------- CÁC TRẠNG THÁI ĐẶC BIỆT -----------------
    // 11. Tin DRAFT (Bản nháp)
    {
      id: 'seed-internship-draft-fpt-ai',
      companyId: fptComp.id,
      semesterId: semFuture,
      title: 'Kỹ sư Thực tập Trí tuệ Nhân tạo & Xử lý Ngôn ngữ Tự nhiên (Kỳ Hè 2027)',
      department: 'FPT AI Center',
      location: 'F-Town 3, TP. Thủ Đức, TP. Hồ Chí Minh',
      workType: 'Hybrid',
      stipend: '9,000,000 VNĐ/tháng',
      description: 'Bản thảo tin tuyển dụng nghiên cứu mô hình ngôn ngữ lớn LLMs phục vụ trợ lý ảo tiếng Việt.',
      requirements: 'Thành thạo PyTorch, Transformers, HuggingFace.',
      slots: 3,
      filledSlots: 0,
      status: InternshipStatus.DRAFT,
      skills: ['Python', 'Natural Language Processing (NLP)', 'Deep Learning', 'PyTorch'],
      majors: ['BK-AI', 'BK-CS'],
    },
    // 12. Tin REJECTED (Bị Ban Quản trị từ chối/gỡ bỏ do vi phạm quy định thu phí)
    {
      id: 'seed-internship-rejected-scam',
      companyId: fptComp.id,
      semesterId: semRecruiting,
      title: 'Tuyển CTV Nhập liệu Phần mềm Lương cao Không yêu cầu Kinh nghiệm',
      department: 'Phòng Nhân sự Vệ tinh',
      location: 'Làm việc từ xa (Remote)',
      workType: 'Từ xa (Remote)',
      stipend: '15,000,000 VNĐ/tháng',
      description: 'Công việc nhập mã captcha và tài liệu dự án đơn giản, yêu cầu đóng phí đặt cọc tài liệu 500,000 VNĐ.',
      requirements: 'Có máy tính kết nối Internet.',
      slots: 20,
      filledSlots: 0,
      status: InternshipStatus.REJECTED,
      moderationReasonCode: InternshipModerationReasonCode.UNAUTHORIZED_FEE,
      moderationReason: 'Nội dung tin tuyển dụng có dấu hiệu thu phí đặt cọc tài liệu trái quy định của nhà trường và vi phạm nghiêm trọng chính sách bảo vệ quyền lợi sinh viên.',
      moderatedById: adminUser.id,
      moderatedAt: new Date('2026-11-03T11:00:00Z'),
      skills: ['Data Analysis'],
      majors: [],
    },
    // 13. Tin CANCELLED (Doanh nghiệp tự hủy tin do thay đổi kế hoạch dự án)
    {
      id: 'seed-internship-cancelled-bosch',
      companyId: boschComp.id,
      semesterId: semRecruiting,
      title: 'Thực tập sinh Thiết kế Mạch Tương tự Analog IC (Đã hủy)',
      department: 'Hardware Engineering',
      location: 'E-Town Central, Quận 4, TP. Hồ Chí Minh',
      workType: 'Toàn thời gian (On-site)',
      stipend: '8,000,000 VNĐ/tháng',
      description: 'Dự án tạm ngưng theo điều chỉnh ngân sách của tập đoàn.',
      requirements: 'Sinh viên ngành Thiết kế Vi mạch.',
      slots: 2,
      filledSlots: 0,
      status: InternshipStatus.CANCELLED,
      skills: ['Digital Circuit Design', 'Altium Designer'],
      majors: ['BK-IC'],
    },
  ];

  const internshipMap = new Map<string, string>();

  for (const it of internshipsData) {
    const record = await prisma.internship.upsert({
      where: { id: it.id },
      update: {
        companyId: it.companyId,
        semesterId: it.semesterId,
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
        moderatedById: it.moderatedById,
        moderatedAt: it.moderatedAt,
      },
      create: {
        id: it.id,
        companyId: it.companyId,
        semesterId: it.semesterId,
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
        moderatedById: it.moderatedById,
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
  // 11. ĐƠN ỨNG TUYỂN (APPLICATIONS) VÀ BAO PHỦ TOÀN BỘ 9 TRẠNG THÁI
  // =========================================================================
  console.log('📝 [11/12] Khởi tạo Đơn ứng tuyển bao phủ 9 trạng thái nghiệp vụ & AI Scan...');

  const stSon = studentProfileMap.get('pson4282@gmail.com')!;
  const stLong = studentProfileMap.get('student.interning@student.hcmut.edu.vn')!;
  const stMaiAnh = studentProfileMap.get('student.completed@student.hcmut.edu.vn')!;
  const stTuan = studentProfileMap.get('student.unassigned@student.hcmut.edu.vn')!;
  const stDuy = studentProfileMap.get('student.jobseeking@student.hcmut.edu.vn')!;
  const stLinh = studentProfileMap.get('student.offered@student.hcmut.edu.vn')!;
  const stKiet = studentProfileMap.get('student.interviewing@student.hcmut.edu.vn')!;
  const stHuy = studentProfileMap.get('student.reported@student.hcmut.edu.vn')!;
  const stDuong = studentProfileMap.get('student.sim@student.hcmut.edu.vn')!;
  const stNam = studentProfileMap.get('student.withdrawn@student.hcmut.edu.vn')!;

  const appsData = [
    // 0. Phạm Hoàng Sơn - REVIEWING (Tại FPT Software Fullstack)
    {
      id: 'seed-app-son-fpt-fullstack-reviewing',
      studentId: stSon.id,
      internshipId: 'seed-internship-recruiting-fpt-fullstack',
      coverLetter:
        'Kính gửi Bộ phận Tuyển dụng FPT Software, em là Phạm Hoàng Sơn, sinh viên chuyên ngành Kỹ thuật Phần mềm. Em có kinh nghiệm thực chiến phát triển ứng dụng Backend & Fullstack với NestJS, TypeScript, PostgreSQL, Prisma ORM, Redis và Docker. Em rất mong muốn được gia nhập và cống hiến cho các dự án tại FPT Software.',
      status: ApplicationStatus.REVIEWING,
      matchScore: 95.0,
      aiScore: 94.0,
      companyFeedback:
        'Hồ sơ năng lực xuất sắc, các dự án thực tế rất ấn tượng (đã deploy production trên AWS, dùng thuần thục NestJS, Prisma và Redis).',
      appliedAt: new Date('2026-11-06T08:30:00Z'),
    },
    // 0.1 Phạm Hoàng Sơn - OFFERED (Tại FPT Software Backend)
    {
      id: 'seed-app-son-fpt-backend-offered',
      studentId: stSon.id,
      internshipId: 'seed-internship-current-fpt-backend',
      coverLetter:
        'Em là Phạm Hoàng Sơn, sinh viên năm 4 đam mê kiến trúc Backend và hệ thống phân tán cao tải.',
      status: ApplicationStatus.OFFERED,
      matchScore: 96.0,
      aiScore: 95.0,
      companyFeedback:
        'Ứng viên làm bài kiểm tra kỹ thuật Backend đạt điểm tối đa, hiểu sâu về tối ưu hóa cơ sở dữ liệu và bảo mật JWT / RBAC.',
      appliedAt: new Date('2026-10-18T09:00:00Z'),
      offeredAt: new Date('2026-10-28T14:00:00Z'),
      offerExpiresAt: new Date('2026-11-20T23:59:59Z'),
      offerMessage:
        'FPT Software trân trọng gửi thư mời thực tập vị trí Backend Developer đến bạn Phạm Hoàng Sơn. Mức phụ cấp thực tập: 8,500,000 VNĐ/tháng.',
    },
    // 1. Nguyễn Hoàng Long - ACCEPTED (Tại FPT Software Backend - Kỳ Thu 2026 hiện tại) -> Có Placement
    {
      id: 'seed-app-long-fpt-accepted',
      studentId: stLong.id,
      internshipId: 'seed-internship-current-fpt-backend',
      coverLetter: 'Kính gửi Bộ phận Tuyển dụng FPT Software, em là Nguyễn Hoàng Long, sinh viên K21 ngành Kỹ thuật Phần mềm ĐHBK. Em có niềm đam mê lớn với kiến trúc hệ thống phân tán và mong muốn được cống hiến cho các dự án của FPT.',
      status: ApplicationStatus.ACCEPTED,
      matchScore: 92.5,
      aiScore: 90.0,
      companyFeedback: 'Ứng viên có kiến thức nền tảng Backend vững chắc, tư duy thuật toán tốt và thái độ cầu tiến.',
      appliedAt: new Date('2026-08-10T14:00:00Z'),
      acceptedAt: new Date('2026-08-25T16:00:00Z'),
      offeredAt: new Date('2026-08-20T10:00:00Z'),
      respondedAt: new Date('2026-08-22T09:00:00Z'),
      offerMessage: 'FPT Software trân trọng gửi thư mời thực tập vị trí Backend Developer Intern đến bạn. Mức hỗ trợ: 7,000,000 VNĐ/tháng.',
    },
    // 2. Trần Thị Mai Anh - ACCEPTED (Tại Bosch - Kỳ Xuân 2026 quá khứ) -> Placement đã COMPLETED
    {
      id: 'seed-app-maianh-bosch-accepted',
      studentId: stMaiAnh.id,
      internshipId: 'seed-internship-past-bosch-2026',
      coverLetter: 'Em là Mai Anh, sinh viên Khoa học Máy tính ĐHBK. Em có định hướng nghiên cứu chuyên sâu về Computer Vision trong lĩnh vực xe tự hành của Bosch.',
      status: ApplicationStatus.ACCEPTED,
      matchScore: 96.0,
      aiScore: 95.0,
      companyFeedback: 'Hồ sơ học thuật xuất sắc, tiếng Anh lưu loát, hoàn thành bài test thuật toán đạt điểm tuyệt đối.',
      appliedAt: new Date('2025-12-05T08:30:00Z'),
      acceptedAt: new Date('2025-12-20T15:00:00Z'),
      offeredAt: new Date('2025-12-18T10:00:00Z'),
      respondedAt: new Date('2025-12-19T14:00:00Z'),
    },
    // 3. Đỗ Thùy Dương - ACCEPTED (Tại Tân Cảng - Kỳ Thu 2025 quá khứ) -> Placement đã COMPLETED
    {
      id: 'seed-app-duong-newport-accepted',
      studentId: stDuong.id,
      internshipId: 'seed-internship-past-newport-2025',
      coverLetter: 'Em là Đỗ Thùy Dương, sinh viên Logistics ĐHBK, mong muốn được thực tập và học hỏi nghiệp vụ khai thác cảng tại Cát Lái.',
      status: ApplicationStatus.ACCEPTED,
      matchScore: 90.0,
      aiScore: 88.0,
      appliedAt: new Date('2025-08-05T10:00:00Z'),
      acceptedAt: new Date('2025-08-18T16:00:00Z'),
      offeredAt: new Date('2025-08-15T11:00:00Z'),
    },
    // 4. Bùi Gia Huy - ACCEPTED (Tại VinFast - Kỳ Thu 2026 hiện tại) -> Có Placement
    {
      id: 'seed-app-huy-vinfast-accepted',
      studentId: stHuy.id,
      internshipId: 'seed-internship-current-vinfast-ev',
      coverLetter: 'Em yêu thích công nghệ ô tô điện và rất mong muốn được trải nghiệm môi trường kỹ thuật hiện đại tại VinFast.',
      status: ApplicationStatus.ACCEPTED,
      matchScore: 85.0,
      aiScore: 82.0,
      appliedAt: new Date('2026-08-08T09:00:00Z'),
      acceptedAt: new Date('2026-08-22T14:00:00Z'),
      offeredAt: new Date('2026-08-19T16:00:00Z'),
    },
    // 5. Lê Minh Tuấn - ACCEPTED (Tại Viettel - Kỳ Thu 2026 hiện tại) -> Có Placement nhưng CHƯA GÁN GVHD
    {
      id: 'seed-app-tuan-viettel-accepted',
      studentId: stTuan.id,
      internshipId: 'seed-internship-recruiting-viettel-sec',
      coverLetter: 'Em có chứng chỉ CCNA và đam mê phòng thủ an ninh mạng, mong muốn được thực tập tại Trung tâm Giám sát SOC của Viettel.',
      status: ApplicationStatus.ACCEPTED,
      matchScore: 88.0,
      aiScore: 86.0,
      appliedAt: new Date('2026-11-02T10:00:00Z'),
      acceptedAt: new Date('2026-11-05T15:00:00Z'),
      offeredAt: new Date('2026-11-04T09:00:00Z'),
      respondedAt: new Date('2026-11-05T11:00:00Z'),
    },
    // 6. Vũ Phương Linh - OFFERED (Tại FPT Software - Đang chờ Linh phản hồi chấp nhận hoặc từ chối)
    {
      id: 'seed-app-linh-fpt-offered',
      studentId: stLinh.id,
      internshipId: 'seed-internship-recruiting-fpt-fullstack',
      coverLetter: 'Em là Vũ Phương Linh, có nền tảng vi mạch và lập trình phần mềm, ứng tuyển vị trí thực tập tại FPT Software.',
      status: ApplicationStatus.OFFERED,
      matchScore: 89.0,
      aiScore: 87.5,
      appliedAt: new Date('2026-11-02T14:00:00Z'),
      offeredAt: new Date('2026-11-06T10:00:00Z'),
      offerExpiresAt: new Date('2026-11-13T23:59:59Z'),
      offerMessage: 'FPT Software chúc mừng bạn đã vượt qua các vòng phỏng vấn. Chúng tôi vui mừng gửi đến bạn lời mời thực tập với mức trợ cấp 8,000,000 VNĐ/tháng. Vui lòng phản hồi trước ngày 13/11/2026.',
    },
    // 7. Đặng Tuấn Kiệt - INTERVIEWING (Đang có lịch phỏng vấn Online tại Viettel Solutions)
    {
      id: 'seed-app-kiet-viettel-interviewing',
      studentId: stKiet.id,
      internshipId: 'seed-internship-recruiting-viettel-sec',
      coverLetter: 'Em là Đặng Tuấn Kiệt, sinh viên Cơ điện tử có định hướng an toàn phần cứng và mạng IoT, mong muốn được thử sức tại Viettel.',
      status: ApplicationStatus.INTERVIEWING,
      matchScore: 82.0,
      aiScore: 80.0,
      appliedAt: new Date('2026-11-03T11:30:00Z'),
    },
    // 8. Phạm Đức Duy - REVIEWING (Hồ sơ đang được FPT Software xem xét, AI Scan xong)
    {
      id: 'seed-app-duy-fpt-reviewing',
      studentId: stDuy.id,
      internshipId: 'seed-internship-recruiting-fpt-fullstack',
      coverLetter: 'Em là Phạm Đức Duy, có thế mạnh về AI/NLP và Fullstack web, mong muốn ứng tuyển vị trí Fullstack Developer Intern.',
      status: ApplicationStatus.REVIEWING,
      matchScore: 91.0,
      aiScore: 89.0,
      appliedAt: new Date('2026-11-04T15:00:00Z'),
    },
    // 9. Phạm Đức Duy - PENDING (Đơn mới nộp vào Bosch, đang chờ xử lý)
    {
      id: 'seed-app-duy-bosch-pending',
      studentId: stDuy.id,
      internshipId: 'seed-internship-recruiting-bosch-embedded',
      coverLetter: 'Em muốn mở rộng kỹ năng lập trình nhúng C++ cho các bài toán Computer Vision tại Bosch.',
      status: ApplicationStatus.PENDING,
      matchScore: 78.0,
      appliedAt: new Date('2026-11-06T18:00:00Z'),
    },
    // 10. Lý Hoàng Nam - WITHDRAWN (Sinh viên tự rút đơn)
    {
      id: 'seed-app-nam-newport-withdrawn',
      studentId: stNam.id,
      internshipId: 'seed-internship-recruiting-newport-scm',
      coverLetter: 'Em ứng tuyển vị trí quản lý kho vận cảng biển.',
      status: ApplicationStatus.WITHDRAWN,
      matchScore: 65.0,
      appliedAt: new Date('2026-11-02T09:00:00Z'),
      withdrawnAt: new Date('2026-11-04T10:00:00Z'),
    },
    // 11. Ứng viên bị DECLINED (Sinh viên từ chối offer)
    {
      id: 'seed-app-kiet-bosch-declined',
      studentId: stKiet.id,
      internshipId: 'seed-internship-recruiting-bosch-embedded',
      coverLetter: 'Em ứng tuyển vị trí nhúng ô tô tại Bosch.',
      status: ApplicationStatus.DECLINED,
      matchScore: 84.0,
      aiScore: 83.0,
      appliedAt: new Date('2026-10-28T10:00:00Z'),
      offeredAt: new Date('2026-11-02T09:00:00Z'),
      respondedAt: new Date('2026-11-03T16:00:00Z'),
      companyFeedback: 'Ứng viên phản hồi đã chọn cơ hội thực tập phù hợp hơn với định hướng cá nhân.',
    },
    // 12. Ứng viên bị REJECTED (Doanh nghiệp từ chối hồ sơ kèm lý do)
    {
      id: 'seed-app-nam-vinfast-rejected',
      studentId: stNam.id,
      internshipId: 'seed-internship-recruiting-vinfast-auto',
      coverLetter: 'Em ứng tuyển vị trí robot lắp ráp ô tô.',
      status: ApplicationStatus.REJECTED,
      matchScore: 55.0,
      aiScore: 52.0,
      appliedAt: new Date('2026-11-01T14:00:00Z'),
      rejectedAt: new Date('2026-11-04T11:00:00Z'),
      rejectionReason: 'Chuyên ngành Kỹ thuật Xây dựng của bạn chưa phù hợp với yêu cầu chuyên sâu về Cơ điện tử & PLC của vị trí này.',
      companyFeedback: 'Cảm ơn bạn đã quan tâm. Chúc bạn sớm tìm được vị trí thực tập phù hợp với chuyên môn xây dựng.',
    },
    // 13. Ứng viên bị EXPIRED (Quá hạn phản hồi offer)
    {
      id: 'seed-app-huy-fpt-expired',
      studentId: stHuy.id,
      internshipId: 'seed-internship-recruiting-fpt-fullstack',
      coverLetter: 'Em ứng tuyển thử sức với mảng công nghệ phần mềm.',
      status: ApplicationStatus.EXPIRED,
      matchScore: 70.0,
      appliedAt: new Date('2026-10-15T10:00:00Z'),
      offeredAt: new Date('2026-10-20T10:00:00Z'),
      offerExpiresAt: new Date('2026-10-27T23:59:59Z'),
    },
  ];

  for (const a of appsData) {
    const itId = internshipMap.get(a.internshipId)!;
    const cvFileId = studentCvMap.get(a.studentId) || null;
    const app = await prisma.application.upsert({
      where: { id: a.id },
      update: {
        studentId: a.studentId,
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
        studentId: a.studentId,
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

    // Lịch phỏng vấn cho bạn Đặng Tuấn Kiệt
    if (a.id === 'seed-app-kiet-viettel-interviewing') {
      await prisma.applicationInterview.upsert({
        where: { applicationId: app.id },
        update: {
          scheduledAt: new Date('2026-11-12T09:30:00Z'),
          mode: InterviewMode.ONLINE,
          meetingLink: 'https://meet.google.com/xyz-careerbridge-viettel',
          contactName: 'Lê Quốc Huy (HR Manager)',
          contactEmail: 'huy.le@viettel.com.vn',
          contactPhone: '02462778899',
          note: 'Ứng viên vui lòng chuẩn bị laptop có webcam, micro và chuẩn bị trình bày ngắn gọn về dự án NetWatch trong 10 phút đầu.',
        },
        create: {
          applicationId: app.id,
          scheduledAt: new Date('2026-11-12T09:30:00Z'),
          mode: InterviewMode.ONLINE,
          meetingLink: 'https://meet.google.com/xyz-careerbridge-viettel',
          contactName: 'Lê Quốc Huy (HR Manager)',
          contactEmail: 'huy.le@viettel.com.vn',
          contactPhone: '02462778899',
          note: 'Ứng viên vui lòng chuẩn bị laptop có webcam, micro và chuẩn bị trình bày ngắn gọn về dự án NetWatch trong 10 phút đầu.',
        },
      });

      // Email log mời phỏng vấn
      await prisma.emailLog.deleteMany({ where: { applicationId: app.id } });
      await prisma.emailLog.create({
        data: {
          applicationId: app.id,
          type: EmailLogType.INTERVIEW_INVITATION,
          to: 'student.interviewing@student.hcmut.edu.vn',
          subject: '[Viettel Solutions] Thư mời tham gia phỏng vấn vị trí SOC Analyst Intern',
          html: '<p>Chào bạn Đặng Tuấn Kiệt, Viettel Solutions trân trọng mời bạn tham gia buổi phỏng vấn trực tuyến qua Google Meet vào lúc 09:30 ngày 12/11/2026.</p>',
          status: EmailLogStatus.SENT,
          sentAt: new Date('2026-11-04T10:00:00Z'),
        },
      });
    }

    // AI Scan Job cho các Application tiêu biểu
    if (a.aiScore) {
      await prisma.aiScanJob.upsert({
        where: { applicationId: app.id },
        update: {
          status: AiScanStatus.COMPLETED,
          aiScore: a.aiScore,
          recommendation: a.aiScore >= 90 ? AiCandidateRecommendation.STRONG_HIRE : AiCandidateRecommendation.HIRE,
          experienceYears: 1.0,
          extractedSkills: ['TypeScript', 'NestJS', 'PostgreSQL', 'Docker', 'Git'],
          matchedSkills: ['TypeScript', 'NestJS', 'PostgreSQL'],
          missingSkills: ['Kubernetes'],
          strengths: ['Nền tảng thuật toán xuất sắc', 'Kinh nghiệm làm dự án thực tế tốt', 'GPA cao'],
          weaknesses: ['Cần tích lũy thêm kinh nghiệm triển khai Cloud thực tế'],
          summary: 'Ứng viên rất tiềm năng, hồ sơ năng lực khớp tốt với yêu cầu tuyển dụng.',
          completedAt: new Date(),
        },
        create: {
          applicationId: app.id,
          companyId: fptComp.id,
          status: AiScanStatus.COMPLETED,
          aiScore: a.aiScore,
          recommendation: a.aiScore >= 90 ? AiCandidateRecommendation.STRONG_HIRE : AiCandidateRecommendation.HIRE,
          experienceYears: 1.0,
          extractedSkills: ['TypeScript', 'NestJS', 'PostgreSQL', 'Docker', 'Git'],
          matchedSkills: ['TypeScript', 'NestJS', 'PostgreSQL'],
          missingSkills: ['Kubernetes'],
          strengths: ['Nền tảng thuật toán xuất sắc', 'Kinh nghiệm làm dự án thực tế tốt', 'GPA cao'],
          weaknesses: ['Cần tích lũy thêm kinh nghiệm triển khai Cloud thực tế'],
          summary: 'Ứng viên rất tiềm năng, hồ sơ năng lực khớp tốt với yêu cầu tuyển dụng.',
          completedAt: new Date(),
        },
      });
    }
  }

  // =========================================================================
  // 12. THỰC TẬP (PLACEMENTS), GIẢNG VIÊN HƯỚNG DẪN, BÁO CÁO VÀ ĐÁNH GIÁ
  // =========================================================================
  console.log('📊 [12/12] Khởi tạo Placement, Giám sát hướng dẫn, 10 Báo cáo tuần & Đánh giá 2 bên...');

  const lecAnh = lecturerProfileMap.get('lecturer.cse@careerbridge.edu.vn')!;
  const lecThang = lecturerProfileMap.get('lecturer.feee@careerbridge.edu.vn')!;
  const lecTung = lecturerProfileMap.get('lecturer.fme@careerbridge.edu.vn')!;
  const lecMai = lecturerProfileMap.get('lecturer.sim@careerbridge.edu.vn')!;

  // -------------------------------------------------------------
  // PLACEMENT 1: Nguyễn Hoàng Long tại FPT Software (HIỆN TẠI - TUẦN 8/10)
  // Đang thực tập, GVHD: PGS.TS. Phạm Hoàng Anh. Đã nộp báo cáo tuần 8 chờ duyệt.
  // -------------------------------------------------------------
  const plLong = await prisma.internshipPlacement.upsert({
    where: { applicationId: 'seed-app-long-fpt-accepted' },
    update: {
      status: PlacementStatus.ACTIVE,
      academicStatus: AcademicMonitoringStatus.ACTIVE,
      startDate: new Date('2026-09-15T00:00:00Z'),
      endDate: new Date('2026-11-24T23:59:59Z'),
    },
    create: {
      applicationId: 'seed-app-long-fpt-accepted',
      studentId: stLong.id,
      companyId: fptComp.id,
      internshipId: internshipMap.get('seed-internship-current-fpt-backend')!,
      semesterId: semCurrentActive,
      status: PlacementStatus.ACTIVE,
      academicStatus: AcademicMonitoringStatus.ACTIVE,
      startDate: new Date('2026-09-15T00:00:00Z'),
      endDate: new Date('2026-11-24T23:59:59Z'),
    },
  });

  // Gán GVHD cho Long
  await prisma.supervision.upsert({
    where: { placementId: plLong.id },
    update: {
      lecturerId: lecAnh.id,
      assignedById: academicAdmin.id,
      status: SupervisionStatus.ACTIVE,
      assignedAt: new Date('2026-09-10T08:00:00Z'),
    },
    create: {
      placementId: plLong.id,
      lecturerId: lecAnh.id,
      assignedById: academicAdmin.id,
      status: SupervisionStatus.ACTIVE,
      assignedAt: new Date('2026-09-10T08:00:00Z'),
    },
  });

  // Báo cáo các tuần của Long (Tuần 1 -> Tuần 7: APPROVED, Tuần 8: SUBMITTED, Tuần 9: DRAFT)
  const longReportsData = [
    { week: 1, title: 'Tuần 1: Tiếp nhận công việc, tìm hiểu kiến trúc hệ thống và quy trình Agile tại FPT Software', content: 'Tìm hiểu tổng quan kiến trúc Microservices của dự án GDU1, cài đặt môi trường lập trình Docker, cấu hình ESLint, Prettier và làm quen với team.', status: ReportStatus.APPROVED, feedback: 'Báo cáo rõ ràng, sinh viên chủ động nắm bắt công việc rất tốt.', reviewedAt: new Date('2026-09-22T10:00:00Z') },
    { week: 2, title: 'Tuần 2: Nghiên cứu tài liệu Swagger API và cơ sở dữ liệu PostgreSQL', content: 'Đọc tài liệu SRS, phân tích các bảng dữ liệu trong PostgreSQL, viết truy vấn mẫu và làm quen với Prisma ORM.', status: ReportStatus.APPROVED, feedback: 'Tốt. Em chú ý thêm về các index để tối ưu hiệu năng truy vấn.', reviewedAt: new Date('2026-09-29T11:00:00Z') },
    { week: 3, title: 'Tuần 3: Xây dựng Module Authentication & Phân quyền RBAC', content: 'Hiện thực module đăng nhập JWT, giải pháp Refresh Token bảo mật và phân quyền vai trò người dùng trong hệ thống.', status: ReportStatus.APPROVED, feedback: 'Đã hoàn thành đúng tiến độ cam kết.', reviewedAt: new Date('2026-10-06T09:30:00Z') },
    { week: 4, title: 'Tuần 4: Thiết kế API Quản lý Người dùng và Upload tài liệu', content: 'Xây dựng CRUD API quản lý tài khoản, tích hợp giải pháp lưu trữ đám mây S3 và xử lý kiểm tra định dạng file.', status: ReportStatus.APPROVED, feedback: 'Tốt, code sạch, tuân thủ đúng coding convention của công ty.', reviewedAt: new Date('2026-10-13T10:15:00Z') },
    { week: 5, title: 'Tuần 5: Viết Unit Test và Integration Test bằng Jest', content: 'Đạt độ bao phủ kiểm thử Unit Test 82% cho các Service chính, viết mock database và kiểm thử tự động trên GitHub Actions.', status: ReportStatus.APPROVED, feedback: 'Độ bao phủ test rất tốt, cần tiếp tục phát huy.', reviewedAt: new Date('2026-10-20T14:00:00Z') },
    { week: 6, title: 'Tuần 6: Tối ưu hiệu năng truy vấn và triển khai Redis Caching', content: 'Áp dụng bộ nhớ đệm Redis Cache cho các API đọc dữ liệu tần suất cao, giảm thời gian phản hồi từ 180ms xuống 25ms.', status: ReportStatus.APPROVED, feedback: 'Rất ấn tượng với kết quả benchmark đo lường hiệu năng.', reviewedAt: new Date('2026-10-27T16:00:00Z') },
    { week: 7, title: 'Tuần 7: Đóng gói ứng dụng với Docker Compose và chuẩn bị tài liệu bàn giao', content: 'Tối ưu hóa Dockerfile đa tầng (multi-stage build), giảm dung lượng image từ 1.2GB xuống còn 180MB.', status: ReportStatus.APPROVED, feedback: 'Thầy đánh giá rất cao tinh thần tự học hỏi và áp dụng kỹ thuật tiên tiến.', reviewedAt: new Date('2026-11-03T10:00:00Z') },
    { week: 8, title: 'Tuần 8: Tích hợp hệ thống thông báo realtime qua Socket.io', content: 'Hiện thực WebSocket Gateway gửi thông báo trạng thái tức thời cho client. Đã kiểm thử ổn định với 1,000 kết nối đồng thời.', status: ReportStatus.SUBMITTED, feedback: null, reviewedAt: null },
    { week: 9, title: 'Tuần 9: Chuẩn bị slide báo cáo và tổng kết đồ án thực tập tốt nghiệp', content: 'Đang tổng hợp các tính năng đã hoàn thiện, chuẩn bị số liệu đánh giá kết quả thực tập.', status: ReportStatus.DRAFT, feedback: null, reviewedAt: null },
  ];

  for (const r of longReportsData) {
    await prisma.report.upsert({
      where: { placementId_week: { placementId: plLong.id, week: r.week } },
      update: {
        title: r.title,
        content: r.content,
        status: r.status,
        feedback: r.feedback,
        submittedAt: new Date('2026-09-15T00:00:00Z'),
        reviewedAt: r.reviewedAt,
      },
      create: {
        placementId: plLong.id,
        week: r.week,
        title: r.title,
        content: r.content,
        status: r.status,
        feedback: r.feedback,
        submittedAt: new Date('2026-09-15T00:00:00Z'),
        reviewedAt: r.reviewedAt,
      },
    });
  }

  // -------------------------------------------------------------
  // PLACEMENT 2: Trần Thị Mai Anh tại Bosch (QUÁ KHỨ - ĐÃ HOÀN THÀNH 100%)
  // Đầy đủ 10 báo cáo APPROVED, Đánh giá Doanh nghiệp (9.5) & Đánh giá Giảng viên (9.2)
  // -------------------------------------------------------------
  const plMaiAnh = await prisma.internshipPlacement.upsert({
    where: { applicationId: 'seed-app-maianh-bosch-accepted' },
    update: {
      status: PlacementStatus.COMPLETED,
      academicStatus: AcademicMonitoringStatus.CLOSED,
      academicClosedAt: new Date('2026-03-30T17:00:00Z'),
      startDate: new Date('2026-01-15T00:00:00Z'),
      endDate: new Date('2026-03-26T23:59:59Z'),
    },
    create: {
      applicationId: 'seed-app-maianh-bosch-accepted',
      studentId: stMaiAnh.id,
      companyId: boschComp.id,
      internshipId: internshipMap.get('seed-internship-past-bosch-2026')!,
      semesterId: semPastSpring,
      status: PlacementStatus.COMPLETED,
      academicStatus: AcademicMonitoringStatus.CLOSED,
      academicClosedAt: new Date('2026-03-30T17:00:00Z'),
      startDate: new Date('2026-01-15T00:00:00Z'),
      endDate: new Date('2026-03-26T23:59:59Z'),
    },
  });

  await prisma.supervision.upsert({
    where: { placementId: plMaiAnh.id },
    update: {
      lecturerId: lecAnh.id,
      assignedById: adminUser.id,
      status: SupervisionStatus.COMPLETED,
      assignedAt: new Date('2026-01-10T08:00:00Z'),
      completedAt: new Date('2026-03-30T17:00:00Z'),
    },
    create: {
      placementId: plMaiAnh.id,
      lecturerId: lecAnh.id,
      assignedById: adminUser.id,
      status: SupervisionStatus.COMPLETED,
      assignedAt: new Date('2026-01-10T08:00:00Z'),
      completedAt: new Date('2026-03-30T17:00:00Z'),
    },
  });

  // Tạo đủ 10 báo cáo tuần APPROVED cho Mai Anh
  for (let w = 1; w <= 10; w++) {
    await prisma.report.upsert({
      where: { placementId_week: { placementId: plMaiAnh.id, week: w } },
      update: {
        title: `Báo cáo Tuần ${w}: Nghiên cứu và tối ưu mô hình thị giác máy tính xe tự hành`,
        content: `Nội dung chi tiết tuần ${w}: Thu thập dữ liệu camera, xử lý nhiễu hình ảnh ban đêm, đánh giá độ chính xác mAP đạt 94.6% trên tập kiểm thử giao thông thực tế.`,
        status: ReportStatus.APPROVED,
        feedback: 'Báo cáo xuất sắc, nghiên cứu chuyên sâu đạt chuẩn công bố hội nghị.',
        submittedAt: new Date('2026-02-01T00:00:00Z'),
        reviewedAt: new Date('2026-02-05T00:00:00Z'),
      },
      create: {
        placementId: plMaiAnh.id,
        week: w,
        title: `Báo cáo Tuần ${w}: Nghiên cứu và tối ưu mô hình thị giác máy tính xe tự hành`,
        content: `Nội dung chi tiết tuần ${w}: Thu thập dữ liệu camera, xử lý nhiễu hình ảnh ban đêm, đánh giá độ chính xác mAP đạt 94.6% trên tập kiểm thử giao thông thực tế.`,
        status: ReportStatus.APPROVED,
        feedback: 'Báo cáo xuất sắc, nghiên cứu chuyên sâu đạt chuẩn công bố hội nghị.',
        submittedAt: new Date('2026-02-01T00:00:00Z'),
        reviewedAt: new Date('2026-02-05T00:00:00Z'),
      },
    });
  }

  // Đánh giá từ Doanh nghiệp (Bosch)
  await prisma.evaluation.upsert({
    where: { placementId_type: { placementId: plMaiAnh.id, type: EvaluationType.COMPANY } },
    update: {
      evaluatorId: boschComp.userId,
      score: 9.5,
      criteria: {
        technicalExpertise: 9.8,
        problemSolving: 9.5,
        workAttitude: 9.6,
        teamwork: 9.2,
        adaptability: 9.5,
      },
      comment: 'Mai Anh là một trong những thực tập sinh xuất sắc nhất mà trung tâm từng tiếp nhận. Tư duy toán học và thị giác máy tính rất sâu sắc, tác phong làm việc chuẩn mực của kỹ sư quốc tế.',
      submittedAt: new Date('2026-03-27T10:00:00Z'),
    },
    create: {
      placementId: plMaiAnh.id,
      evaluatorId: boschComp.userId,
      type: EvaluationType.COMPANY,
      score: 9.5,
      criteria: {
        technicalExpertise: 9.8,
        problemSolving: 9.5,
        workAttitude: 9.6,
        teamwork: 9.2,
        adaptability: 9.5,
      },
      comment: 'Mai Anh là một trong những thực tập sinh xuất sắc nhất mà trung tâm từng tiếp nhận. Tư duy toán học và thị giác máy tính rất sâu sắc, tác phong làm việc chuẩn mực của kỹ sư quốc tế.',
      submittedAt: new Date('2026-03-27T10:00:00Z'),
    },
  });

  // Đánh giá từ Giảng viên (PGS.TS. Phạm Hoàng Anh)
  await prisma.evaluation.upsert({
    where: { placementId_type: { placementId: plMaiAnh.id, type: EvaluationType.LECTURER } },
    update: {
      evaluatorId: lecAnh.userId,
      score: 9.2,
      criteria: {
        academicRigor: 9.5,
        reportQuality: 9.2,
        progressAdherence: 9.0,
        presentationSkills: 9.0,
      },
      comment: 'Sinh viên hoàn thành trọn vẹn 10 tuần thực tập đúng tiến độ, báo cáo học thuật chỉn chu, bảo vệ đồ án tự tin và thuyết phục.',
      submittedAt: new Date('2026-03-29T14:00:00Z'),
    },
    create: {
      placementId: plMaiAnh.id,
      evaluatorId: lecAnh.userId,
      type: EvaluationType.LECTURER,
      score: 9.2,
      criteria: {
        academicRigor: 9.5,
        reportQuality: 9.2,
        progressAdherence: 9.0,
        presentationSkills: 9.0,
      },
      comment: 'Sinh viên hoàn thành trọn vẹn 10 tuần thực tập đúng tiến độ, báo cáo học thuật chỉn chu, bảo vệ đồ án tự tin và thuyết phục.',
      submittedAt: new Date('2026-03-29T14:00:00Z'),
    },
  });

  // -------------------------------------------------------------
  // PLACEMENT 3: Bùi Gia Huy tại VinFast (HIỆN TẠI - CÓ BÁO CÁO BỊ REJECTED)
  // -------------------------------------------------------------
  const plHuy = await prisma.internshipPlacement.upsert({
    where: { applicationId: 'seed-app-huy-vinfast-accepted' },
    update: {
      status: PlacementStatus.ACTIVE,
      academicStatus: AcademicMonitoringStatus.ACTIVE,
      startDate: new Date('2026-09-15T00:00:00Z'),
      endDate: new Date('2026-11-24T23:59:59Z'),
    },
    create: {
      applicationId: 'seed-app-huy-vinfast-accepted',
      studentId: stHuy.id,
      companyId: vinfastComp.id,
      internshipId: internshipMap.get('seed-internship-current-vinfast-ev')!,
      semesterId: semCurrentActive,
      status: PlacementStatus.ACTIVE,
      academicStatus: AcademicMonitoringStatus.ACTIVE,
      startDate: new Date('2026-09-15T00:00:00Z'),
      endDate: new Date('2026-11-24T23:59:59Z'),
    },
  });

  await prisma.supervision.upsert({
    where: { placementId: plHuy.id },
    update: {
      lecturerId: lecTung.id,
      assignedById: academicAdmin.id,
      status: SupervisionStatus.ACTIVE,
      assignedAt: new Date('2026-09-10T08:00:00Z'),
    },
    create: {
      placementId: plHuy.id,
      lecturerId: lecTung.id,
      assignedById: academicAdmin.id,
      status: SupervisionStatus.ACTIVE,
      assignedAt: new Date('2026-09-10T08:00:00Z'),
    },
  });

  // Báo cáo tuần 1 -> 4 APPROVED, tuần 5 REJECTED
  for (let w = 1; w <= 4; w++) {
    await prisma.report.upsert({
      where: { placementId_week: { placementId: plHuy.id, week: w } },
      update: {
        title: `Tuần ${w}: Tìm hiểu an toàn cao áp và cấu trúc khối pin VF8`,
        content: `Nội dung tuần ${w}: Thực hiện đúng các quy định an toàn điện cao áp của xưởng VinFast, đo kiểm điện áp cell pin bằng máy đo chuyên dụng.`,
        status: ReportStatus.APPROVED,
        feedback: 'Nội dung đạt yêu cầu.',
        submittedAt: new Date('2026-09-20T00:00:00Z'),
        reviewedAt: new Date('2026-09-25T00:00:00Z'),
      },
      create: {
        placementId: plHuy.id,
        week: w,
        title: `Tuần ${w}: Tìm hiểu an toàn cao áp và cấu trúc khối pin VF8`,
        content: `Nội dung tuần ${w}: Thực hiện đúng các quy định an toàn điện cao áp của xưởng VinFast, đo kiểm điện áp cell pin bằng máy đo chuyên dụng.`,
        status: ReportStatus.APPROVED,
        feedback: 'Nội dung đạt yêu cầu.',
        submittedAt: new Date('2026-09-20T00:00:00Z'),
        reviewedAt: new Date('2026-09-25T00:00:00Z'),
      },
    });
  }

  // Báo cáo tuần 5 bị REJECTED
  await prisma.report.upsert({
    where: { placementId_week: { placementId: plHuy.id, week: 5 } },
    update: {
      title: 'Tuần 5: Thu thập dữ liệu cảm biến CAN Bus khi chạy thử xe',
      content: 'Ghi lại các file log CAN Bus từ cổng OBD-II khi xe chạy trên đường thử.',
      status: ReportStatus.REJECTED,
      feedback: 'Báo cáo quá sơ sài. Em cần bổ sung sơ đồ giải mã ID các frame CAN Bus (tốc độ xe, nhiệt độ pin, dòng điện sạc) và đồ thị phân tích cụ thể trước khi nộp lại.',
      submittedAt: new Date('2026-10-20T10:00:00Z'),
      reviewedAt: new Date('2026-10-23T15:00:00Z'),
    },
    create: {
      placementId: plHuy.id,
      week: 5,
      title: 'Tuần 5: Thu thập dữ liệu cảm biến CAN Bus khi chạy thử xe',
      content: 'Ghi lại các file log CAN Bus từ cổng OBD-II khi xe chạy trên đường thử.',
      status: ReportStatus.REJECTED,
      feedback: 'Báo cáo quá sơ sài. Em cần bổ sung sơ đồ giải mã ID các frame CAN Bus (tốc độ xe, nhiệt độ pin, dòng điện sạc) và đồ thị phân tích cụ thể trước khi nộp lại.',
      submittedAt: new Date('2026-10-20T10:00:00Z'),
      reviewedAt: new Date('2026-10-23T15:00:00Z'),
    },
  });

  // -------------------------------------------------------------
  // PLACEMENT 4: Lê Minh Tuấn tại Viettel (CHƯA PHÂN CÔNG GVHD - UNASSIGNED)
  // Dùng để Admin test tính năng Phân công giảng viên (/admin/supervisions)
  // -------------------------------------------------------------
  await prisma.internshipPlacement.upsert({
    where: { applicationId: 'seed-app-tuan-viettel-accepted' },
    update: {
      status: PlacementStatus.ACTIVE,
      academicStatus: AcademicMonitoringStatus.PENDING,
      startDate: new Date('2026-12-15T00:00:00Z'),
      endDate: new Date('2027-02-23T23:59:59Z'),
    },
    create: {
      applicationId: 'seed-app-tuan-viettel-accepted',
      studentId: stTuan.id,
      companyId: viettelComp.id,
      internshipId: internshipMap.get('seed-internship-recruiting-viettel-sec')!,
      semesterId: semRecruiting,
      status: PlacementStatus.ACTIVE,
      academicStatus: AcademicMonitoringStatus.PENDING,
      startDate: new Date('2026-12-15T00:00:00Z'),
      endDate: new Date('2027-02-23T23:59:59Z'),
    },
  });
  // Xóa supervision nếu có để chắc chắn Tuấn ở trạng thái Unassigned
  const plTuan = await prisma.internshipPlacement.findUnique({
    where: { applicationId: 'seed-app-tuan-viettel-accepted' },
    select: { id: true },
  });
  if (plTuan) {
    await prisma.supervision.deleteMany({ where: { placementId: plTuan.id } });
  }

  // =========================================================================
  // 13. HỘI THOẠI & TIN NHẮN CHAT (CONVERSATIONS & MESSAGES)
  // =========================================================================
  console.log('💬 Khởi tạo Hội thoại Chat giữa Sinh viên, Doanh nghiệp và Giảng viên...');

  // 1. Đoạn chat giữa Sinh viên Nguyễn Hoàng Long và HR FPT Software
  const convFptLong = await prisma.conversation.upsert({
    where: { applicationId: 'seed-app-long-fpt-accepted' },
    update: {},
    create: {
      applicationId: 'seed-app-long-fpt-accepted',
      studentId: stLong.id,
      companyId: fptComp.id,
    },
  });

  const chatMessagesData = [
    { senderId: fptComp.userId, content: 'Chào Long, FPT Software đã nhận được hồ sơ của em. Em có thể chuẩn bị phỏng vấn kỹ thuật vào chiều thứ Ba được không?' },
    { senderId: stLong.userId, content: 'Dạ em chào anh Tùng, em hoàn toàn sắp xếp được lịch chiều thứ Ba ạ. Em cảm ơn anh nhiều!' },
    { senderId: fptComp.userId, content: 'Tuyệt vời. Anh đã gửi link Google Meet qua email rồi nhé. Hẹn gặp em!' },
    { senderId: stLong.userId, content: 'Dạ vâng, em đã nhận được email và chuẩn bị sẵn sàng ạ.' },
  ];

  await prisma.message.deleteMany({ where: { conversationId: convFptLong.id } });
  for (const m of chatMessagesData) {
    await prisma.message.create({
      data: {
        conversationId: convFptLong.id,
        senderId: m.senderId,
        content: m.content,
        readAt: new Date(),
      },
    });
  }

  // =========================================================================
  // 14. THÔNG BÁO HỆ THỐNG (NOTIFICATIONS)
  // =========================================================================
  console.log('🔔 Khởi tạo Thông báo hệ thống cho các tài khoản...');

  const notificationsData = [
    {
      userId: stLong.userId,
      type: NotificationType.REPORT,
      action: NotificationAction.OPEN_REPORT,
      title: 'Báo cáo tuần 7 đã được duyệt',
      content: 'Giảng viên hướng dẫn PGS.TS. Phạm Hoàng Anh đã đánh giá và duyệt Báo cáo thực tập Tuần 7 của bạn.',
      eventKey: 'notif-long-report-w7',
      isRead: true,
    },
    {
      userId: stLinh.userId,
      type: NotificationType.APPLICATION,
      action: NotificationAction.OPEN_APPLICATION,
      title: 'Chúc mừng! Bạn đã nhận được Thư mời thực tập từ FPT Software',
      content: 'FPT Software đã gửi Thư mời thực tập cho bạn. Hạn chót phản hồi là ngày 13/11/2026.',
      eventKey: 'notif-linh-offer-fpt',
      isRead: false,
    },
    {
      userId: stKiet.userId,
      type: NotificationType.APPLICATION,
      action: NotificationAction.OPEN_APPLICATION,
      title: 'Lịch phỏng vấn trực tuyến với Viettel Solutions',
      content: 'Bạn có lịch phỏng vấn vị trí SOC Analyst Intern vào lúc 09:30 ngày 12/11/2026 qua Google Meet.',
      eventKey: 'notif-kiet-interview-viettel',
      isRead: false,
    },
    {
      userId: lecAnh.userId,
      type: NotificationType.REPORT,
      action: NotificationAction.OPEN_REPORT,
      title: 'Sinh viên Nguyễn Hoàng Long đã nộp báo cáo tuần 8',
      content: 'Sinh viên Nguyễn Hoàng Long (2110234) vừa nộp báo cáo thực tập Tuần 8 và đang chờ thầy nhận xét.',
      eventKey: 'notif-lecanh-report-w8',
      isRead: false,
    },
    {
      userId: adminUser.id,
      type: NotificationType.COMPANY,
      action: NotificationAction.OPEN_COMPANY_PROFILE,
      title: 'Doanh nghiệp KMS Technology vừa gửi hồ sơ đăng ký xác minh',
      content: 'Công ty TNHH Phần mềm KMS Technology Việt Nam đã gửi hồ sơ và đang chờ Ban quản trị xét duyệt.',
      eventKey: 'notif-admin-kms-pending',
      isRead: false,
    },
  ];

  for (const n of notificationsData) {
    await prisma.notification.upsert({
      where: { eventKey: n.eventKey },
      update: {
        userId: n.userId,
        type: n.type,
        action: n.action,
        title: n.title,
        content: n.content,
        isRead: n.isRead,
      },
      create: n,
    });
  }

  // =========================================================================
  // 15. YÊU CẦU HỖ TRỢ SINH VIÊN (SUPPORT REQUESTS)
  // =========================================================================
  console.log('❓ Khởi tạo Yêu cầu hỗ trợ sinh viên (Support Requests)...');

  const stNgoc = studentProfileMap.get('student.support@student.hcmut.edu.vn')!;

  // 1. Yêu cầu đã được Admin giải quyết (RESOLVED)
  await prisma.supportRequest.create({
    data: {
      studentId: stNgoc.id,
      title: 'Thủ tục xin cấp Giấy giới thiệu thực tập của Khoa Quản lý Công nghiệp',
      content: 'Kính gửi Ban Quản trị và Phòng Đào tạo, em cần xin giấy giới thiệu thực tập có mộc đỏ của trường để nộp cho doanh nghiệp. Em có thể nhận bản cứng tại phòng nào ạ?',
      status: SupportRequestStatus.RESOLVED,
      adminReply: 'Chào em, Ban Quản trị đã tiếp nhận yêu cầu. Em có thể mang theo Thẻ sinh viên đến Văn phòng Khoa Quản lý Công nghiệp (Phòng 104 nhà B10) trong giờ hành chính từ thứ 2 đến thứ 6 để nhận Giấy giới thiệu nhé.',
      repliedById: academicAdmin.id,
      repliedAt: new Date('2026-11-04T15:30:00Z'),
    },
  });

  // 2. Yêu cầu mới đang chờ xử lý (PENDING)
  await prisma.supportRequest.create({
    data: {
      studentId: stTuan.id,
      title: 'Hỗ trợ cập nhật thông tin Giảng viên hướng dẫn kỳ thực tập',
      content: 'Dạ em chào thầy cô, em đã nhận được xác nhận tiếp nhận thực tập của Viettel Solutions, em muốn hỏi khi nào trường sẽ hoàn tất danh sách phân công Giảng viên hướng dẫn trên hệ thống ạ?',
      status: SupportRequestStatus.PENDING,
    },
  });

  // =========================================================================
  // 16. BÁO CÁO VI PHẠM TIN TUYỂN DỤNG (INTERNSHIP REPORT)
  // =========================================================================
  console.log('🚨 Khởi tạo Báo cáo vi phạm tin tuyển dụng...');

  const rejectedInternship = await prisma.internship.findUnique({
    where: { id: 'seed-internship-rejected-scam' },
    select: { id: true },
  });

  if (rejectedInternship) {
    await prisma.internshipReport.create({
      data: {
        internshipId: rejectedInternship.id,
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

  // =========================================================================
  // 17. NHẬT KÝ KIỂM TOÁN HỆ THỐNG (AUDIT LOGS)
  // =========================================================================
  console.log('🛡️ Khởi tạo Nhật ký kiểm toán hệ thống (Audit Logs)...');

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
      entityId: plLong.id,
      metadata: { student: stLong.fullName, lecturer: lecAnh.fullName },
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
