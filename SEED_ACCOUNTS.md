# DANH SÁCH TÀI KHOẢN HỆ THỐNG DEMO & KIỂM THỬ (SEED ACCOUNTS)

Hệ thống **CareerBridge** đã được nạp bộ dữ liệu seed chuẩn hóa (34 tài khoản), phục vụ mục đích kiểm thử và demo toàn diện tất cả các phân hệ và vai trò người dùng.

> 🔑 **MẬT KHẨU DÙNG CHUNG CHO TẤT CẢ TÀI KHOẢN DEMO:** `Seed@123456`

---

## 🧭 BẢNG TRA CỨU NHANH THEO KỊCH BẢN DEMO (QUICK MATRIX)

| Kịch bản / Chức năng muốn demo | Tài khoản nên đăng nhập | Vai trò | Điểm nhấn kỹ thuật / Nghiệp vụ |
|---|---|:---:|---|
| **Demo AI Scan CV & Match việc làm** | `pson4282@gmail.com` | `STUDENT` | Có sẵn CV thật `CV_PhamHoangSon_FullStackDeveloper.pdf`, kỹ năng chuẩn NestJS/React, điểm match 95–96%. |
| **Demo HR duyệt CV & gửi Offer** | `fpt.software@fpt.com` | `COMPANY` | Đang có tin Fullstack (có đơn của Phạm Hoàng Sơn) và tin Backend (đã gửi Offer 8.5tr/tháng). |
| **Demo Phỏng vấn trực tuyến (Google Meet)** | `viettel.solutions@viettel.com.vn` <br/> `student.interviewing@student.hcmut.edu.vn` | `COMPANY` <br/> `STUDENT` | Lịch phỏng vấn lúc 09:30 ngày 12/11/2026 kèm link Google Meet đã sinh sẵn trong hệ thống. |
| **Demo Báo cáo tuần & GVHD duyệt** | `lecturer.cse@careerbridge.edu.vn` <br/> `student.interning@student.hcmut.edu.vn` | `LECTURER` <br/> `STUDENT` | Sinh viên Nguyễn Hoàng Long đang ở tuần 8/10, báo cáo tuần 8 đang chờ Thầy duyệt. |
| **Demo Báo cáo bị từ chối / Phản hồi** | `student.reported@student.hcmut.edu.vn` <br/> `lecturer.fme@careerbridge.edu.vn` | `STUDENT` <br/> `LECTURER` | Bùi Gia Huy tại VinFast có báo cáo tuần 5 bị từ chối, yêu cầu bổ sung đồ thị CAN Bus. |
| **Demo Đã tốt nghiệp / Chấm điểm 2 phía** | `student.completed@student.hcmut.edu.vn` | `STUDENT` | Trần Thị Mai Anh hoàn thành tại Bosch: Điểm DN = 9.5, Điểm GV = 9.2 $\rightarrow$ Final Score = 9.35. |
| **Demo Phân công GVHD** | `academic.admin@careerbridge.edu.vn` | `ADMIN` | Lê Minh Tuấn đã được Viettel nhận nhưng chưa có GVHD $\rightarrow$ Thao tác phân công tại `/admin/supervisions`. |
| **Demo Thẩm định & Duyệt Doanh nghiệp** | `corporate.admin@careerbridge.edu.vn` | `ADMIN` | Doanh nghiệp KMS Technology đang trạng thái `PENDING` chờ duyệt giấy phép kinh doanh. |
| **Demo Xử lý Khiếu nại / Support Ticket** | `support.admin@careerbridge.edu.vn` | `ADMIN` | Sinh viên Võ Thị Bích Ngọc gửi yêu cầu cấp giấy giới thiệu thực tập. |
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

## 2. Giảng viên Hướng dẫn Đại học Bách Khoa (LECTURER)

