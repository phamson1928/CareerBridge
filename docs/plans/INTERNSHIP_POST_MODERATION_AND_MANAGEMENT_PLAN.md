# Kế hoạch Triển khai: Quản lý & Hậu kiểm Tin tuyển dụng (Job Post Moderation & Management)

> **Trạng thái:** Bản thảo kế hoạch kỹ thuật chi tiết — Sẵn sàng triển khai  
> **Phạm vi:** Backend (NestJS + Prisma) & Frontend (React + Vite + TailwindCSS)  
> **Phụ thuộc:** Luồng Company Verification và Internship CRUD hiện tại  
> **Nguyên tắc cốt lõi:**  
> 1. Không phá vỡ quy trình tuyển dụng và trạng thái `CompanyStatus` / `InternshipStatus` hiện có.  
> 2. Giữ nguyên mô hình Doanh nghiệp hợp lệ (`APPROVED`) được đăng bài ngay (`OPEN`), không tạo nghẽn cổ chai duyệt từng tin trước khi đăng (Pre-moderation).  
> 3. Cung cấp công cụ Hậu kiểm (Post-moderation) toàn diện, mạnh mẽ cho Ban quản trị (Admin): giám sát, gỡ tin vi phạm, yêu cầu sửa đổi, xử phạt và tiếp nhận phản ánh từ sinh viên.

---

## 1. Bối cảnh & Vấn đề giải quyết

### 1.1. Thực trạng hệ thống hiện tại
* **Cơ chế tiền kiểm doanh nghiệp tốt:** Admin duyệt kỹ giấy tờ pháp lý (`CompanyStatus: APPROVED`) thì doanh nghiệp mới được đăng tin.
* **Cơ chế xử phạt hiện có:** Admin chỉ có thể **đình chỉ toàn bộ doanh nghiệp (`SUSPENDED`)** tại trang `CompanyModeration.tsx`. Khi đình chỉ, toàn bộ tin của công ty bị đóng.
* **KHOẢNG TRỐNG LỚN (Gap):**
  * Admin **chưa có màn hình tập trung** để quản lý danh sách tin tuyển dụng của toàn trường.
  * Admin **không thể can thiệp đơn lẻ vào từng bài đăng**: Nếu 1 doanh nghiệp uy tín vô tình đăng 1 tin sai lệch, sai ngành đào tạo, hoặc có dấu hiệu đa cấp/thu phí ứng viên, Admin không thể bấm "Gỡ tin này" hay "Yêu cầu sửa tin này" mà bắt buộc phải khóa cả tài khoản doanh nghiệp.
  * **Sinh viên không có kênh tố cáo (Report)** khi đi phỏng vấn phát hiện tin tuyển dụng lừa đảo, bắt nộp tiền cọc.

### 1.2. Mục tiêu đạt được sau khi triển khai
1. **Admin có Dashboard Quản lý Tin tuyển dụng (`/admin/internships`):** Xem toàn bộ tin, lọc theo học kỳ, doanh nghiệp, trạng thái, và tin có cờ cảnh báo/báo cáo vi phạm.
2. **Admin có công cụ Can thiệp vi mô (Micro-moderation Actions):**
   * **Gỡ/Khóa tin vi phạm (`REJECTED` / `CLOSED`):** Cưỡng chế gỡ tin khỏi trang tìm việc của sinh viên, nhập mã lý do chuẩn hóa + chi tiết, tự động cảnh báo sinh viên đã nộp đơn.
   * **Yêu cầu chỉnh sửa (`REQUEST_REVISION`):** Đưa tin về `DRAFT` kèm lời nhắn nhắc nhở để doanh nghiệp cập nhật lại.
3. **Kênh tiếp nhận Báo cáo Vi phạm từ Sinh viên (Job Reporting System):** Sinh viên có thể bấm "Báo cáo tin tuyển dụng" kèm bằng chứng/lý do. Hệ thống tổng hợp và cảnh báo ưu tiên cho Admin xử lý.
4. **Bảo vệ an toàn cho Sinh viên (Student Protection Safeguard):** Khi một tin bị gỡ do lừa đảo/thu phí, hệ thống tự động thông báo và hủy/đóng các đơn ứng tuyển (`Application`) đang chờ phỏng vấn để sinh viên không bị sập bẫy.

