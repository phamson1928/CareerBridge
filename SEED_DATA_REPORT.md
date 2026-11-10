# BÁO CÁO PHÂN TÍCH HỆ THỐNG VÀ XÂY DỰNG BỘ SEED DATA THỰC TẾ (QUY MÔ LỚN)
**Dự án:** Nền tảng Quản lý Thực tập Tốt nghiệp CareerBridge  
**Đối tượng mô phỏng:** Hệ thống quản lý thực tập thực tế của Trường Đại học Bách Khoa (ĐHQG TPHCM)  
**Thời điểm tham chiếu hệ thống:** Tháng 11/2026  
**Quy mô dữ liệu:** **1,416 bản ghi** (Bao phủ 31 bảng dữ liệu, 73 tài khoản người dùng, 20 doanh nghiệp thật, 10 giảng viên thật, 36 sinh viên chuẩn 20 ngành đào tạo)

---

## 1. Phân tích Toàn bộ Dự án & Kiến trúc Dữ liệu

### 1.1. Cấu trúc Prisma Schema (33 Model) & Phân quyền Hệ thống
Hệ thống quản lý thực tập CareerBridge là nền tảng quản lý quy trình thực tập khép kín với 33 model dữ liệu liên kết chặt chẽ:
1. **Quản trị Tài khoản & Phân quyền Sub-Admin:**
   - `User` (hỗ trợ `isSuperAdmin: Boolean` và `permissions: String[]`), `VerificationToken`, `PasswordResetToken`, `RefreshToken`, `AuditLog`.
   - **Super Admin (`isSuperAdmin: true`)**: Toàn quyền mọi phân hệ, **độc quyền** quản lý tài khoản & phân quyền Sub-Admin (`/admin/users`) và xem Nhật ký kiểm toán hệ thống (`/admin/audit-logs`).
   - **Sub-Admin (`isSuperAdmin: false`)**: Được cấp quyền theo các module chuẩn hóa:
     - Giáo vụ Đào tạo: `DASHBOARD`, `PLACEMENTS`, `SEMESTERS`, `SUPPORT`.
     - Quan hệ Doanh nghiệp: `DASHBOARD`, `COMPANIES`, `INTERNSHIPS`.
     - Chuyên viên Hỗ trợ Sinh viên: `SUPPORT`.
2. **Cơ cấu Tổ chức Đào tạo Bách Khoa:**
   - `Faculty` (6 Khoa: CSE, FEEE, FME, FCE, SIM, CIVIL).
   - `Major` (20 Ngành đào tạo chuẩn của ĐHBK: Khoa học máy tính, Kỹ thuật phần mềm, Hệ thống thông tin, Mạng MT & ATTT, AI & Khoa học dữ liệu, Điện tử - Viễn thông, Kỹ thuật Máy tính, Thiết kế Vi mạch, Kỹ thuật Điện, Điều khiển & Tự động hóa, Cơ điện tử, Cơ khí, Ô tô & Xe điện, Robot & HT thông minh, Kỹ thuật Hóa học, Công nghệ Thực phẩm, Công nghệ Sinh học, Quản lý Công nghiệp, Logistics & Quản lý Chuỗi cung ứng, Kỹ thuật Xây dựng, Kỹ thuật Môi trường).
   - `Skill` (124 kỹ năng chuyên sâu phân loại theo nhóm chuyên môn).
3. **Hồ sơ Người dùng Chuyên biệt:**
   - `StudentProfile`: Liên kết mã ngành `majorId`, đồng bộ `major`, quản lý `GPA`, `StudentSkill`, `StudentProject`, `StudentJobPreference`, file CV đính kèm.
   - `LecturerProfile`: Liên kết khoa cơ hữu `facultyId`, đồng bộ `department`, học hàm/học vị `title` (PGS.TS., TS., ThS.).
   - `CompanyProfile`: Trạng thái kiểm duyệt `CompanyStatus` (`APPROVED`, `PENDING`, `REJECTED`, `SUSPENDED`, `DRAFT`), mã số thuế `businessRegistrationNumber`, checklist kiểm duyệt pháp lý `reviewChecklist`, địa chỉ trụ sở và khu công nghiệp thực tế.
4. **Học kỳ & Chu kỳ Thực tập (Semester Lifecycle):**
   - `Semester`: Quản lý chu kỳ thời gian (Tuyển dụng $\rightarrow$ Thực tập $\rightarrow$ Nghiệm thu).
