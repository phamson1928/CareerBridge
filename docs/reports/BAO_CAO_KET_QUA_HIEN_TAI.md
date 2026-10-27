# BÁO CÁO SƠ BỘ KẾT QUẢ HIỆN TẠI CỦA HỆ THỐNG

## 1. Thông tin chung

- **Tên đề tài:** CareerBridge – Hệ thống hỗ trợ kết nối sinh viên và doanh nghiệp trong tìm kiếm, tuyển chọn và quản lý thực tập.
- **Thành viên thực hiện:**
  - [Tên thành viên 1 – Người A]
  - [Tên thành viên 2 – Người B]
- **Giảng viên hướng dẫn:** [Điền tên giảng viên]
- **Thời gian thực hiện:** [Điền thời gian thực hiện]
- **Giai đoạn báo cáo:** Kết quả hiện tại, sau giai đoạn Week 7 và các phần hoàn thiện bổ sung.

### Mục tiêu

Xây dựng nền tảng web giúp sinh viên hoàn thiện hồ sơ, tìm kiếm và ứng tuyển vị trí thực tập; giúp doanh nghiệp đăng tuyển, quản lý ứng viên; đồng thời hỗ trợ nhà trường quản lý việc phân công giảng viên, theo dõi và đánh giá quá trình thực tập.

Trong quá trình triển khai, hệ thống được bổ sung thêm tính năng **AI Job Recommendation** để hỗ trợ sinh viên tìm các vị trí phù hợp hơn. Đây là tính năng mở rộng so với kế hoạch ban đầu.

---

## 2. Tổng quan hệ thống

CareerBridge giải quyết quy trình đang bị phân tán giữa sinh viên, doanh nghiệp và nhà trường. Các bên có thể sử dụng chung một hệ thống để quản lý từ hồ sơ, tin tuyển dụng, ứng tuyển, placement, báo cáo tuần đến đánh giá cuối kỳ.

| Đối tượng | Chức năng chính |
| --- | --- |
| **Sinh viên** | Quản lý hồ sơ, CV, dự án, kỹ năng; tìm kiếm/lọc vị trí; nhận AI gợi ý; ứng tuyển; theo dõi placement; nộp báo cáo và xem đánh giá. |
| **Doanh nghiệp** | Tạo hồ sơ doanh nghiệp; gửi giấy tờ xác minh; đăng và quản lý tin tuyển dụng; xem/xử lý ứng viên; trao đổi với sinh viên; đánh giá thực tập sinh. |
| **Giảng viên** | Xem sinh viên được phân công; theo dõi placement; xem, phản hồi và duyệt báo cáo tuần; thực hiện đánh giá học vụ. |
| **Admin/Nhà trường** | Quản lý người dùng, doanh nghiệp, đợt thực tập, tin tuyển dụng, kỹ năng; xác minh doanh nghiệp; phân công giảng viên; theo dõi audit log. |

### Luồng tổng quát

```text
Sinh viên hoàn thiện hồ sơ
          ↓
Tìm kiếm hoặc nhận AI gợi ý vị trí
          ↓
Nộp đơn ứng tuyển
          ↓
Doanh nghiệp xem xét và chấp nhận
          ↓
Tạo Internship Placement
          ↓
Admin phân công giảng viên
          ↓
Báo cáo tuần – phản hồi – đánh giá
```

---

## 3. Công nghệ và kiến trúc hệ thống

### Công nghệ sử dụng

**Frontend**

- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- Socket.IO Client

**Backend**

- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT, Passport và refresh token
- class-validator/class-transformer
- Socket.IO

**Lưu trữ tệp**

- Supabase Object Storage thông qua signed upload/download URL.
- Database chỉ lưu metadata và `storageKey`, không lưu URL công khai cố định.

**AI**

- Google Gemini SDK được tích hợp ở backend.
- AI chỉ tạo phần giải thích cho kết quả đã được backend xếp hạng.
- API key chỉ nằm ở backend, không gửi xuống frontend.

**Môi trường hiện tại**

- Frontend phát triển với Vite.
- Backend chạy bằng NestJS tại local.
- PostgreSQL dùng database môi trường test/development.
- Migration và Prisma Client được quản lý trong thư mục `Backend/prisma`.

### Kiến trúc tổng quan

