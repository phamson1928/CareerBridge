# WEEK 7 — PERSON A — AUDIT, SYSTEM VERIFICATION & HARDENING

> Phạm vi chính của Người A trong tuần 7: hoàn thiện khả năng truy vết hệ thống cho Admin, kiểm tra toàn bộ luồng nghiệp vụ đã xây dựng từ tuần 1 đến tuần 6, xử lý lỗi và edge case trước khi tổng kết dự án.
>
> Người B phụ trách Chat. Người A chỉ hỗ trợ Người B ở contract, kiểm thử liên thông, authorization và regression; không tự mở rộng sang xây dựng Chat nếu chưa thống nhất lại trách nhiệm.

---

## 1. Mục tiêu tuần 7

Tuần 7 không phải tuần thêm nhiều nghiệp vụ mới. Mục tiêu là đưa hệ thống từ trạng thái “các module chạy riêng lẻ” sang trạng thái “toàn bộ workflow chạy liền mạch, có thể truy vết và đủ ổn định để demo/bàn giao”.

Người A cần hoàn thành bốn nhóm kết quả:

1. **Audit Log hoàn chỉnh cho Admin**
   - Backend cung cấp API đọc audit log an toàn, có filter và pagination.
   - Frontend có trang Nhật ký hệ thống chuyên nghiệp.
   - Admin có thể xác định ai đã làm gì, trên tài nguyên nào và vào thời điểm nào.
   - Audit log là dữ liệu bất biến; không có API sửa hoặc xóa từ giao diện.

2. **Kiểm thử toàn bộ flow nghiệp vụ**
   - Kiểm tra liên thông Auth → Profile → Company moderation → Semester → Internship → Application → Placement → Supervision → Report → Evaluation → Notification.
   - Kiểm tra phân quyền của Student, Company, Lecturer và Admin.
   - Kiểm tra state machine, transaction, dữ liệu liên quan và audit log.

3. **Hardening và sửa lỗi**
   - Sửa các lỗi P0/P1 phát hiện trong integration flow.
   - Chuẩn hóa error response, empty state và các edge case quan trọng.
   - Không refactor lớn hoặc đổi kiến trúc ở cuối dự án nếu không giải quyết lỗi thực tế.

4. **Hỗ trợ Chat của Người B**
   - Xác nhận conversation được tạo từ application được accept.
   - Kiểm tra authorization và regression khi Chat dùng chung Realtime Gateway.
   - Đảm bảo Chat không phá Notification realtime đã hoàn thành ở tuần 6.

---

## 2. Phân chia trách nhiệm

### 2.1. Người A chịu trách nhiệm chính

#### Backend Audit

- Hoàn thiện `AuditLogsModule` hiện đang là skeleton.
- Xây dựng read-only Audit Log API dành riêng cho Admin.
- Pagination, filter, search và date range.
- Trả actor summary, action, entity, entityId, metadata, IP và thời gian.
- Chuẩn hóa action naming và kiểm tra audit coverage của các mutation quan trọng.
- Đảm bảo mutation quan trọng ghi audit cùng transaction khi có nhiều thao tác database.
- Chặn dữ liệu bí mật xuất hiện trong audit metadata.

#### Frontend Audit

- Thêm mục “Nhật ký hệ thống” vào navigation Admin.
- Trang danh sách audit log lấy dữ liệu thật từ backend.
- Bộ lọc thời gian, action, entity, actor và search.
- Pagination hoặc load-more rõ ràng.
- Detail drawer/modal để xem metadata có cấu trúc.
- Loading, error, empty state và responsive layout.

#### System verification

- Thiết kế và chạy checklist kiểm thử end-to-end nghiệp vụ.
- Dùng curl cho REST API integration test.
- Dùng browser cho frontend visual/interaction test.
- Dùng Socket.IO client hoặc browser cho realtime; không coi curl là công cụ kiểm tra đầy đủ Socket.IO.
- Lưu lại test matrix, kết quả pass/fail và lỗi đã sửa.

#### Bug fixing

- Phân loại lỗi theo mức độ.
- Sửa lỗi trong phạm vi module đã hoàn thiện.
- Chạy regression sau mỗi nhóm sửa lỗi.
- Không che lỗi bằng mock hoặc dữ liệu hard-code trên frontend.

### 2.2. Người B chịu trách nhiệm chính

- Conversation API.
- Message API.
- Chat realtime.
- Mark message read.
- Unread chat badge.
- Chat drawer/list/detail.
- Socket event của Chat.

### 2.3. Người A hỗ trợ Người B

- Review contract Chat với schema/application workflow hiện tại.
- Cung cấp test accounts và application/conversation fixtures.
- Kiểm tra Chat chỉ truy cập đúng participant.
- Kiểm tra Message không giả mạo `senderId`.
- Kiểm tra Realtime Gateway dùng chung không làm Notification mất kết nối.
- Chạy regression Auth, Application, Notification sau khi merge Chat.

### 2.4. Không thuộc phạm vi Người A Week 7

- Viết lại Chat thay Người B.
- Thêm group chat, file attachment, voice/video call.
- Thêm Elasticsearch hoặc hệ thống log tập trung.
- Cho Admin chỉnh sửa/xóa audit log.
- Audit mọi thao tác đọc dữ liệu thông thường.
- Thêm email/push notification mới.
- Refactor toàn bộ frontend hoặc thay state-management framework.
- Mở rộng File Management nếu không liên quan trực tiếp đến lỗi regression.

---

## 3. Hiện trạng cần kế thừa

