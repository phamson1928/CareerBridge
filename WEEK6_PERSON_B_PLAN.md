# WEEK 6 — PERSON B — NOTIFICATIONS & REALTIME

> Phạm vi của Người B trong tuần 6: hoàn thiện hệ thống thông báo và tích hợp thông báo vào các chuyển trạng thái nghiệp vụ.
>
> **Không thực hiện File Management trong tuần này.** Mọi nội dung upload, download, signed URL, quản lý file, giao diện file và chỉnh sửa `FilesModule` đều nằm ngoài phạm vi.

---

## 1. Mục tiêu tuần 6

Xây dựng một hệ thống Notification hoàn chỉnh theo hướng production-ready, gồm ba lớp:

1. **Persistent notification**
   - Thông báo được lưu trong PostgreSQL.
   - Người dùng vẫn xem được thông báo sau khi refresh, đăng xuất hoặc mất kết nối realtime.
   - Trạng thái đã đọc/chưa đọc được lưu bền vững.

2. **Business integration**
   - Thông báo được tạo từ các sự kiện nghiệp vụ thật, không phải dữ liệu giả trên frontend.
   - Ví dụ: đơn ứng tuyển được duyệt, báo cáo bị từ chối, giảng viên được phân công, placement hoàn thành.
   - Việc tạo thông báo phải nằm cùng transaction với thay đổi nghiệp vụ khi có thể.

3. **Realtime delivery**
   - Sau khi transaction thành công, thông báo được đẩy ngay tới đúng người dùng bằng Socket.IO.
   - REST API vẫn là nguồn dữ liệu chuẩn; Socket.IO chỉ giúp cập nhật tức thời.
   - Khi mất socket hoặc reconnect, frontend đồng bộ lại từ REST để không mất thông báo.

Kết quả cuối tuần:

- Notification center lấy dữ liệu thật từ backend.
- Badge chưa đọc lấy từ backend và cập nhật realtime.
- Người dùng chỉ đọc/chỉnh sửa thông báo của chính mình.
- Các chuyển trạng thái quan trọng tự động sinh thông báo.
- Kiến trúc realtime có thể tái sử dụng cho Chat ở tuần 7.

---

## 2. Ranh giới trách nhiệm

### 2.1. Người B thực hiện

#### Backend

- Mở rộng Prisma schema cho Notification.
- Migration và seed notification.
- REST API:
  - lấy danh sách thông báo;
  - lấy số lượng chưa đọc;
  - đánh dấu một thông báo đã đọc;
  - đánh dấu tất cả đã đọc.
- Internal API để các domain service tạo notification.
- Socket.IO gateway dùng JWT authentication.
- Phát notification vào room riêng của từng user.
- Tích hợp notification vào các state transition đã có.
- Chuẩn hóa template nội dung và action của notification.

#### Frontend

- Thay notification mock bằng API thật.
- Notification center/dropdown hoặc drawer hoàn chỉnh.
- Badge unread trên navbar.
- Socket.IO client.
- Đồng bộ REST khi đăng nhập, reconnect và khi mở notification center.
- Điều hướng người dùng tới đúng chức năng khi nhấn thông báo.
- Loading, empty, error, retry và responsive UI.

#### Verification

- Lint/build backend và frontend.
- Kiểm thử REST bằng curl.
- Kiểm thử việc sinh thông báo từ các state transition.
- Kiểm thử Socket.IO bằng browser hoặc một client Socket.IO nhỏ.
- Kiểm tra trực quan notification center trên các role.

### 2.2. Phối hợp với Người A

Người A phụ trách Evaluations trong tuần 6. Người B cung cấp contract tạo notification để Người A gọi khi:

- một evaluation được tạo;
- một evaluation được cập nhật hoặc công bố nếu nghiệp vụ có trạng thái công bố;
- sinh viên nhận được đánh giá mới.

Người B không viết nghiệp vụ Evaluation thay Người A, nhưng phải:

- định nghĩa `NotificationType.EVALUATION`;
- định nghĩa action mở trang Evaluation;
- cung cấp helper/service để tạo notification trong transaction;
- ghi rõ payload và event key trong tài liệu tích hợp.

### 2.3. Loại trừ hoàn toàn

Các hạng mục sau **không thuộc Week 6 của Người B**:

- upload file;
- download file;
- xóa file;
- file metadata CRUD;
- signed URL của Supabase;
- bucket/policy Supabase Storage;
- file preview;
- upload progress;
- giao diện quản lý file;
- đính kèm file vào report/chat/evaluation;
- chỉnh sửa hoặc hoàn thiện `FilesModule`.

Không thêm các hạng mục trên vào Definition of Done và không để chúng chặn việc hoàn thành Week 6.

### 2.4. Chưa làm trong tuần này

- Conversation và Message của Chat Week 7.
- Push notification của trình duyệt, email hoặc mobile.
- Redis adapter cho Socket.IO nhiều instance.
- Notification preferences theo từng loại.
- Job tự động xóa notification cũ.
- Admin gửi broadcast notification thủ công.

---

## 3. Hiện trạng hệ thống cần kế thừa

### Backend

- Dự án đã có `NotificationsModule` nhưng hiện mới là module khung.
- Prisma đã có model Notification tối thiểu:
  - `id`;
  - `userId`;
  - `title`;
  - `content`;
  - `isRead`;
  - `readAt`;
  - `createdAt`.
- Backend đã cài:
  - `@nestjs/websockets`;
  - `@nestjs/platform-socket.io`;
  - `socket.io`.
