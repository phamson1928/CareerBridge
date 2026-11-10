import {
  PlacementStatus,
  AcademicMonitoringStatus,
  SupervisionStatus,
  ReportStatus,
} from '../../src/generated/prisma/client';

export interface ReportSeedItem {
  week: number;
  title: string;
  content: string;
  status: ReportStatus;
  feedback?: string | null;
  submittedAt?: Date;
  reviewedAt?: Date | null;
}

export interface EvaluationSeedItem {
  score: number;
  criteria: Record<string, number>;
  comment: string;
  submittedAt: Date;
}

export interface PlacementSeedItem {
  applicationId: string;
  studentEmail: string;
  companyEmail: string;
  internshipId: string;
  semesterName: string;
  status: PlacementStatus;
  academicStatus: AcademicMonitoringStatus;
  startDate?: Date;
  endDate?: Date;
  academicClosedAt?: Date;
  supervision?: {
    lecturerEmail: string;
    status: SupervisionStatus;
    assignedAt: Date;
    completedAt?: Date;
  };
  reports: ReportSeedItem[];
  companyEvaluation?: EvaluationSeedItem;
  lecturerEvaluation?: EvaluationSeedItem;
}

export const placementsData: PlacementSeedItem[] = [
  // =========================================================================
  // 1. PLACEMENTS ĐÃ HOÀN THÀNH (COMPLETED - 4 ĐỢT THỰC TẬP XUẤT SẮC)
  // =========================================================================
  // 1. Trần Thị Mai Anh tại Bosch (Kỳ Xuân 2026 - CSE)
  {
    applicationId: 'seed-app-maianh-bosch-accepted',
    studentEmail: 'student.completed@student.hcmut.edu.vn',
    companyEmail: 'bosch.recruitment@bosch.com',
    internshipId: 'seed-internship-past-bosch-2026',
    semesterName: 'Học kỳ 2 (2025 - 2026) - Kỳ Xuân',
    status: PlacementStatus.COMPLETED,
    academicStatus: AcademicMonitoringStatus.CLOSED,
    startDate: new Date('2026-01-15T00:00:00Z'),
    endDate: new Date('2026-03-26T23:59:59Z'),
    academicClosedAt: new Date('2026-03-30T17:00:00Z'),
    supervision: {
      lecturerEmail: 'lecturer.cse@careerbridge.edu.vn',
      status: SupervisionStatus.COMPLETED,
      assignedAt: new Date('2026-01-10T08:00:00Z'),
      completedAt: new Date('2026-03-30T17:00:00Z'),
    },
    reports: Array.from({ length: 10 }, (_, i) => ({
      week: i + 1,
      title: `Tuần ${i + 1}: Nghiên cứu và tối ưu mô hình thị giác máy tính xe tự hành`,
      content: `Nội dung tuần ${i + 1}: Thu thập dữ liệu camera, xử lý nhiễu hình ảnh ban đêm, đánh giá độ chính xác mAP đạt 94.6% trên tập kiểm thử giao thông thực tế.`,
      status: ReportStatus.APPROVED,
      feedback: 'Báo cáo xuất sắc, nghiên cứu chuyên sâu đạt chuẩn công bố hội nghị.',
      submittedAt: new Date('2026-02-01T00:00:00Z'),
      reviewedAt: new Date('2026-02-05T00:00:00Z'),
    })),
    companyEvaluation: {
      score: 9.5,
      criteria: { technicalExpertise: 9.8, problemSolving: 9.5, workAttitude: 9.6, teamwork: 9.2, adaptability: 9.5 },
      comment: 'Mai Anh là một trong những thực tập sinh xuất sắc nhất mà trung tâm từng tiếp nhận. Tư duy toán học và thị giác máy tính rất sâu sắc, tác phong làm việc chuẩn mực của kỹ sư quốc tế.',
      submittedAt: new Date('2026-03-27T10:00:00Z'),
    },
    lecturerEvaluation: {
      score: 9.2,
      criteria: { academicRigor: 9.5, reportQuality: 9.2, progressAdherence: 9.0, presentationSkills: 9.0 },
      comment: 'Sinh viên hoàn thành trọn vẹn 10 tuần thực tập đúng tiến độ, báo cáo học thuật chỉn chu, bảo vệ đồ án tự tin và thuyết phục.',
      submittedAt: new Date('2026-03-29T14:00:00Z'),
    },
  },

  // 2. Đỗ Thùy Dương tại Tân Cảng (Kỳ Thu 2025 - SIM)
  {
    applicationId: 'seed-app-duong-newport-accepted',
    studentEmail: 'student.sim@student.hcmut.edu.vn',
    companyEmail: 'saigon.newport@saigonnewport.com.vn',
    internshipId: 'seed-internship-past-newport-2025',
    semesterName: 'Học kỳ 1 (2025 - 2026) - Kỳ Thu',
    status: PlacementStatus.COMPLETED,
    academicStatus: AcademicMonitoringStatus.CLOSED,
    startDate: new Date('2025-09-15T00:00:00Z'),
    endDate: new Date('2025-11-24T23:59:59Z'),
    academicClosedAt: new Date('2025-11-30T17:00:00Z'),
    supervision: {
      lecturerEmail: 'lecturer.sim@careerbridge.edu.vn',
      status: SupervisionStatus.COMPLETED,
      assignedAt: new Date('2025-09-10T08:00:00Z'),
      completedAt: new Date('2025-11-30T17:00:00Z'),
    },
    reports: Array.from({ length: 10 }, (_, i) => ({
      week: i + 1,
      title: `Tuần ${i + 1}: Phân tích vận hành bãi container và tối ưu chuỗi cung ứng cảng Cát Lái`,
      content: `Nội dung tuần ${i + 1}: Thu thập số liệu thời gian lưu bãi container, mô phỏng tuyến di chuyển xe nâng RTG và đề xuất giải pháp giảm ùn ứ cầu cảng.`,
      status: ReportStatus.APPROVED,
      feedback: 'Sinh viên nắm bắt quy trình vận hành cảng rất nhanh, đề xuất có tính thực tiễn cao.',
      submittedAt: new Date('2025-10-01T00:00:00Z'),
      reviewedAt: new Date('2025-10-05T00:00:00Z'),
    })),
    companyEvaluation: {
      score: 9.3,
      criteria: { practicalApplication: 9.5, discipline: 9.4, reportAccuracy: 9.2, communication: 9.0 },
      comment: 'Thùy Dương hoàn thành xuất sắc các nhiệm vụ được giao, chủ động phối hợp với các tổ điều hành khai thác bãi container.',
      submittedAt: new Date('2025-11-26T10:00:00Z'),
    },
    lecturerEvaluation: {
      score: 9.0,
      criteria: { academicRigor: 9.0, reportQuality: 9.0, progressAdherence: 9.2, presentationSkills: 8.8 },
      comment: 'Báo cáo thực tập có số liệu thực tế phong phú, áp dụng đúng kiến thức chuyên ngành Logistics và Quản lý Chuỗi cung ứng.',
      submittedAt: new Date('2025-11-28T14:00:00Z'),
    },
  },

  // 3. Trương Hữu Nghĩa tại Coteccons (Kỳ Xuân 2026 - CIVIL)
  {
    applicationId: 'seed-app-nghia-coteccons-accepted',
    studentEmail: 'nghia.truong@student.hcmut.edu.vn',
    companyEmail: 'coteccons.careers@coteccons.vn',
    internshipId: 'seed-internship-past-coteccons-2026',
    semesterName: 'Học kỳ 2 (2025 - 2026) - Kỳ Xuân',
    status: PlacementStatus.COMPLETED,
    academicStatus: AcademicMonitoringStatus.CLOSED,
    startDate: new Date('2026-01-15T00:00:00Z'),
    endDate: new Date('2026-03-26T23:59:59Z'),
    academicClosedAt: new Date('2026-03-30T17:00:00Z'),
    supervision: {
      lecturerEmail: 'lecturer.civil@careerbridge.edu.vn',
      status: SupervisionStatus.COMPLETED,
      assignedAt: new Date('2026-01-10T08:00:00Z'),
      completedAt: new Date('2026-03-30T17:00:00Z'),
    },
    reports: Array.from({ length: 10 }, (_, i) => ({
      week: i + 1,
      title: `Tuần ${i + 1}: Giám sát thi công kết cấu bê tông cốt thép dự án cao tầng`,
      content: `Nội dung tuần ${i + 1}: Kiểm tra công tác nghiệm thu cốt thép dầm sàn tầng điển hình, kiểm soát độ sụt bê tông thương phẩm và đối chiếu mô hình BIM Navisworks.`,
      status: ReportStatus.APPROVED,
      feedback: 'Nội dung bám sát công trường, kiểm tra kỹ thuật đạt tiêu chuẩn xây dựng.',
      submittedAt: new Date('2026-02-01T00:00:00Z'),
      reviewedAt: new Date('2026-02-05T00:00:00Z'),
    })),
    companyEvaluation: {
      score: 9.4,
      criteria: { siteSafety: 9.8, structuralKnowledge: 9.4, drawingReading: 9.5, reportQuality: 9.0 },
      comment: 'Sinh viên Trương Hữu Nghĩa có kiến thức nền kết cấu vững, tác phong công trường mẫu mực, tuân thủ nghiêm ngặt an toàn lao động.',
      submittedAt: new Date('2026-03-28T09:00:00Z'),
    },
    lecturerEvaluation: {
      score: 9.3,
      criteria: { technicalDepth: 9.5, reportStructure: 9.2, practicalRelevance: 9.4, presentation: 9.0 },
      comment: 'Thầy đánh giá rất cao đồ án thực tập tốt nghiệp của Nghĩa. Mô hình hóa kết cấu và đối chiếu số liệu đo đạc thực địa rất chi tiết.',
      submittedAt: new Date('2026-03-29T16:00:00Z'),
    },
  },

  // 4. Mai Phương Uyên tại Renesas Design (Kỳ Thu 2025 - FEEE)
  {
    applicationId: 'seed-app-uyen-renesas-accepted',
    studentEmail: 'uyen.mai@student.hcmut.edu.vn',
    companyEmail: 'renesas.careers@lm.renesas.com',
    internshipId: 'seed-internship-past-renesas-2025',
    semesterName: 'Học kỳ 1 (2025 - 2026) - Kỳ Thu',
    status: PlacementStatus.COMPLETED,
    academicStatus: AcademicMonitoringStatus.CLOSED,
    startDate: new Date('2025-09-15T00:00:00Z'),
    endDate: new Date('2025-11-24T23:59:59Z'),
    academicClosedAt: new Date('2025-11-30T17:00:00Z'),
    supervision: {
      lecturerEmail: 'lecturer.feee@careerbridge.edu.vn',
      status: SupervisionStatus.COMPLETED,
      assignedAt: new Date('2025-09-10T08:00:00Z'),
      completedAt: new Date('2025-11-30T17:00:00Z'),
    },
    reports: Array.from({ length: 10 }, (_, i) => ({
      week: i + 1,
      title: `Tuần ${i + 1}: Thiết kế và kiểm thử vi mạch số SoC bằng Verilog/SystemVerilog`,
      content: `Nội dung tuần ${i + 1}: Xây dựng testbench ngẫu nhiên có ràng buộc (constrained-random), đo độ bao phủ chức năng Functional Coverage đạt 99.2% trên Synopsys VCS.`,
      status: ReportStatus.APPROVED,
      feedback: 'Báo cáo kỹ thuật vi mạch rất chỉn chu, mô phỏng logic không có lỗi timing.',
      submittedAt: new Date('2025-10-01T00:00:00Z'),
      reviewedAt: new Date('2025-10-05T00:00:00Z'),
    })),
    companyEvaluation: {
      score: 9.6,
      criteria: { verilogDesign: 9.8, verificationQuality: 9.6, analyticalThinking: 9.5, teamwork: 9.5 },
      comment: 'Mai Phương Uyên đạt điểm tuyệt đối trong đợt đánh giá thực tập sinh của trung tâm RVC. Đề xuất tuyển dụng chính thức vị trí RTL Design Engineer ngay sau khi tốt nghiệp.',
      submittedAt: new Date('2025-11-27T11:00:00Z'),
    },
    lecturerEvaluation: {
      score: 9.5,
      criteria: { academicRigor: 9.6, chipArchitecture: 9.5, reportExcellence: 9.5, defenseScore: 9.5 },
      comment: 'Sinh viên hoàn thành xuất sắc đề tài thiết kế vi mạch bán dẫn, đáp ứng chuẩn kỹ sư thiết kế phần cứng quốc tế.',
      submittedAt: new Date('2025-11-29T10:00:00Z'),
    },
  },

  // =========================================================================
  // 2. PLACEMENTS HIỆN TẠI (KỲ THU 2026 - MONITORING - TUẦN 8/10)
  // =========================================================================
  // 5. Nguyễn Hoàng Long tại FPT Software (Tuần 8 SUBMITTED)
  {
    applicationId: 'seed-app-long-fpt-accepted',
    studentEmail: 'student.interning@student.hcmut.edu.vn',
    companyEmail: 'fpt.software@fpt.com',
    internshipId: 'seed-internship-current-fpt-backend',
    semesterName: 'Học kỳ 1 (2026 - 2027) - Kỳ Thu [Hiện tại]',
    status: PlacementStatus.ACTIVE,
    academicStatus: AcademicMonitoringStatus.ACTIVE,
    startDate: new Date('2026-09-15T00:00:00Z'),
    endDate: new Date('2026-11-24T23:59:59Z'),
    supervision: {
      lecturerEmail: 'lecturer.cse@careerbridge.edu.vn',
      status: SupervisionStatus.ACTIVE,
      assignedAt: new Date('2026-09-10T08:00:00Z'),
    },
    reports: [
      { week: 1, title: 'Tuần 1: Tiếp nhận công việc, tìm hiểu kiến trúc hệ thống và quy trình Agile tại FPT Software', content: 'Tìm hiểu tổng quan kiến trúc Microservices của dự án GDU1, cài đặt môi trường lập trình Docker, cấu hình ESLint, Prettier và làm quen với team.', status: ReportStatus.APPROVED, feedback: 'Báo cáo rõ ràng, sinh viên chủ động nắm bắt công việc rất tốt.', submittedAt: new Date('2026-09-22T10:00:00Z'), reviewedAt: new Date('2026-09-22T10:00:00Z') },
      { week: 2, title: 'Tuần 2: Nghiên cứu tài liệu Swagger API và cơ sở dữ liệu PostgreSQL', content: 'Đọc tài liệu SRS, phân tích các bảng dữ liệu trong PostgreSQL, viết truy vấn mẫu và làm quen với Prisma ORM.', status: ReportStatus.APPROVED, feedback: 'Tốt. Em chú ý thêm về các index để tối ưu hiệu năng truy vấn.', submittedAt: new Date('2026-09-29T11:00:00Z'), reviewedAt: new Date('2026-09-29T11:00:00Z') },
      { week: 3, title: 'Tuần 3: Xây dựng Module Authentication & Phân quyền RBAC', content: 'Hiện thực module đăng nhập JWT, giải pháp Refresh Token bảo mật và phân quyền vai trò người dùng trong hệ thống.', status: ReportStatus.APPROVED, feedback: 'Đã hoàn thành đúng tiến độ cam kết.', submittedAt: new Date('2026-10-06T09:30:00Z'), reviewedAt: new Date('2026-10-06T09:30:00Z') },
      { week: 4, title: 'Tuần 4: Thiết kế API Quản lý Người dùng và Upload tài liệu', content: 'Xây dựng CRUD API quản lý tài khoản, tích hợp giải pháp lưu trữ đám mây S3 và xử lý kiểm tra định dạng file.', status: ReportStatus.APPROVED, feedback: 'Tốt, code sạch, tuân thủ đúng coding convention của công ty.', submittedAt: new Date('2026-10-13T10:15:00Z'), reviewedAt: new Date('2026-10-13T10:15:00Z') },
      { week: 5, title: 'Tuần 5: Viết Unit Test và Integration Test bằng Jest', content: 'Đạt độ bao phủ kiểm thử Unit Test 82% cho các Service chính, viết mock database và kiểm thử tự động trên GitHub Actions.', status: ReportStatus.APPROVED, feedback: 'Độ bao phủ test rất tốt, cần tiếp tục phát huy.', submittedAt: new Date('2026-10-20T14:00:00Z'), reviewedAt: new Date('2026-10-20T14:00:00Z') },
      { week: 6, title: 'Tuần 6: Tối ưu hiệu năng truy vấn và triển khai Redis Caching', content: 'Áp dụng bộ nhớ đệm Redis Cache cho các API đọc dữ liệu tần suất cao, giảm thời gian phản hồi từ 180ms xuống 25ms.', status: ReportStatus.APPROVED, feedback: 'Rất ấn tượng với kết quả benchmark đo lường hiệu năng.', submittedAt: new Date('2026-10-27T16:00:00Z'), reviewedAt: new Date('2026-10-27T16:00:00Z') },
      { week: 7, title: 'Tuần 7: Đóng gói ứng dụng với Docker Compose và chuẩn bị tài liệu bàn giao', content: 'Tối ưu hóa Dockerfile đa tầng (multi-stage build), giảm dung lượng image từ 1.2GB xuống còn 180MB.', status: ReportStatus.APPROVED, feedback: 'Thầy đánh giá rất cao tinh thần tự học hỏi và áp dụng kỹ thuật tiên tiến.', submittedAt: new Date('2026-11-03T10:00:00Z'), reviewedAt: new Date('2026-11-03T10:00:00Z') },
      { week: 8, title: 'Tuần 8: Tích hợp hệ thống thông báo realtime qua Socket.io', content: 'Hiện thực WebSocket Gateway gửi thông báo trạng thái tức thời cho client. Đã kiểm thử ổn định với 1,000 kết nối đồng thời.', status: ReportStatus.SUBMITTED, feedback: null, submittedAt: new Date('2026-11-07T09:00:00Z'), reviewedAt: null },
      { week: 9, title: 'Tuần 9: Chuẩn bị slide báo cáo và tổng kết đồ án thực tập tốt nghiệp', content: 'Đang tổng hợp các tính năng đã hoàn thiện, chuẩn bị số liệu đánh giá kết quả thực tập.', status: ReportStatus.DRAFT, feedback: null, submittedAt: new Date('2026-11-07T10:00:00Z'), reviewedAt: null },
    ],
  },

  // 6. Bùi Gia Huy tại VinFast (Tuần 5 REJECTED)
  {
    applicationId: 'seed-app-huy-vinfast-accepted',
    studentEmail: 'student.reported@student.hcmut.edu.vn',
    companyEmail: 'vinfast.careers@vinfast.vn',
    internshipId: 'seed-internship-current-vinfast-ev',
    semesterName: 'Học kỳ 1 (2026 - 2027) - Kỳ Thu [Hiện tại]',
    status: PlacementStatus.ACTIVE,
    academicStatus: AcademicMonitoringStatus.ACTIVE,
    startDate: new Date('2026-09-15T00:00:00Z'),
    endDate: new Date('2026-11-24T23:59:59Z'),
    supervision: {
      lecturerEmail: 'lecturer.fme@careerbridge.edu.vn',
      status: SupervisionStatus.ACTIVE,
      assignedAt: new Date('2026-09-10T08:00:00Z'),
    },
    reports: [
      { week: 1, title: 'Tuần 1: Quy định an toàn điện cao áp xưởng thử nghiệm VinFast', content: 'Được huấn luyện quy chuẩn an toàn cao áp và cấu trúc pin xe điện VF8.', status: ReportStatus.APPROVED, feedback: 'Đạt yêu cầu.', submittedAt: new Date('2026-09-20T00:00:00Z'), reviewedAt: new Date('2026-09-25T00:00:00Z') },
      { week: 2, title: 'Tuần 2: Đo kiểm điện áp và nội trở cell pin Lithium-ion', content: 'Sử dụng máy đo nội trở chuyên dụng HIOKI kiểm tra 120 cell pin.', status: ReportStatus.APPROVED, feedback: 'Tốt.', submittedAt: new Date('2026-09-27T00:00:00Z'), reviewedAt: new Date('2026-10-02T00:00:00Z') },
      { week: 3, title: 'Tuần 3: Khảo sát hệ thống làm mát bằng chất lỏng khối pin', content: 'Ghi nhận lưu lượng và nhiệt độ dòng coolant tuần hoàn qua khay pin.', status: ReportStatus.APPROVED, feedback: 'Đạt.', submittedAt: new Date('2026-10-04T00:00:00Z'), reviewedAt: new Date('2026-10-08T00:00:00Z') },
      { week: 4, title: 'Tuần 4: Lập trình thu thập dữ liệu qua cổng CAN Bus xe thử nghiệm', content: 'Kết nối máy tính nhúng ghi log các frame CAN Bus từ bộ điều khiển pin BMS.', status: ReportStatus.APPROVED, feedback: 'Tốt.', submittedAt: new Date('2026-10-11T00:00:00Z'), reviewedAt: new Date('2026-10-15T00:00:00Z') },
      { week: 5, title: 'Tuần 5: Thu thập dữ liệu cảm biến CAN Bus khi chạy thử xe', content: 'Ghi lại các file log CAN Bus từ cổng OBD-II khi xe chạy trên đường thử.', status: ReportStatus.REJECTED, feedback: 'Báo cáo quá sơ sài. Em cần bổ sung sơ đồ giải mã ID các frame CAN Bus (tốc độ xe, nhiệt độ pin, dòng điện sạc) và đồ thị phân tích cụ thể trước khi nộp lại.', submittedAt: new Date('2026-10-20T10:00:00Z'), reviewedAt: new Date('2026-10-23T15:00:00Z') },
    ],
  },

  // 7. Nguyễn Minh Khoa tại VNG (Tuần 8 SUBMITTED)
  {
    applicationId: 'seed-app-khoa-vng-accepted',
    studentEmail: 'khoa.nguyen@student.hcmut.edu.vn',
    companyEmail: 'vng.recruitment@vng.com.vn',
    internshipId: 'seed-internship-current-vng-backend',
    semesterName: 'Học kỳ 1 (2026 - 2027) - Kỳ Thu [Hiện tại]',
    status: PlacementStatus.ACTIVE,
    academicStatus: AcademicMonitoringStatus.ACTIVE,
    startDate: new Date('2026-09-15T00:00:00Z'),
    endDate: new Date('2026-11-24T23:59:59Z'),
    supervision: {
      lecturerEmail: 'lecturer.cse2@careerbridge.edu.vn',
      status: SupervisionStatus.ACTIVE,
      assignedAt: new Date('2026-09-10T08:00:00Z'),
    },
    reports: [
      { week: 1, title: 'Tuần 1: Tìm hiểu hạ tầng mạng VNGGames và cài đặt môi trường Golang', content: 'Thiết lập môi trường phát triển Golang, làm quen với Git flow nội bộ và tìm hiểu cấu trúc microservices cụm game server.', status: ReportStatus.APPROVED, feedback: 'Báo cáo tốt, nắm bắt quy trình nhanh.', submittedAt: new Date('2026-09-22T00:00:00Z'), reviewedAt: new Date('2026-09-23T00:00:00Z') },
      { week: 2, title: 'Tuần 2: Xây dựng TCP Gateway xử lý gói tin nhị phân Protobuf', content: 'Hiện thực module giải mã Protobuf và định tuyến gói tin mạng thời gian thực.', status: ReportStatus.APPROVED, feedback: 'Khá ấn tượng với cách tối ưu bộ nhớ heap trong Go.', submittedAt: new Date('2026-09-29T00:00:00Z'), reviewedAt: new Date('2026-09-30T00:00:00Z') },
      { week: 3, title: 'Tuần 3: Đồng bộ trạng thái phòng chơi bằng Redis Pub/Sub', content: 'Sử dụng Redis Pub/Sub và Lua Scripting để đảm bảo tính nguyên tử khi người chơi vào/rời phòng.', status: ReportStatus.APPROVED, feedback: 'Xử lý race condition rất chuẩn.', submittedAt: new Date('2026-10-06T00:00:00Z'), reviewedAt: new Date('2026-10-07T00:00:00Z') },
      { week: 4, title: 'Tuần 4: Tích hợp Kafka xử lý ghi nhận lịch sử trận đấu (Game Match History)', content: 'Đẩy event trận đấu vào topic Kafka để lưu trữ phân tích bất đồng bộ xuống ClickHouse.', status: ReportStatus.APPROVED, feedback: 'Tốt, hệ thống chạy trơn tru.', submittedAt: new Date('2026-10-13T00:00:00Z'), reviewedAt: new Date('2026-10-14T00:00:00Z') },
      { week: 5, title: 'Tuần 5: Kiểm thử chịu tải Stress Test với k6 (Benchmark 15,000 CCU)', content: 'Viết kịch bản test k6 đo lường độ trễ mạng P99 đạt dưới 12ms khi có 15,000 người chơi đồng thời.', status: ReportStatus.APPROVED, feedback: 'Kết quả benchmark rất ấn tượng.', submittedAt: new Date('2026-10-20T00:00:00Z'), reviewedAt: new Date('2026-10-21T00:00:00Z') },
      { week: 6, title: 'Tuần 6: Tối ưu Garbage Collection (Go GC Tuning) và CPU Profiling', content: 'Sử dụng pprof phân tích cấp phát bộ nhớ, tái sử dụng sync.Pool giảm 35% áp lực thu gom rác GC.', status: ReportStatus.APPROVED, feedback: 'Thầy đánh giá rất cao độ sâu kỹ thuật của em.', submittedAt: new Date('2026-10-27T00:00:00Z'), reviewedAt: new Date('2026-10-28T00:00:00Z') },
      { week: 7, title: 'Tuần 7: Đóng gói Helm Chart và triển khai thử nghiệm lên cụm Kubernetes', content: 'Viết Helm template cấu hình Horizontal Pod Autoscaler (HPA) tự động co giãn theo ngưỡng CPU 70%.', status: ReportStatus.APPROVED, feedback: 'Đạt yêu cầu.', submittedAt: new Date('2026-11-03T00:00:00Z'), reviewedAt: new Date('2026-11-04T00:00:00Z') },
      { week: 8, title: 'Tuần 8: Hoàn thiện tính năng Ghép trận Xếp hạng (Matchmaking Rating System)', content: 'Hiện thực thuật toán ghép trận dựa trên chỉ số ELO và thời gian chờ của người chơi.', status: ReportStatus.SUBMITTED, feedback: null, submittedAt: new Date('2026-11-07T11:00:00Z'), reviewedAt: null },
    ],
  },

  // 8. Huỳnh Tuấn Kiệt tại Axon (Tuần 8 APPROVED)
  {
    applicationId: 'seed-app-kiet-axon-accepted',
    studentEmail: 'kiet.huynh@student.hcmut.edu.vn',
    companyEmail: 'axon.careers@axon.com',
    internshipId: 'seed-internship-current-axon-cloud',
    semesterName: 'Học kỳ 1 (2026 - 2027) - Kỳ Thu [Hiện tại]',
    status: PlacementStatus.ACTIVE,
    academicStatus: AcademicMonitoringStatus.ACTIVE,
    startDate: new Date('2026-09-15T00:00:00Z'),
    endDate: new Date('2026-11-24T23:59:59Z'),
    supervision: {
      lecturerEmail: 'lecturer.cse@careerbridge.edu.vn',
      status: SupervisionStatus.ACTIVE,
      assignedAt: new Date('2026-09-10T08:00:00Z'),
    },
    reports: Array.from({ length: 8 }, (_, i) => ({
      week: i + 1,
      title: `Tuần ${i + 1}: Tự động hóa hạ tầng đám mây AWS với Terraform và Kubernetes EKS`,
      content: `Nội dung tuần ${i + 1}: Triển khai cụm AWS EKS đa vùng (Multi-AZ), cấu hình Ingress Nginx, quản trị IAM Role và giám sát Datadog APM.`,
      status: ReportStatus.APPROVED,
      feedback: 'Kiệt làm việc rất độc lập và chuyên nghiệp, kỹ năng Cloud rất vững.',
      submittedAt: new Date(`2026-09-${20 + i > 30 ? '10-05' : 20 + i}T00:00:00Z`),
      reviewedAt: new Date(`2026-09-${22 + i > 30 ? '10-07' : 22 + i}T00:00:00Z`),
    })),
  },

  // 9. Trịnh Quốc Cường tại Renesas Design (Tuần 8 DRAFT)
  {
    applicationId: 'seed-app-cuong-renesas-accepted',
    studentEmail: 'cuong.trinh@student.hcmut.edu.vn',
    companyEmail: 'renesas.careers@lm.renesas.com',
    internshipId: 'seed-internship-current-renesas-ic',
    semesterName: 'Học kỳ 1 (2026 - 2027) - Kỳ Thu [Hiện tại]',
    status: PlacementStatus.ACTIVE,
    academicStatus: AcademicMonitoringStatus.ACTIVE,
    startDate: new Date('2026-09-15T00:00:00Z'),
    endDate: new Date('2026-11-24T23:59:59Z'),
    supervision: {
      lecturerEmail: 'lecturer.feee2@careerbridge.edu.vn',
      status: SupervisionStatus.ACTIVE,
      assignedAt: new Date('2026-09-10T08:00:00Z'),
    },
    reports: [
      ...Array.from({ length: 7 }, (_, i) => ({
        week: i + 1,
        title: `Tuần ${i + 1}: Lập trình firmware điều khiển ngoại vi chip ô tô Renesas RH850`,
        content: `Nội dung tuần ${i + 1}: Cấu hình driver ngoại vi CAN FD, ADC, Timer ngắt và kiểm tra tương thích giao tiếp với ECU.`,
        status: ReportStatus.APPROVED,
        feedback: 'Code sạch, bám sát datasheet vi điều khiển.',
        submittedAt: new Date('2026-09-22T00:00:00Z'),
        reviewedAt: new Date('2026-09-25T00:00:00Z'),
      })),
      {
        week: 8,
        title: 'Tuần 8: Thử nghiệm giao thức chẩn đoán UDS (ISO 14229) trên vi điều khiển',
        content: 'Đang hiện thực dịch vụ đọc mã lỗi DTC và nạp firmware qua cổng CAN bootloader.',
        status: ReportStatus.DRAFT,
        feedback: null,
      },
    ],
  },

  // 10. Chu Thị Thanh Hằng tại Unilever (Tuần 8 SUBMITTED)
  {
    applicationId: 'seed-app-hang-unilever-accepted',
    studentEmail: 'hang.chu@student.hcmut.edu.vn',
    companyEmail: 'unilever.careers@unilever.com',
    internshipId: 'seed-internship-current-unilever-qa',
    semesterName: 'Học kỳ 1 (2026 - 2027) - Kỳ Thu [Hiện tại]',
    status: PlacementStatus.ACTIVE,
    academicStatus: AcademicMonitoringStatus.ACTIVE,
    startDate: new Date('2026-09-15T00:00:00Z'),
    endDate: new Date('2026-11-24T23:59:59Z'),
    supervision: {
      lecturerEmail: 'lecturer.fce2@careerbridge.edu.vn',
      status: SupervisionStatus.ACTIVE,
      assignedAt: new Date('2026-09-10T08:00:00Z'),
    },
    reports: [
      ...Array.from({ length: 7 }, (_, i) => ({
        week: i + 1,
        title: `Tuần ${i + 1}: Kiểm soát quy trình sản xuất và chất lượng hóa mỹ phẩm nhà máy Củ Chi`,
        content: `Nội dung tuần ${i + 1}: Lấy mẫu kiểm tra độ pH, độ nhớt và hàm lượng chất hoạt động bề mặt theo quy chuẩn quốc tế Unilever.`,
        status: ReportStatus.APPROVED,
        feedback: 'Thực hiện thí nghiệm cẩn thận, ghi chép nhật ký phân tích rõ ràng.',
        submittedAt: new Date('2026-09-22T00:00:00Z'),
        reviewedAt: new Date('2026-09-25T00:00:00Z'),
      })),
      {
        week: 8,
        title: 'Tuần 8: Tối ưu hóa chu trình tẩy rửa bồn trộn CIP (Clean-in-Place)',
        content: 'Đánh giá nồng độ dung dịch kiềm xút và nhiệt độ nước rửa tuần hoàn, giúp tiết kiệm 12% lượng nước sạch dùng trong vệ sinh dây chuyền.',
        status: ReportStatus.SUBMITTED,
        feedback: null,
        submittedAt: new Date('2026-11-07T14:30:00Z'),
        reviewedAt: null,
      },
    ],
  },

  // =========================================================================
  // 3. PLACEMENTS KỲ TUYỂN DỤNG (KỲ XUÂN 2027 - PENDING / UNASSIGNED)
  // =========================================================================
  // 11. Lê Minh Tuấn tại Viettel (CHƯA PHÂN CÔNG GVHD - UNASSIGNED)
  {
    applicationId: 'seed-app-tuan-viettel-accepted',
    studentEmail: 'student.unassigned@student.hcmut.edu.vn',
    companyEmail: 'viettel.solutions@viettel.com.vn',
    internshipId: 'seed-internship-recruiting-viettel-sec',
    semesterName: 'Học kỳ 2 (2026 - 2027) - Kỳ Xuân [Đang tuyển dụng]',
    status: PlacementStatus.ACTIVE,
    academicStatus: AcademicMonitoringStatus.PENDING,
    startDate: new Date('2026-12-15T00:00:00Z'),
    endDate: new Date('2027-02-23T23:59:59Z'),
    reports: [],
  },

  // 12. Võ Thị Mỹ Duyên tại Coteccons Green (ĐÃ TRÚNG TUYỂN - PENDING)
  {
    applicationId: 'seed-app-duyen-coteccons-accepted',
    studentEmail: 'duyen.vo@student.hcmut.edu.vn',
    companyEmail: 'coteccons.careers@coteccons.vn',
    internshipId: 'seed-internship-recruiting-coteccons-green',
    semesterName: 'Học kỳ 2 (2026 - 2027) - Kỳ Xuân [Đang tuyển dụng]',
    status: PlacementStatus.ACTIVE,
    academicStatus: AcademicMonitoringStatus.PENDING,
    startDate: new Date('2026-12-15T00:00:00Z'),
    endDate: new Date('2027-02-23T23:59:59Z'),
    supervision: {
      lecturerEmail: 'lecturer.civil@careerbridge.edu.vn',
      status: SupervisionStatus.ACTIVE,
      assignedAt: new Date('2026-11-07T15:00:00Z'),
    },
    reports: [],
  },
];
