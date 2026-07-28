BÁO CÁO ĐỀ TÀI THỰC TẬP TỐT NGHIỆP
XÂY DỰNG HỆ THỐNG HỖ TRỢ TÌM KIẾM VÀ QUẢN LÝ THỰC TẬP CHO SINH VIÊN
Tên tiếng Anh:
Development of an Internship Management and Career Support Platform for Students

1. Giới thiệu đề tài
   1.1. Bối cảnh
   Trong quá trình học tập tại các trường đại học, thực tập doanh nghiệp là một giai đoạn quan trọng giúp sinh viên áp dụng kiến thức chuyên môn vào môi trường thực tế. Tuy nhiên, quá trình tìm kiếm và quản lý thực tập hiện nay còn gặp nhiều khó khăn:
   Sinh viên phải tự tìm kiếm thông tin thực tập từ nhiều nguồn khác nhau.
   Doanh nghiệp gặp khó khăn trong việc tiếp cận nguồn ứng viên phù hợp.
   Giảng viên khó theo dõi tiến độ thực tập của sinh viên.
   Việc quản lý CV, đơn ứng tuyển, báo cáo thực tập và đánh giá thường được thực hiện thủ công thông qua email hoặc file riêng lẻ.
   Do đó, đề tài xây dựng một nền tảng trực tuyến hỗ trợ kết nối sinh viên với doanh nghiệp, đồng thời hỗ trợ nhà trường quản lý quá trình thực tập một cách hiệu quả.
2. Mục tiêu đề tài
   2.1. Mục tiêu tổng quát
   Xây dựng một hệ thống web giúp sinh viên tìm kiếm cơ hội thực tập, ứng tuyển vào doanh nghiệp, theo dõi quá trình thực tập và cho phép doanh nghiệp, giảng viên quản lý, đánh giá quá trình này.
   2.2. Mục tiêu cụ thể
   Hệ thống cần đạt được các mục tiêu:
    Đối với sinh viên:
    Tạo và quản lý hồ sơ cá nhân.
    Cập nhật kỹ năng chuyên môn.
    Upload CV.
    Xem các vị trí thực tập được đề xuất dựa trên kỹ năng (skill matching).
    Tìm kiếm vị trí thực tập phù hợp.
    Gửi đơn ứng tuyển.
    Theo dõi trạng thái ứng tuyển.
    Nộp báo cáo thực tập theo tuần.
    Xem giảng viên hướng dẫn được phân công.
    Trao đổi với doanh nghiệp.
    Đối với doanh nghiệp:
    Tạo tài khoản doanh nghiệp (chờ Admin kiểm duyệt).
    Đăng thông tin tuyển thực tập (kèm kỹ năng yêu cầu).
    Quản lý danh sách ứng viên.
    Xem CV sinh viên.
    Chấp nhận hoặc từ chối ứng viên.
    Đánh giá sinh viên sau kỳ thực tập.
    Trao đổi với sinh viên.
    Đối với giảng viên:
    Xem danh sách sinh viên được phân công.
    Xem báo cáo thực tập của sinh viên.
    Phản hồi và phê duyệt báo cáo tuần.
    Nhận xét và đánh giá kết quả thực tập.
    Đối với quản trị viên:
    Quản lý người dùng (sinh viên, giảng viên, doanh nghiệp).
    Quản lý doanh nghiệp (kiểm duyệt tài khoản).
    Quản lý kỳ thực tập (semester).
    Phân công giảng viên hướng dẫn cho sinh viên.
    Quản lý danh mục kỹ năng.
    Kiểm duyệt nội dung.
    Theo dõi thống kê và audit log hệ thống.