| STT | Học hàm - Họ tên | Email đăng nhập | Mật khẩu | Khoa phụ trách | Trạng thái | Mô tả kịch bản nghiệp vụ |
|:---:|---|---|---|---|:---:|---|
| 1 | **PGS.TS. Phạm Hoàng Anh** | `lecturer.cse@careerbridge.edu.vn` | `Seed@123456` | Khoa KH & KT Máy tính (CSE) | `ACTIVE` | Hướng dẫn sinh viên `Nguyễn Hoàng Long` (đang có báo cáo tuần 8 chờ duyệt) và `Trần Thị Mai Anh` (đã hoàn thành, đã chấm 9.2). |
| 2 | **TS. Đỗ Quốc Thắng** | `lecturer.feee@careerbridge.edu.vn` | `Seed@123456` | Khoa Điện - Điện tử (FEEE) | `ACTIVE` | Trưởng bộ môn Vi mạch, phụ trách sinh viên ngành Vi điện tử & Tự động hóa. |
| 3 | **TS. Nguyễn Thanh Tùng** | `lecturer.fme@careerbridge.edu.vn` | `Seed@123456` | Khoa Cơ khí (FME) | `ACTIVE` | Hướng dẫn sinh viên `Bùi Gia Huy` tại VinFast (đã từ chối báo cáo tuần 5 yêu cầu bổ sung đồ thị CAN Bus). |
| 4 | **ThS. Lê Hoàng Mai** | `lecturer.sim@careerbridge.edu.vn` | `Seed@123456` | Khoa Quản lý Công nghiệp (SIM) | `ACTIVE` | Hướng dẫn sinh viên ngành Logistics & Quản lý Chuỗi cung ứng (`Đỗ Thùy Dương` tại Tân Cảng). |
| 5 | **TS. Bùi Minh Triết** | `lecturer.fce@careerbridge.edu.vn` | `Seed@123456` | Khoa Kỹ thuật Hóa học (FCE) | `ACTIVE` | Phụ trách thực tập ngành Công nghệ Thực phẩm & Hóa kỹ thuật. |

---

## 3. Doanh nghiệp Tuyển dụng (COMPANY)

| STT | Tên Doanh nghiệp | Email đăng nhập | Mật khẩu | Lĩnh vực | Trạng thái | Kịch bản nghiệp vụ kiểm thử |
|:---:|---|---|---|---|:---:|---|
| 1 | **FPT Software** | `fpt.software@fpt.com` | `Seed@123456` | Phần mềm & Chuyển đổi số | `APPROVED` | **Đã duyệt**: Đang mở tin Fullstack (có đơn REVIEWING của `Phạm Hoàng Sơn`), tin Backend (đã gửi OFFER 8.5tr cho `Phạm Hoàng Sơn`), đang theo dõi thực tập sinh `Nguyễn Hoàng Long`, có ứng viên nhận Offer `Vũ Phương Linh`. |
| 2 | **Bosch Global Software Technologies** | `bosch.recruitment@bosch.com` | `Seed@123456` | Phần mềm Nhúng & Kỹ thuật Ô tô | `APPROVED` | **Đã duyệt**: Đã cấp chứng nhận và chấm 9.5 cho `Trần Thị Mai Anh`; đang mở tin tuyển Embedded C++ cho Kỳ Xuân 2027. |
| 3 | **Viettel Solutions** | `viettel.solutions@viettel.com.vn` | `Seed@123456` | Viễn thông & Cyber SOC | `APPROVED` | **Đã duyệt**: Đang mở tin tuyển SOC Analyst, có lịch phỏng vấn Online với `Đặng Tuấn Kiệt`, đã nhận sinh viên `Lê Minh Tuấn`. |
| 4 | **VinFast Auto** | `vinfast.careers@vinfast.vn` | `Seed@123456` | Sản xuất Ô tô điện & Pin BMS | `APPROVED` | **Đã duyệt**: Đang quản lý thực tập sinh `Bùi Gia Huy`, mở tuyển dụng kỹ sư Robot & Tự động hóa xưởng hàn. |
| 5 | **Tổng Công ty Tân Cảng Sài Gòn** | `saigon.newport@saigonnewport.com.vn` | `Seed@123456` | Cảng biển & Chuỗi cung ứng | `APPROVED` | **Đã duyệt**: Đã hoàn thành đợt thực tập cho sinh viên Logistics (`Đỗ Thùy Dương`); đang mở tin tuyển Logistics Coordinator tại Cảng Cát Lái. |
| 6 | **KMS Technology** | `kms.recruitment@kms-technology.com` | `Seed@123456` | Kỹ thuật & Kiểm thử phần mềm | `PENDING` | **Chờ duyệt**: Hồ sơ công ty mới gửi kèm ĐKKD rõ nét, dùng để Admin test duyệt doanh nghiệp tại `/admin/companies`. |
| 7 | **Công ty Alpha Việt Nam** | `alpha.tech@alphavn.com` | `Seed@123456` | Thương mại điện tử | `REJECTED` | **Bị từ chối**: Do giấy ĐKKD mờ không rõ con dấu pháp nhân (`DOCUMENT_UNCLEAR`). |
| 8 | **Công ty NextGen Solutions** | `nextgen.hr@nextgensolutions.vn` | `Seed@123456` | Phần mềm & Truyền thông | `SUSPENDED` | **Bị đình chỉ**: Do vi phạm chính sách đăng tin sai lệch và thu phí sinh viên (`ABUSIVE_POSTING`). |
| 9 | **Startup Tân Phú** | `tanphu.startup@tanphutech.vn` | `Seed@123456` | IoT Nông nghiệp | `DRAFT` | **Bản nháp**: Doanh nghiệp mới tạo tài khoản, chưa hoàn thiện hồ sơ đăng ký. |