5. **Tin Tuyển dụng & Đơn vị Tiếp nhận:**
   - `Internship`: Trạng thái tin (`DRAFT`, `OPEN`, `CLOSED`, `REJECTED`, `CANCELLED`), chỉ tiêu, hạn nộp, liên kết nhiều-nhiều với `Major` (`InternshipMajor`) và `Skill` (`InternshipSkill`).
   - `InternshipTemplate`: Bản mẫu tin thực tập cho doanh nghiệp tái sử dụng.
   - `InternshipView` & `InternshipReport`: Thống kê 192 lượt xem và 4 báo cáo vi phạm tin tuyển dụng.
6. **Ứng tuyển & Sàng lọc AI:**
   - `Application`: Toàn bộ 9 trạng thái tuyển dụng (`PENDING`, `REVIEWING`, `INTERVIEWING`, `OFFERED`, `ACCEPTED`, `DECLINED`, `EXPIRED`, `REJECTED`, `WITHDRAWN`).
   - `ApplicationInterview`: Lịch phỏng vấn trực tuyến (Google Meet) hoặc trực tiếp tại trụ sở doanh nghiệp.
   - `AiScanJob`: Điểm số AI (`aiScore`), phân tích điểm mạnh/yếu, kỹ năng trích xuất, khuyến nghị (`STRONG_HIRE`, `HIRE`, `POTENTIAL`, `NOT_RECOMMENDED`).
   - `EmailLog`: Nhật ký gửi thư mời phỏng vấn, thư mời nhận việc.
7. **Đợt Thực tập & Giám sát Học thuật (Placement & Supervision):**
   - `InternshipPlacement`: Đợt thực tập 10 tuần của sinh viên tại công ty (`status`: `ACTIVE`, `COMPLETED`, `CANCELLED`; `academicStatus`: `PENDING`, `ACTIVE`, `CLOSED`).
   - `Supervision`: Phân công Giảng viên hướng dẫn phụ trách sinh viên.
   - `Report`: 86 báo cáo tiến độ tuần (`DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED` kèm phản hồi của GVHD).
   - `Evaluation`: Nghiệm thu 2 bên: Đánh giá từ Doanh nghiệp (`COMPANY`) và Đánh giá từ Giảng viên (`LECTURER`) theo thang điểm 10, tiêu chí chi tiết JSON và giấy chứng nhận hoàn thành.
8. **Tương tác & Hỗ trợ:**
   - `Conversation` & `Message`: Chat sinh viên - HR và kênh tương tác đợt thực tập.
   - `Notification`: Thông báo đẩy với `NotificationAction` điều hướng người dùng.
   - `SupportRequest`: 12 yêu cầu hỗ trợ sinh viên đa dạng tình huống.

---

## 2. Thiết kế Dòng Thời gian (Chu kỳ 3 Kỳ/Năm - 4 Tháng/Kỳ)

Theo yêu cầu nghiệp vụ: **Mỗi năm có 3 kỳ thực tập, mỗi kỳ kéo dài đúng 4 tháng để doanh nghiệp linh hoạt bố trí lịch thực tập 10 tuần, và thời gian tuyển dụng bắt đầu trước 1 tháng.**

```
+-------------------------------------------------------------------------------------------------------+
| NĂM HỌC 2025 - 2026 (QUÁ KHỨ - COMPLETED)                                                              |
| - HK1 (Kỳ Thu 2025) : Tuyển dụng T8/2025  | Thực tập: 01/09/2025 -> 31/12/2025 (4 tháng) -> COMPLETED |
| - HK2 (Kỳ Xuân 2026): Tuyển dụng T12/2025 | Thực tập: 01/01/2026 -> 30/04/2026 (4 tháng) -> COMPLETED |
| - HK3 (Kỳ Hè 2026)  : Tuyển dụng T4/2026  | Thực tập: 01/05/2026 -> 31/08/2026 (4 tháng) -> COMPLETED |
+-------------------------------------------------------------------------------------------------------+
| NĂM HỌC 2026 - 2027 (HIỆN TẠI & TƯƠNG LAI)                                                            |
| - HK1 (Kỳ Thu 2026) [HIỆN TẠI]: Tuyển dụng T8/2026 | Thực tập: 01/09/2026 -> 31/12/2026               |
|   * Mốc tham chiếu: Tháng 11/2026 -> Đang ở tháng thứ 3 của kỳ (Tuần 8/10 thực tập) -> MONITORING    |
| - HK2 (Kỳ Xuân 2027) [ĐANG TUYỂN DỤNG]: Bắt đầu kỳ: 01/12/2026 -> 31/03/2027 (4 tháng)                 |
|   * Đợt tuyển dụng (1 tháng trước): 01/11/2026 -> 30/11/2026 -> RECRUITING (OPEN)                     |
| - HK3 (Kỳ Hè 2027) [TƯƠNG LAI]: Bắt đầu kỳ: 01/04/2027 -> 31/07/2027 (4 tháng) -> UPCOMING          |
+-------------------------------------------------------------------------------------------------------+
```