- Các service như Company moderation, Placement và Supervision đã sử dụng transaction và audit log.
- Kiến trúc hệ thống đã định hướng React nhận realtime event qua Socket.IO.

### Frontend

- Đã có `NotificationCenter.tsx`, nhưng dữ liệu hiện được truyền từ mock/local state.
- `App.tsx` đang chứa `INITIAL_NOTIFICATIONS` và tự tính unread count.
- Type frontend hiện chưa khớp hoàn toàn với Prisma/backend.
- Chưa cài `socket.io-client`.
- App hiện điều hướng chủ yếu bằng tab/state; action notification cần ánh xạ vào cơ chế điều hướng đang có.

### Hệ quả thiết kế

- Không tiếp tục mở rộng mock hiện tại.
- Backend response là contract chuẩn duy nhất.
- Frontend type phải được tạo theo contract backend.
- Realtime phải được xây như hạ tầng dùng chung, để Week 7 Chat có thể tái sử dụng authentication và room management.

---

## 4. Kiến trúc tổng thể

```text
Domain Controller
      |
      v
Domain Service
      |
      | interactive database transaction
      v
Business state change + AuditLog + Notification row
      |
      | commit thành công
      v
Notification realtime publisher
      |
      v
Socket.IO room: user:{userId}
      |
      v
React notification store/provider
      |
      +--> Navbar unread badge
      +--> Notification center
      +--> Optional in-app toast

REST GET /notifications là nguồn đồng bộ và phục hồi dữ liệu
```

### Nguyên tắc bắt buộc

1. **Database là source of truth.**
2. **Không emit socket trước khi transaction commit.**
3. Socket lỗi không được rollback nghiệp vụ đã thành công.
4. Frontend reconnect phải gọi REST để reconcile.
5. User room được xác định từ JWT trên server, không nhận `userId` tùy ý từ client.
6. Không có public endpoint cho user tự tạo notification.
7. Notification từ business transition phải chống trùng lặp.

---

## 5. Thiết kế dữ liệu

### 5.1. Prisma enums đề xuất

```prisma
enum NotificationType {
  APPLICATION
  REPORT
  SUPERVISION
  PLACEMENT
  COMPANY
  EVALUATION
  SYSTEM
}

enum NotificationAction {
  NONE
  OPEN_APPLICATION
  OPEN_REPORT
  OPEN_SUPERVISION
  OPEN_PLACEMENT
  OPEN_COMPANY_PROFILE
  OPEN_EVALUATION
}
```

Không thêm `CHAT` ở Week 6. Khi Chat được triển khai ở Week 7, bổ sung enum bằng migration của Week 7.

### 5.2. Model Notification mục tiêu

```prisma
model Notification {
  id           String             @id @default(uuid())
  userId       String
  type         NotificationType
  action       NotificationAction @default(NONE)
  title        String
  content      String
  resourceId   String?
  metadata     Json?
  eventKey     String             @unique
  isRead       Boolean            @default(false)
  readAt       DateTime?
  createdAt    DateTime           @default(now())

  user         User               @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt])
  @@index([userId, isRead, createdAt])
  @@map("notifications")
}
```

### 5.3. Ý nghĩa các trường mới

- `type`: phân loại để hiển thị icon/màu và filter.
- `action`: hành động frontend được phép thực hiện; an toàn hơn việc lưu URL tùy ý.
- `resourceId`: id của application/report/placement/... liên quan.
- `metadata`: chỉ lưu dữ liệu hiển thị tối thiểu đã whitelist.
- `eventKey`: khóa duy nhất của một lần phát sinh sự kiện, ngăn notification bị tạo hai lần do retry hoặc endpoint bị gọi lại.

### 5.4. Quy tắc eventKey

- Tạo event occurrence id bên ngoài transaction/retry loop.
- Dùng cùng event occurrence id trong mọi lần retry transaction.
- Format gợi ý:

```text
{domain}:{entityId}:{eventName}:{eventOccurrenceId}:{recipientUserId}
```

Ví dụ:

```text
application:app-123:accepted:evt-456:user-student
supervision:sup-123:reassigned:evt-789:user-new-lecturer
```

Với sự kiện chỉ có thể xảy ra đúng một lần, có thể dùng key xác định:

```text
company:company-123:approved:user-company-owner
application:app-123:submitted:user-company-owner
```

Không dùng chỉ `{entityId}:{status}` cho sự kiện có thể lặp lại như reassign hoặc resubmit.

### 5.5. Quy tắc metadata

Chỉ cho phép dữ liệu đã kiểm soát, ví dụ:

```json
{
  "companyName": "ABC Tech",
  "studentName": "Nguyen Van A",
  "reportTitle": "Bao cao tuan 3"
}
```

Không lưu trong metadata:

- access token hoặc refresh token;
- password;
- signed URL;
- nội dung riêng tư dài;
- dữ liệu file;
- dữ liệu không cần cho UI notification.

---

## 6. REST API contract

Tất cả endpoint yêu cầu JWT hợp lệ. Mọi role đã đăng nhập đều có quyền thao tác trên notification của chính mình.

### 6.1. Lấy danh sách notification

```http
GET /api/v1/notifications?page=1&limit=20&isRead=false&type=REPORT
Authorization: Bearer <accessToken>
```

Query DTO:

| Field | Kiểu | Mặc định | Quy tắc |
|---|---|---:|---|
| `page` | integer | 1 | tối thiểu 1 |
| `limit` | integer | 20 | 1–50 |
| `isRead` | boolean | không lọc | transform string chính xác |
| `type` | enum | không lọc | thuộc `NotificationType` |

