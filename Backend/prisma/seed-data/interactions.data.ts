import {
  NotificationType,
  NotificationAction,
  SupportRequestStatus,
  InternshipReportReasonCode,
  InternshipReportStatus,
} from '../../src/generated/prisma/client';

export interface ChatMessageSeedItem {
  senderEmail: string;
  content: string;
  sentAt?: Date;
}

export interface ConversationSeedItem {
  applicationId?: string;
  studentEmail: string;
  companyEmail?: string;
  lecturerEmail?: string;
  messages: ChatMessageSeedItem[];
}

export interface NotificationSeedItem {
  userEmail: string;
  type: NotificationType;
  action: NotificationAction;
  title: string;
  content: string;
  eventKey: string;
  isRead: boolean;
}

export interface SupportRequestSeedItem {
  studentEmail: string;
  title: string;
  content: string;
  status: SupportRequestStatus;
  adminReply?: string;
  repliedAt?: Date;
}

export const conversationsData: ConversationSeedItem[] = [
  // 1. Nguyễn Hoàng Long & FPT Software (Trao đổi lịch phỏng vấn và nhận việc)
  {
    applicationId: 'seed-app-long-fpt-accepted',
    studentEmail: 'student.interning@student.hcmut.edu.vn',
    companyEmail: 'fpt.software@fpt.com',
    messages: [
      { senderEmail: 'fpt.software@fpt.com', content: 'Chào Long, FPT Software đã nhận được hồ sơ của em. Em có thể chuẩn bị phỏng vấn kỹ thuật vào chiều thứ Ba được không?' },
      { senderEmail: 'student.interning@student.hcmut.edu.vn', content: 'Dạ em chào anh Tùng, em hoàn toàn sắp xếp được lịch chiều thứ Ba ạ. Em cảm ơn anh nhiều!' },
      { senderEmail: 'fpt.software@fpt.com', content: 'Tuyệt vời. Anh đã gửi link Google Meet qua email rồi nhé. Hẹn gặp em!' },
      { senderEmail: 'student.interning@student.hcmut.edu.vn', content: 'Dạ vâng, em đã nhận được email và chuẩn bị sẵn sàng ạ.' },
      { senderEmail: 'fpt.software@fpt.com', content: 'Chúc mừng Long đã hoàn thành xuất sắc bài test và nhận được offer thực tập tại GDU1!' },
      { senderEmail: 'student.interning@student.hcmut.edu.vn', content: 'Dạ em cảm ơn anh Tùng và quý công ty rất nhiều ạ. Em sẽ cố gắng hết mình trong kỳ thực tập này.' },
    ],
  },

  // 2. Nguyễn Minh Khoa & VNG (Trao đổi về kiến trúc microservices và onboard Zalo Campus)
  {
    applicationId: 'seed-app-khoa-vng-accepted',
    studentEmail: 'khoa.nguyen@student.hcmut.edu.vn',
    companyEmail: 'vng.recruitment@vng.com.vn',
    messages: [
      { senderEmail: 'vng.recruitment@vng.com.vn', content: 'Chào Khoa, VNG chúc mừng em đã trúng tuyển vị trí Backend Golang Intern tại VNGGames Publishing Platform!' },
      { senderEmail: 'khoa.nguyen@student.hcmut.edu.vn', content: 'Dạ em chào chị Mai, em rất vui và vinh dự khi nhận được offer từ VNG ạ!' },
      { senderEmail: 'vng.recruitment@vng.com.vn', content: 'Thứ Hai tuần tới em đến sảnh tòa nhà Zalo Campus lúc 08:30 để làm thủ tục Onboard và nhận MacBook Pro nhé.' },
      { senderEmail: 'khoa.nguyen@student.hcmut.edu.vn', content: 'Dạ vâng ạ, em đã đọc kỹ cẩm nang Onboard và sẽ có mặt đúng giờ. Em cảm ơn chị!' },
    ],
  },

  // 3. Huỳnh Tuấn Kiệt & Axon (Trao đổi về cấp phát laptop và thẻ an ninh Deutsches Haus)
  {
    applicationId: 'seed-app-kiet-axon-accepted',
    studentEmail: 'kiet.huynh@student.hcmut.edu.vn',
    companyEmail: 'axon.careers@axon.com',
    messages: [
      { senderEmail: 'axon.careers@axon.com', content: 'Hi Kiet, congratulations on accepting the Cloud Platform Engineering Intern offer at Axon Vietnam!' },
      { senderEmail: 'kiet.huynh@student.hcmut.edu.vn', content: 'Hi Long, thank you very much! I am thrilled to join the team and work with AWS multi-region infrastructure.' },
      { senderEmail: 'axon.careers@axon.com', content: 'Please come to Deutsches Haus Level 12 on September 15th at 09:00 AM. Our IT team has prepared your equipment.' },
      { senderEmail: 'kiet.huynh@student.hcmut.edu.vn', content: 'Got it, see you there!' },
    ],
  },

  // 4. Trịnh Quốc Cường & Renesas (Trao đổi về EDA tool và bảo mật thiết kế chip)
  {
    applicationId: 'seed-app-cuong-renesas-accepted',
    studentEmail: 'cuong.trinh@student.hcmut.edu.vn',
    companyEmail: 'renesas.careers@lm.renesas.com',
    messages: [
      { senderEmail: 'renesas.careers@lm.renesas.com', content: 'Chào Cường, anh Tuấn gửi em tài liệu hướng dẫn cài đặt môi trường mô phỏng vi điều khiển RH850 nội bộ nhé.' },
      { senderEmail: 'cuong.trinh@student.hcmut.edu.vn', content: 'Dạ em chào anh Tuấn, em đã nhận được tài liệu và cài đặt thành công toolchain rồi ạ.' },
      { senderEmail: 'renesas.careers@lm.renesas.com', content: 'Tốt lắm, em lưu ý toàn bộ mã nguồn firmware tuân thủ chính sách bảo mật NDA của Renesas nhé.' },
      { senderEmail: 'cuong.trinh@student.hcmut.edu.vn', content: 'Dạ vâng, em cam kết tuân thủ nghiêm ngặt quy định bảo mật của công ty ạ.' },
    ],
  },

  // 5. Chu Thị Thanh Hằng & Unilever (Hỏi về an toàn phòng thí nghiệm và xe đưa đón)
  {
    applicationId: 'seed-app-hang-unilever-accepted',
    studentEmail: 'hang.chu@student.hcmut.edu.vn',
    companyEmail: 'unilever.careers@unilever.com',
    messages: [
      { senderEmail: 'unilever.careers@unilever.com', content: 'Chào Thanh Hằng, Unilever đã gửi lộ trình tuyến xe buýt đưa đón nhân viên từ ĐHBK Cơ sở 2 đến Nhà máy Củ Chi qua email của em.' },
      { senderEmail: 'hang.chu@student.hcmut.edu.vn', content: 'Dạ em chào chị Hà, em đã nhận được thông tin xe buýt và lịch tập huấn an toàn hóa chất GLP rồi ạ.' },
      { senderEmail: 'unilever.careers@unilever.com', content: 'Tuyệt vời. Chúc em có 10 tuần thực tập nhiều trải nghiệm bổ ích tại Unilever!' },
    ],
  },

  // 6. Trương Hữu Nghĩa & PGS.TS. Nguyễn Danh Thảo (Báo cáo tiến độ nghiệm thu Coteccons)
  {
    applicationId: 'seed-app-nghia-coteccons-accepted',
    studentEmail: 'nghia.truong@student.hcmut.edu.vn',
    lecturerEmail: 'lecturer.civil@careerbridge.edu.vn',
    messages: [
      { senderEmail: 'nghia.truong@student.hcmut.edu.vn', content: 'Kính gửi Thầy Thảo, em vừa hoàn thành 10 tuần thực tập tại Coteccons và đã nhận được bảng đánh giá 9.4 điểm từ phía Ban chỉ huy công trường ạ.' },
      { senderEmail: 'lecturer.civil@careerbridge.edu.vn', content: 'Thầy chúc mừng Nghĩa. Em hoàn thiện quyển đồ án thực tập theo đúng mẫu của Khoa Xây dựng rồi gửi thầy duyệt trước ngày 28/3 nhé.' },
      { senderEmail: 'nghia.truong@student.hcmut.edu.vn', content: 'Dạ vâng thưa Thầy, em đang hoàn thiện phần thuyết minh tính toán cốt thép dầm sàn và xuất bản vẽ phụ lục ạ. Em cảm ơn Thầy!' },
    ],
  },
];