---

## 2. Thiết kế Kiến trúc & Dữ liệu (Schema Architecture)

### 2.1. Cập nhật Prisma Schema (`Backend/prisma/schema.prisma`)

#### A. Mở rộng `InternshipStatus`
Thêm trạng thái `REJECTED` để định danh các tin bị Admin cưỡng chế gỡ:
```prisma
enum InternshipStatus {
  DRAFT
  OPEN
  CLOSED
  CANCELLED
  REJECTED // Tin bị Admin cưỡng chế gỡ bỏ do vi phạm
}
```

#### B. Định nghĩa Enum Lý do kiểm duyệt & Báo cáo
```prisma
enum InternshipModerationReasonCode {
  POLICY_VIOLATION        // Vi phạm quy định/chính sách thực tập của Nhà trường
  MISLEADING_INFO         // Mô tả công việc sai thực tế, thông tin mập mờ
  UNAUTHORIZED_FEE        // Yêu cầu nộp phí, mua khóa học, đặt cọc giữ chỗ
  INAPPROPRIATE_CONTENT   // Nội dung phản cảm, đa cấp, cờ bạc, việc làm cấm
  OUTSIDE_MAJOR_SCOPE     // Vị trí không đúng chuyên ngành/chuẩn đầu ra thực tập
  OTHER                   // Lý do khác
}

enum InternshipReportReasonCode {
  FRAUD_SCAM              // Dấu hiệu lừa đảo, đa cấp, giả mạo công ty
  FEE_CHARGED             // Đòi thu phí ứng tuyển, tiền cọc, bắt mua đồng phục/khóa học
  MISLEADING_DESCRIPTION  // Công việc thực tế hoàn toàn khác mô tả trên bài đăng
  UNPROFESSIONAL_BEHAVIOR // Thái độ quấy rối, xúc phạm hoặc không đúng mực
  OTHER                   // Lý do khác
}

enum InternshipReportStatus {
  PENDING       // Chờ Admin xem xét
  INVESTIGATING // Đang xác minh với doanh nghiệp
  RESOLVED      // Đã xử lý (đã gỡ tin hoặc cảnh cáo)
  DISMISSED     // Bác bỏ (báo cáo sai sự thật / spam)
}
```

#### C. Bổ sung trường vào Model `Internship`
```prisma
model Internship {
  // ... các trường hiện có giữ nguyên ...
  
  // Các trường Hậu kiểm (Moderation fields)
  moderationReasonCode InternshipModerationReasonCode?
  moderationReason     String?                          // Ghi chú chi tiết từ Admin
  moderatedById        String?
  moderatedAt          DateTime?

  // Relations
  moderatedBy          User?                            @relation("InternshipModeratedBy", fields: [moderatedById], references: [id], onDelete: SetNull)
  reports              InternshipReport[]

  @@index([status])
  @@index([companyId, status])
  @@index([moderationReasonCode])
}
```

#### D. Tạo Model mới `InternshipReport` (Báo cáo vi phạm từ sinh viên)
```prisma
model InternshipReport {
  id           String                     @id @default(cuid())
  internshipId String
  studentId    String
  reasonCode   InternshipReportReasonCode
  reasonDetail String?                    @db.Text
  status       InternshipReportStatus     @default(PENDING)
  reviewedById String?
  reviewedAt   DateTime?
  adminNotes   String?                    @db.Text
  createdAt    DateTime                   @default(now())
  updatedAt    DateTime                   @updatedAt

  internship   Internship     @relation(fields: [internshipId], references: [id], onDelete: Cascade)
  student      StudentProfile @relation(fields: [studentId], references: [id], onDelete: Cascade)
  reviewedBy   User?          @relation("InternshipReportReviewedBy", fields: [reviewedById], references: [id], onDelete: SetNull)

  @@index([internshipId])
  @@index([studentId])
  @@index([status])
  @@index([status, createdAt])
}
```

