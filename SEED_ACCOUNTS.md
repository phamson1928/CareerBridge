# DANH SÁCH TÀI KHOẢN HỆ THỐNG DEMO & KIỂM THỬ (SEED ACCOUNTS)

Hệ thống **CareerBridge** đã được nạp bộ dữ liệu seed chuẩn hóa, phục vụ mục đích kiểm thử và demo toàn diện tất cả các phân hệ và vai trò người dùng.

> **Mật khẩu dùng chung cho tất cả các tài khoản demo:** `Seed@123456`

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
| 4 | **ThS. Lê Hoàng Mai** | `lecturer.sim@careerbridge.edu.vn` | `Seed@123456` | Khoa Quản lý Công nghiệp (SIM) | `ACTIVE` | Hướng dẫn sinh viên ngành Logistics & Quản lý Chuỗi cung ứng. |
| 5 | **TS. Bùi Minh Triết** | `lecturer.fce@careerbridge.edu.vn` | `Seed@123456` | Khoa Kỹ thuật Hóa học (FCE) | `ACTIVE` | Phụ trách thực tập ngành Công nghệ Thực phẩm & Hóa kỹ thuật. |

---

## 3. Doanh nghiệp Tuyển dụng (COMPANY)

| STT | Tên Doanh nghiệp | Email đăng nhập | Mật khẩu | Lĩnh vực | Trạng thái | Kịch bản nghiệp vụ kiểm thử |
|:---:|---|---|---|---|:---:|---|
| 1 | **FPT Software** | `fpt.software@fpt.com` | `Seed@123456` | Phần mềm & Chuyển đổi số | `APPROVED` | **Đã duyệt**: Có tin OPEN (Fullstack), tin CLOSED (Backend), thực tập sinh đang theo dõi (Nguyễn Hoàng Long), có ứng viên nhận Offer (Vũ Phương Linh). |
| 2 | **Bosch Global Software Technologies** | `bosch.recruitment@bosch.com` | `Seed@123456` | Phần mềm Nhúng & Kỹ thuật Ô tô | `APPROVED` | **Đã duyệt**: Đã cấp chứng nhận và chấm 9.5 cho `Trần Thị Mai Anh`; đang mở tin tuyển Embedded C++ cho Kỳ Xuân 2027. |
| 3 | **Viettel Solutions** | `viettel.solutions@viettel.com.vn` | `Seed@123456` | Viễn thông & Cyber SOC | `APPROVED` | **Đã duyệt**: Đang mở tin tuyển SOC Analyst, có lịch phỏng vấn Online với `Đặng Tuấn Kiệt`, đã nhận sinh viên `Lê Minh Tuấn`. |
| 4 | **VinFast Auto** | `vinfast.careers@vinfast.vn` | `Seed@123456` | Sản xuất Ô tô điện & Pin BMS | `APPROVED` | **Đã duyệt**: Đang quản lý thực tập sinh `Bùi Gia Huy`, mở tuyển dụng kỹ sư Robot & Tự động hóa xưởng hàn. |
| 5 | **Tổng Công ty Tân Cảng Sài Gòn** | `saigon.newport@saigonnewport.com.vn` | `Seed@123456` | Cảng biển & Chuỗi cung ứng | `APPROVED` | **Đã duyệt**: Đã hoàn thành đợt thực tập cho sinh viên Logistics; đang mở tin tuyển Logistics Coordinator tại Cảng Cát Lái. |
| 6 | **KMS Technology** | `kms.recruitment@kms-technology.com` | `Seed@123456` | Kỹ thuật & Kiểm thử phần mềm | `PENDING` | **Chờ duyệt**: Hồ sơ công ty mới gửi, dùng để Admin test duyệt doanh nghiệp tại `/admin/companies`. |
| 7 | **Công ty Alpha Việt Nam** | `alpha.tech@alphavn.com` | `Seed@123456` | Thương mại điện tử | `REJECTED` | **Bị từ chối**: Do giấy ĐKKD mờ không rõ con dấu (`DOCUMENT_UNCLEAR`). |
| 8 | **Công ty NextGen Solutions** | `nextgen.hr@nextgensolutions.vn` | `Seed@123456` | Phần mềm & Truyền thông | `SUSPENDED` | **Bị đình chỉ**: Do vi phạm chính sách đăng tin sai lệch và thu phí sinh viên (`ABUSIVE_POSTING`). |
| 9 | **Startup Tân Phú** | `tanphu.startup@tanphutech.vn` | `Seed@123456` | IoT Nông nghiệp | `DRAFT` | **Bản nháp**: Doanh nghiệp mới tạo tài khoản, chưa hoàn thiện hồ sơ đăng ký. |

---

## 4. Sinh viên Đại học Bách Khoa (STUDENT)

