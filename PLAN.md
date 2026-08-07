# CareerBridge — Kế hoạch triển khai 7 tuần

**Nhóm:** 2 người (A + B)
**Mô hình:** Full-stack per feature — mỗi người tự lo backend + frontend cho feature được giao
**Database:** Railway PostgreSQL (chỉ dùng DB cloud, backend chạy local)
**Deployment:** Railway PostgreSQL + Object Storage

---

## Nguyên tắc

- **Không chờ đợi:** Feature của ai người đó làm từ API đến UI, không phụ thuộc nhau
- **Import chung:** Auth guard, PrismaService, file upload utility dùng chung được 2 người dùng
- **Mỗi tuần có đầu ra:** Cuối tuần phải có feature hoàn chỉnh (chạy được API + thao tác được trên UI)
- **Tuần 1 là nền:** Cả 2 cùng setup để không ai bị chặn

---

## Tuần 1 — Nền tảng (Cả 2)

### A (Auth + Setup)

| Backend                                                             | Frontend                                       |
| ------------------------------------------------------------------- | ---------------------------------------------- |
| NestJS project setup, Prisma schema, migration đầu tiên lên Railway | Setup React + routing + protected route layout |
| Auth module: register, login, refresh, logout, JWT strategy         | Trang login/register form                      |
| RolesGuard, JwtAuthGuard, CurrentUser decorator                     | Role-based redirect (sau login)                |
| App module đăng ký sẵn tất cả module                                | Axios instance + interceptor gắn token         |

### B (UI Skeleton + Common)

| Backend                            | Frontend                                |
| ---------------------------------- | --------------------------------------- |
| Users module: CRUD cơ bản (Admin)  | Main layout: Navbar, role switcher      |
| File module: upload signed URL API | Notification center + Chat drawer shell |
| Audit log module: ghi log          | Global error handling UI                |

> **Đầu tuần 2:** Cả 2 đã có thể login/logout, thấy đúng giao diện theo role, call API được.

---

## Tuần 2 — Hồ sơ + Kỹ năng

### A — Skill Management (MEDIUM)

| Backend                                    | Frontend                              |
| ------------------------------------------ | ------------------------------------- |
| `skills` CRUD (danh mục kỹ năng)           | Trang Admin quản lý danh mục kỹ năng  |
| `student_skills` + `internship_skills` API | UI gắn kỹ năng cho sinh viên + vị trí |
| Skill matching algorithm (tính % match)    | Hiển thị % match trên internship card |

### B — Profiles (HEAVY)

| Backend                               | Frontend                               |
| ------------------------------------- | -------------------------------------- |
| `student_profiles` CRUD               | Trang hồ sơ sinh viên (form + preview) |
| `lecturer_profiles` CRUD              | Trang hồ sơ giảng viên                 |
| `company_profiles` CRUD + verify flow | Trang đăng ký doanh nghiệp + chờ duyệt |
| CV upload (signed URL)                | CV upload + preview                    |

> **Đầu tuần 3:** Có data profiles + skills chuẩn để bắt đầu feature lớn.

---

## Tuần 3 — Kỳ thực tập + Vị trí tuyển

### A — Semesters (LIGHT)

| Backend                     | Frontend                        |
| --------------------------- | ------------------------------- |
| `semesters` CRUD            | Trang Admin quản lý kỳ thực tập |
| Gán internship vào semester | Filter internship theo kỳ       |

### B — Internships (MEDIUM)

| Backend                            | Frontend                                |
| ---------------------------------- | --------------------------------------- |
| `internships` CRUD (Company tạo)   | Form đăng vị trí (có skills picker)     |
| Filter: theo kỳ, skill, trạng thái | Danh sách vị trí + search/filter        |
| Company chỉ xem bài của mình       | Dashboard company (bài đăng + thống kê) |

> **Đầu tuần 4:** Có vị trí tuyển để sinh viên apply.

---

## Tuần 4 — Ứng tuyển + Phân công

### A — Supervision (LIGHT)

| Backend                                 | Frontend                         |
| --------------------------------------- | -------------------------------- |
| `supervisions` CRUD (Admin tạo)         | Trang Admin: phân công GV cho SV |
| `placements` lifecycle (tạo khi accept) | UI xem giảng viên hướng dẫn      |

### B — Applications (HEAVY)

| Backend                                  | Frontend                                |
| ---------------------------------------- | --------------------------------------- |
| `applications` state machine             | Nút apply + form kèm CV                 |
| `application_status_history` tự động ghi | Trang theo dõi trạng thái ứng tuyển     |
| Review: accept/reject + feedback         | Company: danh sách ứng viên + xét duyệt |
| Tạo placement + conversation khi accept  | Modal xem CV + quyết định               |

> **Đầu tuần 5:** Luồng apply → accept/reject hoàn chỉnh.

