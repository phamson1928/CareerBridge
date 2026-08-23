# CareerBridge — Kế hoạch triển khai Tuần 2 cho Người A

## 1. Phạm vi và mục tiêu

**Người thực hiện:** A  
**Tuần:** 2 — Hồ sơ và kỹ năng  
**Feature được giao:** Skill Management  
**Mức độ:** Medium  
**Điểm bắt đầu:** Phần Tuần 2 của Người B đã hoàn thành: profile sinh viên, profile giảng viên, profile doanh nghiệp, luồng duyệt doanh nghiệp và CV upload đã có backend/frontend thực tế.

Mục tiêu cuối tuần là thay toàn bộ phần kỹ năng đang dùng mock data bằng dữ liệu thật từ Neon/Prisma, hoàn chỉnh từ API đến UI:

- Admin quản lý được danh mục kỹ năng chuẩn.
- Sinh viên khai báo kỹ năng và cấp độ của mình.
- Kỹ năng của sinh viên được hiển thị trong hồ sơ thật.
- Có API gắn kỹ năng vào vị trí thực tập để Người B dùng khi hoàn thiện Internships ở Tuần 3.
- Backend tính phần trăm phù hợp giữa sinh viên và vị trí thực tập; frontend chỉ hiển thị kết quả, không tự tạo điểm giả.
- Có seed kỹ năng mẫu và có checklist kiểm thử endpoint bằng `curl`.

## 2. Hiện trạng hệ thống cần tôn trọng

### 2.1. Phần đã có và sẽ tái sử dụng

- Auth đã có JWT access token, refresh token, `JwtAuthGuard`, `RolesGuard`, `@Roles()` và `@CurrentUser()`.
- API dùng prefix `/api/v1`.
- Response thành công dùng dạng `{ success: true, data, timestamp }`.
- Error dùng dạng `{ success: false, statusCode, code, message, timestamp, path }`.
- Global validation đã bật `whitelist`, `forbidNonWhitelisted` và `transform`.
- Prisma schema đã có sẵn `Skill`, `StudentSkill`, `InternshipSkill` và enum `SkillLevel`.
- `StudentProfile` của Người B đã hoạt động; không tạo lại profile module.
- `Internship` schema đã có nhưng module nghiệp vụ internship chưa hoàn thiện; Tuần 2 chỉ làm phần liên kết kỹ năng đủ để Người B tích hợp ở Tuần 3.
- Frontend hiện vẫn còn mock `studentProfile.skills`, `internship.requiredSkills` và hàm `calculateSkillMatch()` tạo điểm tối thiểu giả. Những phần này phải được thay bằng API thật trong phạm vi Tuần 2.

### 2.2. Schema hiện tại đủ dùng, chưa cần migration

```prisma
model Skill {
  id                String            @id @default(cuid())
  name              String            @unique
  studentSkills     StudentSkill[]
  internshipSkills  InternshipSkill[]
}

model StudentSkill {
  studentId String
  skillId   String
  level     SkillLevel @default(BEGINNER)

  @@id([studentId, skillId])
}

model InternshipSkill {
  internshipId String
  skillId      String
  isRequired   Boolean @default(true)
  weight       Int     @default(1)

  @@id([internshipId, skillId])
}
```

Không thay đổi schema trong Tuần 2 trừ khi phát hiện yêu cầu nghiệp vụ không thể đáp ứng bằng cấu trúc trên. Nếu buộc phải đổi schema, phải tạo migration mới; không sửa migration `init` đã tồn tại.

## 3. Quy tắc nghiệp vụ

### 3.1. Danh mục kỹ năng