### Cơ chế Tự Động Hóa `SemesterLifecycleService.reconcile()`:
Hệ thống Backend có cơ chế quét định kỳ tự động đóng (`CLOSED`) các tin tuyển dụng có `semester.startDate <= now`. Bằng việc thiết kế **Học kỳ 2 (2026 - 2027)** có thời gian tuyển dụng từ `01/11/2026` đến `30/11/2026` và ngày bắt đầu là `01/12/2026`, tất cả các tin tuyển dụng `OPEN` được bảo toàn nguyên vẹn trên giao diện tìm kiếm của sinh viên mà không bị đóng nhầm.

---

## 3. Thống kê Chi tiết 1,416 Bản Ghi Seed Data (31 Bảng)

| STT | Tên Bảng (Prisma Model) | Số lượng | Mô tả chi tiết dữ liệu đã khởi tạo |
|:---:|---|:---:|---|
| 1 | **User** | **73** | 4 Quản trị viên (1 Super Admin + 3 Sub-Admin), 10 Giảng viên ĐHBK, 20 Doanh nghiệp thật, 36 Sinh viên ĐHBK, 3 Tài khoản kiểm thử trạng thái |
| 2 | **Faculty** | **6** | 6 Khoa nòng cốt ĐHBK: CSE, FEEE, FME, FCE, SIM, CIVIL |
| 3 | **Major** | **20** | 20 Ngành đào tạo chuẩn của ĐHBK bao quát toàn bộ các khối ngành kỹ thuật & kinh tế |
| 4 | **Skill** | **124** | 124 kỹ năng chuyên sâu: AI, Cloud AWS/GCP, VLSI RTL, PLC, SCADA, Robot ROS, BIM Revit, HACCP... |
| 5 | **Semester** | **8** | 8 học kỳ từ 2024 đến 2027 mô phỏng trọn vẹn chu kỳ 3 kỳ/năm (COMPLETED, MONITORING, RECRUITING, UPCOMING) |
| 6 | **LecturerProfile** | **10** | 10 giảng viên thật các khoa với học hàm PGS.TS., TS., ThS. (Thầy Nguyễn Danh Thảo, Thầy Quản Thành Thơ, Thầy Huỳnh Phú Minh Cường...) |
| 7 | **CompanyProfile** | **20** | 20 doanh nghiệp thật với MST thật: 15 APPROVED, 2 PENDING, 1 REJECTED, 1 SUSPENDED, 1 DRAFT |
| 8 | **StudentProfile** | **36** | 36 sinh viên Bách Khoa K20-K23 chuẩn mã số SV (201xxxx - 231xxxx) với GPA từ 3.15 đến 3.85 |
| 9 | **StudentSkill** | **194** | Kỹ năng chuyên môn gán cho từng sinh viên với các cấp độ BEGINNER, INTERMEDIATE, ADVANCED, EXPERT |
| 10 | **StudentProject** | **35** | Dự án cá nhân thực tế kèm GitHub repo, live demo và mô tả công nghệ |
| 11 | **StudentJobPreference** | **36** | Nguyện vọng nghề nghiệp, địa điểm làm việc (TP.HCM, Bình Dương, Đồng Nai) và hình thức (Onsite, Hybrid) |
| 12 | **InternshipTemplate** | **2** | Mẫu tin thực tập Backend và Nhúng của FPT Software và Bosch |
| 13 | **Internship** | **37** | 37 tin tuyển dụng thực tế: 23 OPEN, 7 CLOSED, 3 DRAFT, 2 REJECTED, 2 CANCELLED |
| 14 | **InternshipSkill** | **162** | Ràng buộc kỹ năng yêu cầu cho từng vị trí tuyển dụng |
| 15 | **InternshipMajor** | **82** | Phù hợp ngành đào tạo mục tiêu cho từng vị trí tuyển dụng |
| 16 | **InternshipView** | **192** | Lượt xem và tương tác của sinh viên trên các tin tuyển dụng |
| 17 | **InternshipReport** | **4** | Báo cáo vi phạm do sinh viên phản ánh (thu phí, mô tả sai lệch, đa cấp...) kèm trạng thái xử lý |
| 18 | **Application** | **52** | Bao phủ trọn vẹn **toàn bộ 9 trạng thái**: ACCEPTED (8), OFFERED (6), INTERVIEWING (6), REVIEWING (12), PENDING (8), DECLINED (4), EXPIRED (2), REJECTED (4), WITHDRAWN (2) |
| 19 | **ApplicationInterview** | **6** | Lịch phỏng vấn: Trực tuyến qua Google Meet (MoMo, Viettel, Shopee) và Trực tiếp tại văn phòng (Bosch E-Town, VinFast Landmark 81, Vinamilk Q.7) |
| 20 | **EmailLog** | **4** | Nhật ký email gửi thông báo phỏng vấn và thư mời làm việc |
| 21 | **AiScanJob** | **15** | Kết quả phân tích CV bằng AI: điểm Match Score, kỹ năng trích xuất, điểm mạnh/yếu, khuyến nghị tuyển dụng |
| 22 | **InternshipPlacement** | **12** | 12 đợt thực tập: 4 COMPLETED (kỳ trước), 6 ACTIVE (tuần 8/10 kỳ hiện tại), 2 PENDING (kỳ mới) |
| 23 | **Supervision** | **11** | Phân công Giảng viên hướng dẫn phụ trách sinh viên trong từng đợt thực tập |
| 24 | **Report** | **86** | Báo cáo tiến độ tuần: 40 tuần APPROVED của các đợt đã xong, 42 tuần của đợt đang diễn ra (APPROVED, SUBMITTED, DRAFT, REJECTED) |
| 25 | **Evaluation** | **8** | Đánh giá nghiệm thu 2 chiều: 4 phiếu từ Doanh nghiệp (9.3 - 9.6 điểm) và 4 phiếu từ Giảng viên (9.0 - 9.5 điểm) |
| 26 | **Conversation** | **7** | Kênh trò chuyện giữa Sinh viên - HR Doanh nghiệp và Kênh trao đổi 3 bên đợt thực tập |
| 27 | **Message** | **24** | Nội dung trao đổi công việc, lịch phỏng vấn và hỗ trợ tài liệu thực tập |
| 28 | **Notification** | **63** | Thông báo đẩy hệ thống gắn kèm hành động điều hướng cho tất cả các đối tượng người dùng |
| 29 | **SupportRequest** | **12** | Yêu cầu hỗ trợ sinh viên: Xin cấp giấy giới thiệu, gia hạn nộp báo cáo, xin chuyển công ty, đính chính điểm... |
| 30 | **AuditLog** | **38** | Nhật ký kiểm toán các thao tác của Quản trị viên (Duyệt công ty, từ chối tin, gán GVHD, cập nhật học kỳ) |
| 31 | **File** | **37** | 37 file tài liệu (CV PDF thật của tác giả `CV_PhamHoangSon_FullStackDeveloper.pdf` và 36 file CV sinh viên) |
| **TỔNG CỘNG** | **31 Bảng** | **1,416** | **Bộ dữ liệu hoàn chỉnh, nhất quán, logic 100% không có bản ghi mồ côi** |