Sắp xếp:

```text
createdAt DESC, id DESC
```

Response:

```json
{
  "data": [
    {
      "id": "notification-id",
      "type": "REPORT",
      "action": "OPEN_REPORT",
      "title": "Báo cáo đã được duyệt",
      "content": "Báo cáo tuần 3 của bạn đã được giảng viên duyệt.",
      "resourceId": "report-id",
      "metadata": {
        "reportTitle": "Báo cáo tuần 3"
      },
      "isRead": false,
      "readAt": null,
      "createdAt": "2026-08-23T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

Không trả `userId` nếu frontend không cần dùng.

### 6.2. Lấy unread count

```http
GET /api/v1/notifications/unread-count
Authorization: Bearer <accessToken>
```

Response:

```json
{
  "count": 4
}
```

Route tĩnh `unread-count` phải được khai báo trước route `:id` nếu sau này có route động.

### 6.3. Đánh dấu một notification đã đọc

```http
PATCH /api/v1/notifications/:id/read
Authorization: Bearer <accessToken>
```

Quy tắc:

- Idempotent: gọi lại trên notification đã đọc vẫn trả thành công.
- Query phải có cả `id` và `userId` của JWT.
- Notification không tồn tại hoặc không thuộc user đều trả `404`, tránh lộ tài nguyên của user khác.
- Lần đầu đọc đặt:
  - `isRead = true`;
  - `readAt = now()`.
- Lần gọi sau không thay đổi `readAt` ban đầu.

### 6.4. Đánh dấu tất cả đã đọc

```http
PATCH /api/v1/notifications/read-all
Authorization: Bearer <accessToken>
```

Implementation:

```text
updateMany where userId = currentUser.id AND isRead = false
set isRead = true, readAt = now()
```

Response:

```json
{
  "updatedCount": 4,
  "unreadCount": 0
}
```

### 6.5. Endpoint cố ý không cung cấp

- Không có `POST /notifications` cho client.
- Không có endpoint mark-read nhận `userId` trong body.
- Không có admin broadcast trong Week 6.
- Không bắt buộc `DELETE /notifications` trong Week 6.

Từ “CRUD notifications” trong `PLAN.md` được hiểu theo tài nguyên nghiệp vụ:

- Create: do backend nội bộ tạo từ domain event.
- Read: user xem danh sách và unread count.
- Update: user cập nhật read state.
- Delete: chưa cần vì notification còn đóng vai trò lịch sử hoạt động ngắn hạn.

---

## 7. Backend module design

### 7.1. Cấu trúc NotificationsModule

```text
Backend/src/notifications/
├── dto/
│   └── get-notifications-query.dto.ts
├── notification.constants.ts
├── notification.mapper.ts
├── notification.templates.ts
├── notification.types.ts
├── notifications.controller.ts
├── notifications.module.ts
└── notifications.service.ts
```

### 7.2. NotificationsController

Controller chỉ phụ trách HTTP:

- lấy user từ auth context/decorator hiện có;
- validate params/query bằng DTO;
- gọi service;
- không chứa Prisma query;
- không nhận `userId` từ request body/query;
- không tự xây nội dung business notification.

### 7.3. NotificationsService public methods

```ts
findForUser(userId: string, query: GetNotificationsQueryDto)
countUnread(userId: string)
markAsRead(userId: string, notificationId: string)
markAllAsRead(userId: string)
createInTransaction(tx: Prisma.TransactionClient, input: CreateNotificationInput)
publishCreated(notification: NotificationPublicDto)
publishMany(notifications: NotificationPublicDto[])
```

`createInTransaction` là internal method, không expose qua controller.

### 7.4. Input tạo notification nội bộ

```ts
type CreateNotificationInput = {
  userId: string;
  eventKey: string;
  type: NotificationType;
  action: NotificationAction;
  title: string;
  content: string;
  resourceId?: string;
  metadata?: Prisma.InputJsonValue;
};
```

### 7.5. Template nội dung

Nội dung phải được tạo ở backend bằng các function có type rõ ràng:

```ts
applicationSubmittedTemplate(...)
applicationStatusChangedTemplate(...)
reportSubmittedTemplate(...)
reportReviewedTemplate(...)
supervisionAssignedTemplate(...)
supervisionRemovedTemplate(...)
placementStatusChangedTemplate(...)
companyReviewTemplate(...)
evaluationCreatedTemplate(...)
```

Quy tắc template:

- Tiêu đề ngắn, dễ quét.
- Content không render HTML.
- Không nối chuỗi từ input chưa kiểm soát thành HTML.
- Không ghi lý do từ chối nhạy cảm đầy đủ vào notification nếu trang chi tiết đã có.
- Dùng tên hiển thị đã lấy từ database, không tin client gửi lên.

---

## 8. Transaction và tính nhất quán

### 8.1. Pattern chuẩn

```ts
const eventOccurrenceId = randomUUID();

const transactionResult = await this.prisma.$transaction(async (tx) => {
  const entity = await updateBusinessState(tx);
  await createAuditLog(tx, entity);

  const notification = await this.notifications.createInTransaction(tx, {
    userId: recipientUserId,
    eventKey: buildEventKey(eventOccurrenceId, recipientUserId),
    type: NotificationType.APPLICATION,
    action: NotificationAction.OPEN_APPLICATION,
    title: '...',
    content: '...',
    resourceId: entity.id,
  });

  return { entity, notifications: [notification] };
});