- Chỉ `ADMIN` được tạo, sửa và xóa kỹ năng.
- Mọi user đã đăng nhập được đọc danh mục để dùng cho picker/filter.
- Tên kỹ năng phải được trim, dài từ 1 đến 100 ký tự.
- Tên kỹ năng là duy nhất không phân biệt chữ hoa/thường ở tầng service. Ví dụ `NestJS` và `nestjs` được xem là trùng.
- Khi đổi tên, không được đổi thành tên đã tồn tại.
- Không cho xóa kỹ năng đang được gắn vào sinh viên hoặc internship; trả `409 SKILL_IN_USE`. Lựa chọn này tránh việc admin vô tình làm mất dữ liệu liên kết.
- Danh sách hỗ trợ `page`, `limit`, `search`; mặc định sắp xếp theo `name` tăng dần.

### 3.2. Kỹ năng sinh viên

- Chỉ sinh viên đăng nhập được cập nhật kỹ năng của chính mình.
- Sinh viên phải có `StudentProfile`; nếu chưa có trả `404 STUDENT_PROFILE_NOT_FOUND`.
- Mỗi kỹ năng chỉ xuất hiện một lần trong hồ sơ.
- `level` chỉ nhận `BEGINNER`, `INTERMEDIATE`, `ADVANCED`, `EXPERT`.
- API đồng bộ danh sách dùng semantics thay thế toàn bộ: danh sách gửi lên là trạng thái cuối cùng của sinh viên.
- Payload rỗng `skills: []` là hợp lệ và có nghĩa xóa toàn bộ liên kết kỹ năng của sinh viên.
- Phải kiểm tra toàn bộ `skillId` tồn tại trước khi ghi. Nếu có một ID sai, không cập nhật một phần.
- Việc xóa cũ và tạo mới phải nằm trong transaction.

### 3.3. Kỹ năng internship

- Chỉ tài khoản `COMPANY` sở hữu internship đó mới được gắn/sửa kỹ năng.
- `ADMIN` được đọc để kiểm tra, nhưng không chỉnh thay doanh nghiệp trong flow thông thường.
- Mỗi skill có `isRequired` và `weight`.
- `weight` là số nguyên từ 1 đến 10; mặc định 1.
- Payload đồng bộ thay thế toàn bộ danh sách và thực hiện trong transaction.
- Nếu internship không tồn tại trả `404 INTERNSHIP_NOT_FOUND`.
- Nếu company không sở hữu internship trả `403 INTERNSHIP_NOT_OWNED`.
- Nếu company profile chưa `APPROVED`, trả `403 COMPANY_NOT_APPROVED`.

### 3.4. Matching

Matching là logic backend, không dùng so sánh chuỗi mơ hồ và không đặt điểm nền giả.

Với internship có các skill `i`:

```text
levelFactor:
BEGINNER     = 0.25
INTERMEDIATE = 0.50
ADVANCED     = 0.75
EXPERT       = 1.00

earnedWeight(i) = internshipSkill.weight × levelFactor(studentLevel)
maxWeight(i)    = internshipSkill.weight
matchPercent    = round(sum(earnedWeight) / sum(maxWeight) × 100)
```

Quy tắc:

- Sinh viên không có skill tương ứng: factor bằng `0`.
- Internship không khai báo skill: trả `100` vì không có tiêu chí kỹ năng để thiếu.
- Kết quả luôn nằm trong `0..100`.
- `isRequired` không làm thay đổi công thức điểm ở Tuần 2, nhưng phải trả trong breakdown để UI đánh dấu thiếu kỹ năng bắt buộc.
- Response phải có `matchedWeight`, `totalWeight`, `percentage` và breakdown từng kỹ năng.
- Không sử dụng hàm frontend hiện tại đang ép điểm thấp nhất thành `42%` và cao nhất thành `98%`.

## 4. Thiết kế API

### 4.1. Skill catalogue

#### `GET /api/v1/skills`

Quyền: mọi user đã đăng nhập.

Query:

```text
page=1
limit=20
search=nest
```

Response data:

```json
{
  "items": [
    {
      "id": "skill_id",
      "name": "NestJS",
      "studentCount": 3,
      "internshipCount": 2,
      "createdAt": "2026-08-07T00:00:00.000Z",
      "updatedAt": "2026-08-07T00:00:00.000Z"
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

#### `GET /api/v1/skills/:id`

Quyền: mọi user đã đăng nhập. Trả chi tiết skill và số lượng liên kết.

#### `POST /api/v1/skills`

Quyền: `ADMIN`.

```json
{
  "name": "NestJS"
}
```

Status: `201`.

#### `PATCH /api/v1/skills/:id`

Quyền: `ADMIN`.

```json
{
  "name": "Node.js"
}
```

#### `DELETE /api/v1/skills/:id`

Quyền: `ADMIN`. Thành công trả:

```json
{
  "deleted": true,
  "id": "skill_id"
}
```

### 4.2. Student skills

#### `GET /api/v1/students/me/skills`

Quyền: `STUDENT`.

```json
[
  {
    "skillId": "skill_id",
    "name": "NestJS",
    "level": "ADVANCED"
  }
]
```

#### `PUT /api/v1/students/me/skills`

Quyền: `STUDENT`. Dùng `PUT` vì thay thế toàn bộ collection.

```json
{
  "skills": [
    { "skillId": "skill_1", "level": "ADVANCED" },
    { "skillId": "skill_2", "level": "INTERMEDIATE" }
  ]
}
```

Response trả danh sách mới sau khi đồng bộ.

### 4.3. Internship skills

#### `GET /api/v1/internships/:internshipId/skills`

Quyền: mọi user đã đăng nhập.

#### `PUT /api/v1/internships/:internshipId/skills`

Quyền: `COMPANY` sở hữu internship.

```json
{
  "skills": [
    { "skillId": "skill_1", "isRequired": true, "weight": 5 },
    { "skillId": "skill_2", "isRequired": false, "weight": 2 }
  ]
}
```

### 4.4. Matching

#### `GET /api/v1/internships/:internshipId/match/me`

Quyền: `STUDENT`.

```json
{
  "internshipId": "internship_id",
  "studentId": "student_profile_id",
  "matchedWeight": 5.5,
  "totalWeight": 7,
  "percentage": 79,
  "skills": [
    {
      "skillId": "skill_1",
      "name": "NestJS",
      "isRequired": true,
      "weight": 5,
      "studentLevel": "ADVANCED",
      "earnedWeight": 3.75,
      "matched": true
    }
  ]
}
```

Không đưa endpoint batch match tất cả internship vào Tuần 2 nếu internship listing thật chưa có. Khi Người B hoàn thiện listing ở Tuần 3, service matching phải được export để tính theo danh sách mà không tạo N+1 query.

## 5. Thiết kế backend

### 5.1. Cấu trúc module

```text
Backend/src/skills/
├── dto/
│   ├── create-skill.dto.ts
│   ├── update-skill.dto.ts
│   ├── list-skills-query.dto.ts
│   ├── sync-student-skills.dto.ts
│   └── sync-internship-skills.dto.ts
├── matching.service.ts
├── skills.controller.ts
├── skills.service.ts
└── skills.module.ts
```

Phân trách nhiệm:

- `SkillsController`: route, guard, role và lấy current user.
- `SkillsService`: catalogue CRUD, student skill sync, internship skill sync, ownership checks.
- `MatchingService`: công thức matching thuần và query cần cho một internship.
- Không nhét matching logic vào controller hoặc frontend.

### 5.2. DTO validation

- `CreateSkillDto.name`: `@Transform(trim)`, `@IsString()`, `@MinLength(1)`, `@MaxLength(100)`.
- `ListSkillsQueryDto`: `page >= 1`, `limit 1..100`, `search` optional, transform number.
- `SyncStudentSkillsDto.skills`: array tối đa 100 phần tử, validate nested DTO, `skillId` string không rỗng, `level` là enum.
- `SyncInternshipSkillsDto.skills`: array tối đa 100 phần tử, `weight` integer `1..10`, `isRequired` boolean.
- Service kiểm tra duplicate `skillId` trong cùng payload và trả `400 DUPLICATE_SKILL_ID`.

### 5.3. Prisma query và transaction

- Dùng `where: { userId }` trực tiếp cho `StudentProfile`/`CompanyProfile` vì `userId` là unique; không query full profile chỉ để lấy `id` nếu có thể lấy đúng các field cần thiết.
- Search catalogue bằng `name: { contains: search, mode: 'insensitive' }`.
- Kiểm tra trùng tên case-insensitive trước khi create/update; vẫn bắt `P2002` để chống race condition.
- Đồng bộ collection theo transaction:

```text
1. Tìm profile/internship và kiểm tra quyền.
2. Kiểm tra tất cả skill ID tồn tại.
3. deleteMany liên kết hiện tại.
4. createMany liên kết mới.
5. query và trả collection mới.
```

- Không gọi Prisma query bên trong vòng lặp.
- Matching query một lần, include internship skills và student skills cần thiết.

### 5.4. Error codes

| HTTP | Code                        | Trường hợp                                          |
| ---- | --------------------------- | --------------------------------------------------- |
| 400  | `DUPLICATE_SKILL_ID`        | Payload lặp skill                                   |
| 400  | `INVALID_SKILL_WEIGHT`      | Weight ngoài phạm vi                                |
| 403  | `INTERNSHIP_NOT_OWNED`      | Company sửa internship của company khác             |
| 403  | `COMPANY_NOT_APPROVED`      | Company chưa được duyệt                             |
| 404  | `SKILL_NOT_FOUND`           | Skill đơn lẻ không tồn tại                          |
| 404  | `SKILLS_NOT_FOUND`          | Một hoặc nhiều skill ID trong payload không tồn tại |
| 404  | `STUDENT_PROFILE_NOT_FOUND` | Student chưa tạo profile                            |
| 404  | `INTERNSHIP_NOT_FOUND`      | Internship không tồn tại                            |
| 409  | `SKILL_ALREADY_EXISTS`      | Trùng tên skill                                     |
| 409  | `SKILL_IN_USE`              | Xóa skill đang có liên kết                          |

### 5.5. Tích hợp với profile của Người B

Mở rộng `GET /students/me` để trả thêm:

```json
{
  "skills": [
    {
      "skillId": "skill_id",
      "name": "NestJS",
      "level": "ADVANCED"
    }
  ]
}
```

Không thay đổi hành vi create/update profile hiện có. Student skill được quản lý qua endpoint collection riêng để DTO profile không trở nên quá tải.

## 6. Thiết kế frontend

### 6.1. API client và types

Tạo:

```text
Frontend/src/skills/api.ts
Frontend/src/skills/types.ts
```

API client phải dùng axios instance trong `auth/api.ts`, không tạo axios instance mới.

Types chính:

- `SkillRecord`
- `SkillsPage`
- `StudentSkillRecord`
- `InternshipSkillRecord`
- `SkillMatchResult`
- `SkillLevel`

### 6.2. Admin Skill Management

Tạo component:

```text
Frontend/src/components/AdminView/SkillManagement.tsx
```

Thêm tab `skill-management` vào Navbar Admin và render trong `App.tsx`.

UI gồm:

- Ô tìm kiếm debounce khoảng 300 ms.
- Bảng tên kỹ năng, số sinh viên sử dụng, số internship sử dụng, ngày cập nhật.
- Nút thêm kỹ năng.
- Sửa inline hoặc modal nhỏ.
- Xóa có confirm; nếu `SKILL_IN_USE`, hiển thị thông báo rõ ràng.
- Loading, empty state, lỗi API và pagination.
- Sau create/update/delete phải cập nhật danh sách từ response hoặc refetch; không reload trang.

### 6.3. Student Skill Editor

Tích hợp vào `StudentProfileView` đã có của Người B, không tạo trang profile thứ hai.

UI gồm:

- Multi-select từ catalogue API.
- Mỗi skill đã chọn có dropdown level.
- Cho phép xóa skill khỏi danh sách.
- Nút “Lưu kỹ năng” gọi `PUT /students/me/skills`.
- Disable nút khi đang lưu; hiển thị lỗi validation/API.
- Sau lưu, state phải phản ánh response backend.

### 6.4. Internship Skill Picker

Tạo component tái sử dụng:

```text
Frontend/src/components/Skills/InternshipSkillPicker.tsx
```

Props nhận `value`, `onChange`, `disabled`. Mỗi item có skill, bắt buộc/tùy chọn và weight.

Trong Tuần 2:

- Xây picker và API integration độc lập.
- Có thể gắn vào `PostInternshipModal` dưới feature flag/UI adapter, nhưng không biến modal mock thành internship CRUD thật vì đó là phạm vi Người B Tuần 3.
- Bàn giao interface rõ để Người B gửi `skills` ngay sau khi tạo/cập nhật internship.

### 6.5. Match UI

- Xóa việc sử dụng `calculateSkillMatch()` giả trong luồng dữ liệu thật.
- Match badge lấy `percentage` từ backend.
- Detail hiển thị skill đã match, level của sinh viên và skill bắt buộc còn thiếu.
- Trong khi internship listing vẫn là mock, không trộn điểm backend của internship thật với ID mock. Chỉ bật match API khi card dùng internship ID từ database.

## 7. Seed data

Mở rộng `Backend/prisma/seed.ts` bằng `upsert` các skill chuẩn:

```text
TypeScript
JavaScript
React
Node.js
NestJS
PostgreSQL
Prisma
Docker
Git
REST API
```

Sau khi có skill IDs:

- Gắn tối thiểu 4 skill cho student seed với nhiều level khác nhau.
- Không bắt buộc seed internship ở Tuần 2 vì internship cần `Semester` và company; nếu tạo thì phải seed đầy đủ quan hệ và không phá phạm vi Tuần 3.
- Seed phải chạy lại được bằng `npm.cmd exec prisma db seed` mà không tạo bản ghi trùng.

## 8. Trình tự triển khai

### Ngày 1 — Catalogue backend

- Tạo DTO, controller, service cho CRUD skill.
- Thêm pagination/search và count liên kết.
- Thêm role guard và chuẩn hóa error code.
- Build backend.

### Ngày 2 — Student skills backend

- Làm GET/PUT student skills.
- Transaction sync và validate ID/duplicate.
- Mở rộng response student profile với skills.
- Mở rộng seed.
- Kiểm thử endpoint bằng curl.

### Ngày 3 — Internship skills và matching backend

- Làm GET/PUT internship skills với ownership check.
- Implement `MatchingService` và breakdown.
- Export service cho module internship dùng ở Tuần 3.
- Kiểm thử các role và edge case bằng curl.

### Ngày 4 — Frontend catalogue và student editor

- Tạo skill API/types.
- Tạo trang Admin Skill Management.
- Tích hợp skill editor vào Student Profile.
- Xử lý loading/error/empty state.

### Ngày 5 — Picker, match UI và hoàn thiện

- Tạo internship skill picker tái sử dụng.
- Chuẩn bị adapter cho Post Internship modal.
- Thay thuật toán match mock ở nơi có dữ liệu thật.
- Chạy lint/build, kiểm thử thủ công toàn flow và cập nhật tài liệu.

## 9. Kế hoạch kiểm thử bằng endpoint/curl

Không yêu cầu viết unit test trong Tuần 2; dùng build, validation và kiểm thử API thực tế bằng `curl`.

### 9.1. Chuẩn bị

```powershell
cd D:\CareerBridge\Backend
npm.cmd exec prisma db seed
npm.cmd run start:dev
```

Đăng nhập bằng tài khoản seed để lấy access token:

```powershell
curl.exe -X POST http://localhost:3000/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@internhub.local","password":"Seed@123456"}'
```

Thực hiện tương tự cho `student@internhub.local` và `company@internhub.local`.

### 9.2. Các case bắt buộc

| Case                                    | Kết quả mong đợi                     |
| --------------------------------------- | ------------------------------------ |
| Admin tạo skill hợp lệ                  | `201`                                |
| Admin tạo tên trùng khác hoa/thường     | `409 SKILL_ALREADY_EXISTS`           |
| Student gọi POST/PATCH/DELETE catalogue | `403 FORBIDDEN_ROLE`                 |
| Search và pagination catalogue          | Trả đúng items/total                 |
| Student đồng bộ danh sách hợp lệ        | `200`, DB đúng collection            |
| Student gửi duplicate skill ID          | `400 DUPLICATE_SKILL_ID`             |
| Student gửi skill ID không tồn tại      | `404 SKILLS_NOT_FOUND`, DB không đổi |
| Student gửi `skills: []`                | Xóa toàn bộ liên kết                 |
| Company sửa skill của internship mình   | `200`                                |
| Company sửa internship của người khác   | `403 INTERNSHIP_NOT_OWNED`           |
| Xóa skill đang được sử dụng             | `409 SKILL_IN_USE`                   |
| Match không có skill                    | `0%` nếu internship có tiêu chí      |
| Internship không có tiêu chí skill      | `100%`                               |
| Match nhiều level/weight                | Đúng công thức và breakdown          |

### 9.3. Kiểm tra frontend

- Admin thêm, sửa, tìm và xóa skill không cần reload.
- Student chọn skill, đổi level, lưu và reload trang vẫn giữ dữ liệu.
- User sai role không nhìn thấy tab và API vẫn trả `403` nếu gọi trực tiếp.
- Loading/error/empty state không làm trang trắng.
- Match badge không còn điểm giả `42%` khi sinh viên không có kỹ năng.

## 10. Definition of Done

Tuần 2 của Người A chỉ được xem là hoàn thành khi:

- [ ] `SkillsModule` không còn là module rỗng.
- [ ] CRUD catalogue hoạt động và đúng quyền.
- [ ] Search/pagination hoạt động.
- [ ] Student skill GET/PUT hoạt động bằng transaction.
- [ ] Student profile API trả skills thật.
- [ ] Internship skill GET/PUT hoạt động và kiểm tra ownership.
- [ ] Matching chạy ở backend, có breakdown và không tạo điểm giả.
- [ ] Admin có UI quản lý skills thật.
- [ ] Student có UI quản lý skills thật trong profile.
- [ ] Có internship skill picker tái sử dụng cho Người B.
- [ ] Seed có catalogue và student skills mẫu.
- [ ] Backend `npm.cmd run build` thành công.
- [ ] Frontend `npm.cmd run lint` và `npm.cmd run build` thành công.
- [ ] Toàn bộ case curl bắt buộc đã chạy đạt.
- [ ] Không làm hỏng profile/files/company flow đã hoàn thành của Người B.
- [ ] Không còn sử dụng match score giả trong flow dữ liệu thật.

## 11. Ngoài phạm vi Tuần 2

- CRUD đầy đủ cho `Internship` và `Semester`.
- Application workflow, placement và supervision.
- Báo cáo, đánh giá, notification và chat.
- AI/CV coach.
- Xây unit test/Jest suite; chỉ bổ sung nếu có thời gian sau khi endpoint và UI đã ổn định.

## 12. Điểm bàn giao cho Người B

Cuối Tuần 2, Người A bàn giao:

- API lấy catalogue để dùng trong form internship.
- `InternshipSkillPicker` và types/payload chuẩn.
- `PUT /internships/:id/skills` để gọi sau khi create/update internship.
- `MatchingService` để internship listing có thể trả match score theo batch ở Tuần 3.
- Quy ước không lưu `requiredSkills: string[]` tự do nữa; liên kết phải đi qua `Skill` và `InternshipSkill`.

Người B không cần sửa lại profile module. Chỉ cần dùng catalogue/picker và nối internship thật với các endpoint đã bàn giao.
