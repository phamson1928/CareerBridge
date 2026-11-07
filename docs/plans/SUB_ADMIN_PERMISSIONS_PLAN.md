# Kế hoạch chi tiết: Phân quyền theo Module cho Admin phụ (Sub-Admin Permissions)

> **Mục tiêu**: Cho phép Quản trị viên tối cao (**Super Admin**) linh hoạt cấu hình và cấp quyền cho từng **Admin phụ (Sub-Admin)** chỉ được thao tác trên các phân hệ nhất định (Duyệt Doanh nghiệp, Tin tuyển dụng, Phân công Giảng viên, Đợt thực tập, Hỗ trợ SV...), bảo đảm an toàn tuyệt đối, không gây xung đột (zero regression) với hệ thống hiện tại.

---

## 1. Nguyên tắc kiến trúc & Tiêu chí an toàn (Design Principles)

1. **Zero Regression (Không đụng vào `enum Role`)**:
   - Giữ nguyên `enum Role { ADMIN, STUDENT, LECTURER, COMPANY }` trong PostgreSQL.
   - Mọi Admin (cả tối cao và phụ) vẫn mang `role: Role.ADMIN` ở tầng hệ thống để **không làm gãy** bất kỳ logic routing `/admin/*`, WebSocket, notification hay guard cũ nào.
2. **Mô hình Superuser & Scoped Permissions**:
   - Thêm cờ `isSuperAdmin: Boolean` và mảng `permissions: String[]` trực tiếp vào bảng `User`.
   - **Super Admin (`isSuperAdmin: true`)**: Toàn quyền bypass qua mọi tầng kiểm tra, là người duy nhất được quản lý người dùng (`/users`) và xem nhật ký (`/audit-logs`).
   - **Admin phụ (`isSuperAdmin: false`)**: Chỉ được truy cập các module có mã quyền nằm trong mảng `permissions` được Super Admin cấp.
3. **Hiệu lực tức thì (Real-time Permission Check)**:
   - `JwtStrategy.validate` đọc trực tiếp `permissions` từ database trong mỗi request. Khi Super Admin thêm/bớt quyền, Admin phụ sẽ chịu ảnh hưởng ngay lập tức mà không bắt buộc phải đăng xuất.

---

## 2. Danh mục Module & Bảng phân quyền chuẩn hóa

| Mã Quyền (`AdminPermission`) | Tên Module hiển thị trên UI | URL / Controller Backend tương ứng | Tab Admin trên Frontend |
| :--- | :--- | :--- | :--- |
| `DASHBOARD` | Thống kê hệ thống | `/dashboard/*` (`DashboardController`) | `stats-dashboard` |
| `COMPANIES` | Duyệt & Quản lý Doanh nghiệp | `/companies/*` (`CompaniesController`) | `company-approval` |
| `INTERNSHIPS` | Quản lý Tin tuyển dụng & Kỹ năng | `/internships/*`, `/skills/*` | `internship-management`, `skill-management` |
| `PLACEMENTS` | Quản lý Thực tập & Giảng viên | `/placements/*`, `/supervisions/*` | `placement-management`, `teacher-assignment` |
| `SEMESTERS` | Quản lý Đợt thực tập | `/semesters/*` (`SemestersController`) | `semester-management` |
| `SUPPORT` | Hỗ trợ & Khiếu nại sinh viên | `/support-requests/*` | `support-requests` |
| **Độc quyền Super Admin** | **Quản lý người dùng & Phân quyền** | `/users/*` (`UsersController`) | `user-management` |
| **Độc quyền Super Admin** | **Nhật ký hệ thống (Audit Logs)** | `/audit-logs/*` (`AuditLogsController`) | `audit-logs` |

---

## 3. Kế hoạch triển khai (5 Pha)

1. **Pha 1**: Database Migration & Schema (Prisma, PostgreSQL, Seed).
2. **Pha 2**: Backend Guards, Decorators & Constants (`AdminPermissionsGuard`, `@RequirePermission`, `@SuperAdminOnly`).
3. **Pha 3**: Backend Users API & Auth Service (`UsersService`, `AuthService`, `JwtStrategy`).
4. **Pha 4**: Frontend Navbar & View Filtering (`Navbar.tsx`, `App.tsx`, `auth.types.ts`).
5. **Pha 5**: Frontend UserManagement Checkbox Modal & Testing (`UserManagement.tsx`).

