# DANH SÁCH TÀI KHOẢN HỆ THỐNG DEMO & KIỂM THỬ (SEED ACCOUNTS)

Hệ thống **CareerBridge** đã được nạp bộ dữ liệu seed thực tế chuẩn hóa quy mô lớn, mô phỏng hệ thống quản lý thực tập tốt nghiệp toàn trường của **Trường Đại học Bách Khoa (ĐHQG TPHCM)** với người thật, việc thật, doanh nghiệp thật và các chỉ tiêu ngành nghề thực tế.

> **Mật khẩu dùng chung cho tất cả các tài khoản demo:** `Seed@123456`

---

## 🧭 BẢNG TRA CỨU NHANH THEO KỊCH BẢN DEMO (QUICK MATRIX)

| Kịch bản / Chức năng muốn demo | Tài khoản nên đăng nhập | Vai trò | Tình huống nghiệp vụ & Điểm nhấn |
|---|---|:---:|---|
| **Demo AI Scan CV & Match việc làm** | `pson4282@gmail.com` | `STUDENT` | Sinh viên Phạm Hoàng Sơn có sẵn CV thật `CV_PhamHoangSon_FullStackDeveloper.pdf`, kỹ năng chuẩn NestJS/React, điểm match 94–95%. |
| **Demo HR duyệt CV & gửi Offer** | `fpt.software@fpt.com` hoặc `vng.recruitment@vng.com.vn` | `COMPANY` | FPT Software có đơn Reviewing & đơn đã gửi Offer 8.5tr/tháng; VNG đã gửi Offer 9.0tr/tháng cho sinh viên Lê Hoàng Yến. |
| **Demo Phỏng vấn trực tuyến (Google Meet)** | `viettel.solutions@viettel.com.vn` <br/> `student.interviewing@student.hcmut.edu.vn` | `COMPANY` <br/> `STUDENT` | Viettel Solutions phỏng vấn sinh viên Đặng Tuấn Kiệt lúc 09:30 ngày 12/11/2026 kèm link Google Meet có sẵn. |
| **Demo Phỏng vấn trực tiếp (Offline)** | `vinfast.careers@vinfast.vn` <br/> `vinh.luong@student.hcmut.edu.vn` | `COMPANY` <br/> `STUDENT` | VinFast Auto phỏng vấn trực tiếp sinh viên Lương Thế Vinh lúc 10:00 ngày 14/11/2026 tại Landmark 81 TP.HCM. |
| **Demo Báo cáo tuần & GVHD duyệt** | `lecturer.cse@careerbridge.edu.vn` <br/> `student.interning@student.hcmut.edu.vn` | `LECTURER` <br/> `STUDENT` | Thầy Phạm Hoàng Anh giám sát sinh viên Nguyễn Hoàng Long (FPT Software, tuần 8/10 đang chờ Thầy duyệt). |
| **Demo Báo cáo bị từ chối / Phản hồi** | `student.reported@student.hcmut.edu.vn` <br/> `lecturer.fme@careerbridge.edu.vn` | `STUDENT` <br/> `LECTURER` | Thầy Nguyễn Thanh Tùng từ chối báo cáo tuần 5 của Bùi Gia Huy tại VinFast, yêu cầu bổ sung đồ thị giải mã CAN Bus. |
| **Demo Hoàn thành thực tập & Điểm 2 phía** | `student.completed@student.hcmut.edu.vn` hoặc `uyen.mai@student.hcmut.edu.vn` | `STUDENT` | Mai Phương Uyên (Renesas: Điểm DN = 9.6, Điểm GV = 9.5) hoặc Trần Thị Mai Anh (Bosch: Điểm DN = 9.5, Điểm GV = 9.2). |
| **Demo Phân công GVHD** | `academic.admin@careerbridge.edu.vn` | `ADMIN` | Sinh viên Lê Minh Tuấn đã trúng tuyển Viettel nhưng chưa có GVHD $\rightarrow$ Thao tác phân công tại `/admin/supervisions`. |
| **Demo Thẩm định & Duyệt Doanh nghiệp** | `corporate.admin@careerbridge.edu.vn` | `ADMIN` | Hai doanh nghiệp mới nộp hồ sơ đang chờ duyệt: KMS Technology và Base Enterprise (Base.vn) tại `/admin/companies`. |
| **Demo Xử lý Khiếu nại / Support Ticket** | `support.admin@careerbridge.edu.vn` | `ADMIN` | Sinh viên Võ Thị Bích Ngọc gửi yêu cầu hỗ trợ xin giấy giới thiệu thực tập. |
| **Demo Quản lý User & Phân quyền Sub-Admin** | `admin@careerbridge.edu.vn` | `SUPER_ADMIN` | Quản trị tối cao: Quản lý người dùng, phân quyền chi tiết từng phân hệ và xem Nhật ký Audit Log. |