---

## Tuần 5 — Báo cáo + Dashboard

### A — Dashboard + Placements (MEDIUM)

| Backend                            | Frontend                      |
| ---------------------------------- | ----------------------------- |
| Admin dashboard: tổng hợp thống kê | Biểu đồ + cards thông số      |
| Placement management               | Trang Admin quản lý placement |

### B — Reports (HEAVY)

| Backend                                  | Frontend                               |
| ---------------------------------------- | -------------------------------------- |
| `reports` CRUD (SV gửi)                  | Form viết báo cáo tuần + đính kèm file |
| Review workflow: submit → approve/reject | Lecturer: danh sách + xem báo cáo      |
| File đính kèm (signed URL)               | Preview + download file                |

> **Đầu tuần 6:** Sinh viên nộp báo cáo được, giảng viên duyệt được.

---

## Tuần 6 — Đánh giá + Thông báo

### A — Evaluations (LIGHT)

| Backend                                     | Frontend                   |
| ------------------------------------------- | -------------------------- |
| `evaluations` CRUD (company + lecturer)     | Form đánh giá (2 phía)     |
| Kiểm tra quyền: chỉ đúng người mới đánh giá | Hiển thị kết quả đánh giá  |
| Audit log cho mọi thao tác                  | Trang xem lịch sử đánh giá |

### B — Notifications + Files (MEDIUM)

| Backend                               | Frontend                              |
| ------------------------------------- | ------------------------------------- |
| `notifications` CRUD                  | Notification center (dropdown + list) |
| File management hoàn chỉnh            | Upload/download file UI               |
| Gắn thông báo khi có state transition | Badge unread trên navbar              |

> **Đầu tuần 7:** Hầu hết nghiệp vụ core hoàn thành.

---

## Tuần 7 — Chat + Hoàn thiện

### A — Audit + Fix (LIGHT)

- Audit log UI cho Admin
- Test toàn bộ flow nghiệp vụ
- Fix bug, xử lý edge cases
- Hỗ trợ B nếu cần

### B — Chat (MEDIUM)

| Backend                                | Frontend                                     |
| -------------------------------------- | -------------------------------------------- |
| `conversations` CRUD                   | Chat drawer: danh sách hội thoại             |
| `messages` CRUD (realtime qua polling) | Khung chat realtime (polling hoặc Socket.IO) |
| Kiểm tra quyền trong conversation      | Mark read, unread badge                      |

### Cả 2 — Tổng kết

- Kiểm tra toàn bộ flow: đăng ký → tạo hồ sơ → đăng bài → apply → accept → báo cáo → đánh giá
- Fix lỗi migration
- Cập nhật README, docs

---

## Tổng khối lượng

| Người | Số feature                                                                      | Backend logic                                     | Frontend complexity               | Độ nặng  |
| ----- | ------------------------------------------------------------------------------- | ------------------------------------------------- | --------------------------------- | -------- |
| **A** | Auth, Skills, Semesters, Placements, Supervision, Evaluations, Dashboard, Audit | Auth JWT, matching algorithm, aggregation queries | Forms + Tables + Charts           | **~40%** |
| **B** | Profiles, Internships, Applications, Reports, Files, Notifications, Chat        | State machines, signed URL, file handling         | Multi-step forms, modals, chat UI | **~60%** |

---

## Lưu ý kỹ thuật

- **Dùng chung:** PrismaService, JwtAuthGuard, RolesGuard, CurrentUser decorator, file helper — 2 người đều import được
- **Database migration:** Ai thay đổi schema thì tạo migration mới, commit vào git. Người kia chạy `prisma migrate deploy`
- **Cấu trúc mỗi module:** `module.ts` + `controller.ts` + `service.ts` + `dto/` — đúng pattern NestJS
- **Chuẩn endpoint:** dùng danh từ số nhiều cho resource, đặt theo nhóm chức năng và ưu tiên REST rõ ràng.
  - CRUD: `GET /students`, `GET /students/:id`, `POST /students`, `PATCH /students/:id`, `DELETE /students/:id`
  - Auth: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`
  - Filter/pagination: dùng query string như `?page=1&limit=20&search=abc&status=active&semesterId=1`
  - Action nghiệp vụ: dùng `POST` cho thao tác chuyển trạng thái như `POST /applications/:id/approve`, `POST /reports/:id/review`
  - Quan hệ con: `GET /internships/:id/applications`, `GET /applications/:id/status-history`
  - Update một phần dùng `PATCH`; chỉ dùng `PUT` khi thay thế toàn bộ resource
  - Trả `200`/`201` cho success, `400` cho validation, `401` cho thiếu đăng nhập, `403` cho sai quyền, `404` cho không tìm thấy
- **API response format:** `{ success: true, data: ... }` — TransformInterceptor đã setup sẵn