export const notificationsData: NotificationSeedItem[] = [
  // 1. Sinh viên Long
  {
    userEmail: 'student.interning@student.hcmut.edu.vn',
    type: NotificationType.REPORT,
    action: NotificationAction.OPEN_REPORT,
    title: 'Báo cáo tuần 7 đã được duyệt',
    content: 'Giảng viên hướng dẫn PGS.TS. Phạm Hoàng Anh đã đánh giá và duyệt Báo cáo thực tập Tuần 7 của bạn.',
    eventKey: 'notif-long-report-w7',
    isRead: true,
  },
  // 2. Sinh viên Linh
  {
    userEmail: 'student.offered@student.hcmut.edu.vn',
    type: NotificationType.APPLICATION,
    action: NotificationAction.OPEN_APPLICATION,
    title: 'Chúc mừng! Bạn đã nhận được Thư mời thực tập từ FPT Software',
    content: 'FPT Software đã gửi Thư mời thực tập cho bạn với mức hỗ trợ 8,000,000 VNĐ/tháng. Hạn chót phản hồi là ngày 13/11/2026.',
    eventKey: 'notif-linh-offer-fpt',
    isRead: false,
  },
  // 3. Sinh viên Kiệt
  {
    userEmail: 'student.interviewing@student.hcmut.edu.vn',
    type: NotificationType.APPLICATION,
    action: NotificationAction.OPEN_APPLICATION,
    title: 'Lịch phỏng vấn trực tuyến với Viettel Solutions',
    content: 'Bạn có lịch phỏng vấn vị trí SOC Analyst Intern vào lúc 09:30 ngày 12/11/2026 qua Google Meet.',
    eventKey: 'notif-kiet-interview-viettel',
    isRead: false,
  },
  // 4. Giảng viên Phạm Hoàng Anh
  {
    userEmail: 'lecturer.cse@careerbridge.edu.vn',
    type: NotificationType.REPORT,
    action: NotificationAction.OPEN_REPORT,
    title: 'Sinh viên Nguyễn Hoàng Long đã nộp báo cáo tuần 8',
    content: 'Sinh viên Nguyễn Hoàng Long (2110234) vừa nộp báo cáo thực tập Tuần 8 và đang chờ thầy nhận xét.',
    eventKey: 'notif-lecanh-report-w8',
    isRead: false,
  },
  // 5. Admin - KMS chờ duyệt
  {
    userEmail: 'admin@careerbridge.edu.vn',
    type: NotificationType.COMPANY,
    action: NotificationAction.OPEN_COMPANY_PROFILE,
    title: 'Doanh nghiệp KMS Technology vừa gửi hồ sơ đăng ký xác minh',
    content: 'Công ty TNHH Phần mềm KMS Technology Việt Nam đã gửi hồ sơ và đang chờ Ban quản trị xét duyệt.',
    eventKey: 'notif-admin-kms-pending',
    isRead: false,
  },
  // 6. Admin - Base.vn chờ duyệt
  {
    userEmail: 'corporate.admin@careerbridge.edu.vn',
    type: NotificationType.COMPANY,
    action: NotificationAction.OPEN_COMPANY_PROFILE,
    title: 'Doanh nghiệp Base Enterprise (Base.vn) vừa nộp hồ sơ hợp tác',
    content: 'Hồ sơ pháp lý của Công ty Cổ phần Base Enterprise đang chờ Quản trị viên Quan hệ Doanh nghiệp thẩm định.',
    eventKey: 'notif-admin-base-pending',
    isRead: false,
  },
  // 7. Sinh viên Khoa
  {
    userEmail: 'khoa.nguyen@student.hcmut.edu.vn',
    type: NotificationType.REPORT,
    action: NotificationAction.OPEN_REPORT,
    title: 'Báo cáo thực tập tuần 7 đã được duyệt',
    content: 'Giảng viên hướng dẫn TS. Quản Thành Thơ đã nhận xét và duyệt Báo cáo tuần 7 của bạn tại VNG.',
    eventKey: 'notif-khoa-report-w7',
    isRead: true,
  },
  // 8. Giảng viên Quản Thành Thơ
  {
    userEmail: 'lecturer.cse2@careerbridge.edu.vn',
    type: NotificationType.REPORT,
    action: NotificationAction.OPEN_REPORT,
    title: 'Sinh viên Nguyễn Minh Khoa đã nộp báo cáo tuần 8',
    content: 'Sinh viên Nguyễn Minh Khoa (2110789) vừa nộp báo cáo thực tập Tuần 8 (Matchmaking Rating System) tại VNG.',
    eventKey: 'notif-tho-report-w8',
    isRead: false,
  },
  // 9. Sinh viên Yến
  {
    userEmail: 'yen.le@student.hcmut.edu.vn',
    type: NotificationType.APPLICATION,
    action: NotificationAction.OPEN_APPLICATION,
    title: 'Thư mời thực tập chính thức từ VNG Corporation',
    content: 'VNG Corporation trân trọng gửi lời mời thực tập vị trí Zalo Mini App Frontend Intern. Hạn phản hồi: 15/11/2026.',
    eventKey: 'notif-yen-offer-vng',
    isRead: false,
  },
  // 10. Sinh viên Nga
  {
    userEmail: 'nga.phan@student.hcmut.edu.vn',
    type: NotificationType.APPLICATION,
    action: NotificationAction.OPEN_APPLICATION,
    title: 'Chúc mừng! Bạn đã nhận được Offer thực tập tại Axon Enterprise',
    content: 'Axon Việt Nam trân trọng gửi lời mời thực tập vị trí Computer Vision Intern với mức hỗ trợ 12,000,000 VNĐ/tháng.',
    eventKey: 'notif-nga-offer-axon',
    isRead: false,
  },
  // 11. Giảng viên Nguyễn Danh Thảo
  {
    userEmail: 'lecturer.civil@careerbridge.edu.vn',
    type: NotificationType.SUPERVISION,
    action: NotificationAction.OPEN_SUPERVISION,
    title: 'Nhà trường phân công hướng dẫn sinh viên Võ Thị Mỹ Duyên',
    content: 'Thầy được phân công phụ trách hướng dẫn sinh viên Võ Thị Mỹ Duyên (2212345) trong đợt thực tập tại Coteccons.',
    eventKey: 'notif-thao-supervision-duyen',
    isRead: false,
  },
  // 12. Sinh viên Duyên
  {
    userEmail: 'duyen.vo@student.hcmut.edu.vn',
    type: NotificationType.APPLICATION,
    action: NotificationAction.OPEN_APPLICATION,
    title: 'Chúc mừng! Bạn đã trúng tuyển vị trí Thực tập sinh Công trình Xanh tại Coteccons',
    content: 'Công ty Cổ phần Xây dựng Coteccons đã tiếp nhận đơn ứng tuyển của bạn cho Kỳ thực tập Xuân 2027.',
    eventKey: 'notif-duyen-accepted-coteccons',
    isRead: false,
  },
  // 13. Sinh viên Hậu
  {
    userEmail: 'hau.doan@student.hcmut.edu.vn',
    type: NotificationType.APPLICATION,
    action: NotificationAction.OPEN_APPLICATION,
    title: 'Thư mời thực tập từ Công ty SmartLog',
    content: 'SmartLog đã gửi Thư mời thực tập vị trí Triển khai Phần mềm Quản lý Kho WMS/TMS cho bạn.',
    eventKey: 'notif-hau-offer-smartlog',
    isRead: false,
  },
  // 14. Giảng viên Huỳnh Kỳ Phương Chu
  {
    userEmail: 'lecturer.fce2@careerbridge.edu.vn',
    type: NotificationType.REPORT,
    action: NotificationAction.OPEN_REPORT,
    title: 'Sinh viên Chu Thị Thanh Hằng đã nộp báo cáo tuần 8',
    content: 'Sinh viên Chu Thị Thanh Hằng vừa nộp báo cáo thực tập Tuần 8 về tối ưu chu trình CIP tại nhà máy Unilever.',
    eventKey: 'notif-chu-report-w8',
    isRead: false,
  },
  // 15. Doanh nghiệp FPT Software
  {
    userEmail: 'fpt.software@fpt.com',
    type: NotificationType.APPLICATION,
    action: NotificationAction.OPEN_APPLICATION,
    title: 'Ứng viên Phạm Hoàng Sơn vừa nộp hồ sơ ứng tuyển Fullstack Developer',
    content: 'Hồ sơ năng lực của ứng viên Phạm Hoàng Sơn (2314282) đã được hệ thống AI chấm điểm đạt 94.0 điểm.',
    eventKey: 'notif-fpt-app-son',
    isRead: true,
  },
];