---

## 1. Ban Quản trị Hệ thống (ADMIN & SUB-ADMINS)

| STT | Họ và tên | Email đăng nhập | Mật khẩu | Phân quyền (Quyền hạn) | Trạng thái | Mô tả kịch bản nghiệp vụ |
|:---:|---|---|---|---|:---:|---|
| 1 | **Nguyễn Văn Quản Trị** | `admin@careerbridge.edu.vn` | `Seed@123456` | **Super Admin (Toàn quyền)** | `ACTIVE` | Quản trị viên tối cao: Toàn quyền mọi phân hệ; **độc quyền** quản lý tài khoản & phân quyền Sub-Admin (`/admin/users`) và xem Nhật ký kiểm toán (`/admin/audit-logs`). |
| 2 | **Trần Thị Hồng Hạnh** | `academic.admin@careerbridge.edu.vn` | `Seed@123456` | **Sub-Admin Giáo vụ Đào tạo**<br>`DASHBOARD`, `PLACEMENTS`, `SEMESTERS`, `SUPPORT` | `ACTIVE` | Quản lý đợt thực tập, phân công giảng viên hướng dẫn sinh viên (`/admin/supervisions`), giám sát tiến độ và hỗ trợ sinh viên. Không có quyền duyệt công ty hoặc quản lý user. |
| 3 | **Lê Hoàng Nam** | `corporate.admin@careerbridge.edu.vn` | `Seed@123456` | **Sub-Admin Quan hệ Doanh nghiệp**<br>`DASHBOARD`, `COMPANIES`, `INTERNSHIPS` | `ACTIVE` | Thẩm định và duyệt hồ sơ doanh nghiệp mới (`/admin/companies`), kiểm duyệt và gỡ bỏ tin tuyển dụng vi phạm, quản lý danh mục kỹ năng. |
| 4 | **Đặng Thu Thảo** | `support.admin@careerbridge.edu.vn` | `Seed@123456` | **Sub-Admin Hỗ trợ SV (Helpdesk)**<br>`SUPPORT` | `ACTIVE` | Tiếp nhận và phản hồi các yêu cầu hỗ trợ, thắc mắc thủ tục thực tập tốt nghiệp của sinh viên (`/admin/support-requests`). |

---

## 2. Giảng viên Hướng dẫn Đại học Bách Khoa (LECTURERS - 10 GIẢNG VIÊN ĐỦ 6 KHOA)

