# Kế hoạch Triển khai Chi tiết: Tích hợp Giao diện Web Doanh nghiệp (Giai đoạn 3)

> **Mục tiêu:** Cung cấp trải nghiệm người dùng cao cấp cho Nhà tuyển dụng trên CareerBridge Web Portal: từ quản lý & cấp phát Token AI Worker nội bộ, theo dõi trạng thái quét CV theo thời gian thực, lọc/sắp xếp ứng viên theo điểm AI, đến xem báo cáo phân tích chi tiết kỹ năng (Skill Gap, Điểm mạnh/Điểm yếu, Tóm tắt năng lực).

---

## 1. Phân tích Hiện trạng & Yêu cầu Giao diện

### 1.1. Hiện trạng Codebase Frontend
* Màn hình quản lý ứng viên của Doanh nghiệp hiện tại là [`ManageApplicants.tsx`](file:///d:/CareerBridge/Frontend/src/components/CompanyView/ManageApplicants.tsx).
* Bảng ứng viên hiện mới chỉ hiển thị điểm kỹ năng tự khai báo (`matchScore` - tính từ danh sách kỹ năng sinh viên tick chọn so với tin tuyển dụng).
* Chưa có cột điểm AI (`aiScore`), chưa có trạng thái quét CV, chưa có màn hình cấu hình AI Worker cho doanh nghiệp.

### 1.2. Mục tiêu Giai đoạn 3
1. **Module Cài đặt & Cấp phát AI Worker (`CompanyAiWorkerModal.tsx`):**
   * Doanh nghiệp có thể bật/tắt tính năng **"Tự động quét CV khi có hồ sơ mới"** (`autoAiScanEnabled`).
   * Xem danh sách Worker đang kết nối kèm trạng thái sống (`Online` xanh lá / `Offline` xám).
   * Tạo Worker mới $\rightarrow$ Sinh mã bảo mật `cwb_...` hiển thị 1 lần duy nhất kèm nút Copy và hướng dẫn chạy Worker trong 1 phút.
   * Xóa / Thu hồi Worker.
2. **Cập nhật Bảng Ứng viên (`ManageApplicants.tsx`):**
   * Bổ sung Badge **Đánh giá AI**:
     * Đang chờ/đang quét: Badge nhấp nháy tím `Đang quét AI...` kèm spinner nhẹ.
     * Đã quét xong: Hiển thị điểm số (ví dụ `94/100`) và Khuyến nghị (`Rất phù hợp`, `Phù hợp`, `Tiềm năng`, `Cần cân nhắc`).
     * Lỗi: Badge đỏ `Lỗi quét CV` kèm nút bấm quét lại.
   * Phân biệt rành mạch giữa **Điểm AI** (`aiScore`) và **Kỹ năng tự khai** (`matchScore`).
   * Bộ lọc nâng cao: Lọc theo khuyến nghị AI, lọc theo khoảng điểm AI, sắp xếp theo điểm AI cao nhất.
3. **Cửa sổ Chi tiết Phân tích CV (`AiScanDetailModal.tsx`):**
   * Mở ra khi bấm vào Badge AI hoặc nút "Xem phân tích AI":
     * Biểu đồ/Thẻ tròn điểm số tổng quan + Ước tính số năm kinh nghiệm.
     * Bảng đối chiếu kỹ năng trực quan: Kỹ năng đáp ứng (Tag xanh), Kỹ năng còn thiếu (Tag đỏ/cam), Kỹ năng công nghệ khác (Tag xám).
     * Danh sách gạch đầu dòng **Điểm mạnh nổi bật** & **Điểm cần lưu ý khi phỏng vấn**.
     * Đoạn tóm tắt cô đọng năng lực ứng viên.
     * Nút bấm **"Quét lại CV"** (kích hoạt `POST /api/v1/ai-worker/applications/:id/rescan`).

---

## 2. Thiết kế Kiến trúc Frontend & Files Thay Đổi

```text
Frontend/src/
├── ai-worker/
│   ├── api.ts                               # Client gọi các API quản lý AI Worker của Doanh nghiệp
│   └── types.ts                             # Kiểu dữ liệu TypeScript cho AI Worker & Quét CV
│
├── applications/
│   └── api.ts                               # Cập nhật ApplicationRecord bổ sung aiScore & aiScanJob
│
├── types.ts                                 # Cập nhật Application interface bổ sung aiScore & aiScanJob
├── App.tsx                                  # Cập nhật toLegacyApplication mapping aiScore & aiScanJob
│
└── components/CompanyView/
    ├── CompanyAiWorkerModal.tsx             # [MỚI] Modal quản lý danh sách Worker, tạo Token, bật/tắt Auto-scan
    ├── AiScanDetailModal.tsx                # [MỚI] Modal hiển thị báo cáo phân tích AI chuyên sâu
    └── ManageApplicants.tsx                 # [CẬP NHẬT] Thêm Badge AI, nút mở cài đặt Worker, lọc theo điểm AI
```

---

## 3. Đặc tả Chi tiết Từng Thành phần

### 3.1. API Client Module (`Frontend/src/ai-worker/api.ts`)
Tương thích 100% với Backend NestJS đã xây dựng ở Giai đoạn 1:
```typescript
export const aiWorkerApi = {
  // Lấy danh sách worker, thống kê job và cờ autoAiScanEnabled
  getCompanyWorkers: async () =>
    (await api.get<ApiSuccess<CompanyWorkerDashboardData>>('/ai-worker/workers')).data.data,

  // Tạo worker mới (trả về raw token chỉ 1 lần duy nhất)
  createWorker: async (input: { name: string; modelName?: string }) =>
    (await api.post<ApiSuccess<CreateWorkerResponse>>('/ai-worker/workers', input)).data.data,

  // Xóa / thu hồi worker
  deleteWorker: async (workerId: string) =>
    (await api.delete<ApiSuccess<{ deleted: boolean }>>(`/ai-worker/workers/${workerId}`)).data.data,

  // Bật/tắt quét CV tự động
  updateSettings: async (input: { autoAiScanEnabled: boolean }) =>
    (await api.patch<ApiSuccess<{ autoAiScanEnabled: boolean }>>('/ai-worker/settings', input)).data.data,

  // Yêu cầu quét lại CV cho một hồ sơ
  rescanApplication: async (applicationId: string) =>
    (await api.post<ApiSuccess<{ success: boolean; jobId: string }>>(
      `/ai-worker/applications/${applicationId}/rescan`
    )).data.data,
};
```

---

### 3.2. Cập nhật Model & Mapping Dữ liệu
1. **Trong `Frontend/src/applications/api.ts`:**
   * Bổ sung `aiScore: number | null` và `aiScanJob: AiScanJobRecord | null` vào `ApplicationRecord`.
2. **Trong `Frontend/src/types.ts`:**
   * Bổ sung `aiScore?: number | null` và `aiScanJob?: AiScanJobRecord | null` vào `Application`.
3. **Trong `Frontend/src/App.tsx`:**
   * Cập nhật hàm `toLegacyApplication` để map dữ liệu:
     ```typescript
     aiScore: record.aiScore ?? null,
     aiScanJob: record.aiScanJob ?? null,
     ```

---

### 3.3. Modal Quản lý AI Worker Doanh nghiệp (`CompanyAiWorkerModal.tsx`)
* **Thanh Header & Thống kê nhanh:**
  * Toggle Switch hiện đại: Bật/Tắt **"Tự động quét CV khi có hồ sơ mới"**.
  * 3 thẻ thống kê bo góc:
    * `Chờ quét`: Số job PENDING (Màu vàng hổ phách).
    * `Đã hoàn thành`: Số job COMPLETED (Màu xanh ngọc).
    * `Lỗi`: Số job FAILED (Màu đỏ san hô).
* **Bảng danh sách Workers:**
  * Cột Tên Worker & Mô hình (ví dụ: `Worker-01`, model: `qwen2.5:7b`).
  * Trạng thái Online/Offline: Chấm tròn xanh lá phát sáng nhấp nháy nếu `isOnline === true` (ping < 60s), chấm xám nếu offline.
  * Lần cuối nhìn thấy (`lastSeenAt`): Ví dụ "2 phút trước" hoặc "Chưa từng kết nối".
  * Thao tác: Nút Xóa/Thu hồi có hộp thoại xác nhận an toàn (`confirm`).
* **Hộp thoại Tạo Token mới:**
  * Nhập tên Worker (ví dụ: `Server-Phong-IT-01`).
  * Bấm "Tạo Token" $\rightarrow$ Hiển thị khung sao chép Token bí mật (`cwb_...`) màu xanh đậm nổi bật kèm cảnh báo: *"Mã token này chỉ hiển thị một lần duy nhất vì lý do bảo mật"*.
  * Hộp thoại mẫu lệnh chạy Worker (hỗ trợ 1 click copy file `.env` hoặc lệnh chạy).

---

### 3.4. Nâng cấp Bảng Ứng viên (`ManageApplicants.tsx`)
1. **Nút "Cấu hình AI Worker" trên thanh công cụ:**
   * Đặt cạnh ô tìm kiếm và bộ lọc trạng thái.
   * Có chấm báo hiệu: Xanh lá nếu có ít nhất 1 Worker Online, Xám nếu tất cả Worker đang Offline.
2. **Badge Đánh giá AI trên từng thẻ/dòng ứng viên:**
   * **Chưa có job:** Không hiển thị (hoặc hiển thị nút "Quét CV bằng AI").
   * **Đang chờ / Đang quét:** Badge nền tím nhạt `border border-purple-200 bg-purple-50 text-purple-700` kèm spinner quay: `Đang quét AI...`.
   * **Đã quét xong (`COMPLETED`):**
     * Điểm số: Badge gradient tím-xanh `92/100` kèm icon Sparkles.
     * Khuyến nghị:
       * `STRONG_HIRE`: Badge xanh lá đậm `Rất phù hợp`.
       * `HIRE`: Badge xanh ngọc `Phù hợp`.
       * `POTENTIAL`: Badge cam hổ phách `Tiềm năng`.
       * `NOT_RECOMMENDED`: Badge xám đỏ `Cần cân nhắc`.
     * Khi click vào: Mở `AiScanDetailModal`.
   * **Lỗi quét (`FAILED`):** Badge đỏ nhạt `Lỗi quét CV` + Nút tròn "Quét lại".
3. **Bộ lọc Nâng cao (Filter & Sort):**
   * Lọc theo Khuyến nghị AI: Tất cả | Rất phù hợp | Phù hợp | Tiềm năng | Cần cân nhắc.
   * Lọc theo Khoảng điểm AI: Tất cả | $\ge 80$ điểm | $\ge 60$ điểm | $< 60$ điểm.
   * Nút Sắp xếp: Mới nhất | Điểm AI cao nhất | Điểm kỹ năng khai báo cao nhất.

---

### 3.5. Modal Chi tiết Phân tích AI (`AiScanDetailModal.tsx`)
* **Header:** Tên ứng viên, vị trí ứng tuyển, nút Quét lại CV (`Rescan`), nút Đóng.
* **Khối 1: Tổng quan Điểm & Đánh giá:**
  * Vòng tròn điểm số AI lớn (Gradient SVG Circular Score).
  * Khuyến nghị tuyển dụng kèm lời giải thích ngắn gọn.
  * Số năm kinh nghiệm ước tính từ CV (`experienceYears` năm).
* **Khối 2: Phân tích Kỹ năng Chuyên sâu (Skill Matrix):**
  * *Kỹ năng đáp ứng (`matchedSkills`):* Các tag xanh lá kèm biểu tượng dấu tích xanh `CheckCircle2`.
  * *Kỹ năng còn thiếu (`missingSkills`):* Các tag đỏ/cam kèm biểu tượng dấu chấm than `AlertCircle`.
  * *Kỹ năng khác bóc tách được (`extractedSkills`):* Các tag xám hiện đại.
* **Khối 3: Bảng 2 cột Điểm mạnh & Điểm cần lưu ý:**
  * Cột trái (Xanh ngọc): **Điểm mạnh nổi bật** (liệt kê danh sách bullet kèm icon `TrendingUp`).
  * Cột phải (Hổ phách): **Điểm cần lưu ý / Câu hỏi gợi ý khi phỏng vấn** (liệt kê danh sách bullet kèm icon `HelpCircle`).
* **Khối 4: Tóm tắt Năng lực Ứng viên (Executive Summary):**
  * Hộp thoại nổi bật với trích dẫn chuyên nghiệp do AI tổng hợp từ CV.
* **Footer:**
  * Thông tin model xử lý (ví dụ: `qwen2.5:7b` hoặc `mock-heuristic-v1`), thời gian hoàn thành quét, nút mở file PDF CV gốc để đối chiếu trực tiếp.

---

## 4. Kế hoạch Triển khai Từng Bước (Implementation Steps)

### Bước 1: Tạo Module API & Cập nhật Types Frontend
* Tạo `Frontend/src/ai-worker/api.ts` và `Frontend/src/ai-worker/types.ts`.
* Bổ sung `aiScore` và `aiScanJob` vào `ApplicationRecord` và `Application`.
* Bổ sung ánh xạ trong `toLegacyApplication` (`App.tsx`).

### Bước 2: Xây dựng Modal Quản lý AI Worker (`CompanyAiWorkerModal.tsx`)
* Thiết kế UI Toggle Auto-scan, danh sách Worker, hiển thị Online/Offline chấm xanh nhấp nháy.
* Xây dựng flow tạo Token mới an toàn (copy to clipboard, hiển thị 1 lần, mẫu hướng dẫn chạy).

### Bước 3: Xây dựng Modal Chi tiết Báo cáo AI (`AiScanDetailModal.tsx`)
* Thiết kế Layout 4 khối: Điểm số, Bảng kỹ năng (Khớp / Thiếu / Khác), Điểm mạnh / Yếu, Tóm tắt năng lực.
* Tích hợp nút gọi API quét lại CV (`rescanApplication`).

### Bước 4: Tích hợp vào `ManageApplicants.tsx`
* Bổ sung nút mở Modal Quản lý Worker trên thanh Header.
* Hiển thị Badge Đánh giá AI (Đang quét, Điểm số, Khuyến nghị, Lỗi).
* Tích hợp bộ lọc theo Khuyến nghị AI và khoảng điểm AI.
* Xử lý click mở `AiScanDetailModal`.

### Bước 5: Kiểm thử Giao diện & Đảm bảo Không lỗi
* Kiểm tra `npm run build` trên Frontend.
* Kiểm thử responsive trên các kích thước màn hình (Desktop, Tablet, Mobile).
* Kiểm tra trải nghiệm người dùng: Không dùng dropdown mặc định thô sơ, màu sắc hài hòa, animation mượt mà.

---

## 5. Tiêu chí Nghiệm thu Giai đoạn 3 (Acceptance Checklist)

- [ ] Doanh nghiệp bật/tắt được tính năng Tự động quét CV (`autoAiScanEnabled`).
- [ ] Doanh nghiệp tạo được Token mới, sao chép được token và nhìn thấy Worker hiện trạng thái Online khi Worker kết nối.
- [ ] Bảng ứng viên hiển thị rõ ràng cột Điểm AI và Khuyến nghị, phân biệt hoàn toàn với điểm `matchScore`.
- [ ] Hồ sơ mới nộp hiển thị trạng thái `Đang quét AI...` nhấp nháy, sau khi worker hoàn thành thì tự động cập nhật điểm.
- [ ] HR có thể bấm nút "Quét lại CV" khi cần thiết.
- [ ] Modal chi tiết phân tích AI hiển thị trực quan đầy đủ: Kỹ năng khớp (xanh), Kỹ năng thiếu (đỏ), Điểm mạnh, Điểm yếu, Tóm tắt năng lực.
- [ ] Frontend build sạch sẽ (`npm run build`), không có lỗi TypeScript hoặc vỡ giao diện.
