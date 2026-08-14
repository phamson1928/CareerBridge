# CareerBridge — Kế hoạch triển khai Tuần 3 cho Người A

## 1. Phạm vi và mục tiêu

**Người thực hiện:** A  
**Tuần:** 3 — Kỳ thực tập và vị trí tuyển  
**Feature chính:** Semester Management  
**Mức độ:** Light, nhưng là dữ liệu nền cho Internship, Application và Placement

Theo `PLAN.md`, Tuần 3 được chia như sau:

- Người A chịu trách nhiệm toàn bộ backend và frontend của `Semester`.
- Người B chịu trách nhiệm toàn bộ backend và frontend của `Internship`.
- Hai phần tích hợp qua `semesterId`; Người A không triển khai thay CRUD internship của Người B.

Mục tiêu cuối tuần:

- Admin tạo, xem, sửa, chuyển trạng thái và xóa kỳ thực tập theo đúng quy tắc nghiệp vụ.
- Mọi tài khoản đăng nhập đọc được danh sách kỳ để dùng cho filter và form.
- Internship bắt buộc tham chiếu một semester hợp lệ.
- Frontend có trang Admin quản lý kỳ thực tập hoàn chỉnh.
- Có component chọn kỳ tái sử dụng cho form và bộ lọc internship của Người B.
- Seed có dữ liệu kỳ thực tập đủ trạng thái và chạy lại không tạo trùng.
- Backend/frontend build thành công và các endpoint được kiểm thử bằng `curl`.

## 2. Hiện trạng hệ thống phải tôn trọng

### 2.1. Phần đã có

- Auth sử dụng JWT access token, refresh cookie, `JwtAuthGuard`, `RolesGuard`, `@Roles()` và `@CurrentUser()`.
- API dùng prefix `/api/v1`.
- Response thành công có dạng `{ success: true, data, timestamp }`.
- Error có dạng `{ success: false, statusCode, code, message, timestamp, path }`.
- Global validation đã bật `whitelist`, `forbidNonWhitelisted` và `transform`.
- Role trong backend là `ADMIN`, `STUDENT`, `LECTURER`, `COMPANY`.
- Prisma đã có `Semester`, `Internship`, `InternshipPlacement` và enum `SemesterStatus`.
- `Semester.name` đã unique; `Internship.semesterId` và `InternshipPlacement.semesterId` là foreign key bắt buộc.
- `SemestersModule` và `InternshipsModule` hiện mới là module rỗng.
- Seed hiện đã có `Seed Semester 2026` ở trạng thái `ACTIVE` và một internship mẫu tham chiếu kỳ này.
- Skill Management Tuần 2 đã có API/types/frontend; không sửa lại phần skill trong feature này.

### 2.2. Schema hiện tại

```prisma
enum SemesterStatus {
  UPCOMING
  ACTIVE
  COMPLETED
  CANCELLED
}

model Semester {
  id        String         @id @default(cuid())
  name      String         @unique
  startDate DateTime
  endDate   DateTime
  status    SemesterStatus @default(UPCOMING)
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt

  internships Internship[]
  placements  InternshipPlacement[]
}
```

Schema hiện tại đủ đáp ứng Tuần 3. Không tạo migration nếu không phát hiện yêu cầu mới thực sự không thể đáp ứng. Tuyệt đối không sửa migration `init` đã chạy trên database.

### 2.3. Ranh giới ownership với Người B

Người A sở hữu:

- `Backend/src/semesters/**`.
- `Frontend/src/semesters/**`.
- Trang Admin quản lý semester.
- Component chọn/filter semester tái sử dụng.
- Seed semester và tài liệu contract tích hợp.

Người B sở hữu:

- `Backend/src/internships/**`.
- Internship CRUD, search, filter, company ownership và status.
- Form đăng vị trí, danh sách vị trí và company dashboard.

Người A không tạo endpoint kiểu `POST /semesters/:id/internships`. Internship tự mang `semesterId` trong create/update DTO của Người B. Cách này giữ một nguồn ghi duy nhất cho resource `Internship`.

## 3. Quy tắc nghiệp vụ Semester

### 3.1. Quyền truy cập

