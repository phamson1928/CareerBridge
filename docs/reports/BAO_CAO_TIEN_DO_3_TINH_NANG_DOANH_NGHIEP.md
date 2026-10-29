# BÁO CÁO TIẾN ĐỘ THỰC HIỆN DỰ ÁN CAREERBRIDGE
## Chuyên đề: Hoàn Thiện 03 Phân Hệ Nghiệp Vụ Doanh Nghiệp & Kiểm Duyệt Nhà Trường

---

* **Học phần / Đồ án:** Hệ thống Quản trị & Kết nối Thực tập Doanh nghiệp (CareerBridge)
* **Đối tượng báo cáo:** Giảng viên hướng dẫn / Hội đồng đánh giá
* **Mục tiêu:** Báo cáo chi tiết các chức năng đã xây dựng và hoàn thiện, giải quyết các bài toán thực tế cho Doanh nghiệp, Sinh viên và Nhà trường (không đi sâu vào mã nguồn kỹ thuật).

---

## I. TỔNG QUAN KẾT QUẢ ĐÃ ĐẠT ĐƯỢC

Trong giai đoạn này, hệ thống CareerBridge đã được phát triển và hoàn thiện đồng bộ cả quy trình xử lý dữ liệu và giao diện người dùng cho **03 phân hệ chức năng trọng điểm**:

1. **Phân hệ Xác minh & Kiểm duyệt Doanh nghiệp (Company Verification & Moderation):** Đảm bảo tính pháp lý, minh bạch của đơn vị tuyển dụng liên kết với nhà trường; bảo vệ sinh viên trước nguy cơ tin tuyển dụng rác hoặc lừa đảo.
2. **Phân hệ Mẫu tin tuyển dụng & Đăng lại tin nhanh (Internship Templates & Reposting):** Giúp doanh nghiệp chuẩn hóa mô tả công việc, tái sử dụng các mẫu tin tuyển dụng qua từng học kỳ chỉ với 1 cú click.
3. **Phân hệ Thống kê Tuyển dụng & Phân tích Ứng viên (Company Recruitment Analytics & Dashboard):** Cung cấp hệ thống báo cáo số liệu toàn diện, phễu chuyển đổi tuyển dụng trực quan và phân tích độ phù hợp kỹ năng của ứng viên (đảm bảo bảo mật ẩn danh).

---

## II. CHI TIẾT CÁC PHÂN HỆ ĐÃ XÂY DỰNG

### 1. Phân hệ Xác minh & Kiểm duyệt Doanh nghiệp (Company Verification & Moderation)

#### a. Vấn đề thực tế giải quyết:
Trong các cổng việc làm và thực tập, nếu không có khâu thẩm định danh tính, các đơn vị chưa rõ tư cách pháp nhân có thể đăng tải tin tuyển dụng không đúng sự thật, gây rủi ro lớn cho sinh viên về an toàn lao động và bảo mật thông tin.

#### b. Các chức năng đã triển khai:
* **Hồ sơ pháp lý điện tử của Doanh nghiệp:**
  * Doanh nghiệp tải lên Giấy chứng nhận đăng ký doanh nghiệp (ĐKKD), Giấy phép kinh doanh, mã số thuế/mã số doanh nghiệp, địa chỉ trụ sở và thông tin người đại diện theo pháp luật hoặc người được ủy quyền.
* **Quy trình kiểm duyệt chuẩn hóa cho Quản trị viên (Admin / Nhà trường):**
  * Xây dựng danh mục kiểm tra (Checklist) thẩm định gồm 6 tiêu chí khắt khe:
    1. Tên pháp nhân trên hệ thống trùng khớp với giấy phép đăng ký.
    2. Mã số doanh nghiệp / Mã số thuế hợp lệ và đang hoạt động.
    3. Người liên hệ đại diện có thẩm quyền hoặc có giấy ủy quyền.
    4. Ngành nghề kinh doanh phù hợp với các chuyên ngành đào tạo của nhà trường.
    5. Địa chỉ hoạt động rõ ràng, có thật.
    6. Tính nguyên bản và rõ ràng của tài liệu đính kèm.
  * Hỗ trợ hai luồng kết quả kiểm duyệt: **Phê duyệt (Approve)** khi đạt đủ các tiêu chí; hoặc **Từ chối / Yêu cầu bổ sung (Reject)** kèm lý do chi tiết và mã nguyên nhân chuẩn hóa để doanh nghiệp cập nhật lại.
* **Giám sát thời gian phản hồi (Cam kết SLA):**
  * Hệ thống tự động thiết lập hạn xử lý hồ sơ (48 – 72 giờ làm việc).
  * Tự động cảnh báo hồ sơ sắp đến hạn hoặc quá hạn (Overdue) để cán bộ phụ trách nhà trường không bị bỏ quên yêu cầu của đối tác.