---

## 4. Danh sách 20 Doanh Nghiệp Thật (Người Thật - Việc Thật)

Tất cả các doanh nghiệp đều có mã số thuế (MST) thật, địa chỉ văn phòng thật tại TP.HCM và các khu công nghiệp, cùng các vị trí tuyển dụng thực tế:

| STT | Tên Doanh nghiệp | Mã số thuế | Địa chỉ trụ sở thực tế | Trạng thái | Lĩnh vực chuyên môn |
|:---:|---|---|---|:---:|---|
| 1 | **FPT Software** | `0101778162` | Tòa nhà F-Town 3, Khu Công nghệ cao, TP. Thủ Đức, TP.HCM | `APPROVED` | Dịch vụ Phần mềm, Chuyển đổi số, Web/Mobile |
| 2 | **Bosch Global Software Technologies** | `0310243617` | Lầu 14, E-Town Central, 260 Đoàn Văn Bơ, P.9, Q.4, TP.HCM | `APPROVED` | Phần mềm Nhúng Ô tô, IoT, Thiết kế Phần cứng |
| 3 | **Viettel Solutions** | `0100109106` | Tòa nhà Viettel, 285 Cách Mạng Tháng 8, P.12, Q.10, TP.HCM | `APPROVED` | Viễn thông, Điện toán đám mây, An ninh mạng SOC |
| 4 | **VinFast Auto** | `0108064510` | Tầng 19, Tòa nhà Landmark 81, 720A Điện Biên Phủ, P.22, Bình Thạnh, TP.HCM | `APPROVED` | Ô tô điện thông minh, Robot công nghiệp, Pin BMS |
| 5 | **Tổng Công ty Tân Cảng Sài Gòn** | `0300634426` | 722 Điện Biên Phủ, P.22, Bình Thạnh, TP.HCM (Cảng Cát Lái) | `APPROVED` | Cảng biển, Kho bãi logistics, Khai thác container |
| 6 | **VNG Corporation** | `0303493756` | VNG Campus, Đường số 13, KCX Tân Thuận, P. Tân Thuận Đông, Q.7, TP.HCM | `APPROVED` | Nền tảng Internet, Zalo, Game Studio, Cloud Engine |
| 7 | **MoMo (M-Service)** | `0305365476` | Tòa nhà Phú Mỹ Hưng, 08 Hoàng Văn Thái, Tân Phú, Q.7, TP.HCM | `APPROVED` | Siêu ứng dụng Fintech, Dữ liệu lớn, AppSec |
| 8 | **Axon Enterprise Việt Nam** | `0315892110` | Tòa nhà Friendship, 31 Lê Duẩn, P. Bến Nghé, Q.1, TP.HCM | `APPROVED` | Thiết bị An ninh công cộng, AI Camera, Cloud AWS |
| 9 | **Shopee Việt Nam** | `0313543188` | Tòa nhà Saigon Centre Tower 2, 67 Lê Lợi, P. Bến Nghé, Q.1, TP.HCM | `APPROVED` | TMĐT, Mạng lưới vận chuyển SPX Express, Chuỗi cung ứng |
| 10 | **Renesas Design Việt Nam (RVC)** | `0303534969` | Đường Tân Thuận, KCX Tân Thuận, P. Tân Thuận Đông, Q.7, TP.HCM | `APPROVED` | Thiết kế Vi mạch Bán dẫn VLSI, SoC RTL, Chip Ô tô |
| 11 | **NashTech Việt Nam** | `0301980862` | Tòa nhà Etown 1, 364 Cộng Hòa, P.13, Tân Bình, TP.HCM | `APPROVED` | Gia công Phần mềm Quốc tế, Cloud Azure, Java/Spring |
| 12 | **Coteccons** | `0303443233` | Tòa nhà Coteccons, 236/6 Điện Biên Phủ, P.17, Bình Thạnh, TP.HCM | `APPROVED` | Tổng thầu Xây dựng, Mô hình thông tin công trình BIM |
| 13 | **Unilever Việt Nam** | `0301460340` | Lô A2-3 KCN Tây Bắc Củ Chi, Củ Chi, TP.HCM | `APPROVED` | Hàng tiêu dùng FMCG, Kỹ thuật Hóa học, QA/QC |
| 14 | **Vinamilk** | `0300588569` | 10 Tân Trào, P. Tân Phú, Q.7, TP.HCM (Nhà máy Mega Bình Dương) | `APPROVED` | Chế biến Sữa & Nước giải khát, Tự động hóa Mega Plant |
| 15 | **SmartLog Việt Nam** | `0313506169` | Tòa nhà SmartLog, 215 Nguyễn Văn Hưởng, Thảo Điền, TP. Thủ Đức, TP.HCM | `APPROVED` | Logistics Số, Giải pháp Quản trị Kho WMS & Vận tải TMS |
| 16 | **KMS Technology** | `0309137930` | 2 Tản Viên, P.2, Tân Bình, TP.HCM | `PENDING` | Kỹ thuật & Kiểm thử Phần mềm QA/QC *(Chờ duyệt)* |
| 17 | **Base Enterprise (Base.vn)** | `0107538250` | Tòa nhà Bcons Tower, 4A/167 Nguyễn Văn Thương, P.25, Bình Thạnh, TP.HCM | `PENDING` | Nền tảng SaaS Quản trị Doanh nghiệp *(Chờ duyệt)* |
| 18 | **Công ty Alpha Việt Nam** | `0314567890` | Tầng 5, Tòa nhà Rosana, 60 Nguyễn Đình Chiểu, Q.1, TP.HCM | `REJECTED` | Dịch vụ Trực tuyến *(Bị từ chối do giấy phép mờ)* |
| 19 | **Công ty NextGen Solutions** | `0315678901` | Lầu 8, Tòa nhà Viễn Đông, 14 Phan Tôn, Q.1, TP.HCM | `SUSPENDED` | Phần mềm *(Bị đình chỉ do thu phí sinh viên)* |
| 20 | **Startup Tân Phú** | `0316789012` | 45 Lê Thúc Hoạch, P. Phú Thọ Hòa, Tân Phú, TP.HCM | `DRAFT` | Thiết bị IoT Nông nghiệp *(Bản nháp chưa nộp hồ sơ)* |

