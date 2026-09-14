# Kế hoạch hoàn thiện xác minh doanh nghiệp

## 1. Mục tiêu

Xây dựng luồng xác minh doanh nghiệp đủ rõ ràng và đáng tin cậy cho CareerBridge mà không phụ thuộc OCR hay dịch vụ xác minh bên thứ ba.

Hệ thống phải bảo đảm:

- Xác thực email chỉ chứng minh quyền sử dụng email, không đồng nghĩa doanh nghiệp đã được xác minh.
- Doanh nghiệp cung cấp mã số doanh nghiệp và giấy đăng ký doanh nghiệp để nhà trường đối chiếu thủ công.
- Chỉ doanh nghiệp đã được nhà trường xác minh mới được đăng tin, xử lý ứng viên và thực hiện nghiệp vụ tuyển dụng.
- Tài liệu đăng ký doanh nghiệp là dữ liệu riêng tư, chỉ doanh nghiệp sở hữu hồ sơ và quản trị viên được truy cập.
- Mọi quyết định duyệt, yêu cầu bổ sung hoặc đình chỉ đều có người thực hiện, thời điểm và lịch sử kiểm toán.

## 2. Phạm vi nghiệp vụ đã chốt

### Thông tin bắt buộc

- Tên pháp lý của doanh nghiệp (`companyName`).
- Mã số doanh nghiệp/mã số đăng ký (`businessRegistrationNumber`).
- Địa chỉ đăng ký (`address`).
- Người liên hệ (`contactPersonName`).
- Số điện thoại liên hệ (`contactPhone`).
- Email liên hệ (`contactEmail`).
- Giấy đăng ký doanh nghiệp (`registrationDocumentFileId`).

### Thông tin giới thiệu không dùng để xác minh pháp lý

- Slogan.
- Mô tả doanh nghiệp.
- Lĩnh vực hoạt động.
- Website.
- Logo.

### Cách xác minh

Quản trị viên đối chiếu tên pháp lý, mã số doanh nghiệp và địa chỉ trên hồ sơ với giấy đăng ký doanh nghiệp đã tải lên. CareerBridge không tuyên bố đã xác minh trực tiếp với cơ quan nhà nước.

Huy hiệu công khai phải dùng nội dung **“Đã được nhà trường xác minh hồ sơ”**.

## 3. Trạng thái hồ sơ

Mở rộng `CompanyStatus` thành:

| Trạng thái | Ý nghĩa | Quyền doanh nghiệp |
| --- | --- | --- |
| `DRAFT` | Hồ sơ đang soạn, chưa gửi | Chỉ sửa hồ sơ và tải tài liệu |
| `PENDING` | Đã gửi, đang chờ nhà trường kiểm tra | Xem hồ sơ và tiến độ; không sửa thông tin đang được xét |
| `APPROVED` | Đã được nhà trường xác minh | Sử dụng đầy đủ chức năng tuyển dụng |
| `REJECTED` | Cần sửa hoặc bổ sung | Xem lý do, sửa hồ sơ và gửi lại |
| `SUSPENDED` | Quyền doanh nghiệp bị tạm đình chỉ | Không tạo tin mới, không nhận/xử lý ứng viên mới |

Luồng trạng thái:

```text
DRAFT -> PENDING -> APPROVED
                  -> REJECTED -> PENDING
APPROVED -> SUSPENDED
```

Không cho phép doanh nghiệp tự thay đổi trạng thái bằng API cập nhật hồ sơ.

## 4. Thay đổi dữ liệu

### `CompanyProfile`

Bổ sung:

```prisma
businessRegistrationNumber String?   @unique
contactPersonName           String?
contactPhone                String?
registrationDocumentFileId  String?   @unique
submittedAt                 DateTime?
suspensionReason            String?
suspendedAt                 DateTime?
```

Quan hệ tài liệu:

```prisma
registrationDocument File? @relation(
  "CompanyRegistrationDocument",
  fields: [registrationDocumentFileId],
  references: [id],
  onDelete: SetNull
)
```

### `FileType`

Bổ sung:

```prisma
COMPANY_REGISTRATION
```

Không dùng chung `CERTIFICATE`, vì giấy đăng ký doanh nghiệp cần quy tắc truy cập, dung lượng và mục đích nghiệp vụ riêng.

### Chuẩn hóa mã số doanh nghiệp