* **Cơ chế Tạm dừng (Suspend) & Mở khóa (Unsuspend):**
  * Cho phép Quản trị viên tạm thời khóa tài khoản doanh nghiệp khi phát sinh khiếu nại, phản ánh tiêu cực từ sinh viên hoặc vi phạm nội quy thực tập.
  * Ghi nhận đầy đủ lý do tạm đình chỉ và hỗ trợ khôi phục trạng thái hoạt động bình thường sau khi xử lý xong tranh chấp.

---

### 2. Phân hệ Mẫu tin tuyển dụng & Đăng lại tin nhanh (Internship Templates & Reposting)

#### a. Vấn đề thực tế giải quyết:
Doanh nghiệp tham gia tiếp nhận sinh viên thực tập qua nhiều học kỳ (kỳ mùa Thu, mùa Xuân, mùa Hè) thường tuyển các vị trí có yêu cầu chuyên môn tương tự nhau. Việc phải nhập lại thủ công từ đầu mỗi khi mở đợt mới gây mất thời gian và dễ xảy ra sai sót dữ liệu.

#### b. Các chức năng đã triển khai:
* **Thư viện Mẫu tin tuyển dụng chuẩn (Internship Templates):**
  * Doanh nghiệp có thể soạn sẵn các khung tuyển dụng mẫu cho các vị trí đặc trưng (ví dụ: *Lập trình viên Backend Node.js*, *Kỹ sư Kiểm thử phần mềm*, *Chuyên viên Marketing số*...).
  * Mỗi mẫu tin lưu trữ đầy đủ: Tiêu đề chuẩn, phòng ban, hình thức làm việc (Onsite, Remote, Hybrid), chỉ tiêu tuyển dự kiến, mức phụ cấp/lương thưởng, mô tả nhiệm vụ, yêu cầu ứng viên và danh mục các kỹ năng bắt buộc/tùy chọn.
  * Hỗ trợ giới hạn linh hoạt (tối đa 20 mẫu/doanh nghiệp) giúp doanh nghiệp sắp xếp danh mục gọn gàng.
* **Tính năng "Lưu tin đang có thành mẫu":**
  * Doanh nghiệp chỉ cần nhấn nút "Lưu làm mẫu" trực tiếp từ một tin tuyển dụng đang hoạt động tốt mà không cần nhập lại form tạo mẫu.
* **Tạo tin tuyển dụng mới tức thì từ mẫu:**
  * Doanh nghiệp chọn mẫu tin có sẵn $\rightarrow$ Chọn đợt thực tập áp dụng $\rightarrow$ Điều chỉnh hạn nộp hồ sơ. Hệ thống sẽ tự động khởi tạo tin tuyển dụng mới với đầy đủ thông tin chuẩn hóa.
* **Tính năng "Đăng lại tin" (Repost) sang đợt mới:**
  * Cho phép tái sử dụng trực tiếp một bài đăng từ học kỳ cũ sang học kỳ mới chỉ với 1 thao tác, tự động kế thừa mô tả, yêu cầu và kỹ năng.

---

### 3. Phân hệ Thống kê Tuyển dụng & Phân tích Ứng viên (Company Recruitment Analytics & Dashboard)

#### a. Vấn đề thực tế giải quyết:
Doanh nghiệp sau khi đăng tin thường không nắm được mức độ quan tâm của sinh viên (tin có tiếp cận đúng đối tượng không, tỷ lệ sinh viên xem xong có nộp đơn không, chất lượng kỹ năng của sinh viên nộp vào có đáp ứng yêu cầu tuyển dụng không).

#### b. Các chức năng đã triển khai:
* **Ghi nhận lượt xem tin chính xác & Cơ chế chống số liệu ảo (Anti-spam Cooldown):**
  * Hệ thống tự động đếm lượt xem khi sinh viên mở xem chi tiết bài đăng tuyển dụng.
  * Cơ chế bảo vệ 24 giờ: Nếu một sinh viên xem lại nhiều lần trong cùng một ngày, hệ thống chỉ ghi nhận 1 lần xem duy nhất; lượt xem từ cán bộ quản trị hoặc từ chính doanh nghiệp hoàn toàn không được tính vào số liệu.
  * Báo cáo tách bạch giữa **Tổng số lượt xem** và **Số lượng sinh viên duy nhất** quan tâm.
* **Bảng chỉ số tổng quan (KPIs Overview):**
  * Thống kê tổng số tin đăng, số tin đang mở nhận hồ sơ, số tin đã đóng, bản nháp.
  * Thống kê tỷ lệ lấp đầy chỉ tiêu tuyển dụng (tổng số lượng sinh viên đã trúng tuyển so với chỉ tiêu doanh nghiệp đề ra).
  * Đo lường **Thời gian tuyển dụng trung bình (Time-to-Hire)**:
    * *Thời gian trung bình từ lúc nộp đơn tới khi được nhận (Avg Hours to Accept).*
    * *Thời gian trung bình ra quyết định tiếp nhận hoặc từ chối (Avg Hours to Decision).*