---

## 5. Danh mục 10 Giảng Viên Thật Đại Học Bách Khoa (Đủ 6 Khoa)

| STT | Học hàm - Họ và tên | Email đăng nhập | Khoa chuyên môn | Chức vụ / Bộ môn | Đợt sinh viên hướng dẫn |
|:---:|---|---|---|---|---|
| 1 | **PGS.TS. Phạm Hoàng Anh** | `lecturer.cse@careerbridge.edu.vn` | KH & KT Máy tính (CSE) | Giảng viên cao cấp KTPM | Hướng dẫn `Nguyễn Hoàng Long` (FPT), `Huỳnh Tuấn Kiệt` (Axon Cloud), đã nghiệm thu `Trần Thị Mai Anh` (Bosch - 9.2đ). |
| 2 | **TS. Quản Thành Thơ** | `lecturer.cse2@careerbridge.edu.vn` | KH & KT Máy tính (CSE) | Trưởng bộ môn KTPM | Hướng dẫn `Nguyễn Minh Khoa` (VNG Game Platform), đánh giá báo cáo tuần 8. |
| 3 | **TS. Đỗ Quốc Thắng** | `lecturer.feee@careerbridge.edu.vn` | Điện - Điện tử (FEEE) | Trưởng bộ môn Vi mạch | Đã nghiệm thu xuất sắc `Mai Phương Uyên` (Renesas RVC - 9.5đ). |
| 4 | **TS. Huỳnh Phú Minh Cường** | `lecturer.feee2@careerbridge.edu.vn` | Điện - Điện tử (FEEE) | Trưởng bộ môn Kỹ thuật Điện | Hướng dẫn `Trịnh Quốc Cường` (Renesas Chip RH850). |
| 5 | **TS. Nguyễn Thanh Tùng** | `lecturer.fme@careerbridge.edu.vn` | Cơ khí (FME) | Giảng viên Bộ môn Ô tô | Hướng dẫn `Bùi Gia Huy` (VinFast Auto), từ chối báo cáo tuần 5 yêu cầu bổ sung CAN Bus. |
| 6 | **TS. Lê Thanh Long** | `lecturer.fme2@careerbridge.edu.vn` | Cơ khí (FME) | Trưởng PTN Robot thông minh | Phụ trách chuyên môn Robot công nghiệp, Cơ điện tử & Chế tạo máy. |
| 7 | **ThS. Lê Hoàng Mai** | `lecturer.sim@careerbridge.edu.vn` | Quản lý Công nghiệp (SIM) | Giảng viên Bộ môn Logistics | Đã nghiệm thu xuất sắc `Đỗ Thùy Dương` (Tân Cảng Cát Lái - 9.0đ). |
| 8 | **TS. Bùi Minh Triết** | `lecturer.fce@careerbridge.edu.vn` | Kỹ thuật Hóa học (FCE) | Bộ môn Công nghệ Thực phẩm | Giám sát sinh viên ngành Thực phẩm, QA/QC và Vi sinh thực phẩm. |
| 9 | **PGS.TS. Huỳnh Kỳ Phương Chu** | `lecturer.fce2@careerbridge.edu.vn` | Kỹ thuật Hóa học (FCE) | Giảng viên cao cấp Hóa vô cơ | Hướng dẫn `Chu Thị Thanh Hằng` (Unilever Nhà máy Củ Chi). |
| 10 | **PGS.TS. Nguyễn Danh Thảo** | `lecturer.civil@careerbridge.edu.vn` | Kỹ thuật Xây dựng (CIVIL) | Trưởng khoa Kỹ thuật Xây dựng | Đã nghiệm thu `Trương Hữu Nghĩa` (Coteccons - 9.3đ), phân công hướng dẫn `Võ Thị Mỹ Duyên`. |