this.notifications.publishMany(transactionResult.notifications);
return transactionResult.entity;
```

### 8.2. Lý do emit sau commit

Nếu emit trong transaction:

- client có thể nhận notification trước khi dữ liệu nghiệp vụ tồn tại;
- transaction rollback nhưng notification đã xuất hiện trên UI;
- client click vào resource chưa commit hoặc không tồn tại.

Vì vậy thứ tự bắt buộc là:

```text
business update -> audit -> notification row -> COMMIT -> socket emit
```

### 8.3. Khi Socket.IO emit thất bại

- Không rollback transaction đã commit.
- Log warning có `notificationId`, không log token hoặc dữ liệu nhạy cảm.
- Frontend sẽ lấy lại notification qua REST khi mở center, refresh hoặc reconnect.

### 8.4. Khi transaction retry

- `eventOccurrenceId` phải được tạo trước retry loop.
- `eventKey` giữ nguyên trong retry.
- Unique constraint trên `eventKey` là lớp bảo vệ cuối cùng.
- Nếu request nghiệp vụ idempotent được gọi lại sau khi đã thành công, service phải trả trạng thái hợp lý và không tạo thêm notification vô nghĩa.

---

## 9. Realtime design

### 9.1. Hạ tầng dùng chung

Tạo module riêng thay vì nhốt gateway trong Chat hoặc Notification:

```text
Backend/src/realtime/
├── realtime.constants.ts
├── realtime.gateway.ts
├── realtime.module.ts
├── realtime.types.ts
└── realtime-auth.service.ts
```

Lợi ích:

- Notification Week 6 sử dụng ngay.
- Chat Week 7 tái sử dụng kết nối, JWT validation và user room.
- Tránh tạo hai socket connection và hai cơ chế xác thực khác nhau.

### 9.2. Socket namespace và room

- Namespace: `/realtime`.
- Room cá nhân: `user:{userId}`.
- Client không được gửi userId để tự join room.
- Sau khi verify JWT, server tự join room từ `payload.sub`.

### 9.3. Xác thực handshake

Client gửi:

```ts
io(`${API_ORIGIN}/realtime`, {
  auth: {
    token: accessToken,
  },
});
```

Server phải:

1. lấy token từ `socket.handshake.auth.token`;
2. verify bằng cùng JWT secret/config với REST auth;
3. kiểm tra payload có user id hợp lệ;
4. kiểm tra user còn tồn tại và active nếu hệ thống có trạng thái active;
5. gán `socket.data.userId`;
6. join `user:{userId}`;
7. reject connection nếu token thiếu/hết hạn/không hợp lệ.

Không log raw token.

### 9.4. Server events

```text
notification.created
notification.read
notification.read-all
```

Payload `notification.created` dùng cùng public DTO với REST list item.

Payload mark one:

```json
{
  "id": "notification-id",
  "isRead": true,
  "readAt": "2026-08-23T10:10:00.000Z"
}
```

Payload mark all:

```json
{
  "readAt": "2026-08-23T10:10:00.000Z"
}
```

Mark read vẫn thực hiện bằng REST. Server event chỉ giúp đồng bộ nhiều tab/thiết bị.

### 9.5. Không tạo client write event trong Week 6

Không cần:

```text
notification.create
notification.markRead
notification.joinUserRoom
```

Các mutation dùng REST để giữ validation, authorization và error contract thống nhất.

### 9.6. Reconnect

Khi socket reconnect:

1. cập nhật token mới nhất nếu access token đã refresh;
2. kết nối lại;
3. refetch page đầu notification;
4. refetch unread count;
5. merge theo `notification.id` để loại trùng.

### 9.7. Giới hạn Week 6

- Kiến trúc chạy tốt trên một backend instance.
- Khi deploy nhiều instance, cần Redis Socket.IO adapter hoặc managed realtime backplane.
- Redis adapter không phải điều kiện hoàn thành Week 6.

---

## 10. Ma trận tích hợp nghiệp vụ

Ma trận dưới đây là contract mục tiêu. Khi module tương ứng chưa được merge/hoàn thiện, phải để integration point rõ ràng và nối ngay khi service có mặt.

| Domain event | Người nhận | Type | Action | Resource |
|---|---|---|---|---|
| Company profile được duyệt | tài khoản công ty | `COMPANY` | `OPEN_COMPANY_PROFILE` | company profile id |
| Company profile bị từ chối | tài khoản công ty | `COMPANY` | `OPEN_COMPANY_PROFILE` | company profile id |
| Sinh viên nộp application | tài khoản công ty sở hữu internship | `APPLICATION` | `OPEN_APPLICATION` | application id |
| Application được accept | sinh viên nộp đơn | `APPLICATION` | `OPEN_APPLICATION` | application id |
| Application bị reject | sinh viên nộp đơn | `APPLICATION` | `OPEN_APPLICATION` | application id |
| Giảng viên được assign supervision | giảng viên mới | `SUPERVISION` | `OPEN_SUPERVISION` | supervision id |
| Sinh viên có giảng viên hướng dẫn | sinh viên | `SUPERVISION` | `OPEN_SUPERVISION` | supervision id |
| Supervision được reassign | giảng viên mới | `SUPERVISION` | `OPEN_SUPERVISION` | supervision id |
| Giảng viên cũ bị gỡ khỏi supervision | giảng viên cũ | `SUPERVISION` | `OPEN_SUPERVISION` | supervision id |
| Supervision bị hủy | sinh viên và giảng viên liên quan | `SUPERVISION` | `OPEN_SUPERVISION` | supervision id |
| Sinh viên nộp report | giảng viên active phụ trách | `REPORT` | `OPEN_REPORT` | report id |
| Report được approve | sinh viên | `REPORT` | `OPEN_REPORT` | report id |
| Report bị reject/request changes | sinh viên | `REPORT` | `OPEN_REPORT` | report id |
| Placement được complete | sinh viên, công ty, giảng viên active | `PLACEMENT` | `OPEN_PLACEMENT` | placement id |
| Placement bị cancel | sinh viên, công ty, giảng viên active | `PLACEMENT` | `OPEN_PLACEMENT` | placement id |
| Evaluation mới được tạo | sinh viên được đánh giá | `EVALUATION` | `OPEN_EVALUATION` | evaluation id |

### 10.1. Quy tắc chọn recipient

- Recipient luôn được resolve từ database relation.
- Không lấy recipient user id trực tiếp từ request nếu có thể suy ra từ entity.
- Loại bỏ recipient trùng nhau trước khi tạo nhiều notification.
- Không gửi cho tài khoản đã bị xóa.
- Nếu actor cũng nằm trong danh sách recipient, chỉ giữ self-notification khi nó thật sự có ý nghĩa nghiệp vụ.

### 10.2. Tránh notification trùng ý nghĩa

Ví dụ application được accept đồng thời sinh placement:

- Sinh viên chỉ cần notification “Đơn ứng tuyển đã được chấp nhận”.
- Không tạo thêm notification “Placement mới được tạo” trong cùng transition nếu hai notification cùng dẫn tới một kết quả.
- Khi placement về sau complete/cancel mới tạo notification riêng.

### 10.3. Tích hợp Evaluation với Người A

Contract Người B bàn giao:

```ts
await notifications.createInTransaction(tx, {
  userId: evaluatedStudentUserId,
  eventKey: `evaluation:${evaluationId}:created:${studentUserId}`,
  type: NotificationType.EVALUATION,
  action: NotificationAction.OPEN_EVALUATION,
  title: 'Bạn có đánh giá mới',
  content: 'Một đánh giá mới đã được cập nhật cho kỳ thực tập của bạn.',
  resourceId: evaluationId,
});
```

Không đưa toàn bộ nhận xét/điểm nhạy cảm vào content; người dùng mở trang Evaluation để xem chi tiết.

---

## 11. Authorization và bảo mật

### REST

- Tất cả notification route dùng JWT guard.
- Không dùng role guard vì mọi role đăng nhập đều có notification.
- Mọi Prisma query đều scope bằng `userId` từ JWT.
- Không nhận `userId` từ query/body cho user-facing API.
- Tài nguyên của user khác trả `404`, không trả `403` làm lộ sự tồn tại.
- Validate UUID/CUID theo id format hiện tại của dự án.
- Giới hạn `limit <= 50`.

### Socket.IO

- Verify JWT ở handshake.
- Room name được server tạo.
- Không có event cho client tự join room bất kỳ.
- CORS dùng cùng allowlist frontend với REST.
- Disconnect socket khi logout.
- Kết nối cũ phải reconnect khi token refresh nếu token handshake đã hết hạn.
- Không gửi metadata nhạy cảm qua event.

### Nội dung UI

- Render title/content dưới dạng text, không `dangerouslySetInnerHTML`.
- Không tin HTML đến từ backend.
- Action chỉ nhận enum đã biết; action lạ phải fallback an toàn, không redirect tùy ý.

---

## 12. Frontend architecture

### 12.1. Dependency

Thêm:

```text
socket.io-client
```

Version phải tương thích major version với Socket.IO server.

### 12.2. Cấu trúc đề xuất

```text
Frontend/src/notifications/
├── api.ts
├── navigation.ts
├── realtime.ts
├── types.ts
├── use-notifications.ts
└── NotificationsProvider.tsx

