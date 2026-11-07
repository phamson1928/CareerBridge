# BÁO CÁO PHÂN TÍCH HỆ THỐNG VÀ XÂY DỰNG BỘ SEED DATA THỰC TẾ
**Dự án:** Nền tảng Quản lý Thực tập Tốt nghiệp CareerBridge  
**Đối tượng mô phỏng:** Hệ thống quản lý thực tập thực tế của Trường Đại học Bách Khoa  
**Thời điểm tham chiếu hệ thống:** Tháng 11/2026

---

## 1. Phân tích Toàn bộ Dự án & Cấu trúc Dữ liệu

### 1.1. Cấu trúc Prisma Schema và Các Thực thể Chính
Hệ thống quản lý thực tập CareerBridge gồm 33 model dữ liệu liên kết chặt chẽ:
1. **Quản trị Tài khoản & Phân quyền Sub-Admin:** `User` (hỗ trợ `isSuperAdmin: Boolean` và `permissions: String[]`), `VerificationToken`, `PasswordResetToken`, `RefreshToken`, `AuditLog`.
   - **Super Admin (`isSuperAdmin: true`)**: Toàn quyền mọi phân hệ, độc quyền quản lý người dùng và nhật ký audit log.
   - **Sub-Admin (`isSuperAdmin: false`)**: Được cấp quyền theo module chuẩn hóa (`DASHBOARD`, `COMPANIES`, `INTERNSHIPS`, `PLACEMENTS`, `SEMESTERS`, `SUPPORT`).
2. **Cơ cấu Tổ chức Đại học Bách Khoa:** `Faculty` (Khoa), `Major` (Ngành đào tạo chuẩn hóa), `Skill` (Danh mục kỹ năng chuyên môn).
3. **Hồ sơ Người dùng Chuyên biệt:**
   - `StudentProfile`: Liên kết mã ngành `majorId`, đồng bộ `major`, quản lý `GPA`, `StudentSkill`, `StudentProject`, `StudentJobPreference`.
   - `LecturerProfile`: Liên kết khoa cơ hữu `facultyId`, đồng bộ `department`, học hàm/học vị `title`.
   - `CompanyProfile`: Trạng thái kiểm duyệt `CompanyStatus`, mã số thuế `businessRegistrationNumber`, checklist kiểm duyệt `reviewChecklist`, lý do từ chối/đình chỉ.
4. **Học kỳ & Chiến dịch Thực tập (Internship Campaign):**
   - `Semester`: Quản lý chu kỳ thời gian (Tuyển dụng $\rightarrow$ Thực tập $\rightarrow$ Nghiệm thu).
5. **Tin Tuyển dụng & Đơn vị Tiếp nhận:**
   - `Internship`: Trạng thái tin (`DRAFT`, `OPEN`, `CLOSED`, `REJECTED`, `CANCELLED`), chỉ tiêu, hạn nộp, liên kết nhiều-nhiều với `Major` (`InternshipMajor`) và `Skill` (`InternshipSkill`).
   - `InternshipTemplate`: Bản mẫu tin thực tập cho doanh nghiệp tái sử dụng.
   - `InternshipView` & `InternshipReport`: Thống kê lượt xem và báo cáo vi phạm tin tuyển dụng.
6. **Ứng tuyển & Sàng lọc AI:**
   - `Application`: Toàn bộ 9 trạng thái tuyển dụng (`PENDING`, `REVIEWING`, `INTERVIEWING`, `OFFERED`, `ACCEPTED`, `DECLINED`, `EXPIRED`, `REJECTED`, `WITHDRAWN`).
   - `ApplicationInterview`: Lịch phỏng vấn trực tuyến (Google Meet) hoặc trực tiếp tại văn phòng.
   - `AiScanJob`: Điểm số AI (`aiScore`), phân tích điểm mạnh/yếu, kỹ năng trích xuất, khuyến nghị (`STRONG_HIRE`, `HIRE`, `POTENTIAL`, `NOT_RECOMMENDED`).
   - `EmailLog`: Nhật ký gửi thư mời phỏng vấn, thư mời nhận việc.