### 3.1. Audit backend

`Backend/src/audit-logs/audit-logs.module.ts` hiện chỉ là module skeleton, chưa có controller/service/DTO.

Prisma đã có model:

```prisma
model AuditLog {
  id        String   @id @default(cuid())
  userId    String?
  action    String
  entity    String?
  entityId  String?
  metadata  Json?
  ipAddress String?
  createdAt DateTime @default(now())

  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId, createdAt])
  @@index([entity, entityId])
  @@index([action, createdAt])
}
```

Nhiều module đã ghi AuditLog trực tiếp trong transaction, gồm Company moderation, Semester, Application, Placement, Supervision và Report. Tuy nhiên hiện chưa có một giao diện/API thống nhất để Admin tra cứu.

### 3.2. Audit frontend

- Chưa có API client cho Audit Log.
- Chưa có trang Audit Log trong Admin.
- Chưa có navigation item tương ứng.
- Admin hiện có các trang Dashboard, User, Company moderation, Semester, Supervision, Placement và Skill.

### 3.3. Hệ thống nghiệp vụ

Đầu tuần 7, các module core đã có implementation qua các tuần trước:

- Auth và RBAC.
- Profile Student/Lecturer/Company.
- Company moderation.
- Semester.
- Internship và matching.
- Application workflow.
- Placement.
- Supervision.
- Report.
- Evaluation.
- Notification REST + Socket.IO.
- File infrastructure hiện có nhưng không phải hạng mục mở rộng của Người A.

### 3.4. Chat

- Prisma đã có `Conversation` và `Message`.
- Conversation được tạo khi application được accept.
- `ChatModule` backend còn skeleton.
- `ChatDrawer` frontend đang dùng mock/local state và auto-reply giả.
- Realtime Gateway từ Week 6 có thể tái sử dụng cho Chat.

---

## 4. Definition of Done cấp cao

Week 7 của Người A chỉ được xem là hoàn thành khi:

- Admin xem được audit log thật từ database.
- Non-admin không truy cập được Audit API hoặc Audit UI.
- Audit list có filter, pagination, loading/error/empty/detail state.
- Các mutation nghiệp vụ quan trọng có audit record đúng actor/action/entity.
- Không có password, token hoặc secret trong metadata trả về.
- Luồng nghiệp vụ chính chạy xuyên suốt trên một bộ dữ liệu test nhất quán.
- Các state transition sai bị chặn và không để lại dữ liệu nửa chừng.
- Lỗi P0/P1 phát hiện trong flow đã được sửa và regression pass.
- Backend build và frontend lint/build pass.
- Chat merge không làm hỏng Auth, Application, Notification hoặc Socket.IO.

---

## 5. Thiết kế Audit Log nghiệp vụ

### 5.1. Audit Log dùng để trả lời câu hỏi gì?

Mỗi record phải giúp Admin trả lời tối thiểu:

- Ai thực hiện?
- Hành động gì?
- Trên loại tài nguyên nào?
- Tài nguyên cụ thể nào?
- Thời điểm nào?
- Từ trạng thái nào sang trạng thái nào nếu là transition?
- Có context bổ sung nào phục vụ điều tra lỗi?

Audit Log không phải bản sao toàn bộ entity và không phải application log/debug log.

### 5.2. Tính bất biến

- Không có `POST /audit-logs` từ client.
- Không có `PATCH /audit-logs/:id`.
- Không có `DELETE /audit-logs/:id`.
- Audit record chỉ được tạo nội bộ tại service thực hiện mutation.
- Frontend chỉ đọc.

### 5.3. Actor

- `userId`: user thực hiện hành động.
- System job hoặc migration có thể để `userId = null`.
- API trả actor summary nếu user còn tồn tại:

```json
{
  "id": "user-id",
  "email": "admin@internhub.local",
  "role": "ADMIN"
}
```

- Nếu user đã bị xóa, actor là `null` nhưng audit record vẫn tồn tại.
- Không trả `passwordHash`, refresh token hoặc profile riêng tư.

### 5.4. Action naming convention

Action dùng uppercase snake case:

```text
{ENTITY}_{VERB}
{ENTITY}_{STATE}
```

Ví dụ:

```text
COMPANY_APPROVED
COMPANY_REJECTED
SEMESTER_CREATED
SEMESTER_STATUS_CHANGED
INTERNSHIP_CREATED
INTERNSHIP_STATUS_CHANGED
APPLICATION_CREATED
APPLICATION_STATUS_CHANGED
APPLICATION_ACCEPTED
PLACEMENT_SCHEDULE_UPDATED
PLACEMENT_STATUS_CHANGED
SUPERVISION_ASSIGNED
SUPERVISION_REASSIGNED
SUPERVISION_CANCELLED
REPORT_SUBMITTED
REPORT_APPROVED
REPORT_REJECTED
EVALUATION_CREATED
EVALUATION_UPDATED
USER_STATUS_CHANGED
```

Không đổi hàng loạt action cũ chỉ vì khác wording nhẹ nếu việc đó làm mất tính liên tục. Tạo mapping label ở frontend và chuẩn hóa dần khi chạm vào module.

### 5.5. Entity naming convention

Sử dụng đúng tên domain model, dạng PascalCase:

```text
User
CompanyProfile
Semester
Internship
Application
InternshipPlacement
Supervision
Report
Evaluation
File
Conversation
Message
```

### 5.6. Metadata

Metadata chỉ chứa context tối thiểu:

```json
{
  "fromStatus": "PENDING",
  "toStatus": "APPROVED",
  "reason": "Thông tin pháp lý chưa đầy đủ"
}
```

Không ghi:

- password hoặc password hash;
- access token/refresh token;
- cookie;
- JWT payload toàn phần;
- Supabase service key;
- signed URL;
- raw CV/file content;
- toàn bộ request body không lọc;
- dữ liệu bí mật không cần thiết.

Lý do từ chối/feedback có thể xuất hiện nhưng phải giới hạn độ dài và chỉ hiển thị cho Admin.

### 5.7. IP address

- `ipAddress` là optional.
- Không bắt buộc refactor toàn bộ controller trong Week 7 chỉ để điền IP cho record cũ.
- Với mutation mới hoặc nơi dễ tích hợp, truyền metadata request theo helper thống nhất.
- Frontend hiển thị “Không ghi nhận” nếu null.
- Không dùng IP như bằng chứng định danh duy nhất.

---

## 6. Prisma và database

### 6.1. Có cần migration không?

Model hiện tại đủ cho phiên bản Week 7. Không bắt buộc thêm cột mới.

Chỉ cân nhắc migration thêm index nếu query thực tế cho thấy cần:

```prisma
@@index([createdAt])
```

Index hiện có đã hỗ trợ:

- actor + thời gian;
- entity + entityId;
- action + thời gian.

Không thêm enum Prisma cho `action` vì action có thể mở rộng theo module, tránh migration enum liên tục.

### 6.2. Retention

- Không xóa audit log trong Week 7.
- Không tạo cleanup job.
- Nếu cần retention trong production, đưa vào backlog vận hành sau dự án.

### 6.3. Transaction rule

Nếu một mutation cập nhật nhiều bảng:

```text
validate -> business updates -> related records -> audit log -> COMMIT
```

Audit phải nằm trong cùng transaction với business state change khi có thể.

Nếu transaction rollback:

- state không đổi;
- related record không tồn tại dở dang;
- audit record cũng không được tạo.

---

## 7. Backend Audit API

Base path:

```text
/api/v1/audit-logs
```

Tất cả endpoint dùng:

- `JwtAuthGuard`;
- `RolesGuard`;
- `@Roles(Role.ADMIN)`.

### 7.1. Danh sách audit log

```http
GET /api/v1/audit-logs?page=1&limit=20&action=APPLICATION_ACCEPTED&entity=Application&userId=...&from=2026-08-01&to=2026-08-31&search=student
Authorization: Bearer <adminAccessToken>
```

Query DTO:

| Field | Kiểu | Mặc định | Validation |
|---|---|---:|---|
| `page` | integer | 1 | `>= 1` |
| `limit` | integer | 20 | `1..100` |
| `action` | string | none | trim, max 100 |
| `entity` | string | none | trim, max 100 |
| `entityId` | string | none | trim, max 191 |
| `userId` | string | none | id format hiện tại |
| `from` | ISO date | none | valid date |
| `to` | ISO date | none | valid date, `to >= from` |
| `search` | string | none | trim, 2..100 |

Search phạm vi hợp lý:

- `action` contains, case-insensitive;
- `entity` contains, case-insensitive;
- `entityId` contains;
- actor email contains.

Không search raw JSON metadata bằng query thiếu index trong Week 7.

Sắp xếp ổn định:

```text
createdAt DESC, id DESC
```

Response:

```json
{
  "items": [
    {
      "id": "audit-id",
      "action": "APPLICATION_ACCEPTED",
      "entity": "Application",
      "entityId": "application-id",
      "metadata": {
        "fromStatus": "REVIEWING",
        "toStatus": "ACCEPTED"
      },
      "ipAddress": null,
      "createdAt": "2026-08-24T09:00:00.000Z",
      "actor": {
        "id": "user-id",
        "email": "company@internhub.local",
        "role": "COMPANY"
      }
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

### 7.2. Audit detail

```http
GET /api/v1/audit-logs/:id
Authorization: Bearer <adminAccessToken>
```

Mục đích:

- tải đầy đủ metadata khi Admin mở detail drawer;
- tránh nhồi metadata lớn vào list nếu cần tối ưu sau này.

Nếu list đã trả đủ metadata và dữ liệu nhỏ, endpoint detail vẫn hữu ích cho contract rõ ràng nhưng có thể triển khai sau list trong cùng phase.

Không tồn tại:

```json
{
  "statusCode": 404,
  "code": "AUDIT_LOG_NOT_FOUND",
  "message": ["Audit log not found"]
}
```

### 7.3. Filter options

Không bắt buộc tạo endpoint riêng nếu frontend dùng action/entity config tĩnh.

Nếu muốn lấy option theo dữ liệu thật:

```http
GET /api/v1/audit-logs/options
```

Response chỉ gồm distinct action/entity có giới hạn. Route `options` phải khai báo trước `:id`.

Ưu tiên Week 7: list + detail. `options` là nice-to-have.

### 7.4. Authorization response

- Không token: `401`.
- Student/Company/Lecturer: `403`.
- Admin: `200`.
- Không dùng client-side hidden menu làm lớp bảo mật duy nhất.

---

## 8. Backend module structure

```text
Backend/src/audit-logs/
├── dto/
│   └── list-audit-logs-query.dto.ts
├── audit-log.mapper.ts
├── audit-log.types.ts
├── audit-logs.controller.ts
├── audit-logs.module.ts
└── audit-logs.service.ts
```

### 8.1. Controller

Controller chỉ:

- nhận query/param;
- áp guard/role;
- gọi service;
- không chứa Prisma query;
- không tự parse JSON metadata.

### 8.2. Service methods

```ts
list(query: ListAuditLogsQueryDto)
findOne(id: string)
```

Optional internal helper nếu chuẩn hóa audit creation:

```ts
createInTransaction(
  tx: Prisma.TransactionClient,
  input: CreateAuditLogInput,
)
```

Không bắt buộc refactor tất cả module sang helper trong một lần. Ưu tiên tính đúng và tránh circular dependency.

### 8.3. Prisma select

Chỉ select:

```ts
{
  id: true,
  action: true,
  entity: true,
  entityId: true,
  metadata: true,
  ipAddress: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      email: true,
      role: true,
    },
  },
}
```

Không include toàn bộ User/Profile.

### 8.4. Date range

- `from` bắt đầu ngày theo UTC hoặc chuyển rõ timezone trước khi query.
- `to` kết thúc ngày nếu client chỉ gửi `YYYY-MM-DD`.
- Không cộng/trừ ngày mơ hồ ở nhiều lớp.
- Frontend gửi ISO boundary rõ ràng.
- Có thể giới hạn một truy vấn tối đa 90 ngày để tránh query quá rộng; Admin vẫn có thể phân trang theo từng khoảng.

---

## 9. Audit coverage matrix

Người A phải rà soát các mutation sau. “Có audit” nghĩa là record đúng actor, action, entity, entityId và nằm đúng transaction.

| Module | Mutation quan trọng | Action kỳ vọng |
|---|---|---|
| Auth | register user | `USER_REGISTERED` hoặc action hiện có tương đương |
| Users | tạo user | `USER_CREATED` |
| Users | đổi role/status | `USER_UPDATED` / `USER_STATUS_CHANGED` |
| Company | tạo/cập nhật profile | `COMPANY_PROFILE_CREATED` / `COMPANY_PROFILE_UPDATED` |
| Company | approve | `COMPANY_APPROVED` |
| Company | reject | `COMPANY_REJECTED` |
| Semester | create/update | `SEMESTER_CREATED` / `SEMESTER_UPDATED` |
| Semester | status transition | `SEMESTER_STATUS_CHANGED` |
| Internship | create/update | `INTERNSHIP_CREATED` / `INTERNSHIP_UPDATED` |
| Internship | publish/close/cancel | `INTERNSHIP_STATUS_CHANGED` |
| Application | submit | `APPLICATION_CREATED` |
| Application | reviewing/reject/withdraw | `APPLICATION_STATUS_CHANGED` |
| Application | accept | `APPLICATION_ACCEPTED` |
| Placement | schedule update | `PLACEMENT_SCHEDULE_UPDATED` |
| Placement | complete/cancel | `PLACEMENT_STATUS_CHANGED` |
| Supervision | assign | `SUPERVISION_ASSIGNED` |
| Supervision | reassign/reactivate | `SUPERVISION_REASSIGNED` / `SUPERVISION_REACTIVATED` |
| Supervision | cancel | `SUPERVISION_CANCELLED` |
| Report | submit | `REPORT_SUBMITTED` |
| Report | approve/reject | `REPORT_APPROVED` / `REPORT_REJECTED` |
| Evaluation | create/update | `EVALUATION_CREATED` / `EVALUATION_UPDATED` |
| File | create/delete metadata | action hiện có nếu mutation cần truy vết |

Không bắt buộc audit:

- GET list/detail;
- unread count;
- mark notification read;
- dashboard read;
- filter/search;
- mở/đóng modal.

### Quy tắc khi phát hiện thiếu audit

1. Xác nhận mutation có ý nghĩa nghiệp vụ hoặc bảo mật.
2. Thêm audit vào cùng transaction.
3. Không làm thay đổi response contract ngoài ý muốn.
4. Kiểm tra rollback không để lại audit giả.
5. Thêm case curl vào regression matrix.

---

## 10. Frontend Audit API và types

### 10.1. File structure

```text
Frontend/src/audit-logs/
├── api.ts
├── types.ts
└── formatters.ts

Frontend/src/components/AdminView/
├── AuditLogManagement.tsx
├── AuditLogDetailDrawer.tsx
└── AuditLogSkeleton.tsx
```

### 10.2. Types

```ts
export type AuditActor = {
  id: string;
  email: string;
  role: 'ADMIN' | 'STUDENT' | 'LECTURER' | 'COMPANY';
};