---

## 4. Sinh viên Đại học Bách Khoa (STUDENT)

| STT | Mã số SV | Họ và tên | Email đăng nhập | Ngành (Khoa) | Tệp CV Mẫu đính kèm | Tình huống nghiệp vụ & Trạng thái ứng tuyển |
|:---:|:---:|---|---|---|---|---|
| **0** | `2314282` | **Phạm Hoàng Sơn** | `pson4282@gmail.com` | Kỹ thuật Phần mềm (CSE) | `CV_PhamHoangSon_FullStackDeveloper.pdf` | **Tài khoản cá nhân / Fullstack Developer**: GPA 3.65. Đơn 1: **REVIEWING** tại FPT Fullstack (Match: 95%, AI: 94%). Đơn 2: **OFFERED** tại FPT Backend (Mức hỗ trợ: 8,500,000đ/tháng). |
| 1 | `2110234` | **Nguyễn Hoàng Long** | `student.interning@student.hcmut.edu.vn` | Kỹ thuật Phần mềm (CSE) | `Kỹ sư Phần mềm Sơ yếu lý lịch Trắng Tím.pdf` | **Đang thực tập Tuần 8/10** tại FPT Software. Báo cáo tuần 1-7 đã được duyệt, báo cáo tuần 8 đang chờ GVHD (PGS.TS. Phạm Hoàng Anh) duyệt. |
| 2 | `2011456` | **Trần Thị Mai Anh** | `student.completed@student.hcmut.edu.vn` | Khoa học Máy tính (CSE) | `Hồ sơ xin việc Khoa học và Kỹ thuật Đỏ tươi Kem.pdf` | **Đã hoàn thành thực tập** tại Bosch. Điểm Công ty: 9.5, Điểm Giảng viên: 9.2. Đã hoàn thành 10 tuần báo cáo và cấp chứng nhận. |
| 3 | `2112567` | **Lê Minh Tuấn** | `student.unassigned@student.hcmut.edu.vn` | Mạng máy tính & ATTT (CSE) | `Đen Trắng Hiện Đại Truyền Thông Hồ Sơ Xin Việc.pdf` | **Đã được Viettel tiếp nhận nhưng chưa gán GVHD**. Dùng để Admin test chức năng Phân công giảng viên tại `/admin/supervisions`. |
| 4 | `2210892` | **Phạm Đức Duy** | `student.jobseeking@student.hcmut.edu.vn` | Trí tuệ Nhân tạo & DS (CSE) | `Đơn giản Chuyên nghiệp Kỹ sư phần mềm.pdf` | **Đang tìm kiếm việc**: Đã nộp 2 đơn ứng tuyển (FPT: đang Reviewing, Bosch: đang Pending). Đã có phân tích AI Scan chuyên sâu. |
| 5 | `2213456` | **Vũ Phương Linh** | `student.offered@student.hcmut.edu.vn` | Thiết kế Vi mạch (FEEE) | `Hồ sơ Xin việc Khoa học và Kỹ thuật Trắng Đen.pdf` | **Đã nhận được Offer** từ FPT Software với mức hỗ trợ 8,000,000đ/tháng. Hạn phản hồi: 13/11/2026. |
| 6 | `2111890` | **Đặng Tuấn Kiệt** | `student.interviewing@student.hcmut.edu.vn` | Kỹ thuật Cơ điện tử (FME) | `Hồ sơ Xin việc Thiết kế Hệ thống Be Đen.pdf` | **Đang có lịch phỏng vấn Online** tại Viettel Solutions vào lúc 09:30 ngày 12/11/2026 qua Google Meet. |
| 7 | `2210567` | **Bùi Gia Huy** | `student.reported@student.hcmut.edu.vn` | Kỹ thuật Ô tô & Xe điện (FME) | `Hồ sơ xin việc Thiết kế hệ thống Trắng đen.pdf` | **Báo cáo tuần 5 bị từ chối** tại VinFast Auto, GVHD (TS. Nguyễn Thanh Tùng) yêu cầu bổ sung đồ thị tín hiệu CAN Bus. |
| 8 | `2211234` | **Võ Thị Bích Ngọc** | `student.support@student.hcmut.edu.vn` | Quản lý Công nghiệp (SIM) | `Hồ sơ Xin việc Tiếp thị và Bán hàng Cam Sẫm.pdf` | **Đã gửi Support Request** xin giấy giới thiệu thực tập và đã nhận được phản hồi chính thức từ Nhà trường (`RESOLVED`). |
| 9 | `2214567` | **Hoàng Nhật Minh** | `student.newbie@student.hcmut.edu.vn` | Công nghệ Thực phẩm (FCE) | `Nhà thiết kế Đồ họa Sơ yếu lý lịch.pdf` | **Sinh viên mới**: Chưa nộp đơn ứng tuyển, dùng để test luồng nộp hồ sơ từ đầu. |
| 10 | `2115678` | **Đỗ Thùy Dương** | `student.sim@student.hcmut.edu.vn` | Logistics & SCM (SIM) | `Hồ sơ Xin việc Khoa học và Kỹ thuật Đỏ tươi Kem.pdf` | **Đã hoàn thành thực tập** tại Tân Cảng Sài Gòn, đạt kết quả xuất sắc (Điểm DN: 9.0, Điểm GV: 9.0). |
| 11 | `2113890` | **Ngô Quốc Bảo** | `student.feee@student.hcmut.edu.vn` | Kỹ thuật Tự động hóa (FEEE) | `Kỹ sư Phần mềm Sơ yếu lý lịch Trắng Tím.pdf` | **Hồ sơ sinh viên ngành Điện - Tự động hóa** đầy đủ kỹ năng PLC, SCADA, mạch điện công nghiệp. Đã từ chối offer VinFast (`DECLINED`). |
| 12 | `2212345` | **Lý Hoàng Nam** | `student.withdrawn@student.hcmut.edu.vn` | Kỹ thuật Xây dựng (CIVIL) | `Hồ sơ Xin việc Thiết kế Hệ thống Be Đen.pdf` | **Đã từng tự rút đơn ứng tuyển** (`WITHDRAWN`) tại FPT và bị từ chối (`REJECTED`) tại Viettel do lệch chuyên môn xây dựng. |