```text
User
  ↓
React + TypeScript Frontend
  ↓ REST API / Socket.IO
NestJS Backend
  ├── Authentication & RBAC
  ├── Business Modules
  ├── Recommendation Engine
  ├── Notification & Realtime
  └── File Access Policy
  ↓ Prisma ORM
PostgreSQL

Backend ─────→ Object Storage
Backend ─────→ Gemini API (tùy chọn, chỉ explanation AI)
```

---

## 4. Các chức năng đã hoàn thành

### 4.1. Authentication và Authorization

- Đăng ký tài khoản cho sinh viên và doanh nghiệp.
- Đăng nhập, đăng xuất và khôi phục phiên bằng refresh token HttpOnly.
- Xác thực email bằng verification token có thời hạn và dùng một lần.
- Gửi lại email xác thực với giới hạn tần suất.
- Quên mật khẩu và đặt lại mật khẩu bằng reset token lưu an toàn.
- JWT access token cho các request cần đăng nhập.
- Phân quyền theo vai trò: `STUDENT`, `COMPANY`, `LECTURER`, `ADMIN`.
- Chặn tài khoản chưa xác thực, bị vô hiệu hóa hoặc bị cấm truy cập API bảo vệ.
- Không trả access token, refresh token hoặc verification link trong response đăng ký.

### 4.2. Chức năng sinh viên

- Tạo và cập nhật hồ sơ cá nhân.
- Quản lý mã sinh viên, ngành học, GPA, số điện thoại và giới thiệu bản thân.
- Quản lý nhiều dự án cá nhân, repository và demo URL.
- Upload CV riêng tư và cấp quyền tải thông qua signed URL.
- Quản lý danh sách kỹ năng và mức độ kỹ năng.
- Lưu mong muốn công việc: vị trí, địa điểm và hình thức làm việc.
- Tìm kiếm vị trí thực tập theo từ khóa.
- Lọc theo nhiều kỹ năng cùng lúc.
- Xem chi tiết vị trí, số lượng còn lại, địa điểm, hình thức làm việc và thời gian dự kiến.
- Nộp, theo dõi và rút đơn ứng tuyển.
- Xem placement, báo cáo, đánh giá và thông báo liên quan.

### 4.3. Chức năng doanh nghiệp

- Tạo và cập nhật hồ sơ doanh nghiệp.
- Khai báo tên pháp lý, mã số doanh nghiệp, địa chỉ, người liên hệ, số điện thoại và email liên hệ.
- Upload giấy đăng ký doanh nghiệp ở chế độ riêng tư.
- Gửi hồ sơ để nhà trường kiểm tra thủ công.
- Theo dõi các trạng thái: `DRAFT`, `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`.
- Chỉ doanh nghiệp đã được xác minh mới có quyền đăng tin và xử lý nghiệp vụ tuyển dụng.
- Quản lý thông tin giới thiệu như lĩnh vực, website, logo và mô tả.
- Tạo, chỉnh sửa, đóng hoặc hủy tin tuyển dụng.
- Khai báo phòng ban, kỹ năng yêu cầu, số lượng tuyển, hạn ứng tuyển, địa điểm, hình thức làm việc và thời gian dự kiến.
- Xem và cập nhật trạng thái ứng viên.
- Trao đổi với sinh viên trong phạm vi đơn ứng tuyển/placement.
- Đánh giá thực tập sinh.

### 4.4. Xác minh doanh nghiệp

Luồng xác minh được bổ sung để tăng độ tin cậy của thông tin nhà tuyển dụng:

```text
DRAFT → PENDING → APPROVED
                 ↘ REJECTED → PENDING
APPROVED → SUSPENDED
```

- Email được xác thực độc lập với việc xác minh pháp nhân.
- Admin xem hồ sơ chi tiết trước khi quyết định.
- Admin có checklist đối chiếu tên pháp lý, mã số doanh nghiệp, giấy đăng ký và địa chỉ.
- Từ chối hoặc tạm dừng bắt buộc có lý do.
- Quyết định được lưu vào audit log và gửi thông báo cho doanh nghiệp.
- Thông tin pháp lý đã được duyệt bị khóa chỉnh sửa để tránh thay đổi danh tính sau xác minh.
- Hệ thống hiện hỗ trợ xác minh thủ công; chưa tích hợp OCR hoặc cơ sở dữ liệu doanh nghiệp bên thứ ba.

### 4.5. Vị trí thực tập và ứng tuyển