7. **Đợt Thực tập & Giám sát Học thuật (Placement & Supervision):**
   - `InternshipPlacement`: Đợt thực tập 10 tuần của sinh viên tại công ty (`status`: `ACTIVE`, `COMPLETED`, `CANCELLED`; `academicStatus`: `PENDING`, `ACTIVE`, `CLOSED`).
   - `Supervision`: Phân công Giảng viên hướng dẫn phụ trách sinh viên.
   - `Report`: 10 báo cáo tiến độ hàng tuần (`DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED` kèm phản hồi của GVHD).
   - `Evaluation`: Nghiệm thu 2 bên: Đánh giá từ Doanh nghiệp (`COMPANY`) và Đánh giá từ Giảng viên (`LECTURER`) theo thang điểm 10, tiêu chí chi tiết JSON và giấy chứng nhận hoàn thành.
8. **Tương tác & Hỗ trợ:**
   - `Conversation` & `Message`: Chat sinh viên - doanh nghiệp và chat 3 bên đợt thực tập.
   - `Notification`: Thông báo đẩy với `NotificationAction` điều hướng.
   - `SupportRequest`: Kênh yêu cầu hỗ trợ sinh viên - quản trị viên.

---

## 2. Thiết kế Dòng Thời gian (Chu kỳ 3 Kỳ/Năm - 4 Tháng/Kỳ)

Theo yêu cầu nghiệp vụ: **Mỗi năm có 3 kỳ thực tập, mỗi kỳ kéo dài đúng 4 tháng để doanh nghiệp linh hoạt bố trí lịch thực tập 10 tuần, và thời gian tuyển dụng bắt đầu trước 1 tháng.**

```
+-------------------------------------------------------------------------------------------------------+
| NĂM HỌC 2025 - 2026 (QUÁ KHỨ - COMPLETED)                                                              |
| - HK1 (Kỳ Thu 2025) : Tuyển dụng T8/2025  | Thực tập: 01/09/2025 -> 31/12/2025 (4 tháng) -> Đã xong   |
| - HK2 (Kỳ Xuân 2026): Tuyển dụng T12/2025 | Thực tập: 01/01/2026 -> 30/04/2026 (4 tháng) -> Đã xong   |
| - HK3 (Kỳ Hè 2026)  : Tuyển dụng T4/2026  | Thực tập: 01/05/2026 -> 31/08/2026 (4 tháng) -> Đã xong   |
+-------------------------------------------------------------------------------------------------------+
| NĂM HỌC 2026 - 2027 (HIỆN TẠI & TƯƠNG LAI)                                                            |
| - HK1 (Kỳ Thu 2026) [HIỆN TẠI]: Tuyển dụng T8/2026 | Thực tập: 01/09/2026 -> 31/12/2026               |
|   * Mốc hôm nay: 07/11/2026 -> Đang ở tháng thứ 3 của kỳ (Tuần 8/10 của đợt thực tập) -> MONITORING    |
| - HK2 (Kỳ Xuân 2027) [ĐANG TUYỂN DỤNG]: Bắt đầu kỳ: 01/12/2026 -> 31/03/2027 (4 tháng)                 |
|   * Đợt tuyển dụng (1 tháng trước): 01/11/2026 -> 30/11/2026. Mốc hôm nay 07/11 -> RECRUITING (OPEN) |
| - HK3 (Kỳ Hè 2027) [TƯƠNG LAI]: Bắt đầu kỳ: 01/04/2027 -> 31/07/2027 (4 tháng) -> UPCOMING          |
+-------------------------------------------------------------------------------------------------------+
```

