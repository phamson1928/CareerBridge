# BÁO CÁO TIẾN ĐỘ THỰC HIỆN ĐỒ ÁN — TUẦN 6
## HỆ THỐNG QUẢN LÝ VÀ KẾT NỐI THỰC TẬP THÔNG MINH (CAREERBRIDGE)

---

### THÔNG TIN CHUNG
- Học phần: Đồ án Tốt nghiệp / Dự án Chuyên ngành Công nghệ Thông tin
- Giai đoạn báo cáo: Tuần 6
- Chủ đề trọng tâm: Phân hệ Đánh giá Thực tập (Evaluations) — Hệ thống Thông báo Thời gian thực (Notifications & Realtime) — Quản lý Hồ sơ và Minh chứng Tệp tin (Files Management)
- Thành viên nhóm thực hiện:
  1. Phạm Hoàng Sơn: Phụ trách Phân hệ Đánh giá Thực tập (Evaluations), Quy chuẩn Thang điểm và Kiểm soát Phân quyền Nghiệp vụ
  2. Võ Văn Quyến: Phụ trách Phân hệ Thông báo (Notifications), Kiến trúc Thời gian thực (Socket.IO Realtime) và Quản lý Tệp tin (Files Service)

---

## I. MỤC TIÊU VÀ ĐỊNH HƯỚNG KIẾN TRÚC TUẦN 6

Trong tổng thể kiến trúc giải pháp của nền tảng CareerBridge, Tuần 6 giữ vai trò mắt xích quyết định nhằm hoàn thiện chu trình khép kín của một kỳ thực tập:
Sinh viên sau khi trải qua quá trình nộp báo cáo tiến độ định kỳ hàng tuần (kết quả của Tuần 5) sẽ bước vào giai đoạn nghiệm thu kết quả. Hệ thống cần thiết lập một cơ chế đánh giá minh bạch, đa chiều, song hành cùng cơ chế truyền phát thông tin tức thời và kho lưu trữ minh chứng bảo mật.

### 1. Về nghiệp vụ Đánh giá (Evaluations)
- Định hướng đánh giá hai chiều độc lập:
  - Phía Doanh nghiệp: Chấm điểm dựa trên thái độ làm việc, kỹ năng chuyên môn, mức độ đáp ứng công việc và đóng góp thực tế tại đơn vị thực tập.
  - Phía Giảng viên hướng dẫn: Chấm điểm dựa trên tính học thuật, quá trình làm việc phản ánh qua các báo cáo tuần đã duyệt và tham chiếu kết quả nhận xét từ người hướng dẫn tại doanh nghiệp.
- Nguyên tắc thiết kế cốt lõi: Điểm của Giảng viên và Doanh nghiệp là hai thực thể dữ liệu độc lập cùng gắn với vị trí thực tập (Placement), không ghi đè lẫn nhau (ràng buộc duy nhất theo cặp Placement ID và Loại Đánh giá). Điều này đảm bảo tính khách quan toàn diện khi Hội đồng hoặc Khoa tổng hợp điểm cuối khóa.

### 2. Về hệ thống Thông báo (Notifications & Realtime)
- Kiến trúc xử lý thông điệp ba tầng:
  - Tầng Lưu trữ Bền vững (Persistent Layer): Lưu trữ toàn bộ thông báo trong cơ sở dữ liệu PostgreSQL. Dữ liệu không bị mất mát khi người dùng đăng xuất, tắt trình duyệt hoặc mất kết nối mạng.
  - Tầng Tích hợp Nghiệp vụ (Business Integration Layer): Thông báo được tự động tạo lập từ các sự kiện chuyển trạng thái nghiệp vụ (State Transitions) ngay trong Database Transaction của sự kiện gốc, sử dụng khóa duy nhất (Event Key) để triệt tiêu nguy cơ gửi trùng lặp.
  - Tầng Phát sóng Thời gian thực (Realtime Push Layer): Ứng dụng Socket.IO Gateway truyền phát thông điệp tức thì đến đúng người dùng theo cơ chế Room riêng biệt (user:UserId), đồng bộ số đếm chưa đọc trên thanh điều hướng ngay khi thao tác hoàn thành.