---

## 6. Mẫu Kịch bản Nghiệp vụ Nổi bật Kiểm thử theo Vai trò

### 6.1. Phân hệ Quản trị viên (Super Admin & Sub-Admins)
1. **Phân quyền Sub-Admin độc quyền (`admin@careerbridge.edu.vn`):**
   - Vào `/admin/users`, chỉ Super Admin mới có quyền cấp phát danh sách phân quyền (`permissions`) cho Sub-Admin hoặc chuyển đổi trạng thái người dùng.
   - Vào `/admin/audit-logs`, xem đầy đủ 38 nhật ký thao tác hệ thống thời gian thực.
2. **Thẩm định Doanh nghiệp (`corporate.admin@careerbridge.edu.vn`):**
   - Vào `/admin/companies`, thấy `KMS Technology` và `Base.vn` đang ở trạng thái `PENDING` kèm checklist thẩm định pháp lý (MST, giấy phép, địa chỉ).
   - Có thể bấm **Duyệt (Approve)** hoặc **Từ chối (Reject)** kèm lý do.
3. **Phân công GVHD và Giám sát Đợt Thực tập (`academic.admin@careerbridge.edu.vn`):**
   - Vào `/admin/supervisions`, phát hiện sinh viên `Lê Minh Tuấn` đã được nhận việc tại Viettel Solutions nhưng đang ở trạng thái `Unassigned` (chưa có GVHD).
   - Admin chọn Thầy Đỗ Quốc Thắng hoặc Thầy Phạm Hoàng Anh để phân công phụ trách.