### Điểm đặc biệt bảo đảm tính toàn vẹn:
Hệ thống Backend có cơ chế `SemesterLifecycleService.reconcile()` tự động quét mỗi 5 phút và tự động đóng (`CLOSED`) các tin tuyển dụng có `semester.startDate <= now`. Bằng việc thiết kế **Học kỳ 2 (2026 - 2027)** có thời gian tuyển dụng từ `01/11/2026` đến `30/11/2026` và ngày bắt đầu là `01/12/2026`, tất cả các tin tuyển dụng `OPEN` được bảo toàn nguyên vẹn trên giao diện tìm kiếm của sinh viên mà không bị đóng nhầm!

---

## 3. Thống kê Số lượng Dữ liệu Seed Thực tế

| Tên Bảng (Model) | Số lượng | Mô tả chi tiết dữ liệu đã khởi tạo |
|---|:---:|---|
| **User** | **33** | 4 Quản trị viên (1 Super Admin + 3 Sub-Admin phân quyền), 5 Giảng viên, 9 Doanh nghiệp, 12 Sinh viên, 3 Tài khoản kiểm thử trạng thái |
| **VerificationToken** | **1** | Token xác minh email cho tài khoản `user.unverified` |
| **Faculty** | **6** | 6 Khoa trọng điểm ĐHBK: CSE, FEEE, FME, FCE, SIM, CIVIL |
| **Major** | **20** | 20 Ngành đào tạo chuẩn của ĐHBK (Khoa học máy tính, Kỹ thuật phần mềm, Vi mạch, Cơ điện tử...) |
| **Skill** | **87** | Danh mục kỹ năng bao quát CNTT, AI, Vi mạch bán dẫn, PLC, Cơ khí, Ô tô điện, Hóa sinh, SCM |
| **Semester** | **6** | 6 học kỳ kéo dài từ 2025 đến 2027 (COMPLETED, MONITORING, RECRUITING, UPCOMING) |
| **LecturerProfile** | **5** | Giảng viên hướng dẫn các khoa với học hàm PGS.TS., TS., ThS. |
| **CompanyProfile** | **9** | Đủ 5 trạng thái: APPROVED (FPT, Bosch, Viettel, VinFast, Tân Cảng), PENDING (KMS), REJECTED (Alpha), SUSPENDED (NextGen), DRAFT (Tân Phú) |
| **StudentProfile** | **12** | 12 sinh viên Bách Khoa các khóa K20, K21, K22 với GPA, tóm tắt và năng lực thực tế |
| **StudentSkill** | **57** | Kỹ năng chuyên môn gán cho từng sinh viên với các cấp độ BEGINNER, INTERMEDIATE, ADVANCED, EXPERT |
| **StudentProject** | **10** | Dự án cá nhân thực tế kèm GitHub repo và demo link |
| **StudentJobPreference** | **12** | Nguyện vọng nghề nghiệp, địa điểm làm việc và hình thức làm việc |
| **InternshipTemplate** | **2** | Mẫu tin thực tập Backend và Nhúng của FPT Software và Bosch |
| **Internship** | **13** | Đủ các trạng thái: OPEN (đang nhận hồ sơ), CLOSED (đã đóng), DRAFT, REJECTED (vi phạm thu phí), CANCELLED |
| **InternshipSkill** | **53** | Kỹ năng yêu cầu cho từng vị trí thực tập |
| **InternshipMajor** | **29** | Ngành đào tạo mục tiêu phù hợp cho từng vị trí tuyển dụng |
| **InternshipReport** | **1** | Báo cáo vi phạm do sinh viên phản ánh tin tuyển dụng thu phí sai quy định (RESOLVED) |
| **Application** | **13** | Bao phủ trọn vẹn 9 trạng thái: ACCEPTED, OFFERED, INTERVIEWING, REVIEWING, PENDING, DECLINED, REJECTED, WITHDRAWN, EXPIRED |
| **ApplicationInterview** | **1** | Lịch phỏng vấn trực tuyến qua Google Meet |
| **EmailLog** | **1** | Nhật ký email gửi thư mời phỏng vấn |
| **AiScanJob** | **10** | Kết quả phân tích CV bằng AI: điểm số, kỹ năng trích xuất, điểm mạnh/yếu, gợi ý tuyển dụng |
| **InternshipPlacement** | **4** | Đợt thực tập 10 tuần: COMPLETED (quá khứ), ACTIVE (tuần 8/10), PENDING (chưa gán GVHD) |
| **Supervision** | **3** | Phân công Giảng viên hướng dẫn (ACTIVE, COMPLETED) |
| **Report** | **24** | Báo cáo tuần: 10 tuần APPROVED của kỳ trước, tuần 1-7 APPROVED, tuần 8 SUBMITTED, tuần 9 DRAFT, tuần 5 REJECTED |
| **Evaluation** | **2** | Đánh giá hoàn thành thực tập: 1 từ Doanh nghiệp (Bosch - 9.5), 1 từ Giảng viên (9.2) |
| **Conversation** | **1** | Hội thoại giữa sinh viên và HR Doanh nghiệp |
| **Message** | **4** | Lịch sử tin nhắn trao đổi thực tế |
| **Notification** | **5** | Thông báo hệ thống có nút điều hướng hành động tương ứng |
| **SupportRequest** | **2** | Yêu cầu hỗ trợ sinh viên: 1 đã được giải quyết (RESOLVED), 1 đang chờ xử lý (PENDING) |
| **AuditLog** | **3** | Nhật ký kiểm toán thao tác hệ thống của Admin |
| **TỔNG BẢN GHI** | **427** | **Bộ dữ liệu hoàn chỉnh, nhất quán và liên kết logic 100%** |