### 3. Về Quản lý Tệp tin (Files Management)
- Kiến trúc lưu trữ đám mây an toàn với Presigned Signed URL:
  - Tách rời hoàn toàn máy chủ ứng dụng khỏi máy chủ lưu trữ tệp tin nhằm tối ưu hiệu năng I/O và băng thông.
  - Tích hợp Supabase Storage (chuẩn Object Storage tương thích S3).
  - Phân tách hai luồng: Upload URL (trình duyệt tải trực tiếp tệp lên Storage) và Download URL (tạo liên kết tải tạm thời có thời hạn 60 giây).
  - Kiểm duyệt phân quyền truy cập nghiêm ngặt: Chỉ những đối tượng có quan hệ học vụ trực tiếp mới được cấp quyền tải file (chủ sở hữu, doanh nghiệp nhận đơn ứng tuyển, giảng viên phụ trách hướng dẫn và Quản trị viên).

---

## II. MA TRẬN PHÂN CÔNG VÀ KẾT NỐI NGHIỆP VỤ

### 1. Phân công trách nhiệm giữa hai thành viên
- Phạm Hoàng Sơn:
  - Thiết kế cấu trúc cơ sở dữ liệu và bảng Evaluation.
  - Xây dựng EvaluationsService, EvaluationsController và bộ chuyển đổi dữ liệu DTO.
  - Thiết lập logic kiểm tra thẩm quyền đánh giá hai chiều độc lập.
  - Phát triển giao diện Modal đánh giá dành cho Doanh nghiệp và Form chấm điểm của Giảng viên.
  - Xây dựng màn hình tổng hợp và tra cứu kết quả đánh giá dành cho Sinh viên.
- Võ Văn Quyến:
  - Thiết kế cấu trúc bảng Notification và cơ chế khóa Idempotent (Event Key).
  - Cấu hình Socket.IO Gateway, chứng thực JWT handshake và quản lý phân luồng Room.
  - Tích hợp phát sinh thông báo tại 6 chuyển trạng thái nghiệp vụ trong toàn hệ thống.
  - Hiện thực FilesService, xử lý chữ ký điện tử Presigned URL cho CV và Báo cáo.
  - Phát triển giao diện Notification Center, Menu thông báo và Unread Badge trên Navbar.

### 2. Luồng tương tác tích hợp giữa hai thành viên
Khi Phạm Hoàng Sơn hoàn tất xử lý logic lưu đánh giá mới tại EvaluationsService, phương thức Notification của Võ Văn Quyến được kích hoạt trong cùng Transaction để tự động phát thông báo EVALUATION_CREATED và đẩy qua WebSocket đến tài khoản Sinh viên tương ứng.

---

## III. CHI TIẾT TRIỂN KHAI PHÂN HỆ ĐÁNH GIÁ (PHẠM HOÀNG SƠN)

### 1. Cấu trúc Cơ sở Dữ liệu Phân hệ Đánh giá (Evaluation)
Bảng Evaluation được định nghĩa với các thuộc tính và ràng buộc chặt chẽ như sau:

- id (Kiểu chuỗi String / CUID): Khóa chính của bản ghi đánh giá.
- placementId (Kiểu chuỗi String): Khóa ngoại tham chiếu đến vị trí thực tập (InternshipPlacement).
- evaluatorId (Kiểu chuỗi String): Khóa ngoại tham chiếu đến người thực hiện đánh giá (User).
- type (Kiểu Enum EvaluationType): Gồm COMPANY (Doanh nghiệp) và LECTURER (Giảng viên).
- score (Kiểu số thực Float): Điểm số đánh giá, tính theo thang điểm 10 (hỗ trợ 2 chữ số thập phân).
- comment (Kiểu văn bản String, tùy chọn): Nhận xét chi tiết về năng lực, thái độ hoặc kết quả học vụ.
- submittedAt (Kiểu thời gian DateTime): Thời điểm nộp đánh giá (mặc định lấy thời gian hiện tại).
- updatedAt (Kiểu thời gian DateTime): Thời điểm cập nhật đánh giá lần gần nhất.
- Ràng buộc duy nhất (Unique Constraint): Cặp thuộc tính [placementId, type] là duy nhất. Ràng buộc này đảm bảo một vị trí thực tập chỉ có tối đa một phiếu đánh giá từ Doanh nghiệp và một phiếu đánh giá từ Giảng viên hướng dẫn.