- Doanh nghiệp tạo vị trí ở trạng thái nháp hoặc mở tuyển theo nghiệp vụ của đợt thực tập.
- Vị trí có các thông tin chính: tiêu đề, phòng ban, mô tả, yêu cầu, kỹ năng, số lượng, số lượng đã tuyển, hạn ứng tuyển, địa điểm, hình thức làm việc, ngày bắt đầu và ngày kết thúc dự kiến.
- Hỗ trợ tìm kiếm và lọc nhiều kỹ năng.
- Chỉ tin còn mở, chưa hết hạn và còn số lượng mới nhận đơn.
- Một sinh viên không thể nộp trùng cùng một vị trí.
- Trạng thái đơn gồm `PENDING`, `REVIEWING`, `ACCEPTED`, `REJECTED`, `WITHDRAWN`.
- Lưu lịch sử thay đổi trạng thái đơn.
- Khi doanh nghiệp chấp nhận đơn, hệ thống tạo placement trong transaction và cập nhật số lượng đã tuyển.

### 4.6. Placement, đợt thực tập và theo dõi học vụ

- Quản lý **đợt thực tập** với cửa sổ tuyển dụng và khoảng theo dõi học vụ.
- Placement là bản ghi xác nhận sinh viên thực tập tại một vị trí cụ thể.
- Mỗi sinh viên chỉ có một placement đang chờ hoặc đang hoạt động trong cùng thời điểm nghiệp vụ được kiểm soát.
- Admin phân công một giảng viên cho placement.
- Khoảng thời gian placement dùng cho việc trường theo dõi học vụ, không nhất thiết là thời gian sinh viên làm việc thực tế tại doanh nghiệp.
- Khi phần theo dõi học vụ kết thúc, báo cáo/supervision được chốt theo quy định; sinh viên vẫn có thể tiếp tục làm việc thực tế nếu doanh nghiệp và sinh viên thống nhất.
- Hỗ trợ báo cáo tuần, phản hồi báo cáo và hai loại đánh giá độc lập: doanh nghiệp và giảng viên.

### 4.7. Báo cáo và đánh giá

- Sinh viên tạo, chỉnh sửa và nộp báo cáo tuần.
- Mỗi placement chỉ có một báo cáo cho mỗi tuần.
- Giảng viên xem, duyệt hoặc yêu cầu sinh viên chỉnh sửa báo cáo.
- Tệp báo cáo được lưu riêng tư.
- Doanh nghiệp và giảng viên có thể tạo một đánh giá riêng cho cùng một placement.
- Điểm được kiểm tra trong thang điểm hợp lệ.
- Người tạo đánh giá mới được chỉnh sửa hoặc xóa đánh giá của mình.
- Các thao tác tạo, sửa, xóa và review đều được ghi audit log.

### 4.8. AI Job Recommendation

AI Recommendation là feature mở rộng được triển khai thêm trong giai đoạn Week 7.

- **Input:** hồ sơ sinh viên, kỹ năng, dự án, job preferences và danh sách vị trí đủ điều kiện.
- **Xử lý:** backend lọc vị trí hợp lệ và tính điểm matching xác định; sau đó sắp xếp tối đa 10 vị trí.
- **Output:** danh sách vị trí được xếp hạng, điểm matching, breakdown, kỹ năng phù hợp/thiếu và phần giải thích.
- Gemini chỉ giải thích tối đa 3 vị trí đầu, không tự tạo điểm, không thay đổi thứ hạng và không tự nộp đơn.
- Có cache theo fingerprint dữ liệu, TTL, cooldown khi làm mới và fallback deterministic khi AI lỗi hoặc thiếu dữ liệu.
- Frontend có khu vực gợi ý riêng, trạng thái loading/empty/error/fallback và nút làm mới kèm thời gian chờ.
- API key và thông tin nhạy cảm của sinh viên không được đưa vào frontend hoặc gửi không cần thiết cho AI provider.

### 4.9. Admin, thông báo và realtime

- Admin quản lý người dùng, kỹ năng, doanh nghiệp, đợt thực tập và placement.
- Admin có màn hình xác minh doanh nghiệp và xem audit log.
- Thông báo được lưu bền vững trong PostgreSQL.
- Socket.IO cập nhật thông báo và số lượng chưa đọc theo thời gian thực.
- Có hội thoại giữa sinh viên với doanh nghiệp hoặc giảng viên theo đúng phạm vi nghiệp vụ.
- Các thao tác quan trọng như duyệt doanh nghiệp, thay đổi đơn, phân công, báo cáo và đánh giá được ghi lại.