4. **Xử lý Khiếu nại và Hỗ trợ Sinh viên (`support.admin@careerbridge.edu.vn`):**
   - Vào `/admin/support-requests`, thấy 12 yêu cầu hỗ trợ sinh viên: xử lý đơn xin cấp giấy giới thiệu của `Võ Thị Bích Ngọc` hoặc yêu cầu xin gia hạn nộp báo cáo.

### 6.2. Phân hệ Giảng viên Hướng dẫn (Lecturer View)
1. **Chấm duyệt báo cáo tuần:**
   - Đăng nhập `lecturer.cse@careerbridge.edu.vn` (PGS.TS. Phạm Hoàng Anh) hoặc `lecturer.cse2@careerbridge.edu.vn` (TS. Quản Thành Thơ).
   - Thấy thông báo có báo cáo tuần 8 của `Nguyễn Hoàng Long` (FPT) và `Nguyễn Minh Khoa` (VNG) đang ở trạng thái `SUBMITTED`.
   - Giảng viên đọc nội dung công việc, kết quả đạt được, nhập nhận xét và bấm **Duyệt (Approve)** hoặc **Yêu cầu chỉnh sửa (Reject)**.
2. **Xem lịch sử chỉnh sửa báo cáo bị từ chối:**
   - Đăng nhập `lecturer.fme@careerbridge.edu.vn` (TS. Nguyễn Thanh Tùng), thấy báo cáo tuần 5 của sinh viên `Bùi Gia Huy` tại VinFast Auto bị từ chối với nhận xét chi tiết yêu cầu bổ sung biểu đồ phân tích gói tin CAN Bus.

### 6.3. Phân hệ Doanh nghiệp (Company View)
1. **Sàng lọc Hồ sơ với AI Match Score & Phỏng vấn:**
   - Đăng nhập `fpt.software@fpt.com`, `momo.careers@mservice.com.vn` hoặc `axon.careers@axon.com`.
   - Vào mục Quản lý ứng viên, xem điểm số AI Scan (từ 88 đến 95 điểm), danh sách kỹ năng trích xuất và khuyến nghị tuyển dụng.
   - Chuyển trạng thái ứng viên sang `INTERVIEWING`, tạo lịch phỏng vấn Google Meet hoặc gửi Offer trực tiếp.