### 2. Các quy tắc nghiệp vụ và kiểm soát phân quyền (Business Rules)
- Kiểm tra trạng thái thực tập: Vị trí thực tập phải có trạng thái là ACTIVE (đang diễn ra) hoặc COMPLETED (đã hoàn tất) thì mới được phép thực hiện đánh giá.
- Kiểm tra quyền đối với Doanh nghiệp: Hệ thống xác thực tài khoản gửi yêu cầu phải chính là doanh nghiệp tiếp nhận sinh viên tại vị trí thực tập đó (placement.company.userId == user.id).
- Kiểm tra quyền đối với Giảng viên: Giảng viên thực hiện đánh giá phải đang có phân công hướng dẫn (Supervision) còn hiệu lực (trạng thái ACTIVE) cho đúng vị trí thực tập đó (supervision.lecturer.userId == user.id).
- Quy chuẩn thang điểm học vụ: Điểm số bắt buộc nằm trong khoảng từ 0.00 đến 10.00, được xác thực thông qua thư viện class-validator (@Min(0), @Max(10), @IsNumber({ maxDecimalPlaces: 2 })).
- Ghi vết kiểm toán (Audit Log): Mọi thao tác tạo mới, cập nhật hoặc xóa phiếu đánh giá đều được ghi lại trong bảng AuditLog kèm thông tin người thao tác và thời điểm thực hiện.

### 3. Danh sách API Endpoints xây dựng mới
- POST /api/v1/evaluations: Tạo phiếu đánh giá mới (Hệ thống tự động nhận diện vai trò Doanh nghiệp hay Giảng viên thông qua JWT Token).
- GET /api/v1/evaluations/me: Truy vấn danh sách đánh giá liên quan đến người dùng hiện tại (Sinh viên xem điểm của mình; Doanh nghiệp/Giảng viên xem các đánh giá do mình lập).
- GET /api/v1/evaluations/:id: Truy vấn chi tiết một phiếu đánh giá cụ thể (có kiểm tra quyền sở hữu).
- PATCH /api/v1/evaluations/:id: Cập nhật lại điểm số hoặc lời nhận xét (chỉ người tạo ban đầu mới có quyền sửa).
- DELETE /api/v1/evaluations/:id: Hủy phiếu đánh giá (chỉ áp dụng cho người tạo hoặc Quản trị viên hệ thống).

### 4. Giao diện người dùng đã hoàn thiện trên Frontend
- Phía Doanh nghiệp (EvaluateInternsModal.tsx):
  - Hiển thị danh sách các sinh viên đang thực tập tại công ty kèm trạng thái đã đánh giá hoặc chưa đánh giá.
  - Hộp thoại nhập điểm số trực quan (bước nhảy 0.1 điểm) cùng khung nhập nhận xét về tinh thần làm việc và kỹ năng thực tế.
- Phía Giảng viên (TeacherEvaluations.tsx):
  - Bảng tổng hợp kết quả đánh giá thực tập. Giảng viên có thể xem trước điểm và lời nhận xét của Doanh nghiệp để làm cơ sở tham khảo.
  - Giao diện thể hiện rõ thông điệp định hướng: "Điểm giảng viên là một đánh giá độc lập, không ghi đè đánh giá doanh nghiệp".
- Phía Sinh viên (StudentEvaluations.tsx):
  - Màn hình kết quả thực tập cá nhân: Trình bày song song hai thẻ kết quả độc lập (Thẻ đánh giá của Doanh nghiệp màu xanh lá và Thẻ đánh giá của Giảng viên màu tím).
  - Hiển thị nổi bật huy hiệu điểm số (X/10), nội dung phản hồi chi tiết và ngày cập nhật.

---