---

## 5. Tài khoản kiểm thử trạng thái đặc biệt (UserStatus)

| STT | Email đăng nhập | Mật khẩu | Trạng thái tài khoản | Mục đích kiểm thử |
|:---:|---|---|:---:|---|
| 1 | `user.unverified@careerbridge.edu.vn` | `Seed@123456` | `PENDING_VERIFICATION` | Kiểm tra giao diện yêu cầu xác thực email và gửi lại mã xác minh (Token: `demo-unverified-token-careerbridge-2026`). |
| 2 | `user.banned@careerbridge.edu.vn` | `Seed@123456` | `BANNED` | Kiểm tra cơ chế chặn đăng nhập của tài khoản bị khóa vi phạm kỷ luật đào tạo. |
| 3 | `user.inactive@careerbridge.edu.vn` | `Seed@123456` | `INACTIVE` | Kiểm tra xử lý đối với tài khoản tạm thời bị vô hiệu hóa. |

---

## 💡 Ghi chú Kỹ thuật quan trọng khi chạy Demo
1. **Mật khẩu chuẩn hóa:** Toàn bộ 34 tài khoản đều dùng mật khẩu chung `Seed@123456`.
2. **File CV thực tế:** 100% sinh viên trong hệ thống đều đã được tải lên và liên kết tệp PDF CV tương ứng vào hệ thống lưu trữ (Supabase Storage), sẵn sàng để Doanh nghiệp xem trực tiếp hoặc cho AI Worker quét bóc tách.
3. **Tính liên kết logic nghiệp vụ:** 
   - Đợt thực tập, báo cáo hàng tuần và điểm số đã được liên kết chính xác giữa Sinh viên $\leftrightarrow$ Giảng viên hướng dẫn $\leftrightarrow$ Doanh nghiệp.
   - Thao tác nộp báo cáo hoặc chấm điểm sẽ phản ánh ngay lập tức trên tài khoản đối ứng mà không xảy ra xung đột dữ liệu.