---

## 5. Cơ sở dữ liệu

### Database và entity chính

Hệ thống sử dụng PostgreSQL, Prisma là ORM và `schema.prisma` là nguồn định nghĩa chính của database.

Các nhóm entity chính:

- **Tài khoản:** `User`, `VerificationToken`, `PasswordResetToken`, `RefreshToken`.
- **Hồ sơ:** `StudentProfile`, `StudentProject`, `StudentSkill`, `StudentJobPreference`, `LecturerProfile`, `CompanyProfile`.
- **Tuyển dụng:** `Semester`, `Internship`, `Skill`, `InternshipSkill`, `Application`, `ApplicationStatusHistory`.
- **Theo dõi thực tập:** `InternshipPlacement`, `Supervision`, `Report`, `Evaluation`.
- **Hỗ trợ hệ thống:** `File`, `Conversation`, `Message`, `Notification`, `AuditLog`, `InternshipRecommendationCache`.

### Quan hệ chính

```text
User
 ├── StudentProfile
 │     ├── StudentProject
 │     ├── StudentSkill ───── Skill
 │     ├── StudentJobPreference
 │     └── Application ───── Internship
 │                              └── CompanyProfile
 ├── LecturerProfile ───── Supervision
 └── CompanyProfile

Application
  └── InternshipPlacement
        ├── Supervision
        ├── Report
        ├── Evaluation
        └── Conversation
```

### Một số kỹ thuật đã áp dụng

- Foreign key và quan hệ Prisma giữa các entity.
- Unique constraint cho email, mã sinh viên, application trùng, report theo tuần và evaluation theo loại.
- Conditional update trong các state transition quan trọng để hạn chế hai request ghi đè nhau.
- Transaction cho các thao tác cần cập nhật nhiều bảng cùng lúc.
- Cascade/SetNull phù hợp cho dữ liệu liên quan.
- Signed URL cho upload/download tệp riêng tư.
- Audit log cho các thay đổi quan trọng.
- Cache recommendation trong database thay vì phụ thuộc Redis ở phiên bản hiện tại.

---

## 6. Kết quả chạy thử và demo hiện tại

Hệ thống hiện có thể chạy trong môi trường test để trình bày các luồng chính:

1. Đăng ký, xác thực email và đăng nhập.
2. Sinh viên cập nhật hồ sơ, CV, kỹ năng và mong muốn công việc.
3. Sinh viên tìm kiếm/lọc nhiều kỹ năng và xem chi tiết vị trí.
4. Sinh viên tạo hoặc làm mới danh sách AI recommendation.
5. Sinh viên nộp đơn và doanh nghiệp xử lý đơn.
6. Tạo placement, phân công giảng viên, nộp báo cáo và đánh giá.
7. Doanh nghiệp gửi hồ sơ xác minh và tải giấy ĐKDN.
8. Admin xem checklist, duyệt/yêu cầu bổ sung/tạm dừng doanh nghiệp.
9. Nhận thông báo và trao đổi qua chat.

### Kết quả kiểm thử kỹ thuật

| Hạng mục | Kết quả |
| --- | --- |
| Backend build (`npm run build`) | Đạt |
| Backend Jest tests | 17/17 tests đạt |
| Frontend type-check (`npm run lint`) | Đạt |
| Frontend production build (`npm run build`) | Đạt |
| Prisma migration | Database đã up-to-date |
| Smoke test REST bằng curl/PowerShell | Đạt cho login, auth resend, admin search và các response lỗi chính |
| AI recommendation regression | Đã có tài liệu và script kiểm thử riêng |

### Hình ảnh demo cần bổ sung

> Các ảnh dưới đây có thể chụp từ môi trường chạy thực tế trước khi nộp báo cáo.

