import { SkillLevel } from '../../src/generated/prisma/client';

export interface StudentSkillSeedItem {
  name: string;
  level: SkillLevel;
}

export interface StudentProjectSeedItem {
  title: string;
  description: string;
  repositoryUrl?: string;
  demoUrl?: string;
  startedAt?: Date;
  endedAt?: Date;
}

export interface StudentSeedItem {
  email: string;
  studentCode: string;
  fullName: string;
  majorCode: string;
  phone: string;
  gpa: number;
  summary: string;
  skills: StudentSkillSeedItem[];
  projects: StudentProjectSeedItem[];
  desiredRoles: string[];
  preferredLocations: string[];
  preferredWorkTypes: string[];
  cvFileName?: string;
}

export const studentsData: StudentSeedItem[] = [
  // =========================================================================
  // NHÓM 1: CÁC TÀI KHOẢN SINH VIÊN HIỆN CÓ (GIỮ NGUYÊN 100%)
  // =========================================================================
  // 0. Phạm Hoàng Sơn - FullStack / Backend Developer
  {
    email: 'pson4282@gmail.com',
    studentCode: '2314282',
    fullName: 'Phạm Hoàng Sơn',
    majorCode: 'BK-SE',
    phone: '0901234567',
    gpa: 3.65,
    summary:
      '4th-year IT student with hands-on experience building scalable backend applications using NestJS, TypeScript, PostgreSQL, Redis, and Docker. Experienced in API development, database design, authentication, and VPS deployment. Seeking a Backend Developer Intern role to contribute to real-world products and further develop backend engineering skills.',
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

  // =========================================================================
  // NHÓM 2: CÁC TÀI KHOẢN SINH VIÊN BỔ SUNG MỚI (NGƯỜI THẬT VIỆC THẬT)
  // =========================================================================
  // 13. Nguyễn Minh Khoa - BK-CS (Đang thực tập tuần 8 tại VNG)
  {
    email: 'khoa.nguyen@student.hcmut.edu.vn',
    studentCode: '2110789',
    fullName: 'Nguyễn Minh Khoa',
    majorCode: 'BK-CS',
    phone: '0908112233',
    gpa: 3.72,
    summary: 'Sinh viên K21 Khoa học Máy tính. Đam mê kiến trúc phân tán (Distributed Systems), thành thạo Golang, C++ và hàng đợi thông điệp Kafka. Hiện đang thực tập vị trí Game Platform Backend tại VNG.',
    skills: [
      { name: 'Go', level: SkillLevel.ADVANCED },
      { name: 'C++', level: SkillLevel.ADVANCED },
      { name: 'Kafka', level: SkillLevel.INTERMEDIATE },
      { name: 'Redis', level: SkillLevel.ADVANCED },
      { name: 'PostgreSQL', level: SkillLevel.ADVANCED },
      { name: 'Docker', level: SkillLevel.ADVANCED },
    ],
    projects: [
      {
        title: 'Distributed In-Memory Cache with Raft Consensus Engine',
        description: 'Xây dựng dịch vụ lưu trữ bộ nhớ đệm phân tán hỗ trợ đồng thuận Raft bằng Golang, chịu tải 10,000 QPS với độ trễ dưới 5ms.',
        repositoryUrl: 'https://github.com/khoanguyen-bk/go-raft-cache',
        startedAt: new Date('2025-11-01'),
        endedAt: new Date('2026-04-15'),
      },
    ],
    desiredRoles: ['Backend Golang Developer', 'Distributed Systems Engineer'],
    preferredLocations: ['TP. Hồ Chí Minh'],
    preferredWorkTypes: ['Toàn thời gian (On-site)', 'Hybrid'],
  },

  // 14. Lê Hoàng Yến - BK-SE (Đã nhận Offer tại VNG Zalo Mini App)
  {
    email: 'yen.le@student.hcmut.edu.vn',
    studentCode: '2211987',
    fullName: 'Lê Hoàng Yến',
    majorCode: 'BK-SE',
    phone: '0919334455',
    gpa: 3.68,
    summary: 'Sinh viên K22 Kỹ thuật Phần mềm. Chuyên sâu phát triển ứng dụng Web Frontend hiện đại bằng React, Next.js, TypeScript và tối ưu hiệu năng Core Web Vitals.',
    skills: [
      { name: 'React', level: SkillLevel.ADVANCED },
      { name: 'TypeScript', level: SkillLevel.ADVANCED },
      { name: 'Next.js', level: SkillLevel.ADVANCED },
      { name: 'Tailwind CSS', level: SkillLevel.ADVANCED },
      { name: 'Git', level: SkillLevel.ADVANCED },
      { name: 'English for Engineering', level: SkillLevel.ADVANCED },
    ],
    projects: [
      {
        title: 'Mini App Bán vé Xe buýt Thông minh BusGo trên Zalo Mini App',
        description: 'Xây dựng giao diện Zalo Mini App bằng React và Tailwind CSS, tích hợp ZaloPay thanh toán trực tiếp.',
        repositoryUrl: 'https://github.com/hoangyen-bk/busgo-zma',
        demoUrl: 'https://zalo.me/s/busgo',
        startedAt: new Date('2026-03-01'),
        endedAt: new Date('2026-07-15'),
      },
    ],
    desiredRoles: ['Frontend Developer', 'Web Application Engineer'],
    preferredLocations: ['TP. Hồ Chí Minh'],
    preferredWorkTypes: ['Hybrid', 'Toàn thời gian (On-site)'],
  },

  // 15. Trần Quốc Bảo - BK-IS (Phỏng vấn tại MoMo AppSec)
  {
    email: 'bao.tran@student.hcmut.edu.vn',
    studentCode: '2112891',
    fullName: 'Trần Quốc Bảo',
    majorCode: 'BK-IS',
    phone: '0937445566',
    gpa: 3.48,
    summary: 'Sinh viên K21 Hệ thống Thông tin. Có kiến thức vững chắc về phân tích thiết kế CSDL, bảo mật ứng dụng Web OWASP Top 10 và quy trình kiểm thử an toàn DevSecOps.',
    skills: [
      { name: 'SQL & Data Modeling', level: SkillLevel.ADVANCED },
      { name: 'PostgreSQL', level: SkillLevel.ADVANCED },
      { name: 'Linux/Shell Scripting', level: SkillLevel.ADVANCED },
      { name: 'Python', level: SkillLevel.INTERMEDIATE },
      { name: 'Git', level: SkillLevel.ADVANCED },
    ],
    projects: [
      {
        title: 'Công cụ Tự động Quét Lỗ hổng Bảo mật API OWASP Benchmark',
        description: 'Xây dựng script Python phân tích cú pháp OpenAPI Swagger để tự động inject kiểm tra SQLi, IDOR và Broken Authentication.',
        repositoryUrl: 'https://github.com/quocbao-bk/api-security-scanner',
        startedAt: new Date('2025-10-15'),
        endedAt: new Date('2026-02-20'),
      },
    ],
    desiredRoles: ['Application Security Engineer', 'Database Administrator'],
    preferredLocations: ['TP. Hồ Chí Minh'],
    preferredWorkTypes: ['Toàn thời gian (On-site)'],
  },

  // 16. Phan Thị Quỳnh Nga - BK-AI (Đã nhận Offer tại Axon Camera AI)
  {
    email: 'nga.phan@student.hcmut.edu.vn',
    studentCode: '2213890',
    fullName: 'Phan Thị Quỳnh Nga',
    majorCode: 'BK-AI',
    phone: '0948556677',
    gpa: 3.82,
    summary: 'Sinh viên K22 ngành Khoa học Dữ liệu & Trí tuệ Nhân tạo. Nổi bật với các nghiên cứu Thị giác Máy tính ứng dụng trên thiết bị biên (Edge AI), nén mô hình TensorRT.',
    skills: [
      { name: 'PyTorch', level: SkillLevel.EXPERT },
      { name: 'Computer Vision', level: SkillLevel.ADVANCED },
      { name: 'Computer Vision AI (YOLO / OpenCV)', level: SkillLevel.ADVANCED },
      { name: 'Python', level: SkillLevel.EXPERT },
      { name: 'C++', level: SkillLevel.INTERMEDIATE },
      { name: 'English for Engineering', level: SkillLevel.EXPERT },
    ],
    projects: [
      {
        title: 'Mô hình Phát hiện Hành vi Nguy hiểm Thời gian thực trên Camera An ninh',
        description: 'Tối ưu mô hình YOLOv9 kết hợp ByteTrack chạy trên NVIDIA Jetson Orin Nano, đạt tốc độ xử lý 42 FPS với độ chính xác mAP 91.2%.',
        repositoryUrl: 'https://github.com/quynhnga-bk/edge-surveillance-ai',
        startedAt: new Date('2026-01-10'),
        endedAt: new Date('2026-06-30'),
      },
    ],
    desiredRoles: ['Computer Vision Engineer', 'AI Research Scientist'],
    preferredLocations: ['TP. Hồ Chí Minh'],
    preferredWorkTypes: ['Toàn thời gian (On-site)', 'Hybrid'],
  },

  // 17. Huỳnh Tuấn Kiệt - BK-NET (Đang thực tập tuần 8 tại Axon Cloud)
  {
    email: 'kiet.huynh@student.hcmut.edu.vn',
    studentCode: '2114562',
    fullName: 'Huỳnh Tuấn Kiệt',
    majorCode: 'BK-NET',
    phone: '0969667788',
    gpa: 3.65,
    summary: 'Sinh viên K21 ngành Mạng máy tính & An toàn thông tin. Thành thạo hạ tầng đám mây AWS, triển khai container Kubernetes, viết kịch bản Terraform và CI/CD GitHub Actions.',
    skills: [
      { name: 'AWS Cloud Services', level: SkillLevel.ADVANCED },
      { name: 'Docker', level: SkillLevel.ADVANCED },
      { name: 'Kubernetes', level: SkillLevel.INTERMEDIATE },
      { name: 'Linux/Shell Scripting', level: SkillLevel.ADVANCED },
      { name: 'CI/CD', level: SkillLevel.ADVANCED },
      { name: 'C#', level: SkillLevel.INTERMEDIATE },
    ],
    projects: [
      {
        title: 'Hạ tầng Triển khai Microservices Tự động co giãn trên AWS EKS',
        description: 'Xây dựng cụm Kubernetes EKS với Terraform, tích hợp Prometheus/Grafana giám sát tài nguyên và ArgoCD triển khai GitOps.',
        repositoryUrl: 'https://github.com/tuankiet-net/aws-eks-gitops-infra',
        startedAt: new Date('2025-11-10'),
        endedAt: new Date('2026-04-10'),
      },
    ],
    desiredRoles: ['DevOps Engineer', 'Cloud Infrastructure Specialist'],
    preferredLocations: ['TP. Hồ Chí Minh'],
    preferredWorkTypes: ['Toàn thời gian (On-site)'],
  },

  // 18. Đinh Gia Bảo - BK-ECE (Thiết kế Vi mạch & Viễn thông)
  {
    email: 'bao.dinh@student.hcmut.edu.vn',
    studentCode: '2212999',
    fullName: 'Đinh Gia Bảo',
    majorCode: 'BK-ECE',
    phone: '0971778899',
    gpa: 3.42,
    summary: 'Sinh viên K22 ngành Kỹ thuật Điện tử - Viễn thông. Am hiểu thiết kế mạch số FPGA, giao thức RF và xử lý tín hiệu số DSP.',
    skills: [
      { name: 'Digital Circuit Design', level: SkillLevel.ADVANCED },
      { name: 'Verilog/VHDL', level: SkillLevel.ADVANCED },
      { name: 'FPGA Design', level: SkillLevel.INTERMEDIATE },
      { name: 'UART/I2C/SPI Protocol', level: SkillLevel.ADVANCED },
      { name: 'MATLAB/Simulink', level: SkillLevel.INTERMEDIATE },
    ],
    projects: [
      {
        title: 'Hệ thống Thu phát Dữ liệu Không dây Băng gốc OFDM trên kit SDR',
        description: 'Mô phỏng chuỗi giải điều chế OFDM trên MATLAB và hiện thực phần cứng kiểm tra BER trên kit FPGA Xilinx Zynq.',
        repositoryUrl: 'https://github.com/giabao-bk/sdr-ofdm-transceiver',
        startedAt: new Date('2026-02-01'),
        endedAt: new Date('2026-06-25'),
      },
    ],
    desiredRoles: ['Telecom Hardware Engineer', 'FPGA Developer'],
    preferredLocations: ['TP. Hồ Chí Minh'],
    preferredWorkTypes: ['Toàn thời gian (On-site)'],
  },

  // 19. Trịnh Quốc Cường - BK-CA (Đang thực tập tuần 8 tại Renesas Design)
  {
    email: 'cuong.trinh@student.hcmut.edu.vn',
    studentCode: '2113778',
    fullName: 'Trịnh Quốc Cường',
    majorCode: 'BK-CA',
    phone: '0982889900',
    gpa: 3.66,
    summary: 'Sinh viên K21 ngành Kỹ thuật Điều khiển & Tự động hóa. Thành thạo lập trình nhúng STM32 vi điều khiển ARM Cortex-M, giao tiếp CAN Bus và thiết kế mạch Altium.',
    skills: [
      { name: 'ARM Cortex-M', level: SkillLevel.ADVANCED },
      { name: 'STM32', level: SkillLevel.ADVANCED },
      { name: 'C/C++ Embedded', level: SkillLevel.ADVANCED },
      { name: 'CAN Bus Protocol', level: SkillLevel.ADVANCED },
      { name: 'RTOS (FreeRTOS)', level: SkillLevel.INTERMEDIATE },
    ],
    projects: [
      {
        title: 'Bộ Điều khiển Trung tâm Cổng giao tiếp CAN Bus cho Xe ô tô Thông minh',
        description: 'Lập trình firmware STM32F4 chuyển đổi dữ liệu giữa CAN Bus và mạng WiFi ESP32, hiển thị thông số động cơ lên Dashboard thời gian thực.',
        repositoryUrl: 'https://github.com/quoccuong-bk/stm32-canbus-gateway',
        startedAt: new Date('2025-10-01'),
        endedAt: new Date('2026-03-15'),
      },
    ],
    desiredRoles: ['Embedded Firmware Engineer', 'Automotive Software Engineer'],
    preferredLocations: ['TP. Hồ Chí Minh'],
    preferredWorkTypes: ['Toàn thời gian (On-site)'],
  },

  // 20. Mai Phương Uyên - BK-IC (Đã hoàn thành thực tập xuất sắc tại Renesas)
  {
    email: 'uyen.mai@student.hcmut.edu.vn',
    studentCode: '2214665',
    fullName: 'Mai Phương Uyên',
    majorCode: 'BK-IC',
    phone: '0903990011',
    gpa: 3.85,
    summary: 'Thủ khoa K22 ngành Thiết kế Vi mạch. Đã hoàn thành đợt thực tập tại Renesas RVC với điểm đánh giá 9.6. Chuyên sâu về RTL Design, SystemVerilog và tổng hợp logic ASIC.',
    skills: [
      { name: 'SystemVerilog', level: SkillLevel.ADVANCED },
      { name: 'Verilog/VHDL', level: SkillLevel.EXPERT },
      { name: 'Digital Circuit Design', level: SkillLevel.EXPERT },
      { name: 'ASIC Flow', level: SkillLevel.INTERMEDIATE },
      { name: 'UVM Verification', level: SkillLevel.INTERMEDIATE },
      { name: 'English for Engineering', level: SkillLevel.ADVANCED },
    ],
    projects: [
      {
        title: 'Thiết kế Khối Tăng tốc Mã hóa Phần cứng AES-128 bằng SystemVerilog',
        description: 'Hiện thực pipeline 10 vòng mã hóa AES, mô phỏng testbench xác thực 100% coverage bằng Synopsys VCS, thông lượng đạt 1.2 Gbps.',
        repositoryUrl: 'https://github.com/phuonguyen-bk/aes128-rtl-core',
        startedAt: new Date('2025-08-01'),
        endedAt: new Date('2025-12-10'),
      },
    ],
    desiredRoles: ['RTL Design Engineer', 'ASIC Verification Engineer'],
    preferredLocations: ['TP. Hồ Chí Minh'],
    preferredWorkTypes: ['Toàn thời gian (On-site)'],
  },

  // 21. Đỗ Minh Trí - BK-EE (Kỹ thuật Điện & Năng lượng)
  {
    email: 'tri.do@student.hcmut.edu.vn',
    studentCode: '2115123',
    fullName: 'Đỗ Minh Trí',
    majorCode: 'BK-EE',
    phone: '0914001122',
    gpa: 3.38,
    summary: 'Sinh viên K21 ngành Kỹ thuật Điện. Thành thạo phân tích lưới điện công nghiệp, mô phỏng hệ thống năng lượng mặt trời áp mái và tủ phân phối điện trung hạ thế.',
    skills: [
      { name: 'Electrical Engineering', level: SkillLevel.ADVANCED },
      { name: 'AutoCAD', level: SkillLevel.ADVANCED },
      { name: 'MATLAB/Simulink', level: SkillLevel.INTERMEDIATE },
      { name: 'PLC Programming (Siemens/Mitsubishi)', level: SkillLevel.INTERMEDIATE },
    ],
    projects: [
      {
        title: 'Thiết kế Hệ thống Cung cấp Điện và Trạm Biến áp 3 pha cho Tòa nhà Văn phòng 12 Tầng',
        description: 'Tính toán phụ tải, chọn công suất MBA 1000kVA, tính toán dòng ngắn mạch và thiết kế mặt bằng chiếu sáng theo tiêu chuẩn TCVN.',
        startedAt: new Date('2025-09-15'),
        endedAt: new Date('2026-01-20'),
      },
    ],
    desiredRoles: ['Electrical Design Engineer', 'Substation Engineer'],
    preferredLocations: ['TP. Hồ Chí Minh', 'Bình Dương'],
    preferredWorkTypes: ['Toàn thời gian (On-site)'],
  },

  // 22. Nguyễn Tiến Đạt - BK-MTR (Cơ điện tử)
  {
    email: 'dat.nguyen@student.hcmut.edu.vn',
    studentCode: '2116234',
    fullName: 'Nguyễn Tiến Đạt',
    majorCode: 'BK-MTR',
    phone: '0925112233',
    gpa: 3.58,
    summary: 'Sinh viên K21 ngành Kỹ thuật Cơ điện tử. Có kinh nghiệm vững chắc về thiết kế mô hình CAD 3D, gia công CNC và lập trình hệ điều hành robot ROS trên Linux.',
    skills: [
      { name: 'SolidWorks', level: SkillLevel.ADVANCED },
      { name: 'ROS (Robot Operating System)', level: SkillLevel.ADVANCED },
      { name: 'C/C++ Embedded', level: SkillLevel.ADVANCED },
      { name: 'Mechatronics System Design', level: SkillLevel.ADVANCED },
      { name: 'Python', level: SkillLevel.INTERMEDIATE },
    ],
    projects: [
      {
        title: 'Xe Tự hành AGV Dẫn đường Bằng LiDAR trong Nhà kho Thông minh',
        description: 'Hiện thực thuật toán SLAM tạo bản đồ và điều hướng tránh chướng ngại vật bằng ROS Nav2 trên nền máy tính nhúng Jetson Nano.',
        repositoryUrl: 'https://github.com/tiendat-bk/ros2-lidar-agv',
        startedAt: new Date('2025-11-01'),
        endedAt: new Date('2026-04-20'),
      },
    ],
    desiredRoles: ['Robotics Engineer', 'Mechatronics Specialist'],
    preferredLocations: ['TP. Hồ Chí Minh', 'Bình Dương'],
    preferredWorkTypes: ['Toàn thời gian (On-site)'],
  },

  // 23. Phạm Văn Thịnh - BK-ME (Cơ khí Chế tạo máy)
  {
    email: 'thinh.pham@student.hcmut.edu.vn',
    studentCode: '2217345',
    fullName: 'Phạm Văn Thịnh',
    majorCode: 'BK-ME',
    phone: '0936223344',
    gpa: 3.35,
    summary: 'Sinh viên K22 ngành Kỹ thuật Cơ khí. Thành thạo thiết kế khuôn mẫu trên Catia/SolidWorks, lập trình gia công CNC Mastercam và phân tích ứng suất kết cấu Ansys.',
    skills: [
      { name: 'SolidWorks', level: SkillLevel.ADVANCED },
      { name: 'Catia', level: SkillLevel.ADVANCED },
      { name: 'CNC Machining', level: SkillLevel.ADVANCED },
      { name: 'Ansys FEA', level: SkillLevel.INTERMEDIATE },
      { name: 'AutoCAD', level: SkillLevel.ADVANCED },
    ],
    projects: [
      {
        title: 'Thiết kế Khuôn Ép Nhựa Chi tiết Nắp Hộp Kỹ thuật Xe máy',
        description: 'Phân tích dòng chảy nhựa bằng Moldflow, thiết kế kết cấu lõi khuôn, lòng khuôn và hệ thống làm mát tối ưu chu kỳ ép.',
        startedAt: new Date('2026-01-10'),
        endedAt: new Date('2026-05-30'),
      },
    ],
    desiredRoles: ['Mechanical Design Engineer', 'Mould Specialist'],
    preferredLocations: ['TP. Hồ Chí Minh', 'Đồng Nai'],
    preferredWorkTypes: ['Toàn thời gian (On-site)'],
  },

  // 24. Hồ Ngọc Hưng - BK-AUTO (Kỹ thuật Ô tô)
  {
    email: 'hung.ho@student.hcmut.edu.vn',
    studentCode: '2118456',
    fullName: 'Hồ Ngọc Hưng',
    majorCode: 'BK-AUTO',
    phone: '0947334455',
    gpa: 3.45,
    summary: 'Sinh viên K21 ngành Kỹ thuật Ô tô. Am hiểu động học khung gầm ô tô, kiểm định hệ thống phanh ABS, trợ lực lái điện EPS và chẩn đoán mã lỗi OBD-II.',
    skills: [
      { name: 'Electric Vehicle Powertrain', level: SkillLevel.INTERMEDIATE },
      { name: 'CAN Bus Protocol', level: SkillLevel.ADVANCED },
      { name: 'AutoCAD', level: SkillLevel.ADVANCED },
      { name: 'MATLAB/Simulink', level: SkillLevel.INTERMEDIATE },
    ],
    projects: [
      {
        title: 'Nghiên cứu Tính toán Động lực học Phanh Hệ thống Khôi phục Năng lượng Xe điện',
        description: 'Mô phỏng phối hợp giữa phanh cơ khí ma sát và phanh tái sinh động cơ điện trên phần mềm CarSim và MATLAB/Simulink.',
        startedAt: new Date('2025-10-01'),
        endedAt: new Date('2026-03-25'),
      },
    ],
    desiredRoles: ['Automotive Testing Engineer', 'Chassis Calibration Specialist'],
    preferredLocations: ['Hải Phòng', 'TP. Hồ Chí Minh'],
    preferredWorkTypes: ['Toàn thời gian (On-site)'],
  },

  // 25. Lương Thế Vinh - BK-ROB (Robot & Hệ thống Thông minh)
  {
    email: 'vinh.luong@student.hcmut.edu.vn',
    studentCode: '2219567',
    fullName: 'Lương Thế Vinh',
    majorCode: 'BK-ROB',
    phone: '0958445566',
    gpa: 3.70,
    summary: 'Sinh viên K22 ngành Kỹ thuật Robot & Hệ thống Thông minh. Giải Nhì Robocon Bách Khoa, thành thạo lập trình cánh tay robot công nghiệp 6 trục và thị giác robot 3D.',
    skills: [
      { name: 'Industrial Robotics', level: SkillLevel.ADVANCED },
      { name: 'Industrial Robotics (ABB/Kuka)', level: SkillLevel.ADVANCED },
      { name: 'ROS (Robot Operating System)', level: SkillLevel.ADVANCED },
      { name: 'Computer Vision AI (YOLO / OpenCV)', level: SkillLevel.ADVANCED },
      { name: 'C++', level: SkillLevel.ADVANCED },
    ],
    projects: [
      {
        title: 'Hệ thống Robot Gắp Đặt Linh kiện Điện tử Tốc độ cao Delta Robot',
        description: 'Thiết kế kết cấu delta robot 3 bậc tự do, lập trình nội suy chuyển động và gắn camera nhận diện vị trí linh kiện ngẫu nhiên trên băng chuyền.',
        repositoryUrl: 'https://github.com/thevinh-bk/delta-robot-vision-pick',
        startedAt: new Date('2026-02-15'),
        endedAt: new Date('2026-07-20'),
      },
    ],
    desiredRoles: ['Robotics System Integrator', 'Automation Application Engineer'],
    preferredLocations: ['TP. Hồ Chí Minh', 'Bình Dương'],
    preferredWorkTypes: ['Toàn thời gian (On-site)'],
  },

  // 26. Chu Thị Thanh Hằng - BK-CHE (Đang thực tập tuần 8 tại Unilever)
  {
    email: 'hang.chu@student.hcmut.edu.vn',
    studentCode: '2116789',
    fullName: 'Chu Thị Thanh Hằng',
    majorCode: 'BK-CHE',
    phone: '0969556677',
    gpa: 3.62,
    summary: 'Sinh viên K21 ngành Kỹ thuật Hóa học. Thành thạo mô phỏng tháp chưng cất và phản ứng bằng Aspen Plus, kiểm nghiệm hóa lý nguyên liệu và quy chuẩn GMP.',
    skills: [
      { name: 'Chemical Process Simulation (Aspen Plus)', level: SkillLevel.ADVANCED },
      { name: 'HPLC Analysis', level: SkillLevel.ADVANCED },
      { name: 'Good Laboratory Practice (GLP)', level: SkillLevel.ADVANCED },
      { name: 'Good Manufacturing Practice (GMP)', level: SkillLevel.ADVANCED },
      { name: 'Quality Assurance/Quality Control (QA/QC)', level: SkillLevel.ADVANCED },
    ],
    projects: [
      {
        title: 'Mô phỏng và Tối ưu hóa Tháp Tách Hỗn hợp Hydrocarbon trên Aspen Plus',
        description: 'Thiết lập mô hình thermodynamic NRTL, tối ưu số đĩa lý thuyết và tỷ số hồi lưu, giảm 14% năng lượng tiêu thụ tại nồi đun đáy tháp.',
        startedAt: new Date('2025-10-15'),
        endedAt: new Date('2026-03-30'),
      },
    ],
    desiredRoles: ['Chemical Process Engineer', 'QA/QC Chemical Analyst'],
    preferredLocations: ['TP. Hồ Chí Minh', 'Bà Rịa - Vũng Tàu'],
    preferredWorkTypes: ['Toàn thời gian (On-site)'],
  },

  // 27. Bùi Thanh Trúc - BK-FOOD (Phỏng vấn tại Vinamilk QA/QC)
  {
    email: 'truc.bui@student.hcmut.edu.vn',
    studentCode: '2217890',
    fullName: 'Bùi Thanh Trúc',
    majorCode: 'BK-FOOD',
    phone: '0970667788',
    gpa: 3.50,
    summary: 'Sinh viên K22 ngành Công nghệ Thực phẩm. Am hiểu quy trình tiệt trùng UHT, kiểm soát vi sinh thực phẩm, HACCP, ISO 22000 và đánh giá cảm quan sản phẩm.',
    skills: [
      { name: 'Food Processing Technology', level: SkillLevel.ADVANCED },
      { name: 'HACCP & ISO 22000', level: SkillLevel.ADVANCED },
      { name: 'QA/QC Food Analysis', level: SkillLevel.ADVANCED },
      { name: 'Quality Assurance/Quality Control (QA/QC)', level: SkillLevel.ADVANCED },
      { name: 'GMP Standards', level: SkillLevel.ADVANCED },
    ],
    projects: [
      {
        title: 'Nghiên cứu Kéo dài Hạn sử dụng Nước ép Trái cây Tự nhiên Bằng Công nghệ Thanh trùng Nhiệt độ Thấp',
        description: 'Theo dõi sự biến đổi hàm lượng Vitamin C, độ Brix và mật độ vi sinh vật trong 45 ngày bảo quản lạnh.',
        startedAt: new Date('2026-01-15'),
        endedAt: new Date('2026-05-20'),
      },
    ],
    desiredRoles: ['Food QA/QC Specialist', 'Food Product Developer'],
    preferredLocations: ['TP. Hồ Chí Minh', 'Bình Dương'],
    preferredWorkTypes: ['Toàn thời gian (On-site)'],
  },

  // 28. Dương Gia Hân - BK-BIO (Công nghệ Sinh học)
  {
    email: 'han.duong@student.hcmut.edu.vn',
    studentCode: '2118901',
    fullName: 'Dương Gia Hân',
    majorCode: 'BK-BIO',
    phone: '0981778899',
    gpa: 3.64,
    summary: 'Sinh viên K21 ngành Công nghệ Sinh học. Thành thạo kỹ thuật nuôi cấy vi sinh vật lên men bioreactor, tách chiết enzyme và phân tích điện di protein SDS-PAGE.',
    skills: [
      { name: 'Fermentation Technology', level: SkillLevel.ADVANCED },
      { name: 'Good Laboratory Practice (GLP)', level: SkillLevel.ADVANCED },
      { name: 'Quality Assurance/Quality Control (QA/QC)', level: SkillLevel.INTERMEDIATE },
      { name: 'HPLC Analysis', level: SkillLevel.INTERMEDIATE },
    ],
    projects: [
      {
        title: 'Tối ưu hóa Điều kiện Lên men Thu nhận Enzyme Protease từ Chủng Bacillus subtilis',
        description: 'Khảo sát ảnh hưởng của pH, nhiệt độ và nguồn cacbon trong bình lên men 5 lít, hoạt độ enzyme đạt 420 U/ml.',
        startedAt: new Date('2025-09-01'),
        endedAt: new Date('2026-02-15'),
      },
    ],
    desiredRoles: ['Biotech R&D Specialist', 'Fermentation Engineer'],
    preferredLocations: ['TP. Hồ Chí Minh'],
    preferredWorkTypes: ['Toàn thời gian (On-site)'],
  },

  // 29. Đoàn Văn Hậu - BK-IM (Quản lý Công nghiệp - Đã nhận Offer tại SmartLog)
  {
    email: 'hau.doan@student.hcmut.edu.vn',
    studentCode: '2219012',
    fullName: 'Đoàn Văn Hậu',
    majorCode: 'BK-IM',
    phone: '0992889900',
    gpa: 3.52,
    summary: 'Sinh viên K22 ngành Quản lý Công nghiệp. Thành thạo hoạch định nguồn lực ERP, cân bằng chuyền sản xuất Lean Line Balancing và xây dựng Dashboard Power BI.',
    skills: [
      { name: 'Lean Manufacturing', level: SkillLevel.ADVANCED },
      { name: 'Power BI & Tableau', level: SkillLevel.ADVANCED },
      { name: 'Data Analysis', level: SkillLevel.ADVANCED },
      { name: 'SAP ERP System', level: SkillLevel.INTERMEDIATE },
      { name: 'Six Sigma', level: SkillLevel.INTERMEDIATE },
    ],
    projects: [
      {
        title: 'Dashboard Giám sát Hiệu suất Tổng thể Thiết bị (OEE) Thời gian thực',
        description: 'Kết nối dữ liệu máy móc vào SQL Server, thiết kế Dashboard trực quan chỉ số Availability, Performance và Quality trên Power BI.',
        startedAt: new Date('2026-03-01'),
        endedAt: new Date('2026-07-15'),
      },
    ],
    desiredRoles: ['Production Planner', 'Supply Chain Analyst'],
    preferredLocations: ['TP. Hồ Chí Minh', 'Bình Dương'],
    preferredWorkTypes: ['Toàn thời gian (On-site)'],
  },

  // 30. Nguyễn Công Phượng - BK-LOG (Logistics & Chuỗi cung ứng)
  {
    email: 'phuong.nguyen@student.hcmut.edu.vn',
    studentCode: '2110123',
    fullName: 'Nguyễn Công Phượng',
    majorCode: 'BK-LOG',
    phone: '0903001122',
    gpa: 3.70,
    summary: 'Sinh viên K21 ngành Logistics & Quản lý Chuỗi cung ứng. Nắm vững vận hành kho hàng thông minh, tối ưu hóa mạng lưới phân phối và quy trình hải quan xuất nhập khẩu.',
    skills: [
      { name: 'Supply Chain Management', level: SkillLevel.EXPERT },
      { name: 'Warehouse Management System (WMS)', level: SkillLevel.ADVANCED },
      { name: 'Transport Management System (TMS)', level: SkillLevel.ADVANCED },
      { name: 'Inventory Optimization', level: SkillLevel.ADVANCED },
      { name: 'English for Engineering', level: SkillLevel.ADVANCED },
    ],
    projects: [
      {
        title: 'Tối ưu hóa Chi phí Phân phối Đơn hàng TMĐT Last-mile Delivery',
        description: 'Áp dụng bài toán tối ưu lộ trình VRP (Vehicle Routing Problem) bằng Python OR-Tools giúp giảm 15% tổng quãng đường giao hàng.',
        repositoryUrl: 'https://github.com/congphuong-log/vrp-delivery-optimizer',
        startedAt: new Date('2025-10-15'),
        endedAt: new Date('2026-03-20'),
      },
    ],
    desiredRoles: ['Logistics Operation Executive', 'Supply Chain Strategy Analyst'],
    preferredLocations: ['TP. Hồ Chí Minh'],
    preferredWorkTypes: ['Toàn thời gian (On-site)'],
  },

  // 31. Trương Hữu Nghĩa - BK-CE (Đã hoàn thành thực tập xuất sắc tại Coteccons)
  {
    email: 'nghia.truong@student.hcmut.edu.vn',
    studentCode: '2111234',
    fullName: 'Trương Hữu Nghĩa',
    majorCode: 'BK-CE',
    phone: '0914112233',
    gpa: 3.58,
    summary: 'Sinh viên K21 ngành Kỹ thuật Xây dựng. Đã hoàn thành 10 tuần thực tập tại Tập đoàn Xây dựng Coteccons đạt điểm 9.4. Thành thạo phần mềm phân tích kết cấu Etabs, SAFE và mô hình BIM Revit.',
    skills: [
      { name: 'BIM (Revit)', level: SkillLevel.ADVANCED },
      { name: 'Revit BIM', level: SkillLevel.ADVANCED },
      { name: 'Etabs & SAP2000', level: SkillLevel.ADVANCED },
      { name: 'Structural Analysis', level: SkillLevel.ADVANCED },
      { name: 'Civil Engineering Design', level: SkillLevel.ADVANCED },
      { name: 'AutoCAD', level: SkillLevel.ADVANCED },
    ],
    projects: [
      {
        title: 'Mô hình hóa BIM 4D và Tính toán Kết cấu Tòa nhà Chung cư 25 Tầng',
        description: 'Dựng mô hình kiến trúc kết cấu trên Revit, xuất mô hình sang Etabs tính toán tải trọng gió và động đất, liên kết tiến độ Navisworks.',
        startedAt: new Date('2025-09-01'),
        endedAt: new Date('2026-01-30'),
      },
    ],
    desiredRoles: ['Structural Design Engineer', 'BIM Coordinator'],
    preferredLocations: ['TP. Hồ Chí Minh'],
    preferredWorkTypes: ['Toàn thời gian (On-site)'],
  },

  // 32. Võ Thị Mỹ Duyên - BK-ENV (Kỹ thuật Môi trường - Trúng tuyển Coteccons Green)
  {
    email: 'duyen.vo@student.hcmut.edu.vn',
    studentCode: '2215899',
    fullName: 'Võ Thị Mỹ Duyên',
    majorCode: 'BK-ENV',
    phone: '0925223344',
    gpa: 3.61,
    summary: 'Sinh viên K22 ngành Kỹ thuật Môi trường. Am hiểu quy trình xử lý nước thải công nghiệp MBR/A2O, đánh giá tác động môi trường ĐTM và tiêu chuẩn công trình xanh LEED.',
    skills: [
      { name: 'Environmental Impact Assessment', level: SkillLevel.ADVANCED },
      { name: 'Wastewater Treatment Design', level: SkillLevel.ADVANCED },
      { name: 'LEED Green Building', level: SkillLevel.INTERMEDIATE },
      { name: 'AutoCAD', level: SkillLevel.ADVANCED },
    ],
    projects: [
      {
        title: 'Thiết kế Hệ thống Xử lý Nước thải Dệt nhuộm Công suất 2,500 m3/ngày đêm',
        description: 'Thiết kế công nghệ keo tụ tạo bông kết hợp màng lọc sinh học MBR, đảm bảo nước sau xử lý đạt chuẩn QCVN 40:2011/BTNMT Cột A.',
        startedAt: new Date('2026-02-01'),
        endedAt: new Date('2026-06-15'),
      },
    ],
    desiredRoles: ['Environmental Engineer', 'Sustainability Specialist'],
    preferredLocations: ['TP. Hồ Chí Minh', 'Bình Dương'],
    preferredWorkTypes: ['Toàn thời gian (On-site)'],
  },

  // 33. Lê Thanh Phong - BK-SE (Fullstack / NashTech)
  {
    email: 'phong.le@student.hcmut.edu.vn',
    studentCode: '2113456',
    fullName: 'Lê Thanh Phong',
    majorCode: 'BK-SE',
    phone: '0936334455',
    gpa: 3.55,
    summary: 'Sinh viên K21 Kỹ thuật Phần mềm. Thành thạo phát triển ứng dụng Java/Spring Boot, triển khai đám mây Azure Cloud và tuân thủ quy trình Agile/Scrum quốc tế.',
    skills: [
      { name: 'Java', level: SkillLevel.ADVANCED },
      { name: 'Spring Boot', level: SkillLevel.ADVANCED },
      { name: 'Microsoft Azure', level: SkillLevel.INTERMEDIATE },
      { name: 'PostgreSQL', level: SkillLevel.ADVANCED },
      { name: 'Git', level: SkillLevel.ADVANCED },
      { name: 'English for Engineering', level: SkillLevel.ADVANCED },
    ],
    projects: [
      {
        title: 'Hệ thống Quản lý Bệnh viện Đa khoa Triển khai trên Microsoft Azure',
        description: 'Xây dựng dịch vụ khám chữa bệnh bằng Spring Cloud, tích hợp Azure Blob Storage và kiểm thử tự động với JUnit/Mockito.',
        repositoryUrl: 'https://github.com/thanhphong-bk/hospital-mgmt-spring',
        startedAt: new Date('2025-10-01'),
        endedAt: new Date('2026-03-10'),
      },
    ],
    desiredRoles: ['Java Backend Developer', 'Software Engineer'],
    preferredLocations: ['TP. Hồ Chí Minh'],
    preferredWorkTypes: ['Toàn thời gian (On-site)', 'Hybrid'],
  },

  // 34. Nguyễn Trọng Nhân - BK-CS (Hệ thống phân tán / VNG)
  {
    email: 'nhan.nguyen@student.hcmut.edu.vn',
    studentCode: '2216890',
    fullName: 'Nguyễn Trọng Nhân',
    majorCode: 'BK-CS',
    phone: '0947445566',
    gpa: 3.60,
    summary: 'Sinh viên K22 Khoa học Máy tính. Đam mê tối ưu thuật toán, cấu trúc dữ liệu nâng cao và lập trình hệ thống mạng hiệu năng cao bằng C++ và Golang.',
    skills: [
      { name: 'C++', level: SkillLevel.ADVANCED },
      { name: 'Go', level: SkillLevel.ADVANCED },
      { name: 'Linux/Shell Scripting', level: SkillLevel.ADVANCED },
      { name: 'Redis', level: SkillLevel.ADVANCED },
      { name: 'Git', level: SkillLevel.ADVANCED },
    ],
    projects: [
      {
        title: 'High-Performance Asynchronous TCP Network Framework in C++20',
        description: 'Hiện thực Event Loop dựa trên epoll của Linux kernel, hỗ trợ 50,000 kết nối đồng thời với mức sử dụng RAM dưới 200MB.',
        repositoryUrl: 'https://github.com/trongnhan-bk/cpp-epoll-server',
        startedAt: new Date('2026-01-05'),
        endedAt: new Date('2026-05-25'),
      },
    ],
    desiredRoles: ['C++ Software Engineer', 'Network Systems Developer'],
    preferredLocations: ['TP. Hồ Chí Minh'],
    preferredWorkTypes: ['Toàn thời gian (On-site)'],
  },

  // 35. Phạm Thùy Linh - BK-AI (Khoa học dữ liệu / MoMo BI)
  {
    email: 'linh.pham@student.hcmut.edu.vn',
    studentCode: '2117899',
    fullName: 'Phạm Thùy Linh',
    majorCode: 'BK-AI',
    phone: '0958556677',
    gpa: 3.75,
    summary: 'Sinh viên K21 ngành Trí tuệ Nhân tạo. Nổi bật với kỹ năng trực quan hóa dữ liệu, phân tích hành vi người dùng bằng SQL nâng cao, Python Pandas và xây dựng mô hình dự báo tài chính.',
    skills: [
      { name: 'Python', level: SkillLevel.EXPERT },
      { name: 'SQL & Data Modeling', level: SkillLevel.EXPERT },
      { name: 'Data Analysis', level: SkillLevel.ADVANCED },
      { name: 'Power BI', level: SkillLevel.ADVANCED },
      { name: 'Machine Learning', level: SkillLevel.ADVANCED },
      { name: 'Pandas', level: SkillLevel.EXPERT },
    ],
    projects: [
      {
        title: 'Mô hình Dự báo Khách hàng Rời bỏ (Customer Churn Prediction) trong Fintech',
        description: 'Xử lý tập dữ liệu 5 triệu giao dịch bằng PySpark, xây dựng mô hình LightGBM đạt ROC-AUC 0.89 và triển khai báo cáo trên Power BI.',
        repositoryUrl: 'https://github.com/thuylinh-bk/fintech-churn-prediction',
        startedAt: new Date('2025-11-15'),
        endedAt: new Date('2026-04-10'),
      },
    ],
    desiredRoles: ['Data Analyst', 'Business Intelligence Specialist'],
    preferredLocations: ['TP. Hồ Chí Minh'],
    preferredWorkTypes: ['Hybrid', 'Toàn thời gian (On-site)'],
  },
];