#### E. Mở rộng Model `User` (Relations)
```prisma
model User {
  // ... các relations hiện có ...
  moderatedInternships   Internship[]       @relation("InternshipModeratedBy")
  reviewedInternshipReports InternshipReport[] @relation("InternshipReportReviewedBy")
}
```

#### F. Mở rộng `NotificationAction`
```prisma
enum NotificationAction {
  // ... các actions hiện có ...
  OPEN_INTERNSHIP // Mở xem tin tuyển dụng
}
```

---

## 3. Thiết kế Backend (NestJS)

### 3.1. Các DTO mới (`Backend/src/internships/dto/`)

#### 1. `ModerateInternshipDto` (`moderate-internship.dto.ts`)
```typescript
export enum ModerationActionType {
  REJECT = 'REJECT',                   // Cưỡng chế gỡ tin (status -> REJECTED)
  REQUEST_REVISION = 'REQUEST_REVISION', // Yêu cầu sửa đổi (status -> DRAFT)
  RESTORE = 'RESTORE',                 // Khôi phục lại tin nếu gỡ nhầm (status -> OPEN hoặc DRAFT)
}

export class ModerateInternshipDto {
  @IsEnum(ModerationActionType)
  action: ModerationActionType;

  @IsOptional()
  @IsEnum(InternshipModerationReasonCode)
  reasonCode?: InternshipModerationReasonCode;

  @IsString()
  @MinLength(10, { message: 'Lý do/Ghi chú kiểm duyệt tối thiểu 10 ký tự' })
  @MaxLength(1000)
  reasonDetail: string;

  @IsOptional()
  @IsBoolean()
  notifyApplicants?: boolean = true; // Mặc định tự động báo sinh viên đã nộp đơn khi gỡ tin
}
```

#### 2. `CreateInternshipReportDto` (`create-internship-report.dto.ts`)
```typescript
export class CreateInternshipReportDto {
  @IsEnum(InternshipReportReasonCode)
  reasonCode: InternshipReportReasonCode;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reasonDetail?: string;
}
```

#### 3. `ReviewInternshipReportDto` (`review-internship-report.dto.ts`)
```typescript
export class ReviewInternshipReportDto {
  @IsEnum(InternshipReportStatus)
  status: InternshipReportStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  adminNotes?: string;
}
```

#### 4. Mở rộng `ListInternshipsQueryDto` (`list-internships-query.dto.ts`)
Thêm các query param hỗ trợ Admin:
* `companyId?: string`: Lọc theo công ty cụ thể.
* `hasReports?: boolean`: Chỉ lấy các tin có báo cáo vi phạm đang chờ xử lý (`PENDING`).
* `moderationReasonCode?: InternshipModerationReasonCode`: Lọc theo lý do vi phạm.

---

### 3.2. Cập nhật `InternshipsService` (`Backend/src/internships/internships.service.ts`)

#### A. Cập nhật `buildWhere`
Cho phép Admin truyền `companyId` và filter theo `hasReports`:
```typescript
if (query.companyId) {
  and.push({ companyId: query.companyId });
}
if (query.hasReports) {
  and.push({ reports: { some: { status: InternshipReportStatus.PENDING } } });
}
if (query.moderationReasonCode) {
  and.push({ moderationReasonCode: query.moderationReasonCode });
}
```

