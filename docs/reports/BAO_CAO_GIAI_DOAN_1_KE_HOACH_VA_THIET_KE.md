# BÁO CÁO TIẾN ĐỘ GIAI ĐOẠN 1
## QUY HOẠCH QUY TRÌNH CHUẨN, THIẾT KẾ KIẾN TRÚC & KẾ HOẠCH TRIỂN KHAI 2 THÁNG
### HỆ THỐNG QUẢN LÝ VÀ KẾT NỐI THỰC TẬP THÔNG MINH (CAREERBRIDGE)

---

### THÔNG TIN CHUNG
- **Đề tài:** Nền tảng Quản lý và Kết nối Thực tập Thông minh — CareerBridge
- **Giai đoạn báo cáo:** **Giai đoạn 1 (Lập Kế hoạch Chi tiết, Chuẩn hóa Quy trình & Thiết kế Kỹ thuật)**
- **Thời gian thực hiện:** 2 tuần (Tuần 1 – Tuần 2)
- **Thành viên thực hiện:** Phạm Hoàng Sơn, Võ Văn Quyến
- **Kính gửi:** Giảng viên Hướng dẫn

---

## I. MỤC TIÊU VÀ KẾT QUẢ TIẾP THU Ý KIẾN GÓP Ý CỦA THẦY

Dựa trên các ý kiến góp ý mang tính định hướng của Giảng viên hướng dẫn trong buổi họp trước, nhóm đã tập trung toàn bộ thời gian của Giai đoạn 1 để giải quyết triệt để 3 vấn đề cốt lõi:

1. **Chuẩn hóa quy trình nghiệp vụ là ưu tiên số một:**
   - Thay vì vội vã code tính năng rời rạc, nhóm đã rà soát lại toàn bộ vòng đời thực tập từ lúc khởi động đợt đến lúc nghiệm thu, đảm bảo logic giữa 4 vai trò (`ADMIN`, `COMPANY`, `STUDENT`, `LECTURER`) khép kín, minh bạch và không có xung đột trạng thái dữ liệu.
2. **Định hướng tự động hóa tuyển dụng cho doanh nghiệp:**
   - Đã nghiên cứu và hoàn thiện thiết kế kỹ thuật cho **Module OCR/Parsing CV tự build** (bóc tách cấu trúc CV) và **Model AI lọc & xếp hạng hồ sơ tự build** (tính toán Match Score theo yêu cầu của tin tuyển dụng) mà không phụ thuộc vào các API bên thứ ba tốn kém.
3. **Thực tế hóa quy trình phỏng vấn (Phỏng vấn Offline):**
   - Đã loại bỏ phương án xây dựng hệ thống video call trực tuyến phức tạp và kém ổn định. Thay vào đó, quy trình được chuẩn hóa theo luồng **Phỏng vấn trực tiếp tại doanh nghiệp** (lên lịch hẹn, gửi địa chỉ văn phòng, hướng dẫn chuẩn bị hồ sơ, cập nhật kết quả phỏng vấn).

---

## II. CÁC CÔNG VIỆC VÀ SẢN PHẨM ĐÃ HOÀN THÀNH TRONG GIAI ĐOẠN 1

