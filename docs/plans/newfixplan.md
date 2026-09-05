# CareerBridge – Kế Hoạch Triển Khai (Đã Cập Nhật)

> **Ngày:** 05/09/2026 | Tất cả các mục dưới đây là việc **chúng ta (AI) xử lý**

---

## Danh sách 11 vấn đề cần xử lý

| # | Vấn đề | File chính | Độ ưu tiên |
|---|--------|-----------|-----------|
| 1 | Dropdown filter tìm kiếm trên banner Admin | `AdminDashboard.tsx` | 🟡 |
| 2 | Tên web sai (InternConnect → CareerBridge) | `index.html`, `Navbar.tsx`, `AuthLayout.tsx`, `LoginPage.tsx`, `RegisterPage.tsx` | 🟢 |
| 3 | Xóa "Phiên đăng nhập được bảo vệ bằng JWT" | `AuthLayout.tsx` L22 | 🟢 |
| 4 | Xác thực email khi đăng ký | Backend `auth.service.ts` + Frontend | 🔴 |
| 5 | Thêm thanh loading/processing cho các tính năng | Nhiều components | 🟡 |
| 6 | Thanh tiến trình quy trình xử lý hồ sơ (thay 4 nút + dấu tick) | `StudentApplications.tsx` | 🟡 |
| 7 | SkillPicker bị chìm vào banner | `InternshipList.tsx`, `SkillPicker.tsx` | 🟡 |
| 8 | Format deadline sai (`2026-08-31T16:59:59.000Z`) | `InternshipList.tsx`, `App.tsx` | 🟢 |
| 9 | Việt hóa toàn bộ text tiếng Anh còn sót | Nhiều files | 🟢 |
| 10 | Notification sai: Company nhận thông báo supervision | `supervisions.service.ts` | 🔴 |
| 11 | Notification thiếu nhiều trường hợp | Nhiều backend services | 🔴 |

---

## Chi tiết từng vấn đề

---

### Vấn đề 1 – Dropdown filter trên banner Admin