3. Phạm vi đề tài
3.1. Phạm vi chức năng
    Hệ thống bao gồm các phân hệ:
    | Phân hệ | Chức năng |
    |---|---|
    | Authentication | Đăng nhập, đăng ký, phân quyền (RBAC) |
    | User Management | Quản lý thông tin người dùng (Admin) |
    | Student Profile | Hồ sơ sinh viên, kỹ năng, CV |
    | Lecturer Profile | Hồ sơ giảng viên, khoa/bộ môn |
    | Company Profile | Hồ sơ doanh nghiệp, kiểm duyệt (Pending/Approved/Rejected) |
    | Internship Management | Quản lý bài đăng thực tập (Draft/Open/Closed) |
    | Skill Management | Quản lý kỹ năng, mapping kỹ năng với sinh viên & vị trí |
    | Application Management | Quản lý đơn ứng tuyển, lịch sử trạng thái |
    | Internship Progress | Theo dõi quá trình thực tập |
    | Semester Management | Quản lý kỳ thực tập |
    | Supervision Management | Phân công giảng viên hướng dẫn cho sinh viên |
    | Report Management | Quản lý báo cáo tuần |
    | Evaluation | Đánh giá thực tập (doanh nghiệp + giảng viên) |
    | File Management | Quản lý file tập trung (CV, báo cáo, chứng chỉ) |
    | Notification | Thông báo hệ thống |
    | Chat | Trao đổi realtime giữa sinh viên & doanh nghiệp |
    | Dashboard | Thống kê hệ thống (Admin) |
    | Audit Log | Lưu lịch sử hoạt động hệ thống |

3.2. Đối tượng sử dụng
Sinh viên
Người tìm kiếm và tham gia chương trình thực tập.
Doanh nghiệp
Đơn vị cung cấp vị trí thực tập.
Giảng viên
Người giám sát và đánh giá sinh viên.
Admin
Người quản lý hệ thống. 4. Phân tích nghiệp vụ
4.1. Quy trình hoạt động
Bước 1: Sinh viên tạo hồ sơ
Sinh viên nhập:
Thông tin cá nhân
Ngành học
Kỹ năng
Dự án cá nhân
CV
Ví dụ:
Name:
Pham Hoang Son

Major:
Software Engineering

Skills:
NestJS
React
PostgreSQL
Docker
Bước 2: Doanh nghiệp đăng tuyển
Doanh nghiệp tạo bài đăng:
Position:
Backend Developer Intern

Requirement:

- NodeJS
- Database
- REST API

Deadline:
30/08/2026
Bước 3: Sinh viên ứng tuyển
Sinh viên truy cập danh sách vị trí thực tập.
Hệ thống tự động đề xuất các vị trí phù hợp dựa trên kỹ năng sinh viên đã khai báo (skill matching).
Sinh viên chọn vị trí và gửi đơn ứng tuyển:
Apply Internship

Attach CV

Submit
Bước 4: Doanh nghiệp xử lý hồ sơ
Trạng thái:
Pending

↓

Reviewing

↓

Accepted / Rejected
Bước 4.5: Admin phân công giảng viên hướng dẫn
Sau khi sinh viên được doanh nghiệp chấp nhận:
Admin chọn giảng viên phù hợp (chuyên ngành)
Gán sinh viên vào giảng viên đó theo kỳ thực tập (semester)
Quan hệ được lưu trong bảng supervisions

Ví dụ:
ADMIN
Assign
Nguyễn Văn A (Lecturer)
    |
    |
-----------
|   |   |
Sơn Nam Hùng

Giảng viên có thể xem danh sách sinh viên phụ trách sau khi được phân công.
Bước 5: Theo dõi thực tập
Sau khi được nhận:
Sinh viên gửi báo cáo:
Week 1:

Completed:

- Setup project
- Learn company workflow

Attachment:
report.pdf
Bước 6: Đánh giá
Cả doanh nghiệp và giảng viên đều tham gia đánh giá:

Doanh nghiệp đánh giá:
company_score: 8.5/10
Comment: Good performance, completed assigned tasks

Giảng viên đánh giá:
lecturer_score: 8.0/10
Comment: Báo cáo đầy đủ, đúng tiến độ