## IV. CHI TIẾT TRIỂN KHAI PHÂN HỆ THÔNG BÁO VÀ QUẢN LÝ TỆP TIN (VÕ VĂN QUYẾN)

### 1. Cấu trúc Cơ sở Dữ liệu Phân hệ Thông báo (Notification)
Bảng Notification được chuẩn hóa phục vụ cả lưu trữ lịch sử và điều hướng trực tiếp:

- id (Kiểu chuỗi String / CUID): Khóa chính của thông báo.
- userId (Kiểu chuỗi String): Khóa ngoại tham chiếu đến tài khoản người nhận (User).
- type (Kiểu Enum NotificationType): Phân loại gồm APPLICATION, REPORT, SUPERVISION, PLACEMENT, COMPANY, EVALUATION, SYSTEM.
- action (Kiểu Enum NotificationAction): Hành động điều hướng gồm OPEN_APPLICATION, OPEN_REPORT, OPEN_SUPERVISION, OPEN_PLACEMENT, OPEN_COMPANY_PROFILE, OPEN_EVALUATION, NONE.
- title (Kiểu chuỗi String): Tiêu đề ngắn gọn của thông báo.
- content (Kiểu văn bản String): Nội dung mô tả chi tiết của thông báo.
- isRead (Kiểu boolean Boolean): Trạng thái đã đọc (mặc định là false).
- readAt (Kiểu thời gian DateTime, tùy chọn): Thời điểm người dùng mở xem thông báo.
- resourceId (Kiểu chuỗi String, tùy chọn): Định danh của đối tượng liên quan để phục vụ chuyển trang (ví dụ ID đơn, ID báo cáo).
- metadata (Kiểu Json, tùy chọn): Thông tin mở rộng bổ sung.
- eventKey (Kiểu chuỗi String, duy nhất Unique): Khóa nhận diện sự kiện chống trùng lặp dữ liệu (Idempotency Key).
- createdAt (Kiểu thời gian DateTime): Thời điểm khởi tạo thông báo.

### 2. Kiến trúc Truyền phát Thời gian thực (Socket.IO Gateway)
- Thiết lập Gateway: Hiện thực lớp RealtimeGateway dựa trên nền tảng NestJS WebSockets và thư viện Socket.IO.
- Bảo mật kết nối: Cơ chế Handshake kiểm tra tính hợp lệ của JWT Token ngay khi client thiết lập kết nối socket.
- Quản lý kênh truyền theo phòng (Room Isolation): Mỗi phiên kết nối của người dùng tự động gia nhập vào phòng riêng biệt theo định dạng "user:UserId".
- Sự kiện phát sóng chính:
  - Sự kiện "notification.created": Đẩy toàn bộ dữ liệu thông báo mới đến đúng người nhận ngay khi cơ sở dữ liệu ghi nhận thành công.
  - Sự kiện "notification.read" và "notification.read-all": Đồng bộ ngay lập tức trạng thái đã đọc trên tất cả các tab hoặc thiết bị đang mở của người dùng.

### 3. Tích hợp Thông báo vào 6 Luồng Nghiệp vụ Trọng yếu
Võ Văn Quyến đã thực hiện kết nối việc phát sinh thông báo tự động vào các dịch vụ nghiệp vụ:
1. Luồng Đơn ứng tuyển (ApplicationsService):
   - Sinh viên nộp đơn -> Thông báo Doanh nghiệp có đơn mới (action: OPEN_APPLICATION).
   - Doanh nghiệp tiếp nhận, duyệt hoặc từ chối đơn -> Thông báo kết quả đến Sinh viên.
2. Luồng Khởi tạo Vị trí thực tập (PlacementsService):
   - Đơn ứng tuyển được chấp thuận -> Tự động khởi tạo Placement trạng thái PENDING và thông báo cho Sinh viên biết vị trí đã được tạo (action: OPEN_PLACEMENT).
   - Khi Placement hoàn thành (COMPLETED) hoặc bị hủy (CANCELLED) -> Đồng thời thông báo đến Sinh viên, Doanh nghiệp và Giảng viên hướng dẫn.