- Loại bỏ khoảng trắng ở đầu/cuối.
- Chuyển chữ cái thành chữ hoa nếu mã có chữ.
- Chỉ cho phép chữ, số và dấu gạch nối.
- Giới hạn 8–30 ký tự để không khóa hệ thống vào một định dạng pháp lý quá hẹp.
- Database unique là lớp bảo vệ cuối cùng chống trùng mã.

### Migration và dữ liệu cũ

- Tạo migration mới, không sửa migration cũ.
- Chuyển hồ sơ `PENDING` cũ về `DRAFT` nếu chưa có mã số hoặc tài liệu.
- Hồ sơ `APPROVED` cũ có thể chuyển về `DRAFT` trong môi trường phát triển vì dữ liệu hiện tại có thể tạo lại.
- Chạy `npx prisma generate` sau khi cập nhật schema.
- Local dùng `npx prisma migrate dev --name add_company_verification_workflow`; môi trường triển khai dùng `npm run migrate:deploy`.

## 5. Phase 1 — Làm chắc xác thực tài khoản

### Backend

- Không trả `verificationLink`, token xác thực, access token hoặc refresh token trong response đăng ký.
- Không đặt refresh-token cookie khi tài khoản chưa xác thực email.
- Response đăng ký chỉ trả email đã nhận yêu cầu và thời hạn của liên kết.
- Giữ token xác thực email một lần, có thời hạn và xử lý idempotent.
- Bổ sung endpoint gửi lại email xác thực có rate limit.
- Chỉ tạo phiên đăng nhập sau khi email đã được xác thực và `User.status = ACTIVE`.
- Không ghi token xác thực đầy đủ vào log.

### Frontend

- Sau đăng ký hiển thị màn hình “Kiểm tra email của bạn”.
- Có nút gửi lại email với thời gian chờ.
- Không lưu session giả cho tài khoản chưa xác thực.

### Điều kiện hoàn thành

- Không thể lấy token xác thực từ response hoặc cookie đăng ký.
- Tài khoản chưa xác thực không đăng nhập và không gọi API được bảo vệ.
- Gửi lại email bị giới hạn tần suất.

## 6. Phase 2 — Hồ sơ doanh nghiệp và tải giấy đăng ký

### Backend

- Cập nhật Prisma schema và tạo migration.
- Tạo DTO riêng cho hồ sơ nháp và thao tác gửi xác minh.
- Khi tạo hồ sơ lần đầu, trạng thái mặc định là `DRAFT`.
- `PATCH /companies/me` chỉ cập nhật dữ liệu, không tự chuyển `PENDING`.
- Thêm `POST /companies/me/submit-verification`.
- Khi gửi xác minh, backend kiểm tra đầy đủ các trường bắt buộc.
- Kiểm tra file thuộc đúng tài khoản, đúng loại `COMPANY_REGISTRATION`, đúng MIME và còn tồn tại.
- Chặn cập nhật hồ sơ khi đang `PENDING`.
- Với hồ sơ `APPROVED`, cho sửa thông tin giới thiệu; khóa tên pháp lý, mã số và giấy đăng ký. Thay đổi các trường pháp lý sẽ được xử lý bằng luồng xác minh lại ở phiên bản sau.

### Upload tài liệu

- Cho phép PDF, PNG và JPEG.
- Dung lượng tối đa đề xuất: 10 MB.
- Signed upload/download URL có thời hạn ngắn.
- Chỉ chủ sở hữu và quản trị viên được tải xuống.
- Không trả `storageKey` hoặc URL lâu dài trong API công khai.

### API dự kiến

```text
GET    /companies/me
POST   /companies/me
PATCH  /companies/me
POST   /companies/me/submit-verification
POST   /files/upload-url                 type=COMPANY_REGISTRATION
GET    /files/:id/download-url
```

### Điều kiện hoàn thành

- Không thể gửi hồ sơ thiếu mã số hoặc giấy đăng ký.
- Không thể dùng file của tài khoản khác.
- Không thể tạo hai hồ sơ có cùng mã số doanh nghiệp.
- Hồ sơ chỉ chuyển `DRAFT/REJECTED -> PENDING` qua endpoint gửi xác minh.

## 7. Phase 3 — Thẩm định của quản trị viên

### Backend