Kết quả đánh giá cuối cùng dựa trên cả hai nguồn. 5. Kiến trúc hệ thống
5.1. Kiến trúc tổng quan
Client

        React Web Application

                 |

              REST API

                 |

          NestJS Backend

                 |

---

PostgreSQL Redis Storage

Database Cache File Upload 6. Công nghệ sử dụng
Frontend
ReactJS
Mục đích:
Xây dựng giao diện người dùng.
Quản lý state.
Gọi API.
Tailwind CSS
Dùng để:
Thiết kế responsive UI.
Tối ưu tốc độ phát triển.
Backend
NestJS
Vai trò:
Xây dựng REST API.
Xử lý business logic.
Quản lý authentication.
Prisma ORM
Vai trò:
Mapping database.
Quản lý migration.
Database
PostgreSQL
Lưu trữ:
User
Internship
Application
Report
Evaluation
Redis
Sử dụng cho:
Cache dữ liệu.
Rate limiting.
Lưu trạng thái realtime.
Storage
Supabase Storage:
Lưu CV.
Lưu báo cáo.
Lưu tài liệu.
Realtime
Socket.IO:
Ứng dụng:
Chat giữa sinh viên và doanh nghiệp.
Notification realtime.
Deployment
Docker:
Container hóa ứng dụng.
Nginx:
Reverse proxy.
GitHub Actions:
CI/CD. 7. Thiết kế cơ sở dữ liệu
Hệ thống gồm khoảng 19 bảng chính:

**users** — Tài khoản chung cho tất cả role
id, email, password_hash, role (ADMIN/STUDENT/LECTURER/COMPANY), status, created_at

**refresh_tokens** — Quản lý phiên đăng nhập
id, user_id, token, expires_at, revoked

**student_profiles** — Hồ sơ sinh viên
id, user_id, student_code (MSSV), full_name, major, cv_url

**lecturer_profiles** — Hồ sơ giảng viên
id, user_id, full_name, department (khoa/bộ môn)

**company_profiles** — Hồ sơ doanh nghiệp
id, user_id, company_name, description, status (PENDING/APPROVED/REJECTED)

**semesters** — Quản lý kỳ thực tập
id, name (VD: "2026 Summer Internship"), start_date, end_date, status

**skills** — Danh mục kỹ năng
id, name

**student_skills** — Kỹ năng của sinh viên (many-to-many)
student_id, skill_id

**internship_skills** — Kỹ năng yêu cầu của vị trí (many-to-many)
internship_id, skill_id

**internships** — Bài đăng thực tập
id, company_id, title, description, requirements, deadline, status (DRAFT/OPEN/CLOSED)

**applications** — Đơn ứng tuyển
id, student_id, internship_id, status (PENDING/ACCEPTED/REJECTED), created_at

**application_status_history** — Lịch sử thay đổi trạng thái đơn
id, application_id, from_status, to_status, changed_by, created_at

**supervisions** — Quan hệ sinh viên - giảng viên (do Admin tạo)
id, student_id, lecturer_id, semester_id, status

**reports** — Báo cáo tuần của sinh viên
id, student_id, week, content, file_url, status (SUBMITTED/APPROVED/REJECTED)

**evaluations** — Đánh giá kết quả thực tập
id, student_id, company_score, lecturer_score, comment

**files** — Quản lý file tập trung
id, owner_id, type (CV/REPORT/CERTIFICATE), url, created_at

**messages** — Tin nhắn chat giữa sinh viên & doanh nghiệp
id, sender_id, receiver_id, content, created_at

**notifications** — Thông báo hệ thống
id, user_id, title, content, is_read, created_at