### 1. Chuẩn hóa Quy trình Vòng đời Thực tập (Standard End-to-End Workflow)
Nhóm đã hoàn thiện sơ đồ quy trình chuẩn gồm 6 giai đoạn liên hoàn:
- **Khởi động & Xác minh DN:** Admin mở đợt tuyển $\rightarrow$ Doanh nghiệp nộp ĐKKD $\rightarrow$ Admin đối chiếu theo Checklist 5 bước với hạn SLA 48h $\rightarrow$ Phê duyệt (`APPROVED`) hoặc Yêu cầu bổ sung rõ lý do.
- **Đăng tin & Kiểm soát chất lượng:** Doanh nghiệp tạo tin từ form hoặc Mẫu tin/Clone $\rightarrow$ Hệ thống tự động kiểm tra qua bộ lọc Quality Gatekeeper (bắt buộc đủ vị trí, lịch làm, trợ cấp, kỹ năng, hạn nộp, người liên hệ) $\rightarrow$ Admin có quyền hậu kiểm, ẩn hoặc yêu cầu sửa tin vi phạm.
- **Ứng tuyển & Tự động hóa tuyển dụng:** Sinh viên nộp CV $\rightarrow$ Hệ thống tự động kích hoạt OCR Parser $\rightarrow$ Model AI tự build chấm điểm Match Score & xếp hạng $\rightarrow$ Doanh nghiệp sàng lọc $\rightarrow$ Lên lịch Phỏng vấn Offline $\rightarrow$ Cập nhật kết quả $\rightarrow$ Nếu trúng tuyển chuyển `ACCEPTED` và tự động sinh `InternshipPlacement`.
- **Phân công & Giám sát học vụ:** Admin duyệt lịch thực tập $\rightarrow$ Phân công Giảng viên phụ trách $\rightarrow$ Sinh viên nộp báo cáo tuần (tự động cảnh báo nộp trễ) $\rightarrow$ Giảng viên chấm duyệt báo cáo.
- **Đánh giá hai chiều độc lập:** Doanh nghiệp và Giảng viên chấm hai cột điểm độc lập theo thang điểm 10 (hệ thống tự động phát hiện phản hồi/điểm số bất thường).
- **Nghiệm thu & Kết xuất báo cáo:** Khóa học vụ $\rightarrow$ Khoa kết xuất Báo cáo tổng hợp Excel / PDF $\rightarrow$ Doanh nghiệp xem Dashboard phân tích tuyển dụng.

### 2. Thiết kế Mở rộng Cơ sở Dữ liệu (Prisma Schema Delta)
Đã hoàn thành bản đặc tả chi tiết mở rộng cơ sở dữ liệu trên hệ thống NestJS + Prisma:
- **`CompanyProfile`**: Bổ sung `slaDeadline`, `checklistPassed` (lưu kết quả 5 tiêu chí), `revisionRequests` (lý do yêu cầu sửa), `isSuspended`, `suspensionReason` (cơ chế tạm dừng DN vi phạm có kiểm soát).
- **`Internship`**: Bổ sung `workSchedule`, `contactPersonName`, `contactPhone`, `contactEmail`, `isTemplate` (lưu mẫu tin), `viewsCount` (lượt xem tin), `moderationStatus` (Admin kiểm duyệt tin).
- **`InterviewSchedule` (Model mới)**: Quản lý lịch hẹn phỏng vấn offline (`scheduledAt`, `location`, `interviewerName`, `instructions`, `result`: `PENDING`/`PASSED`/`FAILED`).
- **`Application`**: Bổ sung các trường `parsedCvData` (kết quả OCR), `aiMatchScore`, `aiMatchBreakdown`, và mở rộng trạng thái `INTERVIEW_SCHEDULED`, `INTERVIEW_COMPLETED`.
- **`InternshipViewLog` (Model mới)**: Lưu log lượt xem phục vụ thống kê phễu tuyển dụng.

### 3. Thiết kế Kỹ thuật Module OCR & Model AI Sàng lọc CV Tự Build
- **Kiến trúc OCR bóc tách CV:**
  - Đối với PDF có lớp văn bản (text stream): Trích xuất trực tiếp bằng thư viện stream nội bộ nhằm đạt tốc độ xử lý dưới 500ms.
  - Đối với PDF dạng ảnh scan: Tích hợp engine Tesseract OCR (bộ dữ liệu `vie + eng`) tự build cục bộ.
  - Bộ trích xuất thực thể (Rule-based Regex + Lexicon): Bóc tách chuẩn xác Họ tên, Email, SĐT, Trường học/GPA, Kỹ năng và Kinh nghiệm/Dự án.