export type AuditLogRecord = {
  id: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  actor: AuditActor | null;
};
```

Không ép `metadata` thành shape duy nhất vì mỗi action có context khác nhau.

### 10.3. API client

Sử dụng axios instance chung đã có JWT refresh interceptor:

```ts
auditLogsApi.list(query)
auditLogsApi.findOne(id)
```

Không tự đọc token hoặc tạo axios instance mới.

---

## 11. Frontend Audit Log UI

### 11.1. Admin navigation

Thêm navigation item:

```text
id: audit-logs
label: Nhật ký hệ thống
icon: ScrollText hoặc ShieldCheck
```

Chỉ xuất hiện trong menu Admin.

Trong `App.tsx`:

```tsx
{activeTab === 'audit-logs' && <AuditLogManagement />}
```

### 11.2. Page header

Header cần thể hiện:

- Tiêu đề “Nhật ký hệ thống”.
- Mô tả ngắn: theo dõi hoạt động quản trị và thay đổi nghiệp vụ.
- Nút refresh.
- Thời điểm đồng bộ gần nhất.
- Không đặt nút Create/Edit/Delete.

### 11.3. Summary cards

Có thể tính từ response/filter hiện tại:

- Tổng bản ghi trong query.
- Số actor khác nhau trên page.
- Số state transition trên page.
- Hoạt động trong 24 giờ nếu API hỗ trợ query tương ứng.

Không tạo dashboard analytics phức tạp chỉ để trang đẹp hơn.

### 11.4. Filter bar

Các filter tối thiểu:

- Search.
- Action.
- Entity.
- Actor/userId hoặc actor email search.
- From date.
- To date.
- Reset filters.

UX:

- Search debounce 300–500 ms.
- Đổi filter reset page về 1.
- Không gửi query với string rỗng.
- Hiển thị filter active rõ ràng.
- Date range sai phải chặn ngay trên frontend và vẫn được backend validate.

### 11.5. Desktop table

Cột đề xuất:

| Cột | Nội dung |
|---|---|
| Thời gian | ngày + giờ theo `vi-VN` |
| Actor | email + role badge |
| Hành động | label tiếng Việt + severity/category badge |
| Tài nguyên | entity + rút gọn entityId |
| IP | IP hoặc “Không ghi nhận” |
| Chi tiết | nút mở drawer |

Không render JSON metadata dài trực tiếp trong table.

### 11.6. Mobile layout

Trên màn hình nhỏ:

- chuyển mỗi audit log thành card;
- actor, action, entity và time vẫn nhìn được;
- filter mở trong collapsible panel hoặc xếp dọc;
- không bắt người dùng kéo ngang bảng quá rộng.

### 11.7. Action presentation

`formatters.ts` chứa mapping:

```ts
const auditActionPresentation = {
  APPLICATION_ACCEPTED: {
    label: 'Chấp nhận đơn ứng tuyển',
    tone: 'success',
    category: 'Application',
  },
  COMPANY_REJECTED: {
    label: 'Từ chối hồ sơ công ty',
    tone: 'danger',
    category: 'Company',
  },
};
```

Action chưa biết:

- hiển thị action string an toàn;
- dùng neutral tone;
- không crash.

### 11.8. Detail drawer

Hiển thị:

- action label + raw action code;
- actor;
- role;
- entity/entityId;
- createdAt;
- IP;
- metadata dạng key-value có format;
- nút copy entityId/auditId nếu cần.

Metadata rendering:

- object: key-value;
- array: list/JSON block có giới hạn;
- null: “Không có dữ liệu bổ sung”;
- string dài: wrap;
- không dùng `dangerouslySetInnerHTML`.

### 11.9. Loading, empty, error

- Initial loading: skeleton table/cards.
- Background refresh: giữ data cũ, hiện spinner nhỏ.
- Empty không filter: “Chưa có hoạt động được ghi nhận”.
- Empty có filter: “Không tìm thấy bản ghi phù hợp”.
- Error: message + Retry.
- Page vượt totalPages sau khi filter: tự quay về page 1.

### 11.10. Accessibility

- Filter có label.
- Table có header semantic.
- Detail drawer có dialog semantics.
- Escape đóng drawer.
- Focus visible.
- Không dùng màu làm tín hiệu duy nhất.
- Timestamp có `dateTime` và title đầy đủ.

---

## 12. Full business flow verification

### 12.1. Test environment

Ưu tiên:

- database test/development riêng;
- migration mới nhất đã apply;
- seed deterministic;
- không chạy destructive flow trên production data;
- tài khoản đủ bốn role.

Test accounts:

```text
admin@internhub.local
student@internhub.local
student2@internhub.local
lecturer@internhub.local
lecturer2@internhub.local
company@internhub.local
```

Password lấy từ `SEED_PASSWORD`, không hard-code thêm ở source mới.

### 12.2. Flow 1 — Auth và account

1. Login từng role.
2. `GET /auth/me` trả đúng role/status.
3. Refresh cookie phát access token mới.
4. Logout thu hồi refresh token.
5. Token invalid/expired trả `401`.
6. User inactive/banned không tiếp tục truy cập.
7. Role sai trả `403`, không phải `404` ngẫu nhiên hoặc `500`.
8. Frontend logout clear state Notification/Chat.

### 12.3. Flow 2 — Company onboarding và moderation

1. Company tạo/cập nhật profile.
2. Profile chuyển `PENDING` khi resubmit.
3. Admin list pending profile.
4. Admin approve hoặc reject.
5. Company nhận notification đúng.
6. Audit record đúng action, actor, entity.
7. Profile đã review không thể review lặp sai nghiệp vụ.
8. Company chưa approved không đăng internship mở.

### 12.4. Flow 3 — Semester và Internship

1. Admin tạo semester hợp lệ.
2. Chặn date range sai.
3. Chuyển `UPCOMING -> ACTIVE`.
4. Chặn nhiều semester active nếu nghiệp vụ quy định một kỳ active.
5. Company approved tạo internship.
6. Draft → Open đúng điều kiện.
7. Chặn deadline ngoài semester.
8. Chặn slots/fill count không hợp lệ.
9. Close/cancel theo state machine.
10. Audit log đủ cho mutation.

### 12.5. Flow 4 — Application

1. Student xem internship đang mở.
2. Student có CV hợp lệ nộp application.
3. Chặn application trùng `(studentId, internshipId)`.
4. Company chỉ xem application thuộc internship của mình.
5. `PENDING -> REVIEWING`.
6. `REVIEWING -> REJECTED` hoặc `ACCEPTED`.
7. Student chỉ withdraw khi trạng thái cho phép.
8. Accept phải:
   - reserve slot;
   - ghi status history;
   - tạo placement;
   - tạo conversation;
   - tạo audit;
   - tạo notification.
9. Retry/accept lặp không tạo placement/conversation/notification trùng.
10. Internship hết slot không thể accept thêm.

### 12.6. Flow 5 — Placement và Supervision

1. Placement được tạo từ accepted application.
2. Student/Company/Admin/Lecturer chỉ xem đúng scope.
3. Admin cập nhật schedule trong semester boundary.
4. Admin assign lecturer active.
5. Placement chuyển `PENDING -> ACTIVE`.
6. Lecturer và Student nhận notification.
7. Reassign lecturer không tạo supervision thứ hai.
8. Lecturer cũ/new nhận event phù hợp nếu contract yêu cầu.
9. Cancel supervision đưa placement về trạng thái đúng.
10. Chặn cancel khi đã có report/evaluation nếu nghiệp vụ hiện tại quy định.
11. Audit record đúng transition.

### 12.7. Flow 6 — Report

1. Student chỉ tạo report cho active placement của mình.
2. Chặn report trùng tuần.
3. Draft update được.
4. Submit chuyển `DRAFT/REJECTED -> SUBMITTED`.
5. Lecturer active được phân công mới review được.
6. Lecturer khác bị `403/404` theo contract bảo mật.
7. Approve/reject cập nhật feedback/read timestamps đúng.
8. Student nhận notification.
9. Audit record trong cùng transaction.
10. Placement không complete khi còn report `SUBMITTED`.

### 12.8. Flow 7 — Evaluation

1. Chỉ tạo evaluation trên placement phù hợp.
2. Company evaluator chỉ tạo type Company.
3. Lecturer evaluator chỉ tạo type Lecturer khi active supervision phù hợp.
4. Unique `(placementId, type)` được giữ.
5. Score nằm trong range.
6. Người không liên quan không xem/sửa dữ liệu.
7. Student xem kết quả theo contract hiện tại.
8. Notification và Audit Log được tạo đúng.
9. Placement terminal xử lý theo rule đã chốt.

### 12.9. Flow 8 — Notification

1. REST list/unread/read/read-all pass.
2. User không đọc notification người khác.
3. State transition tạo notification đúng recipient.
4. Socket event tới đúng user room.
5. Reconnect refetch không mất dữ liệu.
6. Không duplicate badge/item.
7. Logout disconnect socket.
8. Notification action mở đúng tab theo role.

### 12.10. Flow 9 — Audit Log

1. Admin list được audit.
2. Non-admin bị `403`.
3. Filter action/entity/user/date đúng.
4. Search actor email đúng.
5. Pagination stable, không lặp/mất record trong cùng dataset.
6. Detail trả đúng record.
7. Audit metadata không chứa secret.
8. Mutation rollback không tạo audit.
9. User bị xóa không làm audit biến mất.
10. UI hiển thị action unknown an toàn.

### 12.11. Flow 10 — Chat integration với Người B

1. Accepted application có đúng một conversation.
2. Student và company liên quan list được conversation.
3. User không liên quan không truy cập conversation.
4. Sender lấy từ JWT, không tin `senderId` client.
5. Message được persist trước khi emit.
6. Socket event chỉ tới participant room.
7. Mark read chỉ cập nhật message người khác gửi.
8. Unread badge đúng sau reconnect.
9. Notification Socket events vẫn hoạt động khi Chat socket hoạt động.
10. Chat frontend không còn auto-reply/mock runtime.

---

## 13. Curl verification strategy

### 13.1. Không viết test rời rạc khó tái sử dụng

Tạo script/checklist có cấu trúc:

```text
docs/testing/week7-person-a/
├── README.md
├── env.example.ps1
├── 01-auth.ps1
├── 02-company-semester.ps1
├── 03-application-placement.ps1
├── 04-supervision-report-evaluation.ps1
├── 05-notification-audit.ps1
└── results.md
```

Nếu repository không muốn commit script, tối thiểu phải ghi lại curl commands và kết quả trong `results.md`.

Không commit token/password thật.

### 13.2. Audit API curl cases

1. Không token → `401`.
2. Student token → `403`.
3. Company token → `403`.
4. Lecturer token → `403`.
5. Admin list → `200`.
6. `page=0` → `400`.
7. `limit=101` → `400`.
8. Date invalid → `400`.
9. `to < from` → `400`.
10. Filter action → chỉ đúng action.
11. Filter entity → chỉ đúng entity.
12. Filter userId → chỉ đúng actor.
13. Search email → đúng result.
14. Detail existing → `200`.
15. Detail unknown → `404`.
16. `POST/PATCH/DELETE` → `404` hoặc method not allowed theo framework.

### 13.3. Assertions sau mỗi mutation

Sau mỗi curl mutation:

1. GET entity xác nhận state mới.
2. GET related entity xác nhận side effect.
3. GET notification của recipient nếu có.
4. GET audit logs filter theo entityId.
5. Gọi mutation sai/lặp để xác nhận state không đổi.
6. GET audit lần nữa để xác nhận không có record giả.

### 13.4. Socket.IO

curl chỉ kiểm tra handshake HTTP/CORS ở mức giới hạn, không kiểm tra đầy đủ Socket.IO framing và event semantics.

Realtime cần:

- frontend browser;
- hoặc script `socket.io-client` tối thiểu;
- hai token/user khác nhau để kiểm tra room isolation.

---

## 14. Bug triage và hardening

### 14.1. Severity

#### P0 — Blocker

- mất/corrupt dữ liệu;
- cross-user data leak;
- bypass role/ownership;
- transaction tạo state nửa chừng;
- login/refresh toàn hệ thống hỏng;
- migration không chạy;
- production build fail.

P0 phải sửa ngay và regression toàn flow liên quan.

#### P1 — Major

- state transition đúng bị lỗi;
- action lặp tạo dữ liệu trùng;
- notification/audit sai recipient/actor;
- frontend crash hoặc trang chính không load;
- unread count sai ổn định;
- pagination/filter trả sai dữ liệu.

P1 phải hoàn thành trong Week 7.

#### P2 — Minor

- UI alignment nhỏ;
- wording chưa thống nhất;
- loading state chưa mượt;
- format thời gian/badge chưa đẹp;
- warning không ảnh hưởng chức năng.

Sửa sau P0/P1.

### 14.2. Bug record

Mỗi lỗi ghi:

```text
ID
Severity
Role/account
Precondition
Steps to reproduce
Expected
Actual
Root cause
Fix
Regression cases
Status
```

### 14.3. Edge cases ưu tiên

- double click/double submit;
- refresh token hết hạn giữa mutation;
- entity bị thay đổi đồng thời;
- record bị xóa giữa list và detail;
- empty database;
- Unicode/tiếng Việt và content dài;
- pagination page vượt totalPages;
- timezone/date boundary;
- user bị inactive trong khi socket đang kết nối;
- reconnect nhận event trùng;
- action lặp sau network retry;
- transaction rollback;
- terminal state bị chuyển tiếp trái phép.

---

## 15. Security review checklist

### Auth/RBAC

- [ ] Mọi private endpoint có JWT guard.
- [ ] Admin endpoint có RolesGuard.
- [ ] Ownership check nằm ở backend service.
- [ ] Không tin `userId`, `senderId`, `companyId` tùy ý từ client khi có thể suy ra từ JWT/entity.
- [ ] Inactive/banned user bị chặn.

### Audit

- [ ] Chỉ Admin đọc được.
- [ ] Không có client mutation API.
- [ ] Không trả password/token/secret.
- [ ] Metadata render dưới dạng text.
- [ ] Search/filter có validation và giới hạn.
- [ ] Page size bị giới hạn.

### Realtime/Chat support

- [ ] Socket handshake verify JWT.
- [ ] Room join do server quyết định.
- [ ] Conversation participant được kiểm tra trước khi join/send/read.
- [ ] Message sender lấy từ JWT.
- [ ] Không broadcast event toàn hệ thống.
- [ ] Logout disconnect socket.

### Files

- [ ] Signed URL chỉ cấp sau ownership/domain access check.
- [ ] Không log service key/signed URL.
- [ ] MIME/size validation vẫn hoạt động sau regression.

---

## 16. Performance checklist

- Audit list dùng pagination server-side.
- Limit tối đa 100.
- Prisma chỉ select field cần thiết.
- Query list/count chạy transaction batch hợp lý.
- Không load toàn bộ audit logs để filter trên frontend.
- Search debounce.
- Stable ordering.
- Metadata lớn chỉ mở khi cần.
- Không gọi audit list lại mỗi render.
- Không tạo chart nặng cho dữ liệu không cần thiết.
- Build warning bundle size được ghi nhận; code splitting là P2 nếu không ảnh hưởng demo.

---

## 17. File dự kiến

### Backend tạo mới

```text
Backend/src/audit-logs/dto/list-audit-logs-query.dto.ts
Backend/src/audit-logs/audit-log.mapper.ts
Backend/src/audit-logs/audit-log.types.ts
Backend/src/audit-logs/audit-logs.controller.ts
Backend/src/audit-logs/audit-logs.service.ts
```

### Backend chỉnh sửa

```text
Backend/src/audit-logs/audit-logs.module.ts
Backend/prisma/schema.prisma                 # chỉ khi thêm index
Backend/prisma/migrations/**                 # chỉ khi schema đổi
Backend/src/**/**.service.ts                 # chỉ nơi audit coverage thiếu
Backend/src/**/**.controller.ts              # chỉ khi cần request metadata
Backend/prisma/seed.ts                       # audit fixtures nếu cần
```

### Frontend tạo mới

```text
Frontend/src/audit-logs/types.ts
Frontend/src/audit-logs/api.ts
Frontend/src/audit-logs/formatters.ts
Frontend/src/components/AdminView/AuditLogManagement.tsx
Frontend/src/components/AdminView/AuditLogDetailDrawer.tsx
Frontend/src/components/AdminView/AuditLogSkeleton.tsx
```

### Frontend chỉnh sửa

```text
Frontend/src/components/Navbar.tsx
Frontend/src/App.tsx
```

### Tài liệu kiểm thử

```text
docs/testing/week7-person-a/README.md
docs/testing/week7-person-a/results.md
docs/testing/week7-person-a/*.ps1          # nếu commit reusable curl scripts
```

---

## 18. Thứ tự triển khai

### Phase 1 — Audit backend

1. Chốt API contract.
2. Viết query DTO.
3. Viết Prisma select/mapper.
4. Viết list/detail service.
5. Viết Admin-only controller.
6. Đăng ký module.
7. Build backend.
8. Curl authorization/filter/pagination.

Kết quả: Admin có API đọc audit ổn định trước khi làm UI.

### Phase 2 — Audit coverage

1. Lập matrix action hiện có.
2. Kiểm tra từng mutation quan trọng.
3. Bổ sung record còn thiếu.
4. Đưa audit vào transaction.
5. Kiểm tra metadata không chứa secret.
6. Regression module vừa sửa.

Không refactor đồng loạt nếu action hiện tại đã đủ nghĩa và đúng dữ liệu.

### Phase 3 — Audit frontend

1. Tạo types/API/formatters.
2. Thêm Admin navigation.
3. Tạo list page.
4. Filter/search/date range.
5. Detail drawer.
6. Loading/error/empty/mobile.
7. Lint/build frontend.
8. Browser visual QA.

### Phase 4 — Full flow test

1. Reset/seed test database.
2. Auth/RBAC.
3. Company/Semester/Internship.
4. Application/Placement.
5. Supervision/Report/Evaluation.
6. Notification/Audit.
7. Ghi bug report.

### Phase 5 — Fix và regression

1. Sửa P0.
2. Chạy lại full flow liên quan.
3. Sửa P1.
4. Chạy regression toàn hệ thống.
5. Sửa P2 có giá trị cao.
6. Build cuối.

### Phase 6 — Chat integration support

1. Đồng bộ contract với Người B.
2. Chuẩn bị accepted application/conversation fixture.
3. Test participant authorization.
4. Test message/read/realtime.
5. Test Notification + Chat dùng chung socket.
6. Người B sửa lỗi Chat; Người A xác nhận regression.

---

## 19. Kế hoạch theo ngày

### Ngày 1 — Audit backend

- API list/detail.
- Admin guard.
- Filter/pagination/date validation.
- Backend build.
- Curl Audit API.

### Ngày 2 — Audit frontend

- API/types.
- Navigation.
- Table/card/filter/detail drawer.
- Loading/error/empty.
- Lint/build.

### Ngày 3 — Audit coverage + core flow

- Rà soát audit matrix.
- Test Auth, Company, Semester, Internship, Application.
- Ghi và sửa P0/P1 đầu tiên.

### Ngày 4 — Placement lifecycle

- Test Placement, Supervision, Report, Evaluation, Notification.
- Transaction/edge cases.
- Regression frontend theo role.

### Ngày 5 — Chat support + final regression

- Test Chat contract của Người B.
- Test shared Socket.IO.
- Full build.
- Hoàn thiện results/checklist.
- Chốt bug còn lại theo severity.

---

## 20. Acceptance criteria chi tiết

### Audit backend

- [ ] `AuditLogsModule` không còn skeleton.
- [ ] List endpoint có pagination ổn định.
- [ ] Filter action/entity/entityId/user/date/search hoạt động.
- [ ] Detail endpoint hoạt động.
- [ ] Admin truy cập được.
- [ ] Student/Company/Lecturer bị từ chối.
- [ ] Query invalid trả `400`, không `500`.
- [ ] Unknown id trả `404`.
- [ ] Response không lộ field nhạy cảm.
- [ ] Backend build pass.

### Audit coverage

- [ ] Company review có audit.
- [ ] Semester mutations có audit.
- [ ] Internship mutations quan trọng có audit.
- [ ] Application transitions có audit/history nhất quán.
- [ ] Placement status/schedule có audit.
- [ ] Supervision assign/reassign/cancel có audit.
- [ ] Report submit/review có audit.
- [ ] Evaluation create/update có audit.
- [ ] Rollback không để audit giả.

### Audit frontend

- [ ] Chỉ Admin thấy navigation.
- [ ] Không dùng mock audit data.
- [ ] List/filter/search/date hoạt động.
- [ ] Detail metadata đọc được.
- [ ] Action unknown không crash.
- [ ] Loading/error/empty states đầy đủ.
- [ ] Responsive desktop/mobile.
- [ ] Keyboard/focus/Escape hoạt động.
- [ ] Frontend lint/build pass.

### System flow

- [ ] Auth/refresh/logout/RBAC pass.
- [ ] Company moderation pass.
- [ ] Semester/Internship pass.
- [ ] Application accept atomic và idempotent.
- [ ] Placement/Supervision pass.
- [ ] Report/Evaluation pass.
- [ ] Notification REST/realtime pass.
- [ ] Cross-user access bị chặn.
- [ ] P0/P1 được đóng hoặc có blocker rõ ràng.

### Chat support

- [ ] Accepted application có conversation.
- [ ] Participant authorization pass.
- [ ] Sender không giả mạo được.
- [ ] Realtime room isolation pass.
- [ ] Mark read/unread badge pass.
- [ ] Notification realtime không regression.

---

## 21. Điều kiện bàn giao Week 7 Person A

Người A bàn giao:

1. Audit Log backend API.
2. Audit Log Admin UI.
3. Audit coverage matrix đã kiểm tra.
4. Full business flow checklist và kết quả.
5. Danh sách bug đã sửa.
6. Danh sách issue còn lại được phân loại P2/backlog.
7. Kết quả backend build, frontend lint/build.
8. Kết quả regression sau khi merge Chat của Người B.

Thứ tự thực thi đề xuất cho các lượt tiếp theo:

1. Triển khai Audit backend trước.
2. Chạy curl Audit API.
3. Triển khai Audit frontend.
4. Browser QA Audit UI.
5. Chạy full business flow và sửa lỗi.
6. Regression sau khi Chat của Người B hoàn tất.

Plan này giữ đúng vai trò Người A Week 7: tập trung vào khả năng truy vết, chất lượng liên thông và độ ổn định của toàn hệ thống, đồng thời không lấn sang phần Chat do Người B phụ trách.