#### B. Thêm phương thức `moderateInternship(id, adminUserId, dto)`
Xử lý trong Prisma Transaction:
1. **Kiểm tra tồn tại:** Tìm tin theo `id`. Nếu không thấy, quăng `NotFoundException`.
2. **Thực thi hành động:**
   * **Nếu `action === REJECT`:**
     * Chuyển `status = InternshipStatus.REJECTED`.
     * Lưu `moderationReasonCode`, `moderationReason`, `moderatedById = adminUserId`, `moderatedAt = new Date()`.
     * **Bảo vệ sinh viên:** Nếu `dto.notifyApplicants !== false`:
       * Tìm toàn bộ đơn ứng tuyển `Application` đang ở trạng thái `[PENDING, REVIEWING, INTERVIEWING]`.
       * Chuyển các đơn này sang `WITHDRAWN` hoặc `EXPIRED` (kèm ghi chú: *Tin tuyển dụng bị gỡ do vi phạm chính sách*).
       * Gửi Notification cho từng sinh viên:
         *"Tin tuyển dụng '[Tên tin]' của công ty [Tên cty] đã bị Nhà trường gỡ bỏ do vi phạm quy định. Đơn ứng tuyển của bạn đã được hủy an toàn."*
     * **Thông báo cho Doanh nghiệp:** Gửi thông báo kèm lý do vi phạm để doanh nghiệp nắm rõ.
   * **Nếu `action === REQUEST_REVISION`:**
     * Chuyển `status = InternshipStatus.DRAFT`.
     * Lưu ghi chú yêu cầu chỉnh sửa.
     * Gửi Notification cho Doanh nghiệp: *"Ban quản trị yêu cầu điều chỉnh tin tuyển dụng '[Tên tin]': [Ghi chú]. Vui lòng cập nhật và công khai lại."*
   * **Nếu `action === RESTORE`:**
     * Chuyển `status = InternshipStatus.DRAFT` (để doanh nghiệp chủ động kiểm tra ngày tháng rồi mở lại, tránh mở lại khi đã quá hạn học kỳ).
     * Xóa cờ vi phạm `moderationReasonCode = null`.
3. **Ghi Audit Log:** Tạo bản ghi `AuditLog` với action `'INTERNSHIP_MODERATED'`.

#### C. Thêm các phương thức quản lý Report
* `reportInternship(internshipId, studentUserId, dto)`:
  * Kiểm tra sinh viên có tồn tại.
  * Chặn spam: Một sinh viên chỉ được gửi tối đa 1 report đang `PENDING` cho cùng 1 tin tuyển dụng.
  * Tạo bản ghi `InternshipReport`.
  * Ghi AuditLog.
* `listReports(query, adminUserId)`:
  * Phân trang danh sách report, include thông tin `internship`, `student`, `company`.
* `reviewReport(reportId, adminUserId, dto)`:
  * Cập nhật trạng thái `status`, `reviewedById`, `reviewedAt`, `adminNotes`.

---

### 3.3. Cập nhật `InternshipsController` (`Backend/src/internships/internships.controller.ts`)

Bổ sung các endpoints:

| Phương thức | Đường dẫn | Phân quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `PATCH` | `/internships/:id/moderate` | `ADMIN` | Can thiệp gỡ tin, yêu cầu sửa, khôi phục tin |
| `POST` | `/internships/:id/report` | `STUDENT` | Sinh viên gửi báo cáo vi phạm bài đăng |
| `GET` | `/internships/admin/reports` | `ADMIN` | Admin xem danh sách các báo cáo vi phạm |
| `PATCH` | `/internships/reports/:reportId/review` | `ADMIN` | Admin duyệt/xử lý một báo cáo vi phạm |

---

## 4. Thiết kế Frontend (React + TailwindCSS)

### 4.1. Màn hình Quản lý Tin tuyển dụng của Admin
Tạo file: `Frontend/src/components/AdminView/InternshipManagement.tsx`

#### A. Thanh công cụ & Bộ lọc (Toolbar)
* Ô tìm kiếm từ khóa (tiêu đề tin, tên công ty).
* Dropdown chọn Đợt thực tập (Semester).
* Dropdown lọc theo Trạng thái: Tất cả, `OPEN` (Đang mở), `DRAFT` (Nháp), `REJECTED` (Bị gỡ vi phạm), `CLOSED` (Đã đóng).
* Toggle Switch: **"Chỉ hiện tin có báo cáo vi phạm (Reports)"** (hiển thị chấm đỏ nổi bật).

#### B. Bảng danh sách tin (Table Layout)
Các cột hiển thị:
1. **Tin tuyển dụng:** Tiêu đề, bộ phận, hình thức (Onsite/Remote/Hybrid).
2. **Doanh nghiệp:** Logo + Tên công ty (có link mở nhanh Company Profile).
3. **Đợt thực tập & Hạn:** Tên học kỳ, hạn ứng tuyển (`deadline`).
4. **Chỉ tiêu:** Ứng viên / Chỉ tiêu (`filledSlots / slots`).
5. **Trạng thái:**
   * Badge Xanh lá: `OPEN` (Công khai)
   * Badge Xám: `DRAFT` (Nháp)
   * Badge Đỏ: `REJECTED` (Bị gỡ vi phạm)
   * Badge Vàng: `Has Reports (N)` (Có N phản ánh)