- Bổ sung `GET /companies/:id` cho quản trị viên xem chi tiết và tài liệu.
- Danh sách hỗ trợ lọc theo trạng thái, tìm theo tên, mã số và email tài khoản.
- Response quản trị bao gồm email tài khoản, `emailVerifiedAt`, thông tin người duyệt và thời điểm duyệt.
- Duyệt/từ chối chỉ áp dụng với hồ sơ `PENDING`.
- Dùng conditional update (`updateMany` với `id + status=PENDING`) hoặc transaction isolation phù hợp để hai quản trị viên không thể ghi đè quyết định của nhau.
- Từ chối bắt buộc lý do rõ ràng.
- Thêm endpoint đình chỉ hồ sơ đã duyệt với lý do bắt buộc.
- Mọi thao tác tạo audit log và gửi thông báo.

### API dự kiến

```text
GET  /companies?status=PENDING&search=...
GET  /companies/:id
POST /companies/:id/approve
POST /companies/:id/reject
POST /companies/:id/suspend
```

### Giao diện quản trị

- Trang danh sách có tab: Chờ xác minh, Đã xác minh, Cần bổ sung, Đình chỉ.
- Không duyệt trực tiếp từ thẻ tóm tắt.
- Mở trang/ngăn chi tiết trước khi ra quyết định.
- Hiển thị:
  - Email tài khoản và trạng thái xác thực email.
  - Tên pháp lý, mã số, địa chỉ.
  - Người liên hệ, điện thoại, email.
  - Giấy đăng ký doanh nghiệp với nút xem/tải.
  - Ngày gửi, người duyệt, ngày duyệt và lịch sử.
- Danh sách kiểm tra trước khi bật nút duyệt:
  - Tên pháp lý trùng tài liệu.
  - Mã số trùng tài liệu.
  - Địa chỉ/thông tin liên hệ hợp lý.
- Nút duyệt có hộp xác nhận cuối cùng.
- Từ chối/yêu cầu bổ sung bắt buộc nhập lý do.

### Điều kiện hoàn thành

- Quản trị viên không thể duyệt khi chưa mở chi tiết và xác nhận các tiêu chí.
- Hai yêu cầu duyệt đồng thời chỉ có một yêu cầu thành công.
- Doanh nghiệp nhận được thông báo và lý do cụ thể.

## 8. Phase 4 — Giao diện doanh nghiệp và phân quyền

### Giao diện hồ sơ

Tách thành ba bước:

1. Thông tin pháp lý và liên hệ.
2. Tải giấy đăng ký doanh nghiệp.
3. Kiểm tra lại và gửi xác minh.

Hiển thị trạng thái bằng ngôn ngữ rõ ràng:

- “Hồ sơ đang soạn”.
- “Nhà trường đang kiểm tra hồ sơ”.
- “Cần bổ sung thông tin”.
- “Đã được nhà trường xác minh hồ sơ”.
- “Quyền doanh nghiệp đang bị tạm đình chỉ”.

### Khóa chức năng

- `DRAFT`, `PENDING`, `REJECTED`: chỉ mở Hồ sơ doanh nghiệp và trang theo dõi xác minh.
- `APPROVED`: mở đăng tin, ứng viên, hội thoại và đánh giá.
- `SUSPENDED`: giữ quyền xem dữ liệu cũ nhưng khóa nghiệp vụ tạo/cập nhật mới.
- Menu bị khóa phải có lý do và nút đi đến hồ sơ; không để người dùng bấm rồi mới nhận lỗi 403.
- Frontend chỉ hỗ trợ trải nghiệm; backend vẫn là lớp phân quyền bắt buộc.

### Trang công khai

- Chỉ hiển thị huy hiệu khi `status = APPROVED`.
- Nội dung huy hiệu: “Đã được nhà trường xác minh hồ sơ”.
- Có thể hiển thị ngày xác minh, nhưng không công khai tài liệu hoặc mã file.

### Điều kiện hoàn thành

- Doanh nghiệp chưa được duyệt hiểu chính xác bước tiếp theo.
- Không thấy nút đăng tin hoặc xử lý ứng viên khi chưa đủ quyền.
- Không còn thông báo kỹ thuật tiếng Anh cho các trạng thái xác minh.

## 9. Phase 5 — Củng cố quyền và vòng đời dữ liệu

- Rà toàn bộ mutation của `internships`, `internship skills`, `applications`, `evaluations` và chat để yêu cầu doanh nghiệp `APPROVED`.
- Khi `SUSPENDED`, ẩn tin đang `OPEN` khỏi danh sách công khai và chặn đơn ứng tuyển mới.
- Không xóa các đơn, hồ sơ thực tập, báo cáo hoặc đánh giá đã có khi đình chỉ doanh nghiệp.
- Quản trị viên xử lý thủ công các hồ sơ thực tập đang diễn ra nếu doanh nghiệp bị đình chỉ.
- Tách select công khai và select riêng tư để không vô tình trả mã số/tài liệu cho sinh viên.
- Audit metadata không chứa signed URL hoặc nội dung file.