| STT | Học hàm - Họ tên | Email đăng nhập | Mật khẩu | Khoa phụ trách | Trạng thái | Kịch bản chuyên môn & Nghiệp vụ |
|:---:|---|---|---|---|:---:|---|
| 1 | **PGS.TS. Phạm Hoàng Anh** | `lecturer.cse@careerbridge.edu.vn` | `Seed@123456` | Khoa KH & KT Máy tính (CSE) | `ACTIVE` | Hướng dẫn sinh viên `Nguyễn Hoàng Long` (FPT - Báo cáo tuần 8 chờ duyệt), `Trần Thị Mai Anh` (Bosch - Đã hoàn thành, chấm 9.2), `Huỳnh Tuấn Kiệt` (Axon Cloud). |
| 2 | **TS. Quản Thành Thơ** | `lecturer.cse2@careerbridge.edu.vn` | `Seed@123456` | Khoa KH & KT Máy tính (CSE) | `ACTIVE` | Trưởng bộ môn KTPM, hướng dẫn sinh viên `Nguyễn Minh Khoa` tại VNGGames (Báo cáo tuần 8 chờ duyệt). |
| 3 | **TS. Đỗ Quốc Thắng** | `lecturer.feee@careerbridge.edu.vn` | `Seed@123456` | Khoa Điện - Điện tử (FEEE) | `ACTIVE` | Trưởng bộ môn Vi mạch, đã chấm 9.5 nghiệm thu cho sinh viên `Mai Phương Uyên` tại Renesas RVC. |
| 4 | **TS. Huỳnh Phú Minh Cường** | `lecturer.feee2@careerbridge.edu.vn` | `Seed@123456` | Khoa Điện - Điện tử (FEEE) | `ACTIVE` | Trưởng bộ môn Kỹ thuật Điện, hướng dẫn sinh viên `Trịnh Quốc Cường` tại Renesas MCU Nhúng. |
| 5 | **TS. Nguyễn Thanh Tùng** | `lecturer.fme@careerbridge.edu.vn` | `Seed@123456` | Khoa Cơ khí (FME) | `ACTIVE` | Hướng dẫn sinh viên `Bùi Gia Huy` tại VinFast (từ chối báo cáo tuần 5 yêu cầu bổ sung đồ thị CAN Bus). |
| 6 | **TS. Lê Thanh Long** | `lecturer.fme2@careerbridge.edu.vn` | `Seed@123456` | Khoa Cơ khí (FME) | `ACTIVE` | Chuyên gia Robot & Hệ thống thông minh, phụ trách sinh viên ngành Robot, Cơ điện tử & Chế tạo máy. |
| 7 | **ThS. Lê Hoàng Mai** | `lecturer.sim@careerbridge.edu.vn` | `Seed@123456` | Khoa Quản lý Công nghiệp (SIM) | `ACTIVE` | Hướng dẫn và nghiệm thu đạt 9.0 cho sinh viên `Đỗ Thùy Dương` tại Cảng Cát Lái (Tân Cảng Sài Gòn). |
| 8 | **TS. Bùi Minh Triết** | `lecturer.fce@careerbridge.edu.vn` | `Seed@123456` | Khoa Kỹ thuật Hóa học (FCE) | `ACTIVE` | Phụ trách thực tập chuyên ngành Công nghệ Thực phẩm & Đảm bảo chất lượng QA/QC. |
| 9 | **PGS.TS. Huỳnh Kỳ Phương Chu** | `lecturer.fce2@careerbridge.edu.vn` | `Seed@123456` | Khoa Kỹ thuật Hóa học (FCE) | `ACTIVE` | Giảng viên cao cấp, hướng dẫn sinh viên `Chu Thị Thanh Hằng` thực tập tại Nhà máy Unilever Củ Chi. |
| 10 | **PGS.TS. Nguyễn Danh Thảo** | `lecturer.civil@careerbridge.edu.vn` | `Seed@123456` | Khoa Kỹ thuật Xây dựng (CIVIL) | `ACTIVE` | Trưởng khoa Xây dựng, đã nghiệm thu 9.3 cho `Trương Hữu Nghĩa` tại Coteccons; hướng dẫn đợt mới cho `Võ Thị Mỹ Duyên`. |

---

## 3. Doanh nghiệp Tuyển dụng (COMPANIES - 20 DOANH NGHIỆP THỰC TẾ)