- Mọi user đã đăng nhập được xem danh sách và chi tiết semester.
- Chỉ `ADMIN` được tạo, sửa, chuyển trạng thái và xóa semester.
- User chưa đăng nhập nhận `401 AUTHENTICATION_REQUIRED`.
- Role khác gọi endpoint ghi nhận `403 FORBIDDEN_ROLE`.

### 3.2. Tên và thời gian

- `name` phải là chuỗi sau khi trim và gom khoảng trắng liên tiếp.
- Độ dài tên từ 1 đến 100 ký tự.
- Tên unique không phân biệt chữ hoa/thường ở tầng service. Ví dụ `Học kỳ 1 2026` và `học kỳ 1 2026` được xem là trùng.
- `startDate` và `endDate` phải là ISO 8601 hợp lệ.
- `startDate` phải nhỏ hơn `endDate`; không chấp nhận hai thời điểm bằng nhau.
- Không cấm hai semester chồng thời gian vì yêu cầu hiện tại chưa quy định mỗi thời điểm chỉ có một kỳ. Không tự thêm ràng buộc “chỉ một ACTIVE” nếu chưa có quyết định nghiệp vụ từ nhóm.
- Thời gian được lưu UTC trong database. Frontend dùng `input[type=date]`, chuyển về ISO trước khi gửi và hiển thị theo locale Việt Nam.

### 3.3. Lifecycle

Trạng thái hợp lệ:

```text
UPCOMING  -> ACTIVE | CANCELLED
ACTIVE    -> COMPLETED | CANCELLED
COMPLETED -> terminal
CANCELLED -> terminal
```

Quy tắc:

- Semester mới luôn được tạo ở `UPCOMING`; create DTO không nhận `status`.
- Chuyển trạng thái dùng endpoint riêng, không trộn với cập nhật tên/ngày.
- Không cho phép chuyển ngược `ACTIVE -> UPCOMING` hoặc mở lại `COMPLETED/CANCELLED` trong phạm vi Tuần 3.
- Service kiểm tra transition, không chỉ dựa vào frontend disable nút.
- `COMPLETED` và `CANCELLED` là terminal để giữ lịch sử nhất quán.
- Không tự động đổi trạng thái theo đồng hồ trong Tuần 3; chưa có scheduler/cron. Admin chủ động chuyển trạng thái.

### 3.4. Chỉnh sửa và xóa

- Cho phép sửa `name`, `startDate`, `endDate` khi semester là `UPCOMING`.
- Khi semester là `ACTIVE`, chỉ cho phép cập nhật `name` và `endDate`; không cho đổi `startDate` để tránh thay đổi lịch sử đã bắt đầu.
- Không cho sửa metadata của semester `COMPLETED` hoặc `CANCELLED`.
- Chỉ cho xóa semester khi chưa có internship và chưa có placement.
- Không xóa semester `ACTIVE` hoặc `COMPLETED`; với kỳ đã vận hành, dùng trạng thái thay vì xóa.
- Nếu có quan hệ sử dụng, trả `409 SEMESTER_IN_USE` trước khi Prisma phát sinh foreign-key error.

### 3.5. Điều kiện dùng semester cho Internship

- Internship create/update phải tham chiếu semester tồn tại.
- Company được tạo `DRAFT` cho semester `UPCOMING` hoặc `ACTIVE`.
- Internship chỉ được chuyển sang `OPEN` khi semester là `ACTIVE`.
- Không cho gắn internship mới vào semester `COMPLETED` hoặc `CANCELLED`.
- Người A export helper/service để Người B kiểm tra semester mà không sao chép logic.

Các method bàn giao đề xuất:

```ts
assertExists(id: string): Promise<Semester>
assertAcceptsDraftInternship(id: string): Promise<Semester>
assertAcceptsOpenInternship(id: string): Promise<Semester>
```

`SemestersModule` phải export `SemestersService` để `InternshipsModule` import và sử dụng.

## 4. Thiết kế API

### 4.1. `GET /api/v1/semesters`

Quyền: mọi user đã đăng nhập.

Query:

```text
page=1
limit=20
search=2026
status=ACTIVE
```

Validation:

- `page >= 1`, mặc định `1`.
- `limit` từ `1..100`, mặc định `20`.
- `search` optional, trim, tối đa 100 ký tự.
- `status` optional và phải thuộc `SemesterStatus`.