## 10. Phase 6 — Kiểm thử và nghiệm thu

### Unit/integration test backend

- Đăng ký không trả token/link xác thực.
- Token email hết hạn, dùng một lần và gọi lặp không gây lỗi 500.
- Tạo hồ sơ ở trạng thái `DRAFT`.
- Gửi thiếu trường bắt buộc trả 400 với mã lỗi ổn định.
- File sai loại/sai chủ sở hữu trả 403 hoặc 400.
- Mã số trùng trả 409.
- Chỉ `DRAFT/REJECTED` được gửi xác minh.
- Chỉ `PENDING` được duyệt/từ chối.
- Hai quản trị viên duyệt đồng thời không ghi đè nhau.
- Doanh nghiệp chưa duyệt không thể thực hiện mutation tuyển dụng.
- Doanh nghiệp đã duyệt có thể thực hiện đúng quyền.
- Tài liệu không thể tải bởi sinh viên, giảng viên hoặc doanh nghiệp khác.
- Đình chỉ không xóa lịch sử nghiệp vụ.

### Kiểm thử curl

1. Đăng ký doanh nghiệp và xác thực email.
2. Tạo hồ sơ nháp.
3. Thử gửi thiếu mã số/tài liệu và xác nhận 400.
4. Xin signed upload URL, tải PDF mẫu và gắn file vào hồ sơ.
5. Gửi xác minh và xác nhận trạng thái `PENDING`.
6. Thử đăng tin trước khi duyệt và xác nhận 403.
7. Quản trị viên tải tài liệu, từ chối với lý do.
8. Doanh nghiệp sửa và gửi lại.
9. Quản trị viên duyệt.
10. Doanh nghiệp đăng tin thành công.
11. Tài khoản không liên quan thử tải tài liệu và xác nhận 403.

### Kiểm thử frontend

- TypeScript `npm run lint`.
- Production build `npm run build`.
- Kiểm tra thủ công responsive cho form ba bước và trang thẩm định.
- Kiểm tra trạng thái tải, lỗi upload, gửi lặp, nút đang xử lý và tải lại trang.

## 11. Thứ tự triển khai

1. Phase 1: đóng lỗ hổng xác thực email.
2. Phase 2: schema, migration, upload và API gửi hồ sơ.
3. Phase 3: API và giao diện thẩm định quản trị viên.
4. Phase 4: onboarding và khóa quyền trên frontend doanh nghiệp.
5. Phase 5: rà quyền toàn hệ thống và trạng thái đình chỉ.
6. Phase 6: test tự động, curl, cập nhật tài liệu.

Không triển khai frontend trước khi API và trạng thái nghiệp vụ của Phase 2–3 ổn định.

## 12. Tiêu chí hoàn thành toàn bộ tính năng

- Không thể tự xác thực email bằng dữ liệu trả về từ endpoint đăng ký.
- Một mã số doanh nghiệp chỉ thuộc một hồ sơ.
- Hồ sơ không có giấy đăng ký doanh nghiệp không thể được gửi duyệt.
- Quản trị viên xem được tài liệu và căn cứ trước khi duyệt.
- Quyết định duyệt có người duyệt, thời điểm và audit log.
- Doanh nghiệp chưa duyệt không thể thực hiện nghiệp vụ tuyển dụng ở cả frontend và backend.
- Sinh viên chỉ thấy tin từ doanh nghiệp đang `APPROVED`.
- Tài liệu pháp lý không xuất hiện trong API công khai.
- Huy hiệu hiển thị đúng phạm vi xác minh của nhà trường.
- Toàn bộ test backend liên quan, type-check và build frontend đều đạt.

## 13. Ngoài phạm vi hiện tại

- OCR tự đọc giấy đăng ký doanh nghiệp.
- Kết nối cơ sở dữ liệu doanh nghiệp của bên thứ ba.
- Ký số hoặc xác thực danh tính người đại diện.
- Tự động đánh giá rủi ro/gian lận bằng AI.
- Luồng nhiều chi nhánh hoặc nhiều người quản trị cho cùng doanh nghiệp.
- Phiên bản hóa đầy đủ hồ sơ pháp lý sau khi doanh nghiệp đã được duyệt.

Các mục này chỉ nên bổ sung sau khi luồng xác minh thủ công hoạt động ổn định.