6. **Thao tác:**
   * Nút **Xem chi tiết** (Drawer/Modal)
   * Nút **Gỡ tin / Xử lý** (Mở Modal can thiệp)

#### C. Modal Can thiệp Tin tuyển dụng (Moderation Modal)
* **Hành động 1: Cưỡng chế Gỡ tin (`REJECT`)**
  * Dropdown chọn mã lý do: `UNAUTHORIZED_FEE`, `MISLEADING_INFO`, `INAPPROPRIATE_CONTENT`,...
  * Textarea nhập lý do chi tiết (bắt buộc ≥10 ký tự).
  * Checkbox: *"Tự động hủy các đơn ứng tuyển đang chờ và gửi cảnh báo đến sinh viên đã nộp"* (Mặc định chọn).
* **Hành động 2: Yêu cầu Doanh nghiệp sửa đổi (`REQUEST_REVISION`)**
  * Nhập yêu cầu chỉnh sửa (sẽ chuyển tin về `DRAFT` và gửi thông báo cho công ty).
* **Hành động 3: Đình chỉ Doanh nghiệp vi phạm nghiêm trọng**
  * Nút tắt chuyển thẳng sang luồng **Suspend Company** nếu phát hiện toàn bộ doanh nghiệp này lừa đảo.

---

### 4.2. Giao diện Báo cáo vi phạm phía Sinh viên
Tạo component: `Frontend/src/components/Internships/ReportJobModal.tsx`

* Vị trí đặt: Đặt nút cờ báo cáo `Report` nhỏ gọn, tinh tế ở góc phải phần chi tiết tin tuyển dụng (khi sinh viên xem tin).
* Giao diện Modal:
  * Tiêu đề: *"Báo cáo tin tuyển dụng có dấu hiệu vi phạm"*
  * Lựa chọn lý do vi phạm (Radio options):
    1. Đòi thu tiền / đặt cọc / mua đồng phục, khóa học.
    2. Dấu hiệu lừa đảo, đa cấp, địa chỉ công ty không có thật.
    3. Công việc thực tế không đúng mô tả tuyển dụng.
    4. Hành vi không đúng mực của người phỏng vấn.
  * Ô mô tả chi tiết: Nhập bằng chứng hoặc nội dung cụ thể.
  * Cam kết thông tin trung thực và bấm gửi.

---

### 4.3. Cập nhật phía Doanh nghiệp (`CompanyInternships.tsx`)
Khi doanh nghiệp xem danh sách tin của mình:
* Nếu tin có `status === 'REJECTED'`:
  * Thẻ tin tuyển dụng có viền đỏ cảnh báo.
  * Hiển thị Banner: *"Tin tuyển dụng đã bị Ban quản trị gỡ bỏ do vi phạm quy định: [Lý do]. Liên hệ Ban quản trị để được hỗ trợ."*
  * Không cho phép bấm nút "Công khai" lại nếu chưa giải quyết xong với Admin.
* Nếu tin bị Admin yêu cầu sửa đổi (`REQUEST_REVISION`):
  * Hiển thị Banner cam: *"Ban quản trị yêu cầu điều chỉnh: [Ghi chú]. Vui lòng cập nhật thông tin trước khi mở lại."*

---