Sort mặc định:

1. `startDate` giảm dần.
2. `createdAt` giảm dần để ổn định kết quả.

Response data:

```json
{
  "items": [
    {
      "id": "semester_id",
      "name": "Học kỳ 1 - 2026",
      "startDate": "2026-01-05T00:00:00.000Z",
      "endDate": "2026-05-31T23:59:59.999Z",
      "status": "ACTIVE",
      "internshipCount": 12,
      "placementCount": 4,
      "createdAt": "2025-12-01T00:00:00.000Z",
      "updatedAt": "2026-01-05T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

`internshipCount` và `placementCount` lấy bằng Prisma `_count`; không query count trong vòng lặp.

### 4.2. `GET /api/v1/semesters/:id`

Quyền: mọi user đã đăng nhập.

Trả cùng shape một item trong list. Nếu không tồn tại trả:

```text
404 SEMESTER_NOT_FOUND
```

Không include toàn bộ internship/placement trong endpoint chi tiết để tránh response lớn và trùng ownership với module khác.

### 4.3. `POST /api/v1/semesters`

Quyền: `ADMIN`.

Payload:

```json
{
  "name": "Học kỳ 2 - 2026",
  "startDate": "2026-08-15T00:00:00.000Z",
  "endDate": "2026-12-31T23:59:59.999Z"
}
```

Status trả về: `201`.

Semester được tạo với `status: UPCOMING`. Backend bỏ qua mọi ý định truyền `status` nhờ `forbidNonWhitelisted`.

### 4.4. `PATCH /api/v1/semesters/:id`

Quyền: `ADMIN`.

Payload là partial của metadata:

```json
{
  "name": "Học kỳ doanh nghiệp 2 - 2026",
  "endDate": "2027-01-15T23:59:59.999Z"
}
```

Không nhận `status`. Service merge dữ liệu hiện tại với DTO rồi kiểm tra lại `startDate < endDate`.

### 4.5. `PATCH /api/v1/semesters/:id/status`

Quyền: `ADMIN`.

Payload:

```json
{
  "status": "ACTIVE"
}
```

Backend kiểm tra bảng transition tại mục 3.3. Transition không hợp lệ trả `409 INVALID_SEMESTER_TRANSITION` và không thay đổi database.

### 4.6. `DELETE /api/v1/semesters/:id`

Quyền: `ADMIN`.

Thành công:

```json
{
  "deleted": true,
  "id": "semester_id"
}
```

Chỉ xóa nếu đúng toàn bộ điều kiện mục 3.4. Không dựa hoàn toàn vào `onDelete: Restrict` để tạo message lỗi.

## 5. Thiết kế backend

### 5.1. Cấu trúc module

```text
Backend/src/semesters/
├── dto/
│   ├── create-semester.dto.ts
│   ├── update-semester.dto.ts
│   ├── update-semester-status.dto.ts
│   └── list-semesters-query.dto.ts
├── semesters.controller.ts
├── semesters.service.ts
└── semesters.module.ts
```

Phân trách nhiệm:

- Controller chịu route, guard, role và DTO.
- Service chịu validation nghiệp vụ, Prisma query, transaction và error mapping.
- Không đặt date/lifecycle logic trong controller.
- Không tạo repository abstraction mới chỉ cho một module nếu project đang dùng trực tiếp `PrismaService`.

### 5.2. DTO validation

`CreateSemesterDto`:

- `name`: transform trim/gom khoảng trắng, `@IsString()`, `@MinLength(1)`, `@MaxLength(100)`.
- `startDate`: `@IsDateString()`.
- `endDate`: `@IsDateString()`.

`UpdateSemesterDto`:

- Ba field optional với validation tương ứng.
- Dùng `@IsOptional()`; không nhận `status`.

`UpdateSemesterStatusDto`:

- `status`: `@IsEnum(SemesterStatus)`.

`ListSemestersQueryDto`:

- Transform số cho `page`, `limit`.
- `status`: enum optional.
- `search`: trim và optional.

Validation liên field `startDate < endDate` đặt trong service để kiểm tra được cả create và partial update.

### 5.3. Prisma select

Dùng một select dùng chung:

```ts
const semesterSelect = {
  id: true,
  name: true,
  startDate: true,
  endDate: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      internships: true,
      placements: true,
    },
  },
} satisfies Prisma.SemesterSelect;
```

Service map `_count` thành `internshipCount` và `placementCount` trước khi trả response để frontend không phụ thuộc tên nội bộ Prisma.

### 5.4. Query và transaction

- List dùng `$transaction([findMany, count])` để lấy items và total cùng lúc.
- Search dùng `name: { contains: search, mode: 'insensitive' }`.
- Kiểm tra trùng tên case-insensitive trước create/update.
- Vẫn bắt Prisma `P2002` để chống race condition.
- Delete kiểm tra count quan hệ và delete trong transaction để giảm khoảng race giữa kiểm tra và ghi.
- Bắt `P2003` khi delete như lớp bảo vệ cuối và map về `SEMESTER_IN_USE`.
- Không gọi Prisma trong vòng lặp.

### 5.5. Error codes

| HTTP | Code | Trường hợp |
| --- | --- | --- |
| 400 | `INVALID_SEMESTER_DATE_RANGE` | `startDate >= endDate` |
| 400 | `SEMESTER_UPDATE_EMPTY` | PATCH không có field hợp lệ |
| 403 | `FORBIDDEN_ROLE` | Role khác Admin gọi endpoint ghi |
| 404 | `SEMESTER_NOT_FOUND` | Semester không tồn tại |
| 409 | `SEMESTER_ALREADY_EXISTS` | Tên trùng không phân biệt hoa/thường |
| 409 | `INVALID_SEMESTER_TRANSITION` | Chuyển trạng thái sai lifecycle |
| 409 | `SEMESTER_IMMUTABLE` | Sửa semester terminal hoặc field bị khóa |
| 409 | `SEMESTER_IN_USE` | Semester có internship/placement |
| 409 | `SEMESTER_NOT_ACCEPTING_INTERNSHIPS` | Internship gắn vào kỳ completed/cancelled |
| 409 | `SEMESTER_NOT_ACTIVE` | Mở internship trong kỳ không active |

Thông báo lỗi nên đủ rõ cho UI, nhưng frontend dựa vào `code` khi cần hành vi cụ thể.

### 5.6. Audit log

Theo yêu cầu phi chức năng, thao tác quản trị phải có audit log. Vì `AuditLogsModule` hiện còn rỗng, có hai phương án theo thứ tự ưu tiên:

1. Tạo `AuditLogsService.record()` dùng chung và export từ `AuditLogsModule`.
2. Nếu nhóm thống nhất để Audit sang Tuần 7, chuẩn bị interface/call site rõ và ghi TODO có owner; không để việc thiếu audit làm thay đổi transaction semester.

Các action cần ghi:

```text
SEMESTER_CREATED
SEMESTER_UPDATED
SEMESTER_STATUS_CHANGED
SEMESTER_DELETED
```

Metadata tối thiểu gồm before/after cần thiết, không lưu token hay dữ liệu nhạy cảm. Audit cho status change nên nằm cùng transaction với update nếu service audit đã sẵn sàng.

## 6. Contract tích hợp với Internship của Người B

### 6.1. Create/update internship

DTO của Người B nhận:

```json
{
  "semesterId": "semester_id"
}
```

Flow backend đề xuất:

```text
1. Kiểm tra company profile APPROVED.
2. Gọi SemestersService.assertAcceptsDraftInternship(semesterId).
3. Validate date của internship nằm trong phạm vi hợp lý của semester.
4. Tạo/update internship với semesterId.
5. Khi OPEN, gọi assertAcceptsOpenInternship(semesterId).
```

Quy tắc ngày tích hợp:

- `internship.startDate` nếu có không được sau `internship.endDate`.
- Thời gian thực tập nên nằm trong `semester.startDate..semester.endDate`.
- `deadline` phải trước hoặc bằng `startDate` nếu cả hai đều có.
- Các validation thuộc internship service của Người B; Người A chỉ bàn giao semester date/status.

### 6.2. Filter internship

Endpoint list của Người B hỗ trợ:

```text
GET /api/v1/internships?semesterId=<id>
```

Frontend `SemesterSelect` truyền `semesterId`; không tải toàn bộ internship rồi filter client-side.

### 6.3. Hạn chế race condition

Nếu Admin chuyển/cancel semester trong lúc company đang mở internship:

- Internship service phải kiểm tra trạng thái semester ngay tại thời điểm ghi.
- Frontend disable chỉ để cải thiện UX, không thay thế validation backend.
- Không cascade đổi tất cả internship status trong Tuần 3 nếu chưa có yêu cầu rõ; việc đó có thể làm thay đổi dữ liệu thuộc ownership Người B.

## 7. Thiết kế frontend

### 7.1. API client và types

Tạo:

```text
Frontend/src/semesters/api.ts
Frontend/src/semesters/types.ts
```

Dùng chung `api` từ `auth/api.ts`, không tạo axios instance mới.

Types:

```ts
type SemesterStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

