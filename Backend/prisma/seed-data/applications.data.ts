import {
  ApplicationStatus,
  InterviewMode,
  EmailLogType,
  EmailLogStatus,
  AiScanStatus,
  AiCandidateRecommendation,
} from '../../src/generated/prisma/client';

export interface ApplicationInterviewSeed {
  scheduledAt: Date;
  mode: InterviewMode;
  meetingLink?: string;
  location?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  note?: string;
}

export interface ApplicationEmailLogSeed {
  type: EmailLogType;
  to: string;
  subject: string;
  html: string;
  status: EmailLogStatus;
  sentAt: Date;
}

export interface ApplicationAiScanSeed {
  status: AiScanStatus;
  aiScore: number;
  recommendation: AiCandidateRecommendation;
  experienceYears: number;
  extractedSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  weaknesses: string[];
  summary: string;
}

export interface ApplicationSeedItem {
  id: string;
  studentEmail: string;
  internshipId: string;
  coverLetter?: string;
  status: ApplicationStatus;
  matchScore?: number;
  aiScore?: number;
  companyFeedback?: string;
  rejectionReason?: string;
  appliedAt: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
  withdrawnAt?: Date;
  offeredAt?: Date;
  offerExpiresAt?: Date;
  offerMessage?: string;
  respondedAt?: Date;
  interview?: ApplicationInterviewSeed;
  emailLogs?: ApplicationEmailLogSeed[];
  aiScan?: ApplicationAiScanSeed;
}