3. Luồng Phân công Giảng viên Hướng dẫn (SupervisionsService):
   - Quản trị viên phân công Giảng viên -> Gửi thông báo đến Giảng viên nhận nhiệm vụ và thông báo đến Sinh viên về người hướng dẫn (action: OPEN_SUPERVISION). Loại bỏ Doanh nghiệp khỏi danh sách nhận do đây là nghiệp vụ học vụ nội bộ của Nhà trường.
4. Luồng Báo cáo Hàng tuần (ReportsService):
   - Sinh viên nộp báo cáo tuần -> Gửi thông báo đến Giảng viên phụ trách để chấm duyệt (action: OPEN_REPORT).
   - Giảng viên phê duyệt hoặc yêu cầu chỉnh sửa báo cáo -> Thông báo phản hồi đến Sinh viên kèm ý kiến nhận xét.
5. Luồng Đánh giá Nghiệm thu (EvaluationsService):
   - Doanh nghiệp hoặc Giảng viên gửi phiếu đánh giá -> Gửi thông báo đến Sinh viên về kết quả đánh giá mới (action: OPEN_EVALUATION).
6. Luồng Kiểm duyệt Doanh nghiệp (CompaniesService):
   - Quản trị viên duyệt hoặc từ chối hồ sơ pháp nhân của doanh nghiệp -> Thông báo phản hồi đến tài khoản Doanh nghiệp (action: OPEN_COMPANY_PROFILE).

### 4. Giao diện Trung tâm Thông báo (NotificationCenter.tsx)
- Biểu tượng chuông thông báo trên thanh điều hướng chính (Navbar) tích hợp huy hiệu số đếm (Unread Badge) tự động cập nhật thời gian thực không cần tải lại trang.
- Bảng danh sách thông báo phân tách trực quan bằng màu sắc và icon đặc trưng cho từng loại nghiệp vụ.
- Bộ lọc thông báo linh hoạt: Xem tất cả, Xem tin chưa đọc, hoặc lọc chuyên biệt theo từng chủ đề (Đơn từ, Báo cáo, Đánh giá, Phân công).
- Tính năng điều hướng thông minh: Khi nhấp vào một thông báo, hệ thống tự động đánh dấu đã đọc và chuyển hướng người dùng trực tiếp đến đúng màn hình của đối tượng tương ứng.

### 5. Phân hệ Quản lý Tệp tin An toàn (Files Management)
- Triển khai dịch vụ FilesService kết nối với Supabase Storage:
  - Tạo liên kết tải lên (Upload URL): Trình duyệt gửi thông tin metadata của tệp tin (tên gốc, định dạng MIME, dung lượng). Hệ thống kiểm tra tính hợp lệ và cấp một liên kết Presigned Upload URL có chữ ký bảo mật để tải tệp trực tiếp lên đám mây.
  - Tạo liên kết tải xuống (Download URL): Khi có yêu cầu xem hoặc tải tệp tin, máy chủ thẩm định quyền sở hữu và vai trò học vụ (chỉ chủ sở hữu file, nhà tuyển dụng nhận CV, giảng viên hướng dẫn của báo cáo và Admin mới có quyền). Nếu hợp lệ, một liên kết Signed Download URL tạm thời có hiệu lực trong 60 giây sẽ được khởi tạo.
- Định dạng tệp tin cho phép: Hồ sơ CV và Báo cáo hỗ trợ định dạng PDF, Microsoft Word (.doc, .docx); Chứng chỉ hỗ trợ PDF và hình ảnh (JPEG, PNG).

---

## V. KẾT QUẢ ĐẠT ĐƯỢC VÀ ĐỐI CHIẾU MỤC TIÊU

### 1. Kết quả kiểm thử kỹ thuật
- Kiểm tra kiểu dữ liệu Backend: Lệnh kiểm tra "npx tsc --noEmit" hoàn thành với 0 lỗi. Toàn bộ mã nguồn NestJS, DTOs, Prisma Models và Unit Tests đều vượt qua kiểm tra tĩnh.
- Kiểm tra kiểu dữ liệu Frontend: Lệnh kiểm tra "npx tsc --noEmit" hoàn thành với 0 lỗi. Toàn bộ giao diện React, Router, Modals và API Types đều đồng bộ chính xác.
- Kiểm thử tích hợp: Chu trình nộp báo cáo, chấm điểm đánh giá và truyền phát thông báo Socket.IO hoạt động trơn tru trên môi trường thực nghiệm.