export const supportRequestsData: SupportRequestSeedItem[] = [
  // 1. Đã giải quyết (Khoa SIM)
  {
    studentEmail: 'student.support@student.hcmut.edu.vn',
    title: 'Thủ tục xin cấp Giấy giới thiệu thực tập của Khoa Quản lý Công nghiệp',
    content: 'Kính gửi Ban Quản trị và Phòng Đào tạo, em cần xin giấy giới thiệu thực tập có mộc đỏ của trường để nộp cho doanh nghiệp. Em có thể nhận bản cứng tại phòng nào ạ?',
    status: SupportRequestStatus.RESOLVED,
    adminReply: 'Chào em, Ban Quản trị đã tiếp nhận yêu cầu. Em có thể mang theo Thẻ sinh viên đến Văn phòng Khoa Quản lý Công nghiệp (Phòng 104 nhà B10) trong giờ hành chính từ thứ 2 đến thứ 6 để nhận Giấy giới thiệu nhé.',
    repliedAt: new Date('2026-11-04T15:30:00Z'),
  },

  // 2. Đang chờ xử lý (Viettel)
  {
    studentEmail: 'student.unassigned@student.hcmut.edu.vn',
    title: 'Hỗ trợ cập nhật thông tin Giảng viên hướng dẫn kỳ thực tập',
    content: 'Dạ em chào thầy cô, em đã nhận được xác nhận tiếp nhận thực tập của Viettel Solutions, em muốn hỏi khi nào trường sẽ hoàn tất danh sách phân công Giảng viên hướng dẫn trên hệ thống ạ?',
    status: SupportRequestStatus.PENDING,
  },

  // 3. Đã giải quyết (Khoa Xây dựng)
  {
    studentEmail: 'nghia.truong@student.hcmut.edu.vn',
    title: 'Xin xác nhận hoàn thành đợt thực tập tốt nghiệp sớm',
    content: 'Kính gửi Thầy Cô Phòng Đào tạo, em đã hoàn thành đủ 10 tuần thực tập tại Coteccons và đã có đánh giá của doanh nghiệp. Em muốn xin xác nhận để nộp hồ sơ bảo vệ sớm được không ạ?',
    status: SupportRequestStatus.RESOLVED,
    adminReply: 'Chào Nghĩa, sau khi Giảng viên hướng dẫn (PGS.TS. Nguyễn Danh Thảo) hoàn tất chấm điểm đánh giá trên hệ thống, trạng thái thực tập của em sẽ tự động chuyển sang CLOSED và em có thể in Phiếu xác nhận điểm thực tập tại Cổng thông tin đào tạo nhé.',
    repliedAt: new Date('2026-03-31T09:00:00Z'),
  },

  // 4. Đã giải quyết (Bảo hiểm tai nạn)
  {
    studentEmail: 'student.interning@student.hcmut.edu.vn',
    title: 'Cấp chứng nhận bảo hiểm tai nạn sinh viên khi thực tập tại doanh nghiệp',
    content: 'Dạ em chào Thầy Cô, phía FPT Software yêu cầu bản photo Thẻ bảo hiểm y tế và bảo hiểm tai nạn sinh viên do trường cấp, em có thể tra cứu mã số bảo hiểm ở đâu ạ?',
    status: SupportRequestStatus.RESOLVED,
    adminReply: 'Chào Long, thông tin bảo hiểm y tế và bảo hiểm tai nạn của em đã được tích hợp trên ứng dụng VssID và Cổng thông tin Sinh viên MyBK. Em có thể chụp màn hình thẻ điện tử trên MyBK để nộp cho bộ phận nhân sự nhé.',
    repliedAt: new Date('2026-09-18T10:00:00Z'),
  },

  // 5. Đang chờ xử lý (Đăng ký học phần song song)
  {
    studentEmail: 'khoa.nguyen@student.hcmut.edu.vn',
    title: 'Thắc mắc về việc đăng ký học phần tiếng Anh song song với kỳ thực tập',
    content: 'Dạ kính gửi Thầy Cô, trong học kỳ này em đang thực tập tại VNG, em có được phép đăng ký thêm 1 môn tiếng Anh buổi tối trực tuyến không ạ?',
    status: SupportRequestStatus.PENDING,
  },

  // 6. Đã giải quyết (Khoa Hóa)
  {
    studentEmail: 'hang.chu@student.hcmut.edu.vn',
    title: 'Xin mẫu báo cáo thực tập chuẩn có logo Bách Khoa và Doanh nghiệp',
    content: 'Dạ em chào Thầy Cô, cho em hỏi mẫu trang bìa báo cáo tuần và báo cáo tổng kết thực tập của Khoa Kỹ thuật Hóa học có thể tải ở link nào ạ?',
    status: SupportRequestStatus.RESOLVED,
    adminReply: 'Chào Hằng, em truy cập mục Tài liệu hướng dẫn trên Cổng CareerBridge hoặc website Khoa Kỹ thuật Hóa học (fce.hcmut.edu.vn/bieu-mau-thuc-tap) để tải file Word template chuẩn nhé.',
    repliedAt: new Date('2026-09-16T14:00:00Z'),
  },
];