| STT | Tên Doanh nghiệp | Email đăng nhập | Mật khẩu | Lĩnh vực hoạt động | Trạng thái | Kịch bản nghiệp vụ kiểm thử |
|:---:|---|---|---|---|:---:|---|
| 1 | **FPT Software** | `fpt.software@fpt.com` | `Seed@123456` | Dịch vụ Phần mềm & Chuyển đổi số | `APPROVED` | **Đã duyệt**: Có tin OPEN (Fullstack), tin CLOSED (Backend), thực tập sinh `Nguyễn Hoàng Long`, gửi offer cho `Phạm Hoàng Sơn` & `Vũ Phương Linh`. |
| 2 | **Bosch Global Software Technologies** | `bosch.recruitment@bosch.com` | `Seed@123456` | Phần mềm Nhúng & Kỹ thuật Ô tô | `APPROVED` | **Đã duyệt**: Đã cấp chứng nhận 9.5 cho `Trần Thị Mai Anh`; mở tin tuyển Automotive Embedded C++ & Hardware PCB cho Kỳ Xuân 2027. |
| 3 | **Viettel Solutions** | `viettel.solutions@viettel.com.vn` | `Seed@123456` | Viễn thông, An ninh mạng & Cloud | `APPROVED` | **Đã duyệt**: Mở tin tuyển SOC Analyst & Cloud DevOps, có lịch phỏng vấn Online với `Đặng Tuấn Kiệt`, đã tiếp nhận `Lê Minh Tuấn`. |
| 4 | **VinFast Auto** | `vinfast.careers@vinfast.vn` | `Seed@123456` | Sản xuất Ô tô điện & Pin BMS | `APPROVED` | **Đã duyệt**: Đang quản lý thực tập sinh `Bùi Gia Huy`, mở tuyển dụng kỹ sư Robot xưởng hàn & Tự động hóa dây chuyền lắp ráp. |
| 5 | **Tổng Công ty Tân Cảng Sài Gòn** | `saigon.newport@saigonnewport.com.vn` | `Seed@123456` | Cảng biển & Chuỗi cung ứng Logistics | `APPROVED` | **Đã duyệt**: Đã hoàn thành đợt thực tập cho sinh viên Logistics; mở tin tuyển Logistics Coordinator tại Cảng Cát Lái. |
| 6 | **VNG Corporation** | `vng.recruitment@vng.com.vn` | `Seed@123456` | Internet, Zalo, Game Platform & Cloud | `APPROVED` | **Đã duyệt**: Đang quản lý thực tập sinh `Nguyễn Minh Khoa`, đã gửi Offer cho `Lê Hoàng Yến` (Zalo Mini App), mở tuyển Backend Golang cao tải. |
| 7 | **MoMo (M-Service)** | `momo.careers@mservice.com.vn` | `Seed@123456` | Siêu ứng dụng Fintech & Dữ liệu lớn | `APPROVED` | **Đã duyệt**: Đang mở tuyển dụng Kỹ sư An toàn Ứng dụng AppSec & Chuyên viên Phân tích Dữ liệu BI; có lịch phỏng vấn với `Trần Quốc Bảo`. |
| 8 | **Axon Enterprise Việt Nam** | `axon.careers@axon.com` | `Seed@123456` | An ninh Công cộng, AI Camera & Cloud | `APPROVED` | **Đã duyệt**: Đang quản lý `Huỳnh Tuấn Kiệt` (Cloud AWS), đã gửi Offer lương 12tr cho `Phan Thị Quỳnh Nga` (Edge AI), mở tuyển C# .NET. |
| 9 | **Shopee Việt Nam** | `shopee.campus@shopee.vn` | `Seed@123456` | TMĐT & Mạng lưới Logistics SPX Express | `APPROVED` | **Đã duyệt**: Đang phỏng vấn sinh viên `Nguyễn Công Phượng` cho vị trí Kỹ sư Vận hành Chuỗi cung ứng SPX Express. |
| 10 | **Renesas Design Việt Nam (RVC)** | `renesas.careers@lm.renesas.com` | `Seed@123456` | Thiết kế Vi mạch Bán dẫn VLSI & SoC | `APPROVED` | **Đã duyệt**: Đã nghiệm thu 9.6 cho `Mai Phương Uyên`, đang hướng dẫn `Trịnh Quốc Cường`, mở tuyển 10 chỉ tiêu Digital RTL Verilog. |
| 11 | **NashTech Việt Nam** | `nashtech.careers@nashtechglobal.com` | `Seed@123456` | Phần mềm Quốc tế, Cloud & DevOps | `APPROVED` | **Đã duyệt**: Mở tuyển 8 chỉ tiêu Thực tập sinh Java/Spring Boot & Azure Cloud; đang xem xét hồ sơ của `Lê Thanh Phong`. |
| 12 | **Coteccons** | `coteccons.careers@coteccons.vn` | `Seed@123456` | Tổng thầu Xây dựng Dân dụng & BIM | `APPROVED` | **Đã duyệt**: Đã nghiệm thu 9.4 cho `Trương Hữu Nghĩa`, đã tiếp nhận `Võ Thị Mỹ Duyên`, mở tuyển kỹ sư Mô hình hóa BIM Revit. |
| 13 | **Unilever Việt Nam** | `unilever.careers@unilever.com` | `Seed@123456` | FMCG, Kỹ thuật Hóa học & QA/QC | `APPROVED` | **Đã duyệt**: Đang quản lý `Chu Thị Thanh Hằng` tại Nhà máy Củ Chi, mở tuyển Thực tập sinh Kỹ thuật Hóa học & Chế tạo mỹ phẩm. |
| 14 | **Vinamilk** | `vinamilk.careers@vinamilk.com.vn` | `Seed@123456` | Chế biến Thực phẩm & Tự động hóa Mega Plant | `APPROVED` | **Đã duyệt**: Mở tuyển Tự động hóa PLC Siemens S7-1500 và Quản lý Chất lượng Sữa QA/QC; đang phỏng vấn `Bùi Thanh Trúc`. |
| 15 | **SmartLog Việt Nam** | `smartlog.hr@gosmartlog.com` | `Seed@123456` | Logistics Số, Phần mềm WMS & TMS | `APPROVED` | **Đã duyệt**: Đã gửi Offer cho `Đoàn Văn Hậu`, mở tuyển Thực tập sinh Triển khai Phần mềm Quản trị Kho bãi WMS/TMS. |
| 16 | **KMS Technology** | `kms.recruitment@kms-technology.com` | `Seed@123456` | Kỹ thuật & Kiểm thử phần mềm (QA) | `PENDING` | **Chờ duyệt**: Hồ sơ công ty mới gửi, dùng để Admin test chức năng Thẩm định & Duyệt doanh nghiệp tại `/admin/companies`. |
| 17 | **Base Enterprise (Base.vn)** | `base.recruitment@base.vn` | `Seed@123456` | Phần mềm B2B SaaS Quản trị Doanh nghiệp | `PENDING` | **Chờ duyệt**: Doanh nghiệp SaaS nộp hồ sơ hợp tác đào tạo, đang trong hạn xét duyệt của Quản trị viên Quan hệ Doanh nghiệp. |
| 18 | **Công ty Alpha Việt Nam** | `alpha.tech@alphavn.com` | `Seed@123456` | Thương mại điện tử & Dịch vụ trực tuyến | `REJECTED` | **Bị từ chối**: Do bản scan giấy phép ĐKKD mờ không rõ con dấu (`DOCUMENT_UNCLEAR`). |
| 19 | **Công ty NextGen Solutions** | `nextgen.hr@nextgensolutions.vn` | `Seed@123456` | Phần mềm & Truyền thông số | `SUSPENDED` | **Bị đình chỉ**: Vi phạm chính sách đăng tin sai lệch và thu phí sinh viên trái quy định (`ABUSIVE_POSTING`). |
| 20 | **Startup Tân Phú** | `tanphu.startup@tanphutech.vn` | `Seed@123456` | IoT Nông nghiệp & Phần cứng | `DRAFT` | **Bản nháp**: Doanh nghiệp mới tạo tài khoản, chưa hoàn thiện hồ sơ pháp lý. |