Frontend/src/components/Notifications/
├── NotificationCenter.tsx
├── NotificationItem.tsx
├── NotificationSkeleton.tsx
└── NotificationEmptyState.tsx
```

Điều chỉnh theo naming convention hiện có, nhưng giữ tách biệt:

- API transport;
- realtime transport;
- state management;
- presentation component.

### 12.3. Frontend types

```ts
type AppNotification = {
  id: string;
  type:
    | 'APPLICATION'
    | 'REPORT'
    | 'SUPERVISION'
    | 'PLACEMENT'
    | 'COMPANY'
    | 'EVALUATION'
    | 'SYSTEM';
  action:
    | 'NONE'
    | 'OPEN_APPLICATION'
    | 'OPEN_REPORT'
    | 'OPEN_SUPERVISION'
    | 'OPEN_PLACEMENT'
    | 'OPEN_COMPANY_PROFILE'
    | 'OPEN_EVALUATION';
  title: string;
  content: string;
  resourceId: string | null;
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
};
```

Không giữ type mock cũ có `message`, `read` nếu backend dùng `content`, `isRead`.

### 12.4. Notification state

Provider/hook quản lý:

```text
notifications
unreadCount
pagination
activeFilter
isInitialLoading
isLoadingMore
isMarkingAll
error
socketStatus
```

Operations:

```text
fetchNotifications
loadMore
refresh
markAsRead
markAllAsRead
handleRealtimeCreated
reconcileAfterReconnect
```

### 12.5. Merge strategy

- Dùng `id` làm khóa duy nhất.
- Realtime notification mới được prepend vào page đầu.
- Nếu id đã tồn tại thì update item, không thêm bản sao.
- Sau reconnect, REST response ghi đè dữ liệu stale.
- Unread count không được âm.
- Nếu event và REST response đến gần nhau, merge theo id thay vì tăng count mù quáng.

### 12.6. Auth lifecycle

- Chỉ fetch và connect socket khi đã có authenticated user.
- Logout:
  - disconnect socket;
  - clear notification state;
  - reset unread count;
  - không để notification của user cũ xuất hiện cho user mới.
- Token refresh:
  - cập nhật token dùng cho lần reconnect;
  - reconnect nếu cần;
  - reconcile bằng REST.

---

## 13. Notification Center UI/UX

### 13.1. Yêu cầu hiển thị

- Nút chuông trên navbar.
- Badge unread:
  - ẩn khi bằng 0;
  - hiển thị `1`–`99`;
  - hiển thị `99+` khi lớn hơn 99.
- Panel dạng dropdown trên desktop, drawer/full-width sheet hợp lý trên mobile.
- Header:
  - “Thông báo”;
  - unread count;
  - nút “Đánh dấu tất cả đã đọc”.
- Filter tối thiểu:
  - Tất cả;
  - Chưa đọc.
- Item:
  - icon theo type;
  - title;
  - content tối đa số dòng hợp lý;
  - thời gian tương đối;
  - unread dot/background;
  - trạng thái focus/hover rõ ràng.
- “Tải thêm” hoặc infinite loading có kiểm soát.

### 13.2. Trạng thái bắt buộc

- Initial loading: skeleton, không nháy empty state.
- Loading more: spinner nhỏ cuối list.
- Empty all: “Bạn chưa có thông báo nào”.
- Empty unread: “Bạn đã đọc tất cả thông báo”.
- Error: thông báo ngắn + nút thử lại.
- Offline/reconnecting: không xóa dữ liệu đang có; REST vẫn được dùng khi có mạng.

### 13.3. Tương tác item

Khi click notification:

1. optimistic mark read trên UI;
2. gọi REST mark read;
3. nếu lỗi thì rollback hoặc refetch;
4. điều hướng theo `action` và role;
5. truyền `resourceId` để trang đích có thể focus/mở chi tiết nếu hỗ trợ.

Nếu `action = NONE` hoặc resource không còn tồn tại:

- vẫn đánh dấu đã đọc;
- không crash;
- có thể chỉ đóng panel hoặc hiển thị toast nhẹ.

### 13.4. Action mapping

`navigation.ts` ánh xạ enum sang tab/route hiện có. Không lưu arbitrary URL từ backend.

Ví dụ định hướng:

| Action | Student | Company | Lecturer | Admin |
|---|---|---|---|---|
| `OPEN_APPLICATION` | applications | applicants/applications | fallback | application management |
| `OPEN_REPORT` | reports | fallback | review reports | report management nếu có |
| `OPEN_SUPERVISION` | placement/supervision | fallback | supervised placements | supervision management |
| `OPEN_PLACEMENT` | placement | placement management | supervised placements | placement management |
| `OPEN_COMPANY_PROFILE` | fallback | company profile | fallback | company approval |
| `OPEN_EVALUATION` | evaluations | company evaluations | lecturer evaluations | fallback |

Tên tab/route cuối cùng phải đối chiếu trực tiếp với navigation hiện tại khi triển khai.

### 13.5. Accessibility

- Nút chuông có `aria-label` chứa unread count.
- Panel có heading rõ ràng.
- Có thể thao tác bằng keyboard.
- Focus visible.
- Escape đóng panel.
- Không dùng màu làm tín hiệu duy nhất cho unread.
- Icon trang trí dùng `aria-hidden`.

---

## 14. Seed data

Seed bổ sung notification cho các tài khoản mẫu hiện có:

- ít nhất một notification unread và một notification read cho Student;
- ít nhất một notification cho Company;
- ít nhất một notification cho Lecturer;
- ít nhất một notification cho Admin nếu có use case phù hợp.

Mỗi seed row có:

- `eventKey` cố định và duy nhất;
- type/action hợp lệ;
- resource id chỉ dùng nếu resource seed tương ứng tồn tại;
- `readAt` nhất quán với `isRead`.

Quy tắc:

```text
isRead = false => readAt = null
isRead = true  => readAt != null
```

Seed phải idempotent bằng `upsert` hoặc cleanup có scope chính xác. Seed không emit realtime event.

---

## 15. Danh sách file dự kiến

### Backend tạo mới

```text
Backend/src/notifications/dto/get-notifications-query.dto.ts
Backend/src/notifications/notification.constants.ts
Backend/src/notifications/notification.mapper.ts
Backend/src/notifications/notification.templates.ts
Backend/src/notifications/notification.types.ts
Backend/src/notifications/notifications.controller.ts
Backend/src/notifications/notifications.service.ts
Backend/src/realtime/realtime.constants.ts
Backend/src/realtime/realtime.gateway.ts
Backend/src/realtime/realtime.module.ts
Backend/src/realtime/realtime.types.ts
Backend/src/realtime/realtime-auth.service.ts
```

### Backend chỉnh sửa

```text
Backend/prisma/schema.prisma
Backend/prisma/seed.ts hoặc seed structure hiện có
Backend/src/app.module.ts
Backend/src/notifications/notifications.module.ts
Backend/src/companies/...service.ts
Backend/src/applications/...service.ts
Backend/src/reports/...service.ts
Backend/src/supervisions/...service.ts
Backend/src/placements/...service.ts
Backend/package.json nếu dependency/config cần thay đổi
Backend/.env.example nếu thêm realtime CORS/config
```

Chỉ sửa domain service tại đúng nơi transition xảy ra; không rải notification logic vào controller.

### Frontend tạo mới hoặc tách mới

```text
Frontend/src/notifications/api.ts
Frontend/src/notifications/navigation.ts
Frontend/src/notifications/realtime.ts
Frontend/src/notifications/types.ts
Frontend/src/notifications/use-notifications.ts
Frontend/src/notifications/NotificationsProvider.tsx
Frontend/src/components/Notifications/NotificationItem.tsx
Frontend/src/components/Notifications/NotificationSkeleton.tsx
Frontend/src/components/Notifications/NotificationEmptyState.tsx
```

### Frontend chỉnh sửa

```text
Frontend/src/components/Notifications/NotificationCenter.tsx
Frontend/src/App.tsx
Frontend/src/types.ts nếu còn shared notification type
Frontend/package.json
Frontend/.env.example nếu cần VITE socket/API origin
```

### File tuyệt đối không nằm trong thay đổi Week 6 Person B

```text
Backend/src/files/**
Frontend/src/**/FileManagement*
Frontend/src/**/FileUpload*
Supabase storage policy/migration liên quan file
```

---

## 16. Thứ tự triển khai

### Phase 1 — Schema và REST core

1. Chốt enum/type/action.
2. Cập nhật Prisma schema.
3. Tạo migration.
4. Generate Prisma client.
5. Viết DTO, mapper, service và controller.
6. Export `NotificationsService` từ module.
7. Đăng ký module trong app.
8. Build/lint backend.

Kết quả phase:

- Có thể list/count/mark read/mark all bằng REST.
- Ownership isolation hoạt động.
- Chưa phụ thuộc Socket.IO.

### Phase 2 — Realtime infrastructure

1. Tạo RealtimeModule/Gateway.
2. Dùng chung JWT config với REST.
3. Authenticate handshake.
4. Join user room từ JWT.
5. Tạo publisher API.
6. Emit notification events.
7. Kiểm tra invalid/expired token bị reject.

Kết quả phase:

- Có thể phát event tới đúng user.
- Không thể giả mạo room của user khác.

### Phase 3 — Business transitions

Ưu tiên theo module đã hoàn thiện:

1. Company approve/reject.
2. Supervision assign/reassign/cancel.
3. Placement complete/cancel.
4. Application submit/review.
5. Report submit/review.
6. Evaluation integration contract với Người A.

Mỗi integration phải:

- resolve recipient từ database;
- tạo notification trong transaction;
- emit sau commit;
- có eventKey;
- không làm thay đổi response contract không cần thiết.

### Phase 4 — Frontend data layer

1. Cài `socket.io-client`.
2. Tạo type/API module.
3. Tạo NotificationsProvider/hook.
4. Kết nối auth lifecycle.
5. Kết nối socket.
6. Reconcile khi reconnect.
7. Xóa `INITIAL_NOTIFICATIONS` và local-only handlers.

### Phase 5 — Frontend UI

1. Hoàn thiện NotificationCenter.
2. Kết nối unread badge.
3. Loading/error/empty states.
4. Mark one/mark all.
5. Action navigation.
6. Responsive và accessibility.
7. Kiểm tra trực quan cho mọi role.

### Phase 6 — Verification và polish

1. Seed notification.
2. Chạy migration/seed trên database test phù hợp.
3. Lint/build backend.
4. Lint/build frontend.
5. Curl toàn bộ REST cases.
6. Trigger domain transitions và kiểm tra notification rows.
7. Kiểm tra realtime bằng Socket.IO client/browser.
8. Kiểm tra reconnect/logout/multi-tab.
9. Kiểm tra không có File Management trong diff.

---

## 17. Kế hoạch kiểm thử

Theo cách làm của dự án, phần chức năng sẽ ưu tiên integration test thủ công bằng curl thay cho việc bắt buộc viết unit test trong Week 6.

### 17.1. REST bằng curl

Chuẩn bị token cho:

- Student A;
- Student B;
- Company;
- Lecturer;
- Admin.

Cases bắt buộc:

1. Không token → `401`.
2. Token hợp lệ → list chỉ trả notification của mình.
3. `page=0` → `400`.
4. `limit=51` → `400`.
5. `isRead` sai format → `400`.
6. `type` không thuộc enum → `400`.
7. unread count khớp số row unread.
8. mark own unread → `isRead=true`, `readAt` có giá trị.
9. mark lại notification đã read → thành công, `readAt` không bị đổi.
10. mark notification của user khác → `404`.
11. mark id không tồn tại → `404`.
12. mark all chỉ thay đổi notification của user hiện tại.
13. mark all lần hai → `updatedCount=0`.
14. list filter read/unread trả đúng.
15. pagination và thứ tự newest-first đúng.

### 17.2. Business transition cases

Với mỗi transition:

1. Gọi endpoint nghiệp vụ bằng curl.
2. Xác nhận state entity thay đổi đúng.
3. Login/lấy token recipient.
4. GET notification list.
5. Xác nhận đúng:
   - recipient;
   - type;
   - action;
   - resourceId;
   - title/content;
   - unread count.
6. Xác nhận actor/user không liên quan không nhận notification.
7. Gọi lại request không hợp lệ hoặc idempotent và xác nhận không sinh bản trùng.

### 17.3. Transaction failure

Tạo tình huống transition bị reject/rollback:

- invalid current status;
- resource không tồn tại;
- conflict/reassignment không hợp lệ.

Xác nhận:

- business state không đổi;
- audit log không tạo sai;
- notification không được lưu;
- socket không phát event.

### 17.4. Realtime

`curl` không kiểm thử đầy đủ protocol Socket.IO. Dùng browser frontend hoặc một script/client Socket.IO tối thiểu để kiểm tra:

1. token hợp lệ connect được;
2. token thiếu/sai/hết hạn bị từ chối;
3. user A không nhận event của user B;
4. notification mới xuất hiện không cần refresh;
5. badge tăng đúng một lần;
6. multi-tab nhận event mark read;
7. mất kết nối rồi reconnect sẽ refetch và không mất event;
8. logout disconnect socket và clear state.

### 17.5. Frontend visual QA

Kiểm tra desktop và mobile:

- panel không tràn viewport;
- content dài không phá layout;
- badge không che icon;
- skeleton/empty/error hiển thị đúng;
- scroll/load more hoạt động;
- click outside/Escape đóng panel;
- keyboard focus rõ;
- dark/light theme nếu hệ thống hỗ trợ;
- mọi role không gặp action/tab không tồn tại.

---

## 18. Error handling và logging

### REST errors

- `400`: query/id validation sai.
- `401`: chưa đăng nhập/token không hợp lệ.
- `404`: notification không tồn tại hoặc không thuộc user.
- `500`: lỗi ngoài dự kiến; không trả raw Prisma error.

### Socket errors

- Authentication failure trả connect error chung, không lộ chi tiết secret.
- Emit failure log warning với:
  - event name;
  - notification id;
  - recipient user id nếu policy log cho phép.
- Không log:
  - JWT;
  - refresh token;
  - toàn bộ notification metadata nhạy cảm.

### Frontend errors

- Fetch lỗi không xóa dữ liệu notification cũ.
- Mark read lỗi phải rollback/refetch.
- Realtime lỗi không khóa Notification Center; REST vẫn hoạt động.
- Action không nhận diện phải fail safely.

---

## 19. Hiệu năng

- Có composite index `(userId, isRead, createdAt)` cho unread list/count.
- Có index `(userId, createdAt)` cho all list.
- Giới hạn page size tối đa 50.
- `select` đúng field cần trả, không include toàn bộ User.
- `markAllAsRead` dùng một `updateMany`, không loop từng row.
- Emit theo user room, không broadcast toàn hệ thống.
- Frontend giữ một socket connection cho mỗi app session, không tạo lại mỗi render.
- Debounce/refetch hợp lý khi nhiều event đến liên tiếp.
- Merge theo id để tránh danh sách phình do duplicate event.

---

## 20. Definition of Done

Week 6 Person B hoàn thành khi tất cả điều kiện sau đạt:

### Backend

- [ ] Prisma schema và migration notification hoàn chỉnh.
- [ ] Có type, action, resourceId, metadata và eventKey.
- [ ] REST list notification hoạt động và có pagination/filter.
- [ ] REST unread count hoạt động.
- [ ] Mark one idempotent và đúng ownership.
- [ ] Mark all chỉ tác động user hiện tại.
- [ ] Không có public create notification endpoint.
- [ ] Notification được tạo trong transaction của state transition.
- [ ] Socket emit chỉ sau commit.
- [ ] Các transition trong ma trận đã được nối ở module hiện có.
- [ ] Contract Evaluation đã bàn giao để Người A tích hợp.
- [ ] JWT Socket.IO authentication và user room an toàn.
- [ ] Backend lint/build thành công.

### Frontend

- [ ] Không còn `INITIAL_NOTIFICATIONS` hoặc notification mock runtime.
- [ ] NotificationCenter lấy dữ liệu từ REST.
- [ ] Navbar badge lấy unread count thật.
- [ ] Notification mới xuất hiện realtime.
- [ ] Mark one/mark all hoạt động và đồng bộ backend.
- [ ] Reconnect refetch và loại duplicate.
- [ ] Logout clear state/disconnect socket.
- [ ] Action điều hướng đúng theo role.
- [ ] Có loading, empty, error và retry states.
- [ ] UI responsive, keyboard-accessible và không lỗi hiển thị.
- [ ] Frontend lint/build thành công.

### Verification

- [ ] Curl REST cases đều pass.
- [ ] Cross-user access không làm lộ notification.
- [ ] Business transition tạo đúng notification và recipient.
- [ ] Transaction rollback không để lại notification.
- [ ] Realtime đúng user, không broadcast nhầm.
- [ ] Seed chạy lại không tạo duplicate.
- [ ] Không có thay đổi File Management trong phạm vi Week 6 Person B.

---

## 21. Thứ tự bàn giao đề xuất

Nếu triển khai từng đợt như các tuần trước:

1. **Backend core + migration + business integration**
   - Chưa cần curl/frontend cho đến khi được yêu cầu.
2. **Curl verification**
   - Kiểm tra REST và state transitions toàn diện.
3. **Realtime verification**
   - Kiểm tra Socket.IO bằng client phù hợp, vì curl không đại diện đầy đủ cho protocol.
4. **Frontend implementation**
   - Data layer, socket lifecycle, notification center và badge.
5. **Frontend visual QA**
   - Browser check cho Student, Company, Lecturer và Admin.

Plan này cho phép thực thi tuần 6 độc lập với File Management và vẫn tạo nền realtime đúng định hướng để tiếp tục Chat ở tuần 7.