**Phân tích:**
- [`AdminDashboard.tsx`](file:///d:/CareerBridge/Frontend/src/components/AdminView/AdminDashboard.tsx) L191: Header có class `overflow-hidden rounded-3xl`
- Bên trong có 2 `<select>` dropdown (Kỳ thực tập + Khoảng thời gian)
- **Root cause:** `overflow-hidden` trên container banner **cắt** dropdown popup nếu dùng custom dropdown
- `<select>` native không bị ảnh hưởng bởi overflow-hidden (dùng system UI)
- Cần xác nhận có phải đang dùng custom styled select không

**Phương án:**
- Nếu là `<select>` native: Đảm bảo styling đúng (text hiển thị, option readable)
- Nếu có custom dropdown: Di chuyển ra ngoài `overflow-hidden` container hoặc dùng `position: fixed`
- Thêm `overflow-visible` cho container hoặc tách filter controls ra ngoài hero

**Files cần sửa:**

#### [MODIFY] [AdminDashboard.tsx](file:///d:/CareerBridge/Frontend/src/components/AdminView/AdminDashboard.tsx)
- Kiểm tra và fix dropdown filter styling/overflow

---

### Vấn đề 2 – Tên web sai

**Phân tích – Tất cả nơi hiển thị "InternConnect":**

| File | Dòng | Text cũ | Text mới |
|------|------|---------|---------|
| [`index.html`](file:///d:/CareerBridge/Frontend/index.html) | L6 | `InternConnect \| Career Bridge Platform` | `CareerBridge – Cổng thực tập thông minh` |
| [`AuthLayout.tsx`](file:///d:/CareerBridge/Frontend/src/pages/AuthLayout.tsx) | L16 | `InternConnect` | `CareerBridge` |
| [`AuthLayout.tsx`](file:///d:/CareerBridge/Frontend/src/pages/AuthLayout.tsx) | L17 | `Career Bridge Platform` | `Cổng kết nối thực tập` |
| [`LoginPage.tsx`](file:///d:/CareerBridge/Frontend/src/pages/LoginPage.tsx) | L40 | `InternConnect` | `CareerBridge` |
| [`LoginPage.tsx`](file:///d:/CareerBridge/Frontend/src/pages/LoginPage.tsx) | L41 | `Career Bridge Platform` | `Cổng kết nối thực tập` |
| [`LoginPage.tsx`](file:///d:/CareerBridge/Frontend/src/pages/LoginPage.tsx) | L46 | `tài khoản InternConnect` | `tài khoản CareerBridge` |
| [`RegisterPage.tsx`](file:///d:/CareerBridge/Frontend/src/pages/RegisterPage.tsx) | L42 | `Bắt đầu với InternConnect` | `Bắt đầu với CareerBridge` |
| [`Navbar.tsx`](file:///d:/CareerBridge/Frontend/src/components/Navbar.tsx) | L187-188 | `Intern` + `Connect` | `Career` + `Bridge` |

---

### Vấn đề 3 – Xóa "Phiên đăng nhập được bảo vệ bằng JWT"

**Phân tích:**
- [`AuthLayout.tsx`](file:///d:/CareerBridge/Frontend/src/pages/AuthLayout.tsx) L21-23: Badge hiển thị implementation detail không nên expose

**Phương án:**
- Xóa `<span>` badge JWT (L21-23)
- Thay bằng tagline marketing phù hợp hơn: *"Kết nối · Thực tập · Phát triển"*

#### [MODIFY] [AuthLayout.tsx](file:///d:/CareerBridge/Frontend/src/pages/AuthLayout.tsx)
```diff
- <span className="inline-flex items-center gap-2 ...">
-   <ShieldCheck className="h-4 w-4 text-emerald-300" /> Phiên đăng nhập được bảo vệ bằng JWT
- </span>
+ <span className="inline-flex items-center gap-2 ...">
+   <Sparkles className="h-4 w-4 text-amber-300" /> Kết nối · Thực tập · Phát triển
+ </span>
```

---

### Vấn đề 4 – Xác thực email

**Phân tích hiện trạng:**
- [`auth.service.ts`](file:///d:/CareerBridge/Backend/src/auth/auth.service.ts) L86-119: Đăng ký tạo user ngay với status ACTIVE, **không gửi email verify**

> [!IMPORTANT]
> Cần xác nhận email provider trước khi implement (SMTP, Resend, Nodemailer, SendGrid...). Hiện tại trong `.env` chưa thấy cấu hình mail server. Cần kiểm tra Backend `.env`.

**Flow mới:**
```
Đăng ký → User tạo với status PENDING_VERIFICATION
→ Gửi email với link verify token (expires 24h)
→ User click link → POST /auth/verify-email
→ Status chuyển sang ACTIVE
→ Có thể login
```

**Files cần sửa:**

| File | Loại | Thay đổi |
|------|------|---------|
| `Backend/prisma/schema.prisma` | MODIFY | Thêm `emailVerifiedAt`, `VerificationToken` model |
| `Backend/src/auth/auth.service.ts` | MODIFY | Gửi email sau đăng ký |
| `Backend/src/auth/auth.controller.ts` | MODIFY | Endpoint `POST /auth/verify-email` |
| `Backend/src/auth/dto/verify-email.dto.ts` | NEW | DTO |
| `Backend/src/mail/mail.service.ts` | NEW | Email service |
| `Backend/src/mail/mail.module.ts` | NEW | Mail module |
| `Frontend/src/pages/RegisterPage.tsx` | MODIFY | Redirect sau đăng ký |
| `Frontend/src/pages/VerifyEmailPage.tsx` | NEW | Trang chờ/xác nhận verify |

---

### Vấn đề 5 – Thêm thanh loading/processing

**Các chỗ cần cải thiện loading state:**

| Component | Vấn đề | Fix |
|-----------|--------|-----|
| [`InternshipList.tsx`](file:///d:/CareerBridge/Frontend/src/components/StudentView/InternshipList.tsx) L153 | Chỉ text nhỏ "Đang tải..." | Skeleton card loading |
| [`StudentApplications.tsx`](file:///d:/CareerBridge/Frontend/src/components/StudentView/StudentApplications.tsx) | Không có global load indicator | Skeleton list |
| [`PlacementManagement.tsx`](file:///d:/CareerBridge/Frontend/src/components/AdminView/PlacementManagement.tsx) | Loading bảng không có visual | Skeleton rows |
| [`SupervisionManagement.tsx`](file:///d:/CareerBridge/Frontend/src/components/AdminView/SupervisionManagement.tsx) | Save action thiếu spinner | Spinner trong nút Lưu |
| Submit buttons tất cả forms | Chỉ `disabled` | `<LoaderCircle>` animation |

**Files cần sửa:**
- `Frontend/src/components/StudentView/InternshipList.tsx` — Skeleton cards
- `Frontend/src/components/AdminView/PlacementManagement.tsx` — Skeleton rows  
- Tất cả modal save buttons — Loading spinner

---

### Vấn đề 6 – Thanh tiến trình quy trình xử lý hồ sơ

**Hiện trạng** ([`StudentApplications.tsx`](file:///d:/CareerBridge/Frontend/src/components/StudentView/StudentApplications.tsx) L96-126):
```
[1. Gửi đơn ✓] [2. Đang xét duyệt] [3. Kết quả] [4. Bắt đầu thực tập]
 (4 ô vuông riêng biệt, không có đường kết nối)
```

**Thiết kế mới – Horizontal Stepper:**
```
●─────────────●─────────────○─────────────○
✓ Gửi đơn   ● Đang xét    ○ Kết quả    ○ Thực tập
```
- Đường kẻ ngang nối các bước
- Bước done: `●` xanh lá + `✓`
- Bước active: `●` xanh dương (animate pulse)
- Bước future: `○` xám
- Bước REJECTED: `●` đỏ + `✗`

**Files cần sửa:**

#### [MODIFY] [StudentApplications.tsx](file:///d:/CareerBridge/Frontend/src/components/StudentView/StudentApplications.tsx)
- Thay grid 4 div (L98-125) bằng Stepper component inline

---

### Vấn đề 7 – SkillPicker bị chìm vào banner

**Root cause đã xác định:**
- [`InternshipList.tsx`](file:///d:/CareerBridge/Frontend/src/components/StudentView/InternshipList.tsx) L117: `relative overflow-hidden` trên banner
- [`SkillPicker.tsx`](file:///d:/CareerBridge/Frontend/src/components/Skills/SkillPicker.tsx) L111: Dropdown dùng `absolute z-50` → bị clip bởi `overflow-hidden` của ancestor

**Giải pháp (2 lớp):**

**Layer 1 – SkillPicker.tsx:** Dùng React `createPortal` để render dropdown vào `document.body`:
```tsx
// Thay vì absolute positioning bên trong component
// Dùng portal + fixed positioning dựa trên getBoundingClientRect()
```

**Layer 2 – InternshipList.tsx:** Di chuyển search + skill filter ra khỏi `overflow-hidden`:
```tsx
// Trước: Search bar nằm trong hero (overflow-hidden)
// Sau: Hero chỉ có title/desc; filter bar riêng bên dưới (sticky)
```

**Files cần sửa:**

#### [MODIFY] [SkillPicker.tsx](file:///d:/CareerBridge/Frontend/src/components/Skills/SkillPicker.tsx)
- Thêm `createPortal` cho dropdown với `position: fixed`

#### [MODIFY] [InternshipList.tsx](file:///d:/CareerBridge/Frontend/src/components/StudentView/InternshipList.tsx)
- Tách filter bar ra ngoài hero banner

---

### Vấn đề 8 – Format deadline

**Root cause:**
- [`App.tsx`](file:///d:/CareerBridge/Frontend/src/App.tsx) L87: `deadline: record.deadline ?? "Chưa cập nhật"` — ISO string nguyên gốc
- [`InternshipList.tsx`](file:///d:/CareerBridge/Frontend/src/components/StudentView/InternshipList.tsx) L208: Hiển thị trực tiếp không format

**Fix:**
```typescript
// Frontend/src/utils/format.ts
export function formatDate(value: string | null | undefined): string {
  if (!value) return 'Chưa cập nhật';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  }).format(d);
}
```

**Files cần sửa:**

| File | Thay đổi |
|------|---------|
| `Frontend/src/utils/format.ts` | Tạo mới hoặc thêm `formatDate()` |
| `Frontend/src/components/StudentView/InternshipList.tsx` | Dùng `formatDate(job.deadline)` |
| `Frontend/src/App.tsx` | Format tại `toLegacyInternship()` |

---

### Vấn đề 9 – Việt hóa toàn bộ

**Các chuỗi tiếng Anh cần đổi:**

| File | Text cũ | Text mới |
|------|---------|---------|
| [`AdminDashboard.tsx`](file:///d:/CareerBridge/Frontend/src/components/AdminView/AdminDashboard.tsx) L195 | `Operational intelligence` | `Trung tâm điều hành` |
| [`PlacementManagement.tsx`](file:///d:/CareerBridge/Frontend/src/components/AdminView/PlacementManagement.tsx) L240 | `Placement operations` | `Quản lý thực tập` |
| [`PlacementOverview.tsx`](file:///d:/CareerBridge/Frontend/src/components/StudentView/PlacementOverview.tsx) | `Internship journey` | `Hành trình thực tập` |
| Toàn bộ codebase | English text còn sót trong JSX | Dịch sang tiếng Việt |

> **Giữ nguyên:** enum values, prop names, class names, technical terms

---

### Vấn đề 10 – Notification sai recipients

**Bug đã xác định:**
- [`supervisions.service.ts`](file:///d:/CareerBridge/Backend/src/supervisions/supervisions.service.ts) **L266** (ASSIGN) và **L425** (CANCEL):
  ```typescript
  // Hiện tại - SAI:
  const recipients = [result.lecturer.userId, result.placement.student.userId, result.placement.company.userId];
  
  // Đúng - Supervision là nội bộ nhà trường:
  const recipients = [result.lecturer.userId, result.placement.student.userId];
  ```

**Bảng logic đúng:**

| Sự kiện | Student | Company | Lecturer |
|---------|---------|---------|---------|
| `SUPERVISION_ASSIGNED` | ✅ | ❌ | ✅ |
| `SUPERVISION_CANCELLED` | ✅ | ❌ | ✅ |
| `PLACEMENT_COMPLETED` | ✅ | ✅ | ✅ |
| `PLACEMENT_CANCELLED` | ✅ | ✅ | ✅ |

**Files cần sửa:**

#### [MODIFY] [supervisions.service.ts](file:///d:/CareerBridge/Backend/src/supervisions/supervisions.service.ts)
- L266: Bỏ `result.placement.company.userId`
- L425: Bỏ `result.placement.company.userId`
- Cải thiện content thông báo (hiện đang quá chung chung)

---

### Vấn đề 11 – Notification thiếu

**Kiểm tra thực tế - đã có:**

| Sự kiện | Có | File |
|---------|-----|------|
| Application accepted → Student | ✅ | `applications.service.ts` L481 |
| Application rejected → Student | ✅ | `applications.service.ts` L572 |
| Report submitted → Lecturer | ✅ | `reports.service.ts` L31 |
| Report reviewed → Student | ✅ | `reports.service.ts` L32 |
| Supervision assigned → Student+Lecturer+**Company❌** | ✅ bug | `supervisions.service.ts` L268 |
| Supervision cancelled | ✅ bug | `supervisions.service.ts` L427 |
| Placement completed/cancelled | ✅ | `placements.service.ts` L438 |
| Evaluation submitted → Student | ✅ | `evaluations.service.ts` L121 |
| Company profile approved → Company | ✅ | `companies.service.ts` L199 |

**Thực sự thiếu:**

| Sự kiện | Người nhận | File cần sửa |
|---------|-----------|-------------|
| **Placement CREATED (PENDING)** | Student + Company | `placements.service.ts` – `createPendingFromAcceptedApplication` |
| Application submitted (new) → Company | Company | `applications.service.ts` – kiểm tra L153 |

**Files cần sửa:**

#### [MODIFY] [placements.service.ts](file:///d:/CareerBridge/Backend/src/placements/placements.service.ts)
- Trong `createPendingFromAcceptedApplication`: Thêm notification cho Student sau khi placement PENDING được tạo

#### [MODIFY] [applications.service.ts](file:///d:/CareerBridge/Backend/src/applications/applications.service.ts)
- Kiểm tra L153 xem đã notify Company khi có đơn mới chưa

---

## Thứ tự thực hiện

### Nhóm 1 – UI/Text (nhanh, ~1-2h)
```
#2 Đổi tên web → #3 Xóa JWT badge → #8 Format deadline → #9 Việt hóa
```

### Nhóm 2 – UI Components (~2-3h)
```
#7 SkillPicker fix → #6 Stepper progress → #5 Loading states → #1 Admin dropdown check
```

### Nhóm 3 – Backend Logic (~2-3h)
```
#10 Fix notification recipients → #11 Thêm notification cases
```

### Nhóm 4 – Feature mới (~3-5h, cần xác nhận email provider)
```
#4 Email verification
```

---

## Open Questions

> [!IMPORTANT]
> **Email Verification (#4):** Backend hiện chưa có email service. Cần xác nhận:
> - Email provider nào? (SMTP Gmail, Resend, SendGrid, Nodemailer...)
> - Biến môi trường `MAIL_HOST`, `MAIL_USER`, `MAIL_PASS` có trong `.env` không?

> [!NOTE]
> **Admin dropdown (#1):** Cần xem live để xác nhận chính xác vấn đề. Dropdown `<select>` native thường không bị ảnh hưởng bởi `overflow-hidden`. Có thể vấn đề là styling (màu chữ, background) trên dark banner rather than clipping.