* **Phễu chuyển đổi tuyển dụng trực quan (Recruitment Funnel):**
  * Hiển thị mô hình phễu 5 giai đoạn:
    1. **Đã nộp đơn (Applied):** 100% hồ sơ tiếp cận.
    2. **Đang / Đã xem xét (Reviewing):** Tỷ lệ hồ sơ vượt qua vòng sàng lọc sơ bộ.
    3. **Được nhận (Accepted):** Tỷ lệ sinh viên trúng tuyển chính thức.
    4. **Từ chối (Rejected):** Tỷ lệ hồ sơ không phù hợp.
    5. **Rút hồ sơ (Withdrawn):** Số lượng sinh viên tự hủy đơn ứng tuyển.
  * Đo lường tỷ lệ trúng tuyển sau khi đã vào vòng phỏng vấn/xét duyệt (`Accept given Reviewing`).
* **Phân tích nguồn kỹ năng ứng viên (Đảm bảo bảo mật & ẩn danh hoàn toàn):**
  * **Top 10 kỹ năng phổ biến nhất:** Bảng xếp hạng các kỹ năng mà những sinh viên nộp đơn vào công ty sở hữu nhiều nhất kèm tỷ lệ phần trăm phân bổ.
  * **Độ phủ kỹ năng của bài đăng (Required Skill Coverage):** Đo lường chi tiết từng kỹ năng bắt buộc và tùy chọn mà công ty yêu cầu có bao nhiêu ứng viên đáp ứng, hiển thị dưới dạng thanh đo trực quan đổi màu cảnh báo theo độ phủ.
  * **Thống kê điểm tương thích (Match Score):** Báo cáo điểm trung bình, điểm cao nhất và điểm thấp nhất do thuật toán đo độ khớp giữa CV sinh viên và bài đăng.
  * *Cam kết bảo mật:* Báo cáo phân tích kỹ năng không hiển thị bất kỳ thông tin định danh cá nhân (PII) nào như tên, email hay mã sinh viên.
* **Bảng thống kê chi tiết theo từng tin tuyển dụng:**
  * Bảng tổng hợp kèm phân trang cho phép doanh nghiệp tra cứu hiệu quả của từng vị trí tuyển dụng.
  * Cửa sổ xem chuyên sâu (Modal) phân tích trọn vẹn số liệu riêng biệt cho từng bài đăng.

---

## III. BẢNG TỔNG HỢP VAI TRÒ & GIÁ TRỊ MANG LẠI

| Đối tượng | Quyền lợi & Chức năng được hưởng |
| :--- | :--- |
| **Nhà trường / Quản trị viên** | • Nắm chắc tính pháp lý của doanh nghiệp tham gia kết nối.<br>• Có công cụ kiểm soát hồ sơ theo checklist rõ ràng, cảnh báo hồ sơ quá hạn (SLA).<br>• Có quyền tạm dừng hoặc khóa các doanh nghiệp có dấu hiệu vi phạm để bảo vệ sinh viên. |
| **Doanh nghiệp tuyển dụng** | • Có thư viện mẫu tin tuyển dụng chuẩn, đăng tin mới hoặc đăng lại tin chỉ trong 1 click.<br>• Nắm rõ số lượng sinh viên xem và quan tâm bài tuyển dụng thực tế.<br>• Theo dõi phễu tuyển dụng, thời gian xử lý hồ sơ và độ phủ kỹ năng của sinh viên để kịp thời điều chỉnh tiêu chí tuyển dụng. |
| **Sinh viên** | • Được tiếp cận các tin tuyển dụng uy tín từ doanh nghiệp đã qua thẩm định pháp lý.<br>• Tránh được các tin tuyển dụng lừa đảo hoặc công ty ảo.<br>• Thông tin cá nhân được bảo vệ an toàn (ẩn danh trong các báo cáo phân tích kỹ năng). |

---

## IV. KẾT LUẬN & ĐÁNH GIÁ CHẤT LƯỢNG

1. **Về mặt kỹ thuật:** Toàn bộ các luồng xử lý phía máy chủ (Backend) và giao diện người dùng (Frontend) đều đã được hoàn thiện đồng bộ, không phát sinh lỗi biên dịch và vượt qua 100% các kịch bản kiểm thử luồng dữ liệu (cả quy trình kiểm duyệt, tính năng mẫu tin và thống kê số liệu).
2. **Về mặt ứng dụng:** Ba phân hệ trên giúp hệ thống CareerBridge hoàn thiện trọn vẹn chu trình hợp tác giữa Nhà trường – Doanh nghiệp – Sinh viên: từ khâu thẩm định pháp lý, đăng tuyển chuẩn hóa, đến khâu đo lường hiệu quả sau tuyển dụng.