- **Mô hình Chấm điểm Match Score Đa Tiêu chí:**
  - Áp dụng công thức tính điểm tương quan có trọng số:
    $$Score = 50\% \times \text{Kỹ năng bắt buộc/ưu tiên} + 25\% \times \text{Kinh nghiệm/Dự án} + 15\% \times \text{Học vấn/GPA} + 10\% \times \text{Độ phù hợp địa điểm/hình thức}$$
  - Cung cấp trực quan bảng giải thích điểm (kỹ năng đạt được, kỹ năng còn thiếu) giúp nhà tuyển dụng ra quyết định nhanh chóng và khách quan.

### 4. Thiết kế Dashboard Học vụ & Module Xuất Báo cáo Excel / PDF
- **Dashboard Giám sát Học vụ cho Khoa:**
  - Bộ lọc 1: Sinh viên chưa có placement (phân loại theo ngành/lớp).
  - Bộ lọc 2: Báo cáo tuần nộp trễ (tự động so sánh với tuần thực tập hiện tại).
  - Bộ lọc 3: Doanh nghiệp có phản hồi bất thường (điểm số quá thấp hoặc chênh lệch bất thường).
  - Bộ lọc 4: Placement sắp hết hạn học vụ (cần chốt điểm và hoàn tất nghiệm thu).
- **Quy chuẩn Xuất Báo cáo:**
  - File Excel đa sheet (`exceljs`): Sheet 1 (Danh sách phân công), Sheet 2 (Tiến độ báo cáo tuần 1-12), Sheet 3 (Bảng tổng hợp điểm doanh nghiệp và giảng viên).
  - File PDF (`pdfkit`): Biên bản đánh giá kết quả thực tập tốt nghiệp chuẩn thể thức văn bản hành chính.

### 5. Lập Kế hoạch Hành động Chi tiết 2 Tháng (WBS & RACI Matrix)
- Đã phân rã công việc chi tiết thành 8 tuần (tương ứng 4 giai đoạn).
- Phân công rõ trách nhiệm giữa 2 thành viên:
  - **Phạm Hoàng Sơn:** Phụ trách Xác minh DN, Chuẩn hóa Tin tuyển dụng, Phỏng vấn Offline, Dashboard Học vụ & Module Xuất báo cáo.
  - **Võ Văn Quyến:** Phụ trách Module OCR CV tự build, Model AI Chấm điểm lọc ứng viên, Analytics Tuyển dụng DN & Cảnh báo Socket.IO.

---

## III. KẾ HOẠCH TRIỂN KHAI GIAI ĐOẠN 2 TIẾP THEO (TUẦN 3 – TUẦN 4)

Trong 2 tuần tới của Giai đoạn 2, nhóm sẽ tiến hành lập trình hoàn thiện các phân hệ nghiệp vụ cốt lõi:
1. **Hoàn thiện Hồ sơ & Xác minh Doanh nghiệp:**
   - Triển khai giao diện và API duyệt theo checklist 5 bước, tích hợp đồng hồ đếm ngược SLA 48h.
   - Hiện thực luồng yêu cầu bổ sung giấy tờ và cơ chế đình chỉ (`SUSPENDED`) DN vi phạm.
2. **Chuẩn hóa Tin tuyển dụng & Bộ lọc Gatekeeper:**
   - Áp dụng kiểm duyệt chặt chẽ các trường thông tin bắt buộc trước khi mở tin (`OPEN`).
   - Xây dựng chức năng lưu mẫu tin (`JobTemplate`) và đăng lại tin tuyển dụng (`Clone/Repost`).
   - Cung cấp quyền Admin ẩn tin vi phạm hoặc yêu cầu chỉnh sửa tin trùng lặp.
3. **Hiện thực Phân hệ Phỏng vấn Offline:**
   - Xây dựng giao diện đặt lịch phỏng vấn offline, tự động gửi thông báo thời gian thực & email đến sinh viên.
   - Cho phép doanh nghiệp cập nhật kết quả phỏng vấn (`PASSED` / `FAILED`) trực tiếp trên hệ thống.