---

## 4. Sinh viên Đại học Bách Khoa (STUDENTS - 36 SINH VIÊN ĐỦ 20 NGÀNH)

| STT | Mã số SV | Họ và tên | Email đăng nhập | Ngành học (Khoa) | GPA | Trạng thái thực tập & Tình huống nghiệp vụ |
|:---:|:---:|---|---|---|:---:|---|
| 0 | `2314282` | **Phạm Hoàng Sơn** | `pson4282@gmail.com` | Kỹ thuật Phần mềm (CSE) | 3.65 | **Tài khoản cá nhân / Fullstack Developer**: Có CV thật `CV_PhamHoangSon_FullStackDeveloper.pdf`, nhận Offer FPT Backend (8.5tr) & đơn Reviewing FPT Fullstack (AI Score 94.0). |
| 1 | `2110234` | **Nguyễn Hoàng Long** | `student.interning@student.hcmut.edu.vn` | Kỹ thuật Phần mềm (CSE) | 3.52 | **Đang thực tập Tuần 8/10 tại FPT Software**: Báo cáo tuần 1-7 đã được duyệt, báo cáo tuần 8 đang chờ Thầy Phạm Hoàng Anh duyệt. |
| 2 | `2011456` | **Trần Thị Mai Anh** | `student.completed@student.hcmut.edu.vn` | Khoa học Máy tính (CSE) | 3.78 | **Đã hoàn thành xuất sắc tại Bosch**: Điểm Công ty: 9.5, Điểm Giảng viên: 9.2. Hoàn thành trọn vẹn 10 tuần báo cáo. |
| 3 | `2112567` | **Lê Minh Tuấn** | `student.unassigned@student.hcmut.edu.vn` | Mạng máy tính & ATTT (CSE) | 3.35 | **Đã trúng tuyển Viettel Solutions nhưng CHƯA GÁN GVHD**: Dùng để Admin test chức năng Phân công giảng viên (`/admin/supervisions`). |
| 4 | `2210892` | **Phạm Đức Duy** | `student.jobseeking@student.hcmut.edu.vn` | Khoa học Dữ liệu & AI (CSE) | 3.65 | **Đang tìm kiếm việc**: Đã nộp 2 đơn ứng tuyển (FPT Fullstack: Reviewing, Bosch Embedded: Pending). Đã có phân tích AI Scan. |
| 5 | `2213456` | **Vũ Phương Linh** | `student.offered@student.hcmut.edu.vn` | Thiết kế Vi mạch (FEEE) | 3.71 | **Đã nhận Offer từ FPT Software**: Mức hỗ trợ 8,000,000đ/tháng, đang trong thời gian chờ phản hồi trước hạn 13/11/2026. |
| 6 | `2111890` | **Đặng Tuấn Kiệt** | `student.interviewing@student.hcmut.edu.vn` | Kỹ thuật Cơ điện tử (FME) | 3.44 | **Có lịch phỏng vấn Online tại Viettel Solutions**: Lúc 09:30 ngày 12/11/2026 qua Google Meet. Đã từ chối offer tại Bosch. |
| 7 | `2210567` | **Bùi Gia Huy** | `student.reported@student.hcmut.edu.vn` | Kỹ thuật Ô tô & Xe điện (FME) | 3.15 | **Báo cáo tuần 5 bị từ chối tại VinFast Auto**: Thầy Nguyễn Thanh Tùng yêu cầu bổ sung đồ thị giải mã tín hiệu CAN Bus. |
| 8 | `2211234` | **Võ Thị Bích Ngọc** | `student.support@student.hcmut.edu.vn` | Quản lý Công nghiệp (SIM) | 3.62 | **Đã gửi Support Request**: Xin giấy giới thiệu thực tập và đã nhận được phản hồi chính thức từ Ban Quản trị. |
| 9 | `2214567` | **Hoàng Nhật Minh** | `student.newbie@student.hcmut.edu.vn` | Công nghệ Thực phẩm (FCE) | 3.28 | **Sinh viên mới**: Chưa nộp đơn ứng tuyển, dùng để test luồng tìm kiếm tin và nộp hồ sơ từ đầu. |
| 10 | `2115678` | **Đỗ Thùy Dương** | `student.sim@student.hcmut.edu.vn` | Logistics & Chuỗi cung ứng (SIM) | 3.75 | **Đã hoàn thành thực tập tại Tân Cảng Sài Gòn**: Điểm Công ty: 9.3, Điểm Giảng viên: 9.0. |
| 11 | `2113890` | **Ngô Quốc Bảo** | `student.feee@student.hcmut.edu.vn` | Điều khiển & Tự động hóa (FEEE) | 3.55 | **Hồ sơ năng lực chuẩn Tự động hóa**: Thành thạo PLC S7-1200, WinCC SCADA, robot công nghiệp. |
| 12 | `2212345` | **Lý Hoàng Nam** | `student.withdrawn@student.hcmut.edu.vn` | Kỹ thuật Xây dựng (CIVIL) | 3.22 | **Đã từng tự rút đơn ứng tuyển (WITHDRAWN)** tại Tân Cảng và bị VinFast từ chối do lệch chuyên ngành Xây dựng. |
| 13 | `2110789` | **Nguyễn Minh Khoa** | `khoa.nguyen@student.hcmut.edu.vn` | Khoa học Máy tính (CSE) | 3.72 | **Đang thực tập Tuần 8/10 tại VNG (Gamer Platform)**: Báo cáo tuần 1-7 đã được Thầy Quản Thành Thơ duyệt, tuần 8 đang chờ duyệt. |
| 14 | `2211987` | **Lê Hoàng Yến** | `yen.le@student.hcmut.edu.vn` | Kỹ thuật Phần mềm (CSE) | 3.68 | **Đã nhận Offer tại VNG (Zalo Mini App)**: Mức hỗ trợ 9,000,000đ/tháng; có đơn Pending tại Axon Cloud. |
| 15 | `2112891` | **Trần Quốc Bảo** | `bao.tran@student.hcmut.edu.vn` | Hệ thống Thông tin (CSE) | 3.48 | **Có lịch phỏng vấn Online tại MoMo AppSec**: Lúc 14:00 ngày 13/11/2026 qua Google Meet. |
| 16 | `2213890` | **Phan Thị Quỳnh Nga** | `nga.phan@student.hcmut.edu.vn` | Trí tuệ Nhân tạo & DS (CSE) | 3.82 | **Đã nhận Offer tại Axon Enterprise (AI Camera)**: Mức lương thực tập 12,000,000đ/tháng; đã từ chối offer tại VNG. |
| 17 | `2114562` | **Huỳnh Tuấn Kiệt** | `kiet.huynh@student.hcmut.edu.vn` | Mạng máy tính & ATTT (CSE) | 3.65 | **Đang thực tập Tuần 8/10 tại Axon (Cloud AWS)**: Đã hoàn thành 8 tuần báo cáo được duyệt 100%. |
| 18 | `2212999` | **Đinh Gia Bảo** | `bao.dinh@student.hcmut.edu.vn` | Điện tử - Viễn thông (FEEE) | 3.42 | **Đang được Renesas Design xem xét hồ sơ (Reviewing)** vị trí Kỹ sư Thiết kế Vi mạch Số RTL. |
| 19 | `2113778` | **Trịnh Quốc Cường** | `cuong.trinh@student.hcmut.edu.vn` | Điều khiển & Tự động hóa (FEEE) | 3.66 | **Đang thực tập Tuần 8/10 tại Renesas (Chip Ô tô RH850)**: Báo cáo tuần 1-7 đã duyệt, tuần 8 đang viết nháp (DRAFT). |
| 20 | `2214665` | **Mai Phương Uyên** | `uyen.mai@student.hcmut.edu.vn` | Thiết kế Vi mạch (FEEE) | 3.85 | **Đã hoàn thành xuất sắc tại Renesas Design**: Điểm Công ty: 9.6, Điểm Giảng viên: 9.5; thiết kế phần cứng AES-128. |
| 21 | `2115123` | **Đỗ Minh Trí** | `tri.do@student.hcmut.edu.vn` | Kỹ thuật Điện (FEEE) | 3.38 | **Có lịch phỏng vấn Trực tiếp tại Bosch (Lầu 14 E-Town Central)** lúc 14:30 ngày 16/11/2026 vị trí Hardware PCB. |
| 22 | `2116234` | **Nguyễn Tiến Đạt** | `dat.nguyen@student.hcmut.edu.vn` | Kỹ thuật Cơ điện tử (FME) | 3.58 | **Đang được Coteccons xem xét hồ sơ (Reviewing)** vị trí Quản lý Mô hình BIM & Cơ điện MEP. |
| 23 | `2217345` | **Phạm Văn Thịnh** | `thinh.pham@student.hcmut.edu.vn` | Kỹ thuật Cơ khí (FME) | 3.35 | **Đang có đơn Pending tại VinFast Robot**; bị Axon từ chối do chưa đủ kỹ năng điện toán đám mây. |
| 24 | `2118456` | **Hồ Ngọc Hưng** | `hung.ho@student.hcmut.edu.vn` | Kỹ thuật Ô tô & Xe điện (FME) | 3.45 | **Đang có đơn Pending tại Bosch Embedded** vị trí phần mềm điều khiển khung gầm ô tô. |
| 25 | `2219567` | **Lương Thế Vinh** | `vinh.luong@student.hcmut.edu.vn` | Robot & Hệ thống Thông minh (FME) | 3.70 | **Có lịch phỏng vấn Trực tiếp tại VinFast (Landmark 81 TP.HCM)** lúc 10:00 ngày 14/11/2026 vị trí Robot xưởng hàn. |
| 26 | `2116789` | **Chu Thị Thanh Hằng** | `hang.chu@student.hcmut.edu.vn` | Kỹ thuật Hóa học (FCE) | 3.62 | **Đang thực tập Tuần 8/10 tại Unilever (Nhà máy Củ Chi)**: Báo cáo tuần 1-7 đã duyệt, tuần 8 vừa nộp (SUBMITTED). |
| 27 | `2217890` | **Bùi Thanh Trúc** | `truc.bui@student.hcmut.edu.vn` | Công nghệ Thực phẩm (FCE) | 3.50 | **Có lịch phỏng vấn Trực tiếp tại Trụ sở Vinamilk Q.7** lúc 09:00 ngày 15/11/2026 vị trí QA/QC Chế biến sữa. |
| 28 | `2118901` | **Dương Gia Hân** | `han.duong@student.hcmut.edu.vn` | Công nghệ Sinh học (FCE) | 3.64 | **Đang được Vinamilk xem xét hồ sơ (Reviewing)** vị trí kiểm soát vi sinh và lên men thực phẩm. |
| 29 | `2219012` | **Đoàn Văn Hậu** | `hau.doan@student.hcmut.edu.vn` | Quản lý Công nghiệp (SIM) | 3.52 | **Đã nhận Offer tại SmartLog Việt Nam**: Mức phụ cấp 6,500,000đ/tháng vị trí Triển khai Phần mềm WMS/TMS. |
| 30 | `2110123` | **Nguyễn Công Phượng** | `phuong.nguyen@student.hcmut.edu.vn` | Logistics & Chuỗi cung ứng (SIM) | 3.70 | **Có lịch phỏng vấn Online tại Shopee SPX Express** lúc 15:00 ngày 14/11/2026 vị trí Kỹ sư Vận hành Chuỗi cung ứng. |
| 31 | `2111234` | **Trương Hữu Nghĩa** | `nghia.truong@student.hcmut.edu.vn` | Kỹ thuật Xây dựng (CIVIL) | 3.58 | **Đã hoàn thành xuất sắc tại Coteccons**: Điểm Công ty: 9.4, Điểm Giảng viên: 9.3; đề tài Kết cấu bê tông cốt thép. |
| 32 | `2215899` | **Võ Thị Mỹ Duyên** | `duyen.vo@student.hcmut.edu.vn` | Kỹ thuật Môi trường (CIVIL) | 3.61 | **Đã trúng tuyển Coteccons Green (Kỳ Xuân 2027)**: GVHD được phân công là PGS.TS. Nguyễn Danh Thảo (Trưởng khoa Xây dựng). |
| 33 | `2113456` | **Lê Thanh Phong** | `phong.le@student.hcmut.edu.vn` | Kỹ thuật Phần mềm (CSE) | 3.55 | **Đang được NashTech xem xét hồ sơ (Reviewing)** vị trí Kỹ sư Thực tập Java/Spring Boot & Azure Cloud. |
| 34 | `2216890` | **Nguyễn Trọng Nhân** | `nhan.nguyen@student.hcmut.edu.vn` | Khoa học Máy tính (CSE) | 3.60 | **Đang được VNG xem xét hồ sơ (Reviewing)** vị trí Kỹ sư Thực tập Backend Golang & Hệ thống mạng hiệu năng cao. |
| 35 | `2117899` | **Phạm Thùy Linh** | `linh.pham@student.hcmut.edu.vn` | Trí tuệ Nhân tạo & DS (CSE) | 3.75 | **Đang được MoMo xem xét hồ sơ (Reviewing)** vị trí Phân tích Dữ liệu Tài chính & Trực quan hóa BI (AI Score 93.0). |