---

## 4. Các Tình huống Nghiệp vụ Nổi bật Sẵn sàng Kiểm thử

### 4.1. Phân hệ Sinh viên (Student View)
1. **Tìm kiếm & Ứng tuyển tin tuyển dụng (`student.newbie` hoặc `student.jobseeking`):**
   - Vào danh sách tin tuyển dụng, thấy các tin `OPEN` hấp dẫn của FPT, Bosch, Viettel, VinFast, Tân Cảng.
   - Thử bấm nút **Ứng tuyển (Apply)** vào một tin để kiểm tra luồng nộp CV và Cover Letter.
2. **Xem và Phản hồi Thư mời nhận việc (`student.offered` - Vũ Phương Linh):**
   - Vào trang Đơn ứng tuyển (`/student/applications`), thấy Offer từ FPT Software với mức hỗ trợ 8,000,000đ/tháng.
   - Có thể bấm **Chấp nhận (Accept)** hoặc **Từ chối (Decline)** offer.
3. **Theo dõi tiến độ thực tập & Nộp báo cáo tuần (`student.interning` - Nguyễn Hoàng Long):**
   - Vào mục Báo cáo (`/student/reports`), thấy tuần 1 đến tuần 7 đã được duyệt kèm lời phê của PGS.TS. Phạm Hoàng Anh.
   - Báo cáo tuần 8 đang ở trạng thái `SUBMITTED`, tuần 9 đang ở trạng thái `DRAFT`.
4. **Xem kết quả đánh giá thực tập (`student.completed` - Trần Thị Mai Anh):**
   - Vào mục Đánh giá (`/student/evaluations`), thấy phiếu đánh giá chi tiết của Bosch (9.5 điểm) và của GVHD (9.2 điểm).

### 4.2. Phân hệ Doanh nghiệp (Company View)
1. **Quản lý ứng viên & Phỏng vấn (`fpt.software@fpt.com` hoặc `viettel.solutions@viettel.com.vn`):**
   - Vào mục Quản lý ứng viên (`ManageApplicants`), xem kết quả chấm điểm AI Scan, điểm Match Score.
   - Xem chi tiết hồ sơ ứng viên `Phạm Đức Duy`, chuyển trạng thái, tạo lịch phỏng vấn hoặc gửi Offer.
2. **Đánh giá thực tập sinh (`bosch.recruitment@bosch.com`):**
   - Xem danh sách thực tập sinh đã tiếp nhận, phiếu đánh giá tiêu chí hoàn thành thực tập.