interface SemesterRecord {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: SemesterStatus;
  internshipCount: number;
  placementCount: number;
  createdAt: string;
  updatedAt: string;
}
```

API methods:

```ts
semestersApi.list(params)
semestersApi.getById(id)
semestersApi.create(input)
semestersApi.update(id, input)
semestersApi.updateStatus(id, status)
semestersApi.remove(id)
```

### 7.2. Admin Semester Management

Tạo:

```text
Frontend/src/components/AdminView/SemesterManagement.tsx
```

Thêm tab `semester-management` vào Navbar Admin và render trong `App.tsx`.

UI gồm:

- Tiêu đề và nút “Tạo kỳ thực tập”.
- Ô search debounce khoảng 300 ms.
- Filter status: Tất cả, Sắp diễn ra, Đang hoạt động, Đã hoàn thành, Đã hủy.
- Bảng/card responsive hiển thị tên, khoảng ngày, status, số internship, số placement và ngày cập nhật.
- Pagination server-side.
- Modal create/edit có validation client cơ bản.
- Menu chuyển trạng thái chỉ hiển thị transition hợp lệ.
- Confirm trước khi cancel hoặc delete.
- Loading state, empty state, API error và disabled state khi submit.
- Sau mutation refetch hoặc cập nhật state từ response; không reload trang.

Không dùng `window.prompt()` cho form semester vì có nhiều field và validation ngày. Dùng modal/form có label và lỗi rõ ràng.

### 7.3. Status badge

Mapping thống nhất:

| Status | Nhãn | Màu |
| --- | --- | --- |
| `UPCOMING` | Sắp diễn ra | Xanh dương/indigo |
| `ACTIVE` | Đang hoạt động | Xanh lá |
| `COMPLETED` | Đã hoàn thành | Slate |
| `CANCELLED` | Đã hủy | Đỏ |

Không suy luận status từ ngày ở frontend; luôn hiển thị status backend.

### 7.4. Component chọn kỳ tái sử dụng

Tạo:

```text
Frontend/src/components/Semesters/SemesterSelect.tsx
```

Props đề xuất:

```ts
interface SemesterSelectProps {
  value: string;
  onChange: (semesterId: string) => void;
  allowedStatuses?: SemesterStatus[];
  includeAllOption?: boolean;
  disabled?: boolean;
  error?: string;
}
```

Hành vi:

- Load list qua `semestersApi.list({ limit: 100 })`.
- Form create internship dùng `allowedStatuses={['UPCOMING', 'ACTIVE']}`.
- Filter danh sách internship dùng `includeAllOption`.
- Hiển thị loading/error trong chính component.
- Giá trị gửi lên là `semester.id`, không phải tên.

### 7.5. Tích hợp vào frontend Người B

- `PostInternshipModal` dùng `SemesterSelect` cho `semesterId`.
- `InternshipList` dùng `SemesterSelect` để gửi filter `semesterId` lên API.
- Company dashboard có thể hiển thị tên semester từ response internship đã include summary.
- Nếu Internship frontend chưa hoàn thành, Người A chỉ tạo component và ví dụ props, không biến mock internship thành CRUD thật.

### 7.6. Responsive và khả năng sử dụng

- Navbar Admin đang có nhiều tab; kiểm tra desktop hẹp và mobile horizontal scroll.
- Table cần `overflow-x-auto`; trên màn nhỏ ưu tiên card hoặc giữ các cột quan trọng.
- Input ngày phải có label, không dựa vào placeholder.
- Nút hành động có disabled/loading để tránh double submit.
- Error server hiển thị bằng `getApiErrorMessage()`; lỗi `SEMESTER_IN_USE` cần thông báo rõ “Kỳ đã có vị trí hoặc placement nên không thể xóa”.

## 8. Seed data

Mở rộng `Backend/prisma/seed.ts` bằng `upsert` theo `name`:

```text
Học kỳ doanh nghiệp 2025 — COMPLETED
Seed Semester 2026       — ACTIVE
Học kỳ doanh nghiệp 2027 — UPCOMING
```

Yêu cầu:

- Giữ `Seed Semester 2026` vì internship seed hiện tham chiếu kỳ này.
- Ngày phải hợp lệ và `startDate < endDate`.
- Seed chạy lại không tạo trùng.
- Không xóa semester có dữ liệu chỉ để seed lại.
- Không tạo `CANCELLED` nếu không cần kiểm thử UI; có thể tạo bằng curl trong checklist rồi xóa nếu chưa được sử dụng.

## 9. Trình tự triển khai đề xuất

### Ngày 1 — Backend CRUD nền

- Tạo DTO, controller, service và Prisma select.
- Làm GET list/detail, POST, PATCH metadata, DELETE.
- Pagination, search, status filter và count quan hệ.
- Chuẩn hóa error codes.
- Chạy backend lint/build.

### Ngày 2 — Lifecycle và integration contract

- Làm endpoint status transition.
- Implement date validation, immutable rules và delete-in-use.
- Export `SemestersService`.
- Viết helper validate cho Internship module.
- Cập nhật seed semester.
- Kiểm thử backend bằng curl.

### Ngày 3 — Admin frontend

- Tạo semester types/API.
- Tạo `SemesterManagement`.
- Tích hợp Navbar và `App.tsx`.
- Hoàn thiện modal create/edit, filter, pagination và status actions.

### Ngày 4 — Component dùng chung và tích hợp

- Tạo `SemesterSelect`.
- Bàn giao cho form/filter internship của Người B.
- Nếu API internship đã có, nối thật và kiểm tra `semesterId` end-to-end.
- Không giữ danh sách semester mock trong component.

### Ngày 5 — Hoàn thiện

- Chạy frontend/backend lint và build.
- Curl toàn bộ positive/negative cases.
- Kiểm tra UI desktop/mobile.
- Rà database sau mutation.
- Cập nhật README hoặc tài liệu API nếu project đang duy trì.

## 10. Kế hoạch kiểm thử bằng curl

Không yêu cầu unit test trong phạm vi kế hoạch này; dùng lint/build, API thực tế và kiểm tra database có mục tiêu.

### 10.1. Chuẩn bị

```powershell
cd D:\CareerBridge\Backend
npm.cmd exec prisma db seed
npm.cmd run start:dev
```

Đăng nhập Admin để lấy access token:

```powershell
curl.exe -X POST http://localhost:3000/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@internhub.local","password":"Seed@123456"}'
```

Lặp lại cho student/company để kiểm thử read access và role denial.

### 10.2. Case backend bắt buộc

| Case | Kết quả mong đợi |
| --- | --- |
| User chưa login list semesters | `401` |
| Student/company/lecturer list semesters | `200` |
| Admin tạo dữ liệu hợp lệ | `201`, status `UPCOMING` |
| Admin truyền field `status` khi create | `400` do non-whitelisted |
| Admin tạo tên trùng khác hoa/thường | `409 SEMESTER_ALREADY_EXISTS` |
| Admin tạo `startDate >= endDate` | `400 INVALID_SEMESTER_DATE_RANGE` |
| Student tạo/sửa/xóa semester | `403 FORBIDDEN_ROLE` |
| Search, status filter, pagination | items/total đúng |
| PATCH partial làm date range sai | `400`, DB không đổi |
| UPCOMING → ACTIVE | `200` |
| ACTIVE → COMPLETED | `200` |
| COMPLETED → ACTIVE | `409 INVALID_SEMESTER_TRANSITION` |
| Sửa semester completed | `409 SEMESTER_IMMUTABLE` |
| Xóa semester chưa dùng, trạng thái cho phép | `200` |
| Xóa semester có internship | `409 SEMESTER_IN_USE` |
| Internship draft dùng UPCOMING/ACTIVE | hợp lệ |
| Internship dùng COMPLETED/CANCELLED | bị từ chối |
| Internship OPEN khi semester không ACTIVE | `409 SEMESTER_NOT_ACTIVE` |

### 10.3. Kiểm tra transaction và database

- Sau request lỗi, query lại để chắc dữ liệu không bị cập nhật một phần.
- Sau delete bị chặn, semester và internship vẫn tồn tại.
- Chạy seed hai lần và kiểm tra số semester không tăng bất thường.
- Kiểm tra `updatedAt` thay đổi sau update/status transition.

## 11. Checklist kiểm thử frontend

- Admin thấy tab quản lý semester.
- List hiển thị đúng dữ liệu thật từ API.
- Search debounce không gọi API mỗi phím ngay lập tức.
- Filter status và pagination giữ trạng thái hợp lý.
- Create modal không cho submit khi thiếu tên/ngày hoặc ngày sai.
- Edit modal khóa field theo trạng thái backend.
- Chuyển status cập nhật badge mà không reload trang.
- Delete semester đang dùng hiển thị thông báo nghiệp vụ rõ ràng.
- Student/company không thấy menu Admin nhưng vẫn load được semester options trong feature phù hợp.
- `SemesterSelect` gửi đúng ID.
- Refresh trang không làm mất dữ liệu vì state được load lại từ API.
- Không có lỗi console, request lặp vô hạn hoặc warning key React.
- Kiểm tra desktop, tablet và mobile.

## 12. Definition of Done

Tuần 3 của Người A chỉ hoàn thành khi:

- [ ] `SemestersModule` không còn rỗng.
- [ ] CRUD semester hoạt động đúng quyền.
- [ ] Search/filter/pagination lấy từ database thật.
- [ ] Date range được validate ở backend.
- [ ] Lifecycle chỉ cho transition hợp lệ.
- [ ] Không xóa được semester đang được sử dụng.
- [ ] Service được export cho Internship module.
- [ ] Seed semester idempotent.
- [ ] Admin có trang quản lý semester hoàn chỉnh.
- [ ] Có `SemesterSelect` tái sử dụng.
- [ ] Frontend không dùng mock semester.
- [ ] Backend lint/build thành công.
- [ ] Frontend lint/build thành công.
- [ ] Các case curl bắt buộc đạt.
- [ ] Không làm hỏng Auth, Profiles, Skills và CV flow của Tuần 1–2.

## 13. Các điểm không làm trong Tuần 3

- Không làm Application state machine.
- Không tạo Placement hoặc Supervision.
- Không làm Report/Evaluation.
- Không tự động schedule chuyển status semester.
- Không cascade đóng/cancel internship nếu chưa thống nhất contract với Người B.
- Không tạo endpoint internship trong SemestersController.
- Không thêm migration chỉ để phục vụ code style hoặc field có thể tính từ dữ liệu hiện có.

## 14. Bàn giao cho Người B

Cuối Tuần 3, Người A bàn giao:

- API list semester cho form và filter.
- `SemesterSelect` dùng lại trong create/edit internship và internship listing.
- `SemestersService` được export với helper validate semester.
- Quy tắc rõ ràng: draft nhận UPCOMING/ACTIVE, open chỉ nhận ACTIVE.
- Error codes để frontend internship hiển thị đúng lỗi.
- Seed semester ổn định cho curl và UI.

Người B chỉ cần lưu `semesterId` trong Internship, gọi helper trước khi ghi và hỗ trợ query `semesterId` ở endpoint list. Không cần sao chép lifecycle logic của Semester sang `InternshipsService`.

## 15. Rủi ro cần tránh

- Dùng tên semester làm foreign key trên frontend thay vì ID.
- Cho frontend tự suy luận status từ ngày và hiển thị lệch backend.
- Cho PATCH metadata sửa luôn status, làm bypass transition rules.
- Xóa semester rồi để foreign-key error thô trả về client.
- Query count từng semester trong vòng lặp gây N+1.
- Người A và Người B cùng sửa `InternshipsModule` gây conflict lớn.
- Lọc internship client-side sau khi tải toàn bộ dữ liệu.
- Seed xóa dữ liệu quan hệ đang có.
- Dùng giờ local không nhất quán khiến ngày lệch một ngày khi serialize.