export const applicationsData: ApplicationSeedItem[] = [
  // =========================================================================
  // 1. CÁC ĐƠN ACCEPTED (12 ĐƠN -> TRỞ THÀNH 12 PLACEMENTS)
  // =========================================================================
  // 1. Nguyễn Hoàng Long - FPT Software Backend (Kỳ Thu 2026 - Active Tuần 8)
  {
    id: 'seed-app-long-fpt-accepted',
    studentEmail: 'student.interning@student.hcmut.edu.vn',
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
    aiScan: {
      status: AiScanStatus.COMPLETED,
      aiScore: 90.0,
      recommendation: AiCandidateRecommendation.STRONG_HIRE,
      experienceYears: 1.0,
      extractedSkills: ['TypeScript', 'NestJS', 'PostgreSQL', 'Docker', 'Git'],
      matchedSkills: ['TypeScript', 'NestJS', 'PostgreSQL', 'Docker'],
      missingSkills: ['Redis'],
      strengths: ['Nền tảng backend NestJS vững vàng', 'Dự án thực tế có kiến trúc rõ ràng', 'GPA giỏi'],
      weaknesses: ['Cần tích lũy thêm kinh nghiệm về caching và message queue'],
      summary: 'Ứng viên rất sáng giá, phù hợp cao với dự án GDU1 của công ty.',
    },
  },

  // 2. Trần Thị Mai Anh - Bosch Vision (Kỳ Xuân 2026 - Đã COMPLETED xuất sắc)
  {
    id: 'seed-app-maianh-bosch-accepted',
    studentEmail: 'student.completed@student.hcmut.edu.vn',
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
    aiScan: {
      status: AiScanStatus.COMPLETED,
      aiScore: 95.0,
      recommendation: AiCandidateRecommendation.STRONG_HIRE,
      experienceYears: 1.5,
      extractedSkills: ['Python', 'Machine Learning', 'PyTorch', 'Computer Vision'],
      matchedSkills: ['Python', 'Machine Learning', 'PyTorch', 'Computer Vision'],
      missingSkills: [],
      strengths: ['Toán giải tích và đại số tuyến tính xuất sắc', 'Tiếng Anh chuẩn quốc tế', 'Bài báo khoa học tiềm năng'],
      weaknesses: [],
      summary: 'Ứng viên top đầu ngành KHMT, đề xuất tuyển thẳng.',
    },
  },

  // 3. Đỗ Thùy Dương - Tân Cảng Logistics (Kỳ Thu 2025 - Đã COMPLETED)
  {
    id: 'seed-app-duong-newport-accepted',
    studentEmail: 'student.sim@student.hcmut.edu.vn',
    internshipId: 'seed-internship-past-newport-2025',
    coverLetter: 'Em là Đỗ Thùy Dương, sinh viên Logistics ĐHBK, mong muốn được thực tập và học hỏi nghiệp vụ khai thác cảng tại Cát Lái.',
    status: ApplicationStatus.ACCEPTED,
    matchScore: 90.0,
    aiScore: 88.0,
    appliedAt: new Date('2025-08-05T10:00:00Z'),
    acceptedAt: new Date('2025-08-18T16:00:00Z'),
    offeredAt: new Date('2025-08-15T11:00:00Z'),
  },

  // 4. Trương Hữu Nghĩa - Coteccons Kết cấu (Kỳ Xuân 2026 - Đã COMPLETED)
  {
    id: 'seed-app-nghia-coteccons-accepted',
    studentEmail: 'nghia.truong@student.hcmut.edu.vn',
    internshipId: 'seed-internship-past-coteccons-2026',
    coverLetter: 'Kính gửi Ban Chỉ huy Công trường Coteccons, em là Trương Hữu Nghĩa, sinh viên ngành Xây dựng ĐHBK. Em mong muốn được cọ xát thực tế thi công kết cấu bê tông cốt thép tại các dự án cao tầng.',
    status: ApplicationStatus.ACCEPTED,
    matchScore: 93.0,
    aiScore: 91.0,
    companyFeedback: 'Sinh viên đọc bản vẽ kết cấu nhanh, nắm chắc tiêu chuẩn xây dựng và tác phong công trường nghiêm túc.',
    appliedAt: new Date('2025-12-08T09:00:00Z'),
    acceptedAt: new Date('2025-12-22T14:00:00Z'),
    offeredAt: new Date('2025-12-19T10:00:00Z'),
    respondedAt: new Date('2025-12-20T11:00:00Z'),
  },

  // 5. Mai Phương Uyên - Renesas RTL (Kỳ Thu 2025 - Đã COMPLETED)
  {
    id: 'seed-app-uyen-renesas-accepted',
    studentEmail: 'uyen.mai@student.hcmut.edu.vn',
    internshipId: 'seed-internship-past-renesas-2025',
    coverLetter: 'Em là Mai Phương Uyên, sinh viên Thiết kế Vi mạch. Em mong muốn được làm việc với các chuyên gia thiết kế SoC hàng đầu tại Renesas RVC.',
    status: ApplicationStatus.ACCEPTED,
    matchScore: 97.0,
    aiScore: 96.0,
    companyFeedback: 'Nắm rất vững SystemVerilog và thiết kế mạch logic số, hoàn thành bài test RTL Design đạt 98/100 điểm.',
    appliedAt: new Date('2025-08-08T08:00:00Z'),
    acceptedAt: new Date('2025-08-22T15:00:00Z'),
    offeredAt: new Date('2025-08-19T10:00:00Z'),
  },

  // 6. Bùi Gia Huy - VinFast Pin Xe điện (Kỳ Thu 2026 - Active Tuần 8)
  {
    id: 'seed-app-huy-vinfast-accepted',
    studentEmail: 'student.reported@student.hcmut.edu.vn',
    internshipId: 'seed-internship-current-vinfast-ev',
    coverLetter: 'Em yêu thích công nghệ ô tô điện và rất mong muốn được trải nghiệm môi trường kỹ thuật hiện đại tại VinFast.',
    status: ApplicationStatus.ACCEPTED,
    matchScore: 85.0,
    aiScore: 82.0,
    appliedAt: new Date('2026-08-08T09:00:00Z'),
    acceptedAt: new Date('2026-08-22T14:00:00Z'),
    offeredAt: new Date('2026-08-19T16:00:00Z'),
  },

  // 7. Nguyễn Minh Khoa - VNG Golang (Kỳ Thu 2026 - Active Tuần 8)
  {
    id: 'seed-app-khoa-vng-accepted',
    studentEmail: 'khoa.nguyen@student.hcmut.edu.vn',
    internshipId: 'seed-internship-current-vng-backend',
    coverLetter: 'Em là Nguyễn Minh Khoa, sinh viên K21 KHMT ĐHBK. Em có kinh nghiệm lập trình mạng phân tán với Golang và Kafka, khao khát được đóng góp cho hệ sinh thái game tại VNG.',
    status: ApplicationStatus.ACCEPTED,
    matchScore: 94.0,
    aiScore: 93.0,
    companyFeedback: 'Tư duy thuật toán và lập trình concurrency rất tốt, giải quyết bài toán đồng bộ dữ liệu xuất sắc trong buổi phỏng vấn kỹ thuật.',
    appliedAt: new Date('2026-08-10T10:00:00Z'),
    acceptedAt: new Date('2026-08-24T16:00:00Z'),
    offeredAt: new Date('2026-08-20T14:00:00Z'),
    respondedAt: new Date('2026-08-21T09:00:00Z'),
    offerMessage: 'VNG vui mừng chào đón bạn gia nhập VNGGames Platform với mức phụ cấp thực tập 8,500,000 VNĐ/tháng.',
  },

  // 8. Huỳnh Tuấn Kiệt - Axon Cloud (Kỳ Thu 2026 - Active Tuần 8)
  {
    id: 'seed-app-kiet-axon-accepted',
    studentEmail: 'kiet.huynh@student.hcmut.edu.vn',
    internshipId: 'seed-internship-current-axon-cloud',
    coverLetter: 'Em là Huỳnh Tuấn Kiệt, sinh viên ngành Mạng máy tính & ATTT. Em am hiểu hạ tầng đám mây AWS và Kubernetes, mong muốn được thực tập tại Axon Việt Nam.',
    status: ApplicationStatus.ACCEPTED,
    matchScore: 95.0,
    aiScore: 94.0,
    companyFeedback: 'Hands-on AWS và Terraform rất ấn tượng, tiếng Anh giao tiếp chuẩn và tinh thần Ownership cao.',
    appliedAt: new Date('2026-08-12T11:00:00Z'),
    acceptedAt: new Date('2026-08-26T17:00:00Z'),
    offeredAt: new Date('2026-08-22T10:00:00Z'),
    respondedAt: new Date('2026-08-23T14:00:00Z'),
    offerMessage: 'Axon Việt Nam trân trọng gửi thư mời thực tập vị trí Cloud Platform Intern với mức lương hỗ trợ 11,000,000 VNĐ/tháng.',
  },

  // 9. Trịnh Quốc Cường - Renesas MCU Nhúng (Kỳ Thu 2026 - Active Tuần 8)
  {
    id: 'seed-app-cuong-renesas-accepted',
    studentEmail: 'cuong.trinh@student.hcmut.edu.vn',
    internshipId: 'seed-internship-current-renesas-ic',
    coverLetter: 'Em là Trịnh Quốc Cường, sinh viên ngành Điều khiển & Tự động hóa. Em đam mê lập trình vi điều khiển nhúng ô tô ARM Cortex-M và giao thức CAN Bus.',
    status: ApplicationStatus.ACCEPTED,
    matchScore: 91.0,
    aiScore: 89.0,
    companyFeedback: 'Hiểu sâu về cấu trúc thanh ghi phần cứng vi điều khiển, kỹ năng debug logic analyzer tốt.',
    appliedAt: new Date('2026-08-11T09:30:00Z'),
    acceptedAt: new Date('2026-08-25T14:00:00Z'),
    offeredAt: new Date('2026-08-21T11:00:00Z'),
    respondedAt: new Date('2026-08-22T15:00:00Z'),
  },

  // 10. Chu Thị Thanh Hằng - Unilever Hóa mỹ phẩm (Kỳ Thu 2026 - Active Tuần 8)
  {
    id: 'seed-app-hang-unilever-accepted',
    studentEmail: 'hang.chu@student.hcmut.edu.vn',
    internshipId: 'seed-internship-current-unilever-qa',
    coverLetter: 'Em là Chu Thị Thanh Hằng, sinh viên Kỹ thuật Hóa học. Em mong muốn áp dụng kiến thức mô phỏng quy trình và kiểm soát chất lượng vào nhà máy sản xuất FMCG chuẩn quốc tế tại Unilever.',
    status: ApplicationStatus.ACCEPTED,
    matchScore: 92.0,
    aiScore: 90.0,
    companyFeedback: 'Kỹ năng phân tích thí nghiệm cẩn thận, hiểu rõ nguyên lý an toàn phòng thí nghiệm GLP và chuẩn sản xuất WCM.',
    appliedAt: new Date('2026-08-09T14:00:00Z'),
    acceptedAt: new Date('2026-08-23T16:00:00Z'),
    offeredAt: new Date('2026-08-20T09:00:00Z'),
    respondedAt: new Date('2026-08-21T10:00:00Z'),
  },

  // 11. Lê Minh Tuấn - Viettel Solutions (Kỳ Xuân 2027 - UNASSIGNED để Admin test gán GVHD)
  {
    id: 'seed-app-tuan-viettel-accepted',
    studentEmail: 'student.unassigned@student.hcmut.edu.vn',
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

  // 12. Võ Thị Mỹ Duyên - Coteccons Green (Kỳ Xuân 2027 - PENDING đợt thực tập)
  {
    id: 'seed-app-duyen-coteccons-accepted',
    studentEmail: 'duyen.vo@student.hcmut.edu.vn',
    internshipId: 'seed-internship-recruiting-coteccons-green',
    coverLetter: 'Em là Võ Thị Mỹ Duyên, sinh viên ngành Kỹ thuật Môi trường. Em mong muốn đồng hành cùng Coteccons trong các giải pháp công trình xanh LEED và kiểm soát tác động môi trường thi công.',
    status: ApplicationStatus.ACCEPTED,
    matchScore: 90.0,
    aiScore: 88.5,
    appliedAt: new Date('2026-11-03T09:00:00Z'),
    acceptedAt: new Date('2026-11-07T14:00:00Z'),
    offeredAt: new Date('2026-11-06T10:00:00Z'),
    respondedAt: new Date('2026-11-07T09:00:00Z'),
  },

  // =========================================================================
  // 2. CÁC ĐƠN OFFERED (CHỜ SINH VIÊN PHẢN HỒI)
  // =========================================================================
  // 13. Phạm Hoàng Sơn - OFFERED (FPT Software Backend)
  {
    id: 'seed-app-son-fpt-backend-offered',
    studentEmail: 'pson4282@gmail.com',
    internshipId: 'seed-internship-current-fpt-backend',
    coverLetter: 'Em là Phạm Hoàng Sơn, sinh viên năm 4 đam mê kiến trúc Backend và hệ thống phân tán cao tải.',
    status: ApplicationStatus.OFFERED,
    matchScore: 96.0,
    aiScore: 95.0,
    companyFeedback: 'Ứng viên làm bài kiểm tra kỹ thuật Backend đạt điểm tối đa, hiểu sâu về tối ưu hóa cơ sở dữ liệu và bảo mật JWT / RBAC.',
    appliedAt: new Date('2026-10-18T09:00:00Z'),
    offeredAt: new Date('2026-10-28T14:00:00Z'),
    offerExpiresAt: new Date('2026-11-20T23:59:59Z'),
    offerMessage: 'FPT Software trân trọng gửi thư mời thực tập vị trí Backend Developer đến bạn Phạm Hoàng Sơn. Mức phụ cấp thực tập: 8,500,000 VNĐ/tháng.',
    aiScan: {
      status: AiScanStatus.COMPLETED,
      aiScore: 95.0,
      recommendation: AiCandidateRecommendation.STRONG_HIRE,
      experienceYears: 1.5,
      extractedSkills: ['NestJS', 'TypeScript', 'PostgreSQL', 'Redis', 'Docker', 'Prisma ORM'],
      matchedSkills: ['NestJS', 'TypeScript', 'PostgreSQL', 'Docker'],
      missingSkills: [],
      strengths: ['Dự án cá nhân TeamZoneVN có độ phức tạp cao, triển khai thực tế trên AWS', 'Kỹ năng thiết kế CSDL và bảo mật toàn diện'],
      weaknesses: [],
      summary: 'Ứng viên vượt trội, kỹ năng tương đương Fresher/Junior.',
    },
  },

  // 14. Vũ Phương Linh - OFFERED (FPT Fullstack)
  {
    id: 'seed-app-linh-fpt-offered',
    studentEmail: 'student.offered@student.hcmut.edu.vn',
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

  // 15. Lê Hoàng Yến - OFFERED (VNG Frontend Zalo Mini App)
  {
    id: 'seed-app-yen-vng-offered',
    studentEmail: 'yen.le@student.hcmut.edu.vn',
    internshipId: 'seed-internship-recruiting-vng-fe',
    coverLetter: 'Em là Lê Hoàng Yến, đam mê phát triển giao diện hiện đại bằng React và Next.js. Em mong muốn tham gia phát triển hệ sinh thái Zalo Mini App tại VNG.',
    status: ApplicationStatus.OFFERED,
    matchScore: 93.0,
    aiScore: 91.0,
    companyFeedback: 'Bài test giao diện React rất mượt mà, kỹ năng responsive và component modular xuất sắc.',
    appliedAt: new Date('2026-11-03T10:00:00Z'),
    offeredAt: new Date('2026-11-07T11:00:00Z'),
    offerExpiresAt: new Date('2026-11-15T23:59:59Z'),
    offerMessage: 'VNG trân trọng mời bạn Lê Hoàng Yến gia nhập đội ngũ Zalo Mini App với mức hỗ trợ 9,000,000 VNĐ/tháng.',
  },

  // 16. Phan Thị Quỳnh Nga - OFFERED (Axon Edge AI Camera)
  {
    id: 'seed-app-nga-axon-offered',
    studentEmail: 'nga.phan@student.hcmut.edu.vn',
    internshipId: 'seed-internship-recruiting-axon-ai',
    coverLetter: 'Em là Phan Thị Quỳnh Nga, sinh viên chuyên ngành AI/DS. Em có kinh nghiệm thực chiến tối ưu hóa mô hình YOLO chạy thời gian thực trên Jetson Orin Nano.',
    status: ApplicationStatus.OFFERED,
    matchScore: 96.0,
    aiScore: 95.0,
    companyFeedback: 'Hiểu sâu về Computer Vision và kiến trúc mô hình học sâu, bài thuyết trình kỹ thuật bằng tiếng Anh rất tự tin và xuất sắc.',
    appliedAt: new Date('2026-11-02T15:00:00Z'),
    offeredAt: new Date('2026-11-08T09:00:00Z'),
    offerExpiresAt: new Date('2026-11-18T23:59:59Z'),
    offerMessage: 'Axon Việt Nam hân hạnh gửi lời mời thực tập vị trí Computer Vision Intern đến bạn Phan Thị Quỳnh Nga với mức đãi ngộ 12,000,000 VNĐ/tháng.',
  },

  // 17. Đoàn Văn Hậu - OFFERED (SmartLog WMS)
  {
    id: 'seed-app-hau-smartlog-offered',
    studentEmail: 'hau.doan@student.hcmut.edu.vn',
    internshipId: 'seed-internship-recruiting-smartlog-wms',
    coverLetter: 'Em là Đoàn Văn Hậu, sinh viên Quản lý Công nghiệp ĐHBK. Em có kỹ năng phân tích quy trình Lean và Dashboard Power BI, mong muốn thực tập tại SmartLog.',
    status: ApplicationStatus.OFFERED,
    matchScore: 89.0,
    aiScore: 87.0,
    appliedAt: new Date('2026-11-04T10:00:00Z'),
    offeredAt: new Date('2026-11-08T14:00:00Z'),
    offerExpiresAt: new Date('2026-11-16T23:59:59Z'),
    offerMessage: 'SmartLog trân trọng mời bạn tham gia đội ngũ triển khai sản phẩm với phụ cấp 6,500,000 VNĐ/tháng.',
  },

  // =========================================================================
  // 3. CÁC ĐƠN INTERVIEWING (LỊCH PHỎNG VẤN TRỰC TUYẾN & TRỰC TIẾP)
  // =========================================================================
  // 18. Đặng Tuấn Kiệt - INTERVIEWING (Viettel Solutions - Online Google Meet)
  {
    id: 'seed-app-kiet-viettel-interviewing',
    studentEmail: 'student.interviewing@student.hcmut.edu.vn',
    internshipId: 'seed-internship-recruiting-viettel-sec',
    coverLetter: 'Em là Đặng Tuấn Kiệt, sinh viên Cơ điện tử có định hướng an toàn phần cứng và mạng IoT, mong muốn được thử sức tại Viettel.',
    status: ApplicationStatus.INTERVIEWING,
    matchScore: 82.0,
    aiScore: 80.0,
    appliedAt: new Date('2026-11-03T11:30:00Z'),
    interview: {
      scheduledAt: new Date('2026-11-12T09:30:00Z'),
      mode: InterviewMode.ONLINE,
      meetingLink: 'https://meet.google.com/xyz-careerbridge-viettel',
      contactName: 'Lê Quốc Huy (HR Manager)',
      contactEmail: 'huy.le@viettel.com.vn',
      contactPhone: '02462778899',
      note: 'Ứng viên vui lòng chuẩn bị laptop có webcam, micro và chuẩn bị trình bày ngắn gọn về dự án NetWatch trong 10 phút đầu.',
    },
    emailLogs: [
      {
        type: EmailLogType.INTERVIEW_INVITATION,
        to: 'student.interviewing@student.hcmut.edu.vn',
        subject: '[Viettel Solutions] Thư mời tham gia phỏng vấn vị trí SOC Analyst Intern',
        html: '<p>Chào bạn Đặng Tuấn Kiệt, Viettel Solutions trân trọng mời bạn tham gia buổi phỏng vấn trực tuyến qua Google Meet vào lúc 09:30 ngày 12/11/2026.</p>',
        status: EmailLogStatus.SENT,
        sentAt: new Date('2026-11-04T10:00:00Z'),
      },
    ],
  },

  // 19. Trần Quốc Bảo - INTERVIEWING (MoMo AppSec - Online Google Meet)
  {
    id: 'seed-app-bao-momo-interviewing',
    studentEmail: 'bao.tran@student.hcmut.edu.vn',
    internshipId: 'seed-internship-recruiting-momo-appsec',
    coverLetter: 'Em là Trần Quốc Bảo, sinh viên Hệ thống Thông tin ĐHBK. Em có kinh nghiệm thực nghiệm kiểm thử an toàn API OWASP và khao khát được bảo vệ nền tảng MoMo.',
    status: ApplicationStatus.INTERVIEWING,
    matchScore: 88.0,
    aiScore: 87.0,
    appliedAt: new Date('2026-11-04T09:00:00Z'),
    interview: {
      scheduledAt: new Date('2026-11-13T14:00:00Z'),
      mode: InterviewMode.ONLINE,
      meetingLink: 'https://meet.google.com/momo-security-interview',
      contactName: 'Trần Bảo Trâm (HR Lead)',
      contactEmail: 'careers@mservice.com.vn',
      contactPhone: '02854147667',
      note: 'Vui lòng chuẩn bị chia sẻ màn hình để demo công cụ quét lỗ hổng API trong phần phỏng vấn kỹ thuật.',
    },
  },

  // 20. Lương Thế Vinh - INTERVIEWING (VinFast Robot - Trực tiếp tại Nhà máy Cát Hải / VP TP.HCM)
  {
    id: 'seed-app-vinh-vinfast-interviewing',
    studentEmail: 'vinh.luong@student.hcmut.edu.vn',
    internshipId: 'seed-internship-recruiting-vinfast-auto',
    coverLetter: 'Em là Lương Thế Vinh, đam mê lập trình cánh tay robot công nghiệp 6 bậc tự do ABB và Kuka. Em rất mong muốn được trải nghiệm thực tế tại xưởng thân vỏ ô tô thông minh VinFast.',
    status: ApplicationStatus.INTERVIEWING,
    matchScore: 92.0,
    aiScore: 91.0,
    appliedAt: new Date('2026-11-04T14:30:00Z'),
    interview: {
      scheduledAt: new Date('2026-11-14T10:00:00Z'),
      mode: InterviewMode.OFFLINE,
      location: 'Văn phòng VinFast, Tầng 3 Tòa nhà Landmark 81, Vinhomes Central Park, Bình Thạnh, TP.HCM',
      contactName: 'Phạm Hải Đăng (Trưởng phòng Tuyển dụng Kỹ thuật)',
      contactEmail: 'vinfast.careers@vinfast.vn',
      contactPhone: '1900232389',
      note: 'Ứng viên vui lòng mang theo Thẻ sinh viên ĐHBK và bảng điểm gốc khi đến phỏng vấn.',
    },
  },

  // 21. Bùi Thanh Trúc - INTERVIEWING (Vinamilk QA/QC - Trực tiếp tại Trụ sở Q.7)
  {
    id: 'seed-app-truc-vinamilk-interviewing',
    studentEmail: 'truc.bui@student.hcmut.edu.vn',
    internshipId: 'seed-internship-recruiting-vinamilk-qaqc',
    coverLetter: 'Em là Bùi Thanh Trúc, sinh viên ngành Công nghệ Thực phẩm. Em am hiểu hệ thống tiêu chuẩn HACCP và kiểm tra vi sinh thực phẩm, mong muốn được thực tập tại Vinamilk.',
    status: ApplicationStatus.INTERVIEWING,
    matchScore: 89.0,
    aiScore: 88.0,
    appliedAt: new Date('2026-11-05T09:30:00Z'),
    interview: {
      scheduledAt: new Date('2026-11-15T09:00:00Z'),
      mode: InterviewMode.OFFLINE,
      location: 'Trụ sở Vinamilk, Số 10 Tân Trào, Phường Tân Phú, Quận 7, TP. Hồ Chí Minh',
      contactName: 'Bùi Thị Thu Hiền (HR Manager Operations)',
      contactEmail: 'tuyendung@vinamilk.com.vn',
      contactPhone: '02854155555',
      note: 'Phỏng vấn chuyên môn kết hợp kiểm tra kiến thức an toàn thực phẩm cơ bản.',
    },
  },

  // 22. Đỗ Minh Trí - INTERVIEWING (Bosch Hardware - Trực tiếp tại E-Town Central)
  {
    id: 'seed-app-tri-bosch-interviewing',
    studentEmail: 'tri.do@student.hcmut.edu.vn',
    internshipId: 'seed-internship-recruiting-bosch-hw',
    coverLetter: 'Em là Đỗ Minh Trí, có thế mạnh về mạch nguồn công nghiệp và layout mạch in Altium Designer, ứng tuyển vị trí Kỹ sư Thiết kế Phần cứng tại Bosch.',
    status: ApplicationStatus.INTERVIEWING,
    matchScore: 87.0,
    aiScore: 86.0,
    appliedAt: new Date('2026-11-05T15:00:00Z'),
    interview: {
      scheduledAt: new Date('2026-11-16T14:30:00Z'),
      mode: InterviewMode.OFFLINE,
      location: 'Tòa nhà E-Town Central, 11 Đoàn Văn Bơ, Quận 4, TP. Hồ Chí Minh (Lầu 14)',
      contactName: 'Trần Minh Đức (Hardware Engineering Lead)',
      contactEmail: 'bosch.recruitment@bosch.com',
      contactPhone: '02862858888',
      note: 'Ứng viên chuẩn bị portfolio các mạch in PCB mẫu đã tự thiết kế để trình bày với kỹ sư trưởng.',
    },
  },

  // 23. Nguyễn Công Phượng - INTERVIEWING (Shopee SPX Logistics - Online)
  {
    id: 'seed-app-phuong-shopee-interviewing',
    studentEmail: 'phuong.nguyen@student.hcmut.edu.vn',
    internshipId: 'seed-internship-recruiting-shopee-spx',
    coverLetter: 'Em là Nguyễn Công Phượng, sinh viên chuyên ngành Logistics & Chuỗi cung ứng ĐHBK. Em có kỹ năng tối ưu hóa tuyến đường giao hàng và phân tích dữ liệu lớn.',
    status: ApplicationStatus.INTERVIEWING,
    matchScore: 91.0,
    aiScore: 89.5,
    appliedAt: new Date('2026-11-04T16:00:00Z'),
    interview: {
      scheduledAt: new Date('2026-11-14T15:00:00Z'),
      mode: InterviewMode.ONLINE,
      meetingLink: 'https://meet.google.com/shopee-spx-interview',
      contactName: 'Nguyễn Hoàng Yến (Campus Recruiter)',
      contactEmail: 'recruitment@shopee.vn',
      contactPhone: '02873081221',
      note: 'Vòng phỏng vấn định lượng và giải bài toán tình huống tối ưu hóa vận tải giao hàng chặng cuối.',
    },
  },

  // =========================================================================
  // 4. CÁC ĐƠN REVIEWING (ĐANG XEM XÉT HỒ SƠ & AI SCAN)
  // =========================================================================
  // 24. Phạm Hoàng Sơn - REVIEWING (FPT Software Fullstack)
  {
    id: 'seed-app-son-fpt-fullstack-reviewing',
    studentEmail: 'pson4282@gmail.com',
    internshipId: 'seed-internship-recruiting-fpt-fullstack',
    coverLetter: 'Kính gửi Bộ phận Tuyển dụng FPT Software, em là Phạm Hoàng Sơn, sinh viên chuyên ngành Kỹ thuật Phần mềm. Em có kinh nghiệm thực chiến phát triển ứng dụng Backend & Fullstack với NestJS, TypeScript, PostgreSQL, Prisma ORM, Redis và Docker. Em rất mong muốn được gia nhập và cống hiến cho các dự án tại FPT Software.',
    status: ApplicationStatus.REVIEWING,
    matchScore: 95.0,
    aiScore: 94.0,
    companyFeedback: 'Hồ sơ năng lực xuất sắc, các dự án thực tế rất ấn tượng (đã deploy production trên AWS, dùng thuần thục NestJS, Prisma và Redis).',
    appliedAt: new Date('2026-11-06T08:30:00Z'),
    aiScan: {
      status: AiScanStatus.COMPLETED,
      aiScore: 94.0,
      recommendation: AiCandidateRecommendation.STRONG_HIRE,
      experienceYears: 1.5,
      extractedSkills: ['TypeScript', 'NestJS', 'React', 'PostgreSQL', 'Docker', 'Redis', 'Git'],
      matchedSkills: ['TypeScript', 'NestJS', 'React', 'PostgreSQL', 'Docker', 'Git'],
      missingSkills: [],
      strengths: ['Toàn diện kỹ năng Fullstack cả NestJS và React', 'Dự án thực tế deployed production', 'Code sạch, tuân thủ convention'],
      weaknesses: [],
      summary: 'Ứng viên xuất sắc cho vị trí Fullstack Intern, đề xuất mời phỏng vấn ngay.',
    },
  },

  // 25. Phạm Đức Duy - REVIEWING (FPT Software Fullstack)
  {
    id: 'seed-app-duy-fpt-reviewing',
    studentEmail: 'student.jobseeking@student.hcmut.edu.vn',
    internshipId: 'seed-internship-recruiting-fpt-fullstack',
    coverLetter: 'Em là Phạm Đức Duy, có thế mạnh về AI/NLP và Fullstack web, mong muốn ứng tuyển vị trí Fullstack Developer Intern.',
    status: ApplicationStatus.REVIEWING,
    matchScore: 91.0,
    aiScore: 89.0,
    appliedAt: new Date('2026-11-04T15:00:00Z'),
  },

  // 26. Lê Thanh Phong - REVIEWING (NashTech Java & Azure)
  {
    id: 'seed-app-phong-nashtech-reviewing',
    studentEmail: 'phong.le@student.hcmut.edu.vn',
    internshipId: 'seed-internship-recruiting-nashtech-java',
    coverLetter: 'Em là Lê Thanh Phong, sinh viên KTPM. Em có nền tảng Java OOP vững và mong muốn làm việc trong môi trường dự án toàn cầu tại NashTech.',
    status: ApplicationStatus.REVIEWING,
    matchScore: 89.0,
    aiScore: 88.0,
    appliedAt: new Date('2026-11-05T10:00:00Z'),
  },

  // 27. Nguyễn Trọng Nhân - REVIEWING (VNG Golang)
  {
    id: 'seed-app-nhan-vng-reviewing',
    studentEmail: 'nhan.nguyen@student.hcmut.edu.vn',
    internshipId: 'seed-internship-recruiting-vng-golang',
    coverLetter: 'Em đam mê lập trình mạng hiệu năng cao bằng C++ và Golang, khao khát được tối ưu hóa hệ thống Zalo.',
    status: ApplicationStatus.REVIEWING,
    matchScore: 92.0,
    aiScore: 91.0,
    appliedAt: new Date('2026-11-05T14:00:00Z'),
  },

  // 28. Dương Gia Hân - REVIEWING (Vinamilk QA/QC)
  {
    id: 'seed-app-han-vinamilk-reviewing',
    studentEmail: 'han.duong@student.hcmut.edu.vn',
    internshipId: 'seed-internship-recruiting-vinamilk-qaqc',
    coverLetter: 'Em là sinh viên ngành Công nghệ Sinh học, mong muốn ứng dụng kiến thức lên men và vi sinh thực phẩm tại nhà máy Vinamilk.',
    status: ApplicationStatus.REVIEWING,
    matchScore: 86.0,
    aiScore: 85.0,
    appliedAt: new Date('2026-11-06T11:00:00Z'),
  },

  // 29. Nguyễn Tiến Đạt - REVIEWING (Coteccons BIM)
  {
    id: 'seed-app-dat-coteccons-reviewing',
    studentEmail: 'dat.nguyen@student.hcmut.edu.vn',
    internshipId: 'seed-internship-recruiting-coteccons-bim',
    coverLetter: 'Em mong muốn áp dụng kỹ năng mô hình hóa 3D SolidWorks và tự động hóa cơ điện MEP vào các công trình của Coteccons.',
    status: ApplicationStatus.REVIEWING,
    matchScore: 82.0,
    appliedAt: new Date('2026-11-06T14:00:00Z'),
  },

  // 30. Đinh Gia Bảo - REVIEWING (Renesas RTL Design)
  {
    id: 'seed-app-bao-renesas-reviewing',
    studentEmail: 'bao.dinh@student.hcmut.edu.vn',
    internshipId: 'seed-internship-recruiting-renesas-rtl',
    coverLetter: 'Em là Đinh Gia Bảo, sinh viên Điện tử - Viễn thông có đam mê thiết kế vi mạch bán dẫn và ngôn ngữ Verilog HDL.',
    status: ApplicationStatus.REVIEWING,
    matchScore: 88.0,
    aiScore: 87.0,
    appliedAt: new Date('2026-11-06T16:00:00Z'),
  },

  // 31. Phạm Thùy Linh - REVIEWING (MoMo Data Analytics & BI)
  {
    id: 'seed-app-linh-momo-reviewing',
    studentEmail: 'linh.pham@student.hcmut.edu.vn',
    internshipId: 'seed-internship-recruiting-momo-bi',
    coverLetter: 'Em là Phạm Thùy Linh, sinh viên Trí tuệ Nhân tạo ĐHBK. Em đam mê phân tích dữ liệu lớn Fintech và xây dựng Dashboard báo cáo quản trị.',
    status: ApplicationStatus.REVIEWING,
    matchScore: 94.0,
    aiScore: 93.0,
    appliedAt: new Date('2026-11-07T08:30:00Z'),
  },

  // =========================================================================
  // 5. CÁC ĐƠN PENDING (MỚI NỘP - CHỜ XỬ LÝ)
  // =========================================================================
  // 32. Phạm Đức Duy - PENDING (Bosch Embedded)
  {
    id: 'seed-app-duy-bosch-pending',
    studentEmail: 'student.jobseeking@student.hcmut.edu.vn',
    internshipId: 'seed-internship-recruiting-bosch-embedded',
    coverLetter: 'Em muốn mở rộng kỹ năng lập trình nhúng C++ cho các bài toán Computer Vision tại Bosch.',
    status: ApplicationStatus.PENDING,
    matchScore: 78.0,
    appliedAt: new Date('2026-11-06T18:00:00Z'),
  },

  // 33. Huỳnh Tuấn Kiệt - PENDING (Viettel Cloud DevOps)
  {
    id: 'seed-app-kiet-viettel-cloud-pending',
    studentEmail: 'kiet.huynh@student.hcmut.edu.vn',
    internshipId: 'seed-internship-recruiting-viettel-cloud',
    coverLetter: 'Em ứng tuyển vị trí Kỹ sư Đám mây tại Viettel Solutions.',
    status: ApplicationStatus.PENDING,
    matchScore: 89.0,
    appliedAt: new Date('2026-11-07T09:00:00Z'),
  },

  // 34. Chu Thị Thanh Hằng - PENDING (Unilever Kỹ thuật Hóa học)
  {
    id: 'seed-app-hang-unilever-chem-pending',
    studentEmail: 'hang.chu@student.hcmut.edu.vn',
    internshipId: 'seed-internship-recruiting-unilever-chem',
    coverLetter: 'Em mong muốn ứng tuyển vị trí Kỹ thuật Hóa học tại Unilever.',
    status: ApplicationStatus.PENDING,
    matchScore: 91.0,
    appliedAt: new Date('2026-11-07T10:00:00Z'),
  },

  // 35. Đỗ Minh Trí - PENDING (Vinamilk Tự động hóa PLC)
  {
    id: 'seed-app-tri-vinamilk-pending',
    studentEmail: 'tri.do@student.hcmut.edu.vn',
    internshipId: 'seed-internship-recruiting-vinamilk-plc',
    coverLetter: 'Em ứng tuyển vị trí thực tập Tự động hóa và PLC tại Nhà máy Mega Plant.',
    status: ApplicationStatus.PENDING,
    matchScore: 85.0,
    appliedAt: new Date('2026-11-07T14:00:00Z'),
  },

  // 36. Hồ Ngọc Hưng - PENDING (Bosch Embedded)
  {
    id: 'seed-app-hung-bosch-pending',
    studentEmail: 'hung.ho@student.hcmut.edu.vn',
    internshipId: 'seed-internship-recruiting-bosch-embedded',
    coverLetter: 'Em muốn ứng tuyển kỹ sư nhúng phần mềm điều khiển ô tô tại Bosch.',
    status: ApplicationStatus.PENDING,
    matchScore: 81.0,
    appliedAt: new Date('2026-11-07T16:00:00Z'),
  },

  // 37. Phạm Văn Thịnh - PENDING (VinFast Robot)
  {
    id: 'seed-app-thinh-vinfast-pending',
    studentEmail: 'thinh.pham@student.hcmut.edu.vn',
    internshipId: 'seed-internship-recruiting-vinfast-auto',
    coverLetter: 'Em ứng tuyển vị trí kỹ sư cơ khí chế tạo và tự động hóa tại VinFast.',
    status: ApplicationStatus.PENDING,
    matchScore: 80.0,
    appliedAt: new Date('2026-11-08T08:00:00Z'),
  },

  // 38. Bùi Thanh Trúc - PENDING (Unilever Hóa mỹ phẩm)
  {
    id: 'seed-app-truc-unilever-pending',
    studentEmail: 'truc.bui@student.hcmut.edu.vn',
    internshipId: 'seed-internship-recruiting-unilever-chem',
    coverLetter: 'Em ứng tuyển vị trí kiểm soát chất lượng tại Unilever.',
    status: ApplicationStatus.PENDING,
    matchScore: 84.0,
    appliedAt: new Date('2026-11-08T10:00:00Z'),
  },

  // 39. Lê Hoàng Yến - PENDING (Axon Cloud C#)
  {
    id: 'seed-app-yen-axon-pending',
    studentEmail: 'yen.le@student.hcmut.edu.vn',
    internshipId: 'seed-internship-recruiting-axon-cloud',
    coverLetter: 'Em ứng tuyển vị trí Cloud Software Engineer Intern tại Axon.',
    status: ApplicationStatus.PENDING,
    matchScore: 83.0,
    appliedAt: new Date('2026-11-08T11:00:00Z'),
  },

  // =========================================================================
  // 6. CÁC ĐƠN DECLINED (SINH VIÊN TỪ CHỐI OFFER)
  // =========================================================================
  // 40. Đặng Tuấn Kiệt - DECLINED (Từ chối offer Bosch Embedded)
  {
    id: 'seed-app-kiet-bosch-declined',
    studentEmail: 'student.interviewing@student.hcmut.edu.vn',
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

  // 41. Nguyễn Minh Khoa - DECLINED (Từ chối offer FPT Software)
  {
    id: 'seed-app-khoa-fpt-declined',
    studentEmail: 'khoa.nguyen@student.hcmut.edu.vn',
    internshipId: 'seed-internship-recruiting-fpt-fullstack',
    coverLetter: 'Em ứng tuyển Fullstack tại FPT Software.',
    status: ApplicationStatus.DECLINED,
    matchScore: 90.0,
    aiScore: 89.0,
    appliedAt: new Date('2026-10-25T08:00:00Z'),
    offeredAt: new Date('2026-10-30T10:00:00Z'),
    respondedAt: new Date('2026-11-01T15:00:00Z'),
    companyFeedback: 'Ứng viên quyết định lựa chọn cơ hội thực tập chuyên sâu Golang tại VNG.',
  },

  // 42. Phan Thị Quỳnh Nga - DECLINED (Từ chối offer VNG)
  {
    id: 'seed-app-nga-vng-declined',
    studentEmail: 'nga.phan@student.hcmut.edu.vn',
    internshipId: 'seed-internship-recruiting-vng-fe',
    coverLetter: 'Em ứng tuyển Zalo Mini App tại VNG.',
    status: ApplicationStatus.DECLINED,
    matchScore: 88.0,
    appliedAt: new Date('2026-10-26T14:00:00Z'),
    offeredAt: new Date('2026-11-01T09:00:00Z'),
    respondedAt: new Date('2026-11-02T16:30:00Z'),
    companyFeedback: 'Ứng viên ưu tiên định hướng chuyên sâu về AI Camera tại Axon.',
  },

  // =========================================================================
  // 7. CÁC ĐƠN EXPIRED (QUÁ HẠN PHẢN HỒI OFFER)
  // =========================================================================
  // 43. Bùi Gia Huy - EXPIRED (Quá hạn offer FPT Fullstack)
  {
    id: 'seed-app-huy-fpt-expired',
    studentEmail: 'student.reported@student.hcmut.edu.vn',
    internshipId: 'seed-internship-recruiting-fpt-fullstack',
    coverLetter: 'Em ứng tuyển thử sức với mảng công nghệ phần mềm.',
    status: ApplicationStatus.EXPIRED,
    matchScore: 70.0,
    appliedAt: new Date('2026-10-15T10:00:00Z'),
    offeredAt: new Date('2026-10-20T10:00:00Z'),
    offerExpiresAt: new Date('2026-10-27T23:59:59Z'),
  },

  // 44. Lê Thanh Phong - EXPIRED (Quá hạn offer Shopee)
  {
    id: 'seed-app-phong-shopee-expired',
    studentEmail: 'phong.le@student.hcmut.edu.vn',
    internshipId: 'seed-internship-recruiting-shopee-spx',
    coverLetter: 'Em ứng tuyển vị trí vận hành chuỗi cung ứng Shopee.',
    status: ApplicationStatus.EXPIRED,
    matchScore: 72.0,
    appliedAt: new Date('2026-10-18T14:00:00Z'),
    offeredAt: new Date('2026-10-22T09:00:00Z'),
    offerExpiresAt: new Date('2026-10-29T23:59:59Z'),
  },

  // =========================================================================
  // 8. CÁC ĐƠN REJECTED (DOANH NGHIỆP TỪ CHỐI KÈM LÝ DO THỰC TẾ)
  // =========================================================================
  // 45. Lý Hoàng Nam - REJECTED (VinFast Robot - Lệch chuyên môn Xây dựng)
  {
    id: 'seed-app-nam-vinfast-rejected',
    studentEmail: 'student.withdrawn@student.hcmut.edu.vn',
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

  // 46. Phạm Văn Thịnh - REJECTED (Axon Cloud - Chưa đủ kỹ năng AWS/Cloud)
  {
    id: 'seed-app-thinh-axon-rejected',
    studentEmail: 'thinh.pham@student.hcmut.edu.vn',
    internshipId: 'seed-internship-recruiting-axon-cloud',
    coverLetter: 'Em muốn thử sức phát triển phần mềm đám mây tại Axon.',
    status: ApplicationStatus.REJECTED,
    matchScore: 50.0,
    aiScore: 48.0,
    appliedAt: new Date('2026-11-02T16:00:00Z'),
    rejectedAt: new Date('2026-11-05T10:00:00Z'),
    rejectionReason: 'Hồ sơ chuyên môn về Cơ khí của bạn chưa đáp ứng yêu cầu lập trình C# .NET và kiến trúc đám mây AWS của dự án.',
  },

  // 47. Đoàn Văn Hậu - REJECTED (Renesas RTL - Không phù hợp chuyên ngành Vi mạch)
  {
    id: 'seed-app-hau-renesas-rejected',
    studentEmail: 'hau.doan@student.hcmut.edu.vn',
    internshipId: 'seed-internship-recruiting-renesas-rtl',
    coverLetter: 'Em ứng tuyển vị trí thiết kế chip bán dẫn.',
    status: ApplicationStatus.REJECTED,
    matchScore: 45.0,
    aiScore: 42.0,
    appliedAt: new Date('2026-11-03T11:00:00Z'),
    rejectedAt: new Date('2026-11-06T09:00:00Z'),
    rejectionReason: 'Vị trí Thiết kế Vi mạch yêu cầu chuyên môn sâu về Verilog/SystemVerilog và kiến trúc vi xử lý bán dẫn.',
  },

  // 48. Lý Hoàng Nam - REJECTED (Coteccons Kết cấu - GPA chưa đạt yêu cầu tính toán kết cấu)
  {
    id: 'seed-app-nam-coteccons-rejected',
    studentEmail: 'student.withdrawn@student.hcmut.edu.vn',
    internshipId: 'seed-internship-recruiting-coteccons-bim',
    coverLetter: 'Em ứng tuyển vị trí giám sát thi công kết cấu tại Coteccons.',
    status: ApplicationStatus.REJECTED,
    matchScore: 68.0,
    aiScore: 65.0,
    appliedAt: new Date('2026-11-03T14:00:00Z'),
    rejectedAt: new Date('2026-11-06T15:00:00Z'),
    rejectionReason: 'Vị trí yêu cầu điểm số các môn Kết cấu Bê tông và Cơ học kết cấu đạt từ Khá trở lên và có kỹ năng Revit Structure thành thạo.',
  },

  // =========================================================================
  // 9. CÁC ĐƠN WITHDRAWN (SINH VIÊN TỰ RÚT ĐƠN)
  // =========================================================================
  // 49. Lý Hoàng Nam - WITHDRAWN (Rút đơn tại Tân Cảng SCM)
  {
    id: 'seed-app-nam-newport-withdrawn',
    studentEmail: 'student.withdrawn@student.hcmut.edu.vn',
    internshipId: 'seed-internship-recruiting-newport-scm',
    coverLetter: 'Em ứng tuyển vị trí quản lý kho vận cảng biển.',
    status: ApplicationStatus.WITHDRAWN,
    matchScore: 65.0,
    appliedAt: new Date('2026-11-02T09:00:00Z'),
    withdrawnAt: new Date('2026-11-04T10:00:00Z'),
  },

  // 50. Võ Thị Mỹ Duyên - WITHDRAWN (Rút đơn tại Shopee để tập trung cho Coteccons Green)
  {
    id: 'seed-app-duyen-shopee-withdrawn',
    studentEmail: 'duyen.vo@student.hcmut.edu.vn',
    internshipId: 'seed-internship-recruiting-shopee-spx',
    coverLetter: 'Em ứng tuyển vị trí chuỗi cung ứng Shopee.',
    status: ApplicationStatus.WITHDRAWN,
    matchScore: 78.0,
    appliedAt: new Date('2026-11-02T14:00:00Z'),
    withdrawnAt: new Date('2026-11-05T09:00:00Z'),
  },
];