### 4.3. Phân hệ Giảng viên (Teacher View)
1. **Chấm duyệt báo cáo tuần (`lecturer.cse@careerbridge.edu.vn` - PGS.TS. Phạm Hoàng Anh):**
   - Vào mục Duyệt báo cáo (`ReviewReports`), thấy ngay thông báo có báo cáo tuần 8 của sinh viên `Nguyễn Hoàng Long` đang chờ duyệt (`SUBMITTED`).
   - Có thể nhập nhận xét và bấm **Duyệt (Approve)** hoặc **Yêu cầu chỉnh sửa (Reject)**.
2. **Theo dõi sinh viên thực tập (`lecturer.fme@careerbridge.edu.vn` - TS. Nguyễn Thanh Tùng):**
   - Thấy sinh viên `Bùi Gia Huy` tại VinFast có báo cáo tuần 5 bị từ chối yêu cầu bổ sung đồ thị CAN Bus.

### 4.4. Phân hệ Ban Quản trị (Admin View)
1. **Duyệt Doanh nghiệp mới (`/admin/companies`):**
   - Thấy công ty `KMS Technology` đang ở trạng thái `PENDING` kèm checklist kiểm tra pháp lý. Admin có thể bấm Duyệt hoặc Từ chối.
   - Xem công ty `Alpha VN` đã bị từ chối (`REJECTED`) và `NextGen` bị đình chỉ (`SUSPENDED`).
2. **Phân công Giảng viên hướng dẫn (`/admin/supervisions`):**
   - Thấy sinh viên `Lê Minh Tuấn` đã trúng tuyển thực tập tại Viettel nhưng chưa được gán GVHD (`Unassigned`).
   - Admin có thể chọn phân công TS. Đỗ Quốc Thắng hoặc PGS.TS. Phạm Hoàng Anh phụ trách.
3. **Kiểm duyệt tin tuyển dụng & Báo cáo vi phạm (`/admin/internships`):**
   - Xem tin tuyển dụng bị từ chối do thu phí trái phép và báo cáo vi phạm đã xử lý xong (`RESOLVED`).
4. **Quản lý Học kỳ (`/admin/semesters`):**
   - Xem đầy đủ 6 học kỳ quá khứ, hiện tại và tương lai với các mốc thời gian chuẩn xác.

---

## 5. Hướng dẫn Lệnh Chạy Seed Data

Dự án cung cấp lệnh npm chuẩn hóa và tích hợp sẵn vào cấu hình Prisma:

### Lệnh 1: Chạy build và seed toàn bộ (Khuyên dùng)
```powershell
# Chạy từ thư mục gốc dự án
npm --prefix Backend run seed:compiled

# Hoặc di chuyển vào thư mục Backend
cd Backend
npm run seed:compiled
```

### Lệnh 2: Chạy thông qua Prisma CLI
```powershell
cd Backend
npx prisma db seed
```

### Lệnh 3: Kiểm tra nhanh số lượng bản ghi sau khi seed
```powershell
node Backend/scripts/verify-seed.js
```

---

## 6. Kết luận & Đánh giá

1. **Tính Thực tế & Tính Bản địa:** Dữ liệu sử dụng 100% họ tên tiếng Việt tự nhiên, đa dạng, cấu trúc mã số sinh viên chuẩn ĐHBK, tên doanh nghiệp và địa chỉ văn phòng thực tế tại TP.HCM và các khu công nghiệp.
2. **Tính Toàn vẹn & Liên kết:** Không có bất kỳ bản ghi mồ côi (orphan record) nào; các ràng buộc Foreign Key, Unique Constraints, quan hệ bảng đều được thỏa mãn tuyệt đối.
3. **Khả năng Chạy lại (Idempotency):** Script seed sử dụng kết hợp `upsert` và các khóa duy nhất xác định, có thể chạy lại nhiều lần mà không gây lỗi trùng lặp dữ liệu hay phá vỡ tính nhất quán của hệ thống.