- **Hình 6.1.** Trang đăng nhập/đăng ký.
- **Hình 6.2.** Hồ sơ và dashboard sinh viên.
- **Hình 6.3.** Trang tìm kiếm, lọc nhiều kỹ năng và chi tiết vị trí.
- **Hình 6.4.** Khu vực AI gợi ý vị trí thực tập.
- **Hình 6.5.** Trang ứng tuyển và theo dõi placement.
- **Hình 6.6.** Hồ sơ doanh nghiệp và trạng thái xác minh.
- **Hình 6.7.** Đăng/quản lý tin tuyển dụng.
- **Hình 6.8.** Quản lý ứng viên.
- **Hình 6.9.** Admin xác minh doanh nghiệp.
- **Hình 6.10.** Báo cáo tuần, đánh giá và thông báo.

---

## 7. Tiến độ và vấn đề còn tồn tại

| Hạng mục | Trạng thái hiện tại | Ghi chú |
| --- | --- | --- |
| Authentication & Authorization | ✅ Hoàn thành phần chính | Có email verification, JWT, refresh token, reset password và RBAC. |
| Student | ✅ Hoàn thành phần chính | Hồ sơ, CV, kỹ năng, preferences, tìm kiếm, ứng tuyển và xem kết quả. |
| Company | 🟡 Đã có MVP | Đã có xác minh thủ công; cần tiếp tục hoàn thiện nội dung và quy trình UI nếu cần. |
| Internship/Job | ✅ Hoàn thành phần chính | CRUD, tìm kiếm, lọc nhiều kỹ năng, số lượng và lịch dự kiến. |
| Application | ✅ Hoàn thành phần chính | State transition, lịch sử và tạo placement khi chấp nhận. |
| Placement & Supervision | ✅ Hoàn thành phần chính | Có khoảng theo dõi học vụ và phân công giảng viên. |
| Reports & Evaluations | ✅ Hoàn thành phần chính | Báo cáo tuần, review và hai đánh giá độc lập. |
| AI Recommendation | ✅ Hoàn thành MVP | Backend ranking xác định, cache, cooldown, Gemini explanation và fallback. |
| Notifications & Chat | 🟡 Đã triển khai | REST và realtime đã có; cần kiểm thử thủ công thêm trên nhiều trình duyệt/kết nối. |
| Admin | 🟡 Đang hoàn thiện | Đã có các màn hình quản trị chính và company moderation. |
| Testing | 🟡 Đang mở rộng | Unit/build/smoke test đã có; cần thêm end-to-end test và checklist demo đầy đủ. |
| Deployment | 🟡 Môi trường test | Có thể chạy local với database test; quy trình production cần tiếp tục chuẩn hóa. |

### Một số giới hạn hiện tại

- Xác minh doanh nghiệp hiện là đối chiếu thủ công, chưa có OCR hoặc kết nối dữ liệu pháp lý bên ngoài.
- AI là chức năng hỗ trợ giải thích kết quả, không thay thế quyết định tuyển dụng.
- Realtime chat cần kiểm thử trực tiếp bằng trình duyệt/Socket.IO client; curl chỉ kiểm tra được REST.
- Cần bổ sung thêm end-to-end test cho các luồng dài: đăng ký → xác minh → ứng tuyển → placement → báo cáo → đánh giá.
- Thông tin thành viên, giảng viên hướng dẫn, thời gian thực hiện và ảnh demo cần được điền/chụp trước khi nộp bản chính thức.

---

## 8. Kế hoạch thực hiện tiếp theo

### 8.1. Ưu tiên ngắn hạn – đưa hệ thống vào dùng thử

2. **Hoàn thiện hồ sơ và xác minh doanh nghiệp:** chuẩn hóa checklist duyệt hồ sơ, thời gian xử lý, lý do yêu cầu bổ sung và cơ chế tạm dừng doanh nghiệp vi phạm. Việc kiểm tra mã số doanh nghiệp với nguồn dữ liệu pháp lý bên ngoài chỉ nên bổ sung khi có nguồn chính thức và điều kiện tích hợp phù hợp.
3. **Bổ sung quy trình phỏng vấn:** cho phép doanh nghiệp đề xuất lịch phỏng vấn, sinh viên xác nhận hoặc yêu cầu đổi lịch; gửi nhắc lịch qua thông báo và email. Đây là bước còn thiếu giữa trạng thái xem CV và chấp nhận ứng viên.
4. **Chuẩn hóa chất lượng tin tuyển dụng:** yêu cầu đầy đủ số lượng tuyển, địa điểm, hình thức làm việc, lịch làm việc, trợ cấp, kỹ năng, hạn nộp và người liên hệ trước khi mở tin. Admin có thể ẩn hoặc yêu cầu chỉnh sửa tin thiếu thông tin, trùng lặp hoặc có dấu hiệu không phù hợp.