### 4.4. Tích hợp Điều hướng & Định tuyến (`App.tsx` & `Navbar.tsx`)
1. Cập nhật `adminPathByTab` trong [`Frontend/src/App.tsx`](file:///d:/CareerBridge/Frontend/src/App.tsx#L66-L76):
   ```typescript
   const adminPathByTab: Record<string, string> = {
     "stats-dashboard": "dashboard",
     "teacher-assignment": "supervisions",
     "placement-management": "placements",
     "user-management": "users",
     "company-approval": "companies",
     "internship-management": "internships", // <-- MỚI
     "skill-management": "skills",
     "semester-management": "semesters",
     "audit-logs": "audit-logs",
     "support-requests": "support-requests",
   };
   ```
2. Thêm mục **"Tin tuyển dụng"** vào thanh menu Admin kèm biểu tượng Briefcase.

---

## 5. Kịch bản Kiểm thử & Nghiệm thu (Test Cases)

| STT | Kịch bản kiểm thử | Hành vi kỳ vọng |
| :--- | :--- | :--- |
| **TC01** | Sinh viên bấm Báo cáo vi phạm (Thu phí trái phép) | Bản ghi `InternshipReport` được tạo ở trạng thái `PENDING`. Không cho phép gửi trùng lặp. |
| **TC02** | Admin xem danh sách tin tuyển dụng tại `/admin/internships` | Tin bị báo cáo có badge cảnh báo. Lọc theo checkbox "Has Reports" trả về đúng tin bị tố cáo. |
| **TC03** | Admin thực hiện Gỡ tin (`REJECT`) do Thu phí | - Trạng thái tin đổi thành `REJECTED`.<br>- Tin lập tức biến mất khỏi trang tìm việc của sinh viên.<br>- Doanh nghiệp nhận notification thông báo bị gỡ tin.<br>- Sinh viên đã nộp đơn nhận notification cảnh báo. |
| **TC04** | Doanh nghiệp cố tình dùng API PATCH để mở lại tin `REJECTED` | Backend chặn lại với lỗi `FORBIDDEN` (chỉ tin hợp lệ mới được mở). |
| **TC05** | Admin yêu cầu sửa đổi (`REQUEST_REVISION`) | - Trạng thái tin về `DRAFT`.<br>- Doanh nghiệp thấy ghi chú yêu cầu của Admin trên giao diện.<br>- Sau khi sửa, doanh nghiệp có thể mở lại thành `OPEN`. |
| **TC06** | Doanh nghiệp vi phạm hàng loạt -> Admin bấm Đình chỉ công ty | - Công ty chuyển sang `SUSPENDED`.<br>- Toàn bộ tin `OPEN` còn lại tự động đóng (`CLOSED`). |

---

## 6. Kế hoạch Thực hiện theo giai đoạn (Roadmap)

### Giai đoạn 1: Database Migration & Backend Core API (Dự kiến: 1 - 2 ngày)
1. Thêm enum `InternshipModerationReasonCode`, `InternshipReportReasonCode`, `InternshipReportStatus`, và mở rộng `InternshipStatus` trong `schema.prisma`.
2. Tạo model `InternshipReport` và quan hệ trong `schema.prisma`.
3. Chạy lệnh `npx prisma db push` hoặc tạo migration an toàn.
4. Xây dựng các DTOs kiểm thực dữ liệu.
5. Cập nhật `InternshipsService` (logic can thiệp, gửi notification, bảo vệ sinh viên nộp đơn).
6. Viết Unit tests cho `moderateInternship` và `reportInternship`.

### Giai đoạn 2: Admin Internship Management UI (Dự kiến: 2 ngày)
1. Xây dựng component `InternshipManagement.tsx` trong `Frontend/src/components/AdminView/`.
2. Tích hợp API danh sách, bộ lọc, modal chi tiết và modal can thiệp gỡ tin.
3. Cập nhật `App.tsx` và `Navbar.tsx` để admin truy cập `/admin/internships`.

### Giai đoạn 3: Kênh Báo cáo cho Sinh viên & Cảnh báo Doanh nghiệp (Dự kiến: 1 ngày)
1. Thêm nút và modal `ReportJobModal.tsx` trên giao diện xem tin của sinh viên.
2. Cập nhật thông báo vi phạm trên `CompanyInternships.tsx` cho doanh nghiệp.
3. Kiểm thử luồng E2E toàn diện.

---

> **Kết luận:** Bản kế hoạch này thiết lập một cơ chế **Hậu kiểm chuẩn mực**, vừa giữ được sự thuận tiện tối đa cho doanh nghiệp chân chính đăng tin nhanh chóng, vừa trao cho Nhà trường **quyền lực can thiệp tức thì** để bảo vệ sinh viên khỏi các bài đăng sai phạm.