| STT | Mã số SV | Họ và tên | Email đăng nhập | Ngành đào tạo (Khoa) | Tình huống nghiệp vụ kiểm thử |
|:---:|:---:|---|---|---|---|
| 0 | `2314282` | **Phạm Hoàng Sơn** | `pson4282@gmail.com` | Kỹ thuật Phần mềm (CSE) | **Tài khoản cá nhân / Fullstack Developer**: Có CV thật `CV_PhamHoangSon_FullStackDeveloper.pdf`, có đơn OFFERED tại FPT Software và đơn REVIEWING. |
| 1 | `2110234` | **Nguyễn Hoàng Long** | `student.interning@student.hcmut.edu.vn` | Kỹ thuật Phần mềm (CSE) | **Đang thực tập Tuần 8/10** tại FPT Software. Báo cáo tuần 1-7 đã được duyệt, báo cáo tuần 8 đang chờ GVHD duyệt. |
| 2 | `2011456` | **Trần Thị Mai Anh** | `student.completed@student.hcmut.edu.vn` | Khoa học Máy tính (CSE) | **Đã hoàn thành thực tập** tại Bosch. Điểm Công ty: 9.5, Điểm Giảng viên: 9.2. Đã hoàn thành 10 tuần báo cáo. |
| 3 | `2112567` | **Lê Minh Tuấn** | `student.unassigned@student.hcmut.edu.vn` | Mạng máy tính & ATTT (CSE) | **Đã được Viettel tiếp nhận nhưng chưa gán GVHD**. Dùng để Admin test chức năng Phân công giảng viên. |
| 4 | `2210892` | **Phạm Đức Duy** | `student.jobseeking@student.hcmut.edu.vn` | Trí tuệ Nhân tạo & DS (CSE) | **Đang tìm kiếm việc**: Đã nộp 2 đơn ứng tuyển (FPT: đang Reviewing, Bosch: đang Pending). Đã có phân tích AI Scan. |
| 5 | `2213456` | **Vũ Phương Linh** | `student.offered@student.hcmut.edu.vn` | Thiết kế Vi mạch (FEEE) | **Đã nhận được Offer** từ FPT Software với mức hỗ trợ 8,000,000đ/tháng. Hạn phản hồi: 13/11/2026. |
| 6 | `2111890` | **Đặng Tuấn Kiệt** | `student.interviewing@student.hcmut.edu.vn` | Kỹ thuật Cơ điện tử (FME) | **Đang có lịch phỏng vấn Online** tại Viettel Solutions vào lúc 09:30 ngày 12/11/2026 qua Google Meet. |
| 7 | `2210567` | **Bùi Gia Huy** | `student.reported@student.hcmut.edu.vn` | Kỹ thuật Ô tô & Xe điện (FME) | **Báo cáo tuần 5 bị từ chối** tại VinFast Auto, GVHD yêu cầu bổ sung đồ thị phân tích tín hiệu CAN Bus. |
| 8 | `2211234` | **Võ Thị Bích Ngọc** | `student.support@student.hcmut.edu.vn` | Quản lý Công nghiệp (SIM) | **Đã gửi Support Request** xin giấy giới thiệu thực tập và đã nhận được phản hồi chính thức từ Nhà trường. |
| 9 | `2214567` | **Hoàng Nhật Minh** | `student.newbie@student.hcmut.edu.vn` | Công nghệ Thực phẩm (FCE) | **Sinh viên mới**: Chưa nộp đơn ứng tuyển, dùng để test luồng nộp hồ sơ từ đầu. |
| 10 | `2115678` | **Đỗ Thùy Dương** | `student.sim@student.hcmut.edu.vn` | Logistics & SCM (SIM) | **Đã hoàn thành thực tập** tại Tân Cảng Sài Gòn, đạt kết quả xuất sắc. |
| 11 | `2113890` | **Ngô Quốc Bảo** | `student.feee@student.hcmut.edu.vn` | Kỹ thuật Tự động hóa (FEEE) | **Hồ sơ sinh viên ngành Điện - Tự động hóa** đầy đủ kỹ năng PLC, SCADA, mạch điện công nghiệp. |
| 12 | `2212345` | **Lý Hoàng Nam** | `student.withdrawn@student.hcmut.edu.vn` | Kỹ thuật Xây dựng (CIVIL) | **Đã từng tự rút đơn ứng tuyển** (WITHDRAWN) và bị từ chối ở vị trí khác do lệch chuyên môn. |

---

## 5. Tài khoản kiểm thử trạng thái đặc biệt (UserStatus)

| STT | Email đăng nhập | Mật khẩu | Trạng thái tài khoản | Mục đích kiểm thử |
|:---:|---|---|:---:|---|
| 1 | `user.unverified@careerbridge.edu.vn` | `Seed@123456` | `PENDING_VERIFICATION` | Kiểm tra giao diện yêu cầu xác thực email và gửi lại mã xác minh. |
| 2 | `user.banned@careerbridge.edu.vn` | `Seed@123456` | `BANNED` | Kiểm tra cơ chế chặn đăng nhập của tài khoản bị khóa vi phạm kỷ luật. |
| 3 | `user.inactive@careerbridge.edu.vn` | `Seed@123456` | `INACTIVE` | Kiểm tra xử lý đối với tài khoản tạm thời bị vô hiệu hóa. |

---

## Ghi chú Quan trọng

1. Toàn bộ mật khẩu đã được mã hóa bằng chuẩn `bcrypt` tương thích tuyệt đối với phương thức `compare` của Backend.
2. Dữ liệu có tính liên kết thực tế: sinh viên có ngành học chuẩn thuộc các khoa của ĐHBK, tin tuyển dụng được lọc theo đúng ngành và kỹ năng chuyên môn tương ứng.
3. Không sử dụng các tài khoản hoặc dữ liệu mẫu này trên môi trường Production.