### 8.2. Mở rộng trung hạn – tăng giá trị cho doanh nghiệp và nhà trường

2. **Quản lý nhiều chi nhánh và phòng ban:** doanh nghiệp khai báo chi nhánh, địa điểm làm việc và bộ phận tuyển dụng; mỗi tin tuyển dụng gắn với đơn vị phụ trách cụ thể.
3. **Quản lý quy trình tuyển dụng chi tiết:** mở rộng pipeline thành các bước như mới nộp, sàng lọc, phỏng vấn, đề nghị nhận việc, nhận việc và từ chối; lưu người xử lý, thời gian và ghi chú nội bộ ở từng bước.
4. **Mẫu tin tuyển dụng và đăng lại có kiểm soát:** doanh nghiệp lưu tin làm mẫu, sao chép hoặc đăng lại trong đợt tuyển mới mà không phải nhập lại toàn bộ; hệ thống vẫn kiểm tra thời hạn và nội dung trước khi mở tin.
5. **Thống kê tuyển dụng cho doanh nghiệp:** số lượt xem, số đơn, tỷ lệ qua từng vòng, thời gian tuyển trung bình, nguồn kỹ năng ứng viên và tỷ lệ lấp đầy vị trí. Dữ liệu này giúp doanh nghiệp đánh giá hiệu quả tin tuyển dụng.
6. **Dashboard học vụ cho nhà trường:** theo dõi sinh viên chưa có placement, báo cáo nộp trễ, doanh nghiệp có nhiều phản hồi bất thường và placement sắp hết thời gian theo dõi.
7. **Xuất báo cáo:** hỗ trợ xuất Excel/PDF danh sách sinh viên, placement, tiến độ báo cáo và kết quả đánh giá để phục vụ công tác quản lý của khoa.

### 8.3. Hướng mở rộng AI phù hợp

1. **Gợi ý khoảng trống kỹ năng:** ngoài việc đề xuất vị trí, hệ thống chỉ ra kỹ năng sinh viên còn thiếu so với yêu cầu và gợi ý nội dung cần cải thiện trong hồ sơ.
2. **Hỗ trợ kiểm tra CV:** AI có thể góp ý cách trình bày, phát hiện thông tin còn thiếu và đề xuất cách diễn đạt; sinh viên phải chủ động chấp nhận thay đổi, AI không tự sửa hoặc gửi CV.
3. **Hỗ trợ doanh nghiệp soạn tin:** tạo bản nháp mô tả công việc từ thông tin doanh nghiệp nhập, nhưng doanh nghiệp phải kiểm tra và chịu trách nhiệm trước khi đăng.

### 8.4. Hướng mở rộng khi triển khai quy mô lớn

- Hỗ trợ đăng nhập một lần của nhà trường (SSO) cho sinh viên, giảng viên và admin.
- Bổ sung chính sách lưu trữ/xóa dữ liệu, lịch sử đồng ý sử dụng dữ liệu và công cụ xử lý yêu cầu riêng tư.
- Thiết lập monitoring, cảnh báo, backup, khôi phục sự cố và phân quyền vận hành cho môi trường production.

## 9. Kết luận sơ bộ

CareerBridge hiện đã hình thành được nền tảng chức năng chính cho việc kết nối sinh viên, doanh nghiệp và nhà trường. Các luồng quan trọng từ hồ sơ, tìm kiếm, ứng tuyển, xác nhận placement, theo dõi báo cáo đến đánh giá đã được hiện thực ở backend và frontend.

Điểm mở rộng nổi bật là **AI Job Recommendation**, trong đó backend vẫn giữ quyền quyết định việc lọc và xếp hạng, còn AI chỉ hỗ trợ diễn giải để bảo đảm tính kiểm soát và khả năng fallback. Bên cạnh đó, luồng **xác minh doanh nghiệp bằng mã số và giấy đăng ký doanh nghiệp** giúp tăng độ tin cậy trước khi doanh nghiệp được phép đăng tuyển.

Hệ thống đã đạt mức có thể chạy thử và demo các luồng chính. Giai đoạn tiếp theo tập trung vào kiểm thử end-to-end, hoàn thiện giao diện, dữ liệu demo và chuẩn hóa triển khai.