**audit_logs** — Lịch sử hoạt động (bảo mật)
id, user_id, action, entity, created_at 8. Các chức năng nâng cao
8.1. Hệ thống đề xuất thực tập (Skill Matching)
Hệ thống sử dụng các bảng `skills`, `student_skills` và `internship_skills` để đối sánh kỹ năng sinh viên với yêu cầu vị trí thực tập.
Cơ chế:
Kỹ năng được chuẩn hóa thành danh mục (bảng skills).
Sinh viên khai báo kỹ năng → lưu vào student_skills.
Doanh nghiệp gắn kỹ năng yêu cầu cho bài đăng → lưu vào internship_skills.
Hệ thống tính % matching dựa trên giao điểm giữa hai tập kỹ năng.
Ví dụ:
Sinh viên:
NestJS
PostgreSQL
Docker
Hệ thống đề xuất:
Backend Developer Intern (Requirements: NestJS, Database, Docker)

Matching:
90%
8.2. Dashboard thống kê
Admin:
Total Students: 500

Companies: 50

Internship Posts: 200

Success Rate: 75% 9. Kế hoạch thực hiện
Dự kiến 8 tuần, chia làm 4 Phase:

**Phase 1 — Core System (Tuần 1-2)**
Phân tích yêu cầu, thiết kế database hoàn chỉnh (~18 bảng).
Setup project (NestJS + React + Prisma + PostgreSQL).
Authentication module (register, login, refresh, logout, RBAC).
User management (CRUD users, roles).
Student profile + Company profile.

**Phase 2 — Nghiệp vụ chính (Tuần 3-4)**
Internship management (CRUD bài đăng, DRAFT/OPEN/CLOSED).
Application workflow (apply, tracking, status history).
Skill management (skills, student_skills, internship_skills).
Semester management.
Supervision management (Admin phân công giảng viên).
File upload (Supabase Storage cho CV, báo cáo).

**Phase 3 — Báo cáo & Đánh giá (Tuần 5-6)**
Report management (nộp báo cáo tuần, lecturer review, approve).
Evaluation (cả company_score + lecturer_score).
Dashboard thống kê (Admin).
Notification system.

**Phase 4 — Hoàn thiện (Tuần 7-8)**
Realtime chat (Socket.IO giữa sinh viên & doanh nghiệp).
Audit log.
Testing (unit test, integration test).
Deploy (Docker + Nginx + VPS + GitHub Actions CI/CD).
Viết báo cáo + Chuẩn bị demo. 10. Kết quả mong đợi
Sau khi hoàn thành, hệ thống có thể:
Hỗ trợ sinh viên tìm kiếm cơ hội thực tập.
Giúp doanh nghiệp tuyển dụng thực tập sinh.
Hỗ trợ giảng viên quản lý tiến độ.
Cung cấp nền tảng quản lý thực tập tập trung.
Áp dụng các kỹ thuật phát triển web hiện đại. 11. Hướng phát triển
Trong tương lai có thể mở rộng:
AI phân tích CV.
AI gợi ý công việc.
Mobile application.
Tích hợp LinkedIn.
Video interview.
Đánh giá kỹ năng tự động. 12. Kết luận
Đề tài "Xây dựng hệ thống hỗ trợ tìm kiếm và quản lý thực tập cho sinh viên" (InternHub) là một hệ thống web có tính ứng dụng thực tế cao, bao gồm nhiều thành phần của một hệ thống phần mềm hiện đại: authentication (JWT + RBAC), phân quyền đa role (4 nhóm người dùng), quản lý hồ sơ và kỹ năng, hệ thống đề xuất vị trí thực tập (skill matching), quản lý kỳ thực tập và phân công giảng viên, realtime communication (chat + notification), quản lý file tập trung (Supabase Storage), audit log, dashboard thống kê và triển khai hệ thống (Docker + CI/CD).
Đề tài phù hợp để triển khai trong phạm vi 2 tháng với nhóm 1–2 sinh viên, đồng thời tận dụng các công nghệ và kinh nghiệm phát triển backend đã có.

Nhận xét riêng cho trường hợp của bạn: nếu đem bản này đi duyệt đề tài, nó đủ mức 4 tín chỉ. Điểm mạnh nhất là bạn có thể chứng minh được nhiều thứ đã làm trước đó (RBAC, Redis, Socket.IO, Docker, PostgreSQL) chứ không phải học công nghệ mới từ đầu.