### 2. Bảng đối chiếu tiến độ với Kế hoạch Đồ án

| Hạng mục cam kết | Kết quả triển khai thực tế | Trạng thái | Người thực hiện |
| :--- | :--- | :---: | :---: |
| Nghiệp vụ Evaluations CRUD | Hoàn thiện API tạo, xem, sửa, xóa đánh giá; Transaction an toàn | Đạt 100% | Phạm Hoàng Sơn |
| Kiểm soát quyền đánh giá 2 chiều | Chặn chéo theo đúng vai trò, đúng Placement và Supervision ACTIVE | Đạt 100% | Phạm Hoàng Sơn |
| Giao diện Đánh giá đa chiều | Đủ 3 giao diện riêng cho Doanh nghiệp, Giảng viên và Sinh viên | Đạt 100% | Phạm Hoàng Sơn |
| Động cơ Thông báo bền vững | Thiết kế bảng CSDL chuẩn hóa, khóa Event Key triệt tiêu trùng lặp | Đạt 100% | Võ Văn Quyến |
| Cơ chế Realtime WebSocket | Tích hợp Socket.IO Gateway, định tuyến Room riêng biệt cho từng User | Đạt 100% | Võ Văn Quyến |
| Tích hợp Thông báo nghiệp vụ | Tự động hóa thông báo tại 6 chuyển trạng thái nghiệp vụ trong hệ thống | Đạt 100% | Võ Văn Quyến |
| Giao diện Notification Center | Chuông thông báo realtime, Unread Badge, bộ lọc và click điều hướng | Đạt 100% | Võ Văn Quyến |
| Quản lý Tệp tin an toàn | Tích hợp Supabase Storage với Presigned Signed URL cho CV và Báo cáo | Đạt 100% | Võ Văn Quyến |

---

## VI. ĐÁNH GIÁ VÀ ĐỊNH HƯỚNG KẾ TIẾP (TUẦN 7)

### 1. Đánh giá chung của nhóm
- Tính toàn vẹn của nghiệp vụ: Đến hết Tuần 6, nhóm đã khép kín toàn bộ vòng đời thực tập của sinh viên: Tìm kiếm vị trí tuyển dụng -> Nộp hồ sơ -> Doanh nghiệp tiếp nhận -> Nhà trường phân công giảng viên -> Sinh viên nộp báo cáo định kỳ -> Doanh nghiệp và Giảng viên nghiệm thu đánh giá độc lập.
- Định hướng kiến trúc đúng đắn: Việc phân tách rõ ràng trách nhiệm giữa hai thành viên, kết hợp cơ chế giao tiếp Realtime bằng Socket.IO và lưu trữ tệp tin trên Object Storage giúp hệ thống vận hành ổn định, sẵn sàng mở rộng và đạt chuẩn mực kỹ thuật cao.

### 2. Kế hoạch triển khai Tuần 7 (Giai đoạn hoàn thiện đồ án)
- Phát triển Phân hệ Trò chuyện Trực tuyến (Realtime Chat): Tái sử dụng và mở rộng hạ tầng Socket.IO Gateway đã dựng ở Tuần 6 để xây dựng kênh nhắn tin trực tiếp giữa Sinh viên với Doanh nghiệp (hỗ trợ phỏng vấn/trao đổi ứng tuyển) và giữa Sinh viên với Giảng viên hướng dẫn (hỗ trợ giải đáp học vụ).
- Hoàn thiện Kiểm toán và Hiệu năng: Rà soát toàn bộ hệ thống Audit Log, tối ưu hóa các chỉ mục cơ sở dữ liệu (Indexes) và chuẩn bị bộ dữ liệu mẫu (Seed Data) hoàn chỉnh để phục vụ báo cáo nghiệm thu đồ án trước Hội đồng.