---

## 5. Tài khoản kiểm thử trạng thái đặc biệt (UserStatus)

| STT | Email đăng nhập | Mật khẩu | Trạng thái tài khoản | Mục đích kiểm thử |
|:---:|---|---|:---:|---|
| 1 | `user.unverified@careerbridge.edu.vn` | `Seed@123456` | `PENDING_VERIFICATION` | Kiểm tra giao diện yêu cầu xác thực email và gửi lại mã xác minh. |
| 2 | `user.banned@careerbridge.edu.vn` | `Seed@123456` | `BANNED` | Kiểm tra cơ chế chặn đăng nhập của tài khoản bị khóa vi phạm kỷ luật. |
| 3 | `user.inactive@careerbridge.edu.vn` | `Seed@123456` | `INACTIVE` | Kiểm tra xử lý đối với tài khoản tạm thời bị vô hiệu hóa. |

---

## Ghi chú Quan trọng

1. **Người thật việc thật**: Tên doanh nghiệp, mã số thuế, địa chỉ trụ sở, tên giảng viên, tên sinh viên, mã số sinh viên ĐHBK và các mô tả công việc (JD) đều được xây dựng dựa trên thực tế 100%.
2. **Mật khẩu dùng chung**: `Seed@123456` cho tất cả các tài khoản demo trên hệ thống.
3. **CV đính kèm**: Toàn bộ 36 sinh viên đều được gán file CV PDF thực tế trong hệ thống lưu trữ Supabase Storage, phục vụ kiểm thử tính năng xem và tải CV.
4. **Bao phủ 20 ngành đào tạo**: Đảm bảo tất cả 20 ngành học của 6 khoa ĐHBK đều có sinh viên và tin tuyển dụng tương ứng.