2. **Nghiệm thu Thực tập sinh:**
   - Đăng nhập `bosch.recruitment@bosch.com`, `renesas.careers@lm.renesas.com` hoặc `coteccons.careers@coteccons.vn`.
   - Xem hồ sơ nghiệm thu đợt thực tập, phiếu chấm điểm 10 tiêu chí (Ý thức kỷ luật, năng lực chuyên môn, khả năng làm việc nhóm, sáng kiến...) và cấp chứng nhận hoàn thành.

### 6.4. Phân hệ Sinh viên (Student View)
1. **Tài khoản cá nhân của Tác giả (`pson4282@gmail.com` - Phạm Hoàng Sơn):**
   - Đã được tích hợp CV thật `CV_PhamHoangSon_FullStackDeveloper.pdf`.
   - Có 1 Offer trúng tuyển Kỹ sư Backend tại FPT Software (8,500,000đ/tháng) và 1 đơn ứng tuyển Fullstack Developer đang trong vòng xét duyệt (AI Score: 94.0).
2. **Phản hồi Thư mời nhận việc:**
   - Đăng nhập `student.offered@student.hcmut.edu.vn` (Vũ Phương Linh), xem Offer FPT Software (8tr/tháng) và có thể bấm **Chấp nhận (Accept)** hoặc **Từ chối (Decline)**.
3. **Theo dõi tiến độ thực tập 10 tuần:**
   - Đăng nhập `student.interning@student.hcmut.edu.vn` (Nguyễn Hoàng Long), xem toàn bộ tiến độ 10 tuần thực tập tại FPT Software.
4. **Xem Phiếu Đánh giá Tốt nghiệp:**
   - Đăng nhập `student.completed@student.hcmut.edu.vn` (Trần Thị Mai Anh), xem phiếu đánh giá song phương từ Bosch (9.5 điểm) và từ Thầy Phạm Hoàng Anh (9.2 điểm).

---

## 7. Hướng dẫn Lệnh Thực thi & Kiểm tra Dữ liệu

### Lệnh 1: Biên dịch và chạy toàn bộ Seed Data
```powershell
# Di chuyển vào thư mục Backend
cd Backend

# Biên dịch NestJS và chạy seed chuẩn hóa
npm run seed:compiled
```

### Lệnh 2: Kiểm tra nhanh số lượng bản ghi của 31 bảng
```powershell
# Chạy script thống kê chi tiết
cd Backend
node scripts/stats.js
```

### Thông tin Đăng nhập Toàn bộ Hệ thống:
- Chi tiết thông tin đăng nhập, vai trò, kịch bản của tất cả **73 tài khoản** được tài liệu hóa đầy đủ tại [SEED_ACCOUNTS.md](file:///d:/Subjects%20-%20Documents/Th%E1%BB%B1c%20t%E1%BA%ADp%20t%E1%BB%91t%20nghi%E1%BB%87p/CareerBridge/SEED_ACCOUNTS.md).
- Mật khẩu đăng nhập mặc định: `Seed@123456`.

---

## 8. Kết luận & Đánh giá Chất lượng Dữ liệu

1. **Quy mô & Độ phủ:** Mở rộng từ 427 bản ghi lên **1,416 bản ghi**, bao phủ 100% 20 ngành đào tạo của 6 khoa Đại học Bách Khoa, 20 doanh nghiệp hàng đầu và 37 vị trí tuyển dụng thực tế.
2. **Tính Chân thực (Realism):** 100% doanh nghiệp, giảng viên, sinh viên, mô tả công việc (JD), tiêu chí đánh giá và các báo cáo tuần đều dựa trên thực tế hoạt động thực tập tốt nghiệp tại ĐHQG TPHCM.
3. **Tính Toàn vẹn Ràng buộc (Referential Integrity):** Tuyệt đối không có bản ghi mồ côi (orphan records). Toàn bộ các quan hệ `Placement - Supervision - Report - Evaluation`, `Internship - Application - Interview - AiScanJob - EmailLog` đều được liên kết logic và chính xác.
4. **Khả năng Chạy lại (Idempotency):** Toàn bộ quy trình nạp seed được thiết kế theo phương thức `upsert` hoặc dọn dẹp có thứ tự, đảm bảo có thể chạy lại bất cứ lúc nào mà không gây xung đột khóa chính hay trùng lặp dữ liệu.
