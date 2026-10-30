# Kế hoạch Triển khai Chi tiết: AI Worker Client Daemon (Giai đoạn 2)

> **Mục tiêu:** Xây dựng ứng dụng Client độc lập (CLI Daemon) đóng vai trò là "Công nhân AI" chạy ngầm trên máy chủ/máy trạm của Doanh nghiệp. Worker liên tục lắng nghe tác vụ quét CV từ CareerBridge Backend, tải CV an toàn, phân tích bằng AI hoàn toàn nội bộ (hỗ trợ Mock khi dev/test và Ollama Local AI khi triển khai thực tế), và đồng bộ kết quả chi tiết về hệ thống mà không để lọt dữ liệu ra bên ngoài.

---

## 1. Quyết định Kiến trúc & Công nghệ

### 1.1. Lựa chọn Runtime: **TypeScript / Node.js (Standalone CLI)**
* **Lý do lựa chọn:**
  * Đồng bộ 100% với hệ sinh thái của dự án, người dùng không cần cài đặt Python, pip hay Conda.
  * Thư viện xử lý PDF thuần JavaScript (`pdf-parse`) hoạt động mượt mà đa nền tảng (Windows, macOS, Linux, Docker).
  * Tiết kiệm tài nguyên máy tính (chạy ở chế độ nền chỉ tốn ~30-50MB RAM).

### 1.2. Vị trí Thư mục:
* Tạo thư mục độc lập: `d:\CareerBridge\ai-worker-client\`
* Đóng gói hoàn chỉnh thành một ứng dụng độc lập, có `package.json`, `.env.example`, `README.md`, `Dockerfile` riêng để bất kỳ kỹ thuật viên doanh nghiệp nào cũng có thể tải về chạy độc lập.

---

## 2. Cấu trúc Thư mục Chi tiết

```text
ai-worker-client/
├── src/
│   ├── index.ts                     # Entry point khởi động Worker & lắng nghe tiến trình
│   ├── config.ts                    # Quản lý cấu hình môi trường (.env + validation)
│   ├── worker.ts                    # Lớp điều phối chính: Vòng lặp Polling & Heartbeat
│   │
│   ├── api/
│   │   ├── client.ts                # HTTP Client giao tiếp Backend (Axios + Header Auth)
│   │   └── types.ts                 # Interfaces dữ liệu khớp 100% với DTO Backend
│   │
│   ├── pdf/
│   │   ├── downloader.ts            # Tải tệp CV từ Signed URL vào thư mục tạm an toàn
│   │   └── parser.ts                # Trích xuất văn bản từ PDF và dọn dẹp file tạm
│   │
│   └── providers/
│       ├── base.provider.ts         # Interface AiProvider trừu tượng
│       ├── mock.provider.ts         # Provider giả lập AI thông minh (dùng khi Dev/Test)
│       ├── ollama.provider.ts       # Provider kết nối Local LLM nội bộ doanh nghiệp (Ollama)
│       └── provider.factory.ts      # Factory tạo provider dựa theo cấu hình
│
├── .env.example                     # File mẫu biến môi trường
├── .gitignore
├── tsconfig.json
├── package.json
├── Dockerfile                       # Đóng gói container Docker siêu nhẹ
└── README.md                        # Hướng dẫn 3 bước khởi chạy cho Doanh nghiệp
```

---

## 3. Đặc tả Kỹ thuật Từng Thành phần

### 3.1. API Client (`src/api/`)
* **Header bắt buộc:** `X-Worker-Token: <cwb_token>`
* **Các phương thức:**
  1. `pollJob()`: Gọi `GET /api/v1/ai-worker/jobs/poll`. Trả về `hasJob: boolean` và dữ liệu `job`.
  2. `completeJob(jobId, payload)`: Gọi `POST /api/v1/ai-worker/jobs/:id/complete`. Payload chuẩn:
     ```typescript
     {
       aiScore: number;                 // 0 - 100
       recommendation: 'STRONG_HIRE' | 'HIRE' | 'POTENTIAL' | 'NOT_RECOMMENDED';
       experienceYears?: number;
       extractedSkills?: string[];
       matchedSkills?: string[];
       missingSkills?: string[];
       strengths?: string[];
       weaknesses?: string[];
       summary?: string;
       modelUsed?: string;
       rawAnalysis?: Record<string, unknown>;
     }
     ```
  3. `failJob(jobId, errorMessage)`: Gọi `POST /api/v1/ai-worker/jobs/:id/fail`.
  4. `sendHeartbeat(modelName)`: Gọi `POST /api/v1/ai-worker/heartbeat`.

### 3.2. Quản lý File An toàn (`src/pdf/`)
* **Nguyên tắc bảo mật:**
  * File PDF chỉ được lưu trữ tạm thời trong thư mục OS temp (hoặc `.tmp/cv_downloads/`).
  * Khối `try ... finally` **bắt buộc** thực thi việc xóa file vật lý (`fs.promises.unlink`) ngay sau khi trích xuất text xong, bất kể quá trình parse thành công hay thất bại.
  * Kiểm tra dung lượng và tính toàn vẹn của tệp trước khi đọc.

### 3.3. Thiết kế AI Provider (Strategy Pattern)
* **Interface `AiProvider`:**
  ```typescript
  export interface AiProvider {
    readonly name: string;
    readonly modelName: string;
    analyze(cvText: string, jobContext: JobContext): Promise<AiAnalysisResult>;
  }
  ```

* **1. `MockProvider`:**
  * Phân tích từ khóa kỹ năng từ văn bản CV đối chiếu với `requiredSkills` của tin tuyển dụng.
  * Tính điểm khớp sơ bộ dựa trên trọng số kỹ năng (`weight`) và độ xuất hiện trong CV.
  * Tự động sinh `strengths`, `weaknesses`, `summary` tự nhiên có nghĩa để HR kiểm tra giao diện.
  * Giả lập thời gian suy nghĩ 1-2 giây để trải nghiệm giống AI thật.

* **2. `OllamaProvider` (Local LLM On-Premise):**
  * Kết nối `http://localhost:11434/api/generate` với tham số `format: "json"`.
  * Hỗ trợ mọi model chạy offline phổ biến: `qwen2.5:7b`, `llama3.2:3b`, `deepseek-r1`, `mistral`.
  * Sử dụng System Prompt yêu cầu JSON Schema nghiêm ngặt, có cơ chế fallback/parse JSON an toàn khi model sinh kèm định dạng markdown.
  * Giữ 100% dữ liệu CV nằm trong máy chủ/máy trạm của doanh nghiệp, không truyền dữ liệu ra Internet.

### 3.4. Vòng đời Điều phối (`src/worker.ts`)
* **Vòng lặp Polling (`pollLoop`):**
  * Định kỳ mỗi `POLL_INTERVAL_MS` (mặc định 5s) gọi `pollJob`.
  * Khi có job: Đổi trạng thái sang bận $\rightarrow$ Tải CV $\rightarrow$ Parse văn bản $\rightarrow$ Gửi sang Provider $\rightarrow$ Gửi kết quả `completeJob`.
  * Nếu gặp lỗi xử lý file/AI: Tự động gọi `failJob(jobId, error)` để Backend xử lý retry.
  * **Exponential Backoff:** Nếu Backend mất kết nối hoặc trả về lỗi 5xx, tự động tăng thời gian chờ (5s $\rightarrow$ 10s $\rightarrow$ 20s $\rightarrow$ tối đa 60s) để tránh làm nghẽn mạng.
* **Vòng lặp Heartbeat (`heartbeatLoop`):**
  * Chạy định kỳ độc lập mỗi 25 giây để cập nhật trạng thái `lastSeenAt` trên Backend.
* **Graceful Shutdown:**
  * Bắt các tín hiệu `SIGINT` (Ctrl+C), `SIGTERM`.
  * Đợi hoàn tất job hiện tại (nếu đang trong bước gửi kết quả) trước khi tắt tiến trình sạch sẽ.

---

## 4. Kế hoạch Triển khai Từng Bước (Implementation Steps)

### Bước 1: Khởi tạo cấu trúc dự án `ai-worker-client`
* Khởi tạo `package.json` với các dependencies tối giản:
  * `axios` (HTTP requests)
  * `dotenv` (Quản lý biến môi trường)
  * `pdf-parse` (Trích xuất văn bản từ PDF)
  * `chalk` (Giao diện dòng lệnh trực quan, màu sắc dễ theo dõi)
  * Development: `typescript`, `ts-node`, `@types/node`, `@types/pdf-parse`.

### Bước 2: Xây dựng Core Network & Security
* Viết `config.ts` đọc và kiểm tra tính hợp lệ của `WORKER_TOKEN`, `BACKEND_URL`, `AI_PROVIDER`.
* Viết `api/client.ts` bọc Axios với timeout, retry và header `X-Worker-Token`.

### Bước 3: Xây dựng Module Xử lý PDF an toàn
* Viết `pdf/downloader.ts`: Tải file stream an toàn từ `cvDownloadUrl`.
* Viết `pdf/parser.ts`: Chuyển đổi stream thành văn bản thuần + xóa file nguồn ngay lập tức trong `finally`.

### Bước 4: Xây dựng AI Provider (`Mock` & `Ollama`)
* Xây dựng `providers/base.provider.ts`.
* Hoàn thiện `MockProvider` với thuật toán trích xuất từ khóa kỹ năng chân thực (dành cho Dev/Testing).
* Xây dựng `OllamaProvider` gọi Local AI qua REST API nội bộ, kiểm tra JSON Schema nghiêm ngặt.
* Xây dựng `ProviderFactory` chuyển đổi qua biến môi trường `AI_PROVIDER=mock` hoặc `AI_PROVIDER=ollama`.

### Bước 5: Hoàn thiện Worker Engine & Graceful Shutdown
* Kết nối luồng `pollLoop`, `heartbeatLoop`.
* Bổ sung log trạng thái chuyên nghiệp với mã màu (Xanh: đã xử lý, Vàng: đang chờ việc, Đỏ: lỗi).
* Bắt sự kiện thoát an toàn (`SIGINT`, `SIGTERM`).

### Bước 6: Kiểm thử Tích hợp Thực tế
1. Khởi động Backend (đã có ở Giai đoạn 1).
2. Tạo 1 Worker token cho công ty test.
3. Chạy Worker ở chế độ `AI_PROVIDER=mock`.
4. Sinh viên nộp hồ sơ đính kèm CV PDF $\rightarrow$ Quan sát Worker tự động nhận job, tải CV, phân tích và trả về điểm số thành công.
5. Kiểm tra Database & API xem `aiScore` và `aiScanJob` có được cập nhật đầy đủ và chuẩn xác.

---

## 5. Tiêu chí Nghiệm thu (Acceptance Checklist)

- [ ] Worker khởi động thành công và gửi heartbeat đều đặn (Backend ghi nhận `lastSeenAt`).
- [ ] Tự động poll được job khi có đơn ứng tuyển mới.
- [ ] Tải và bóc tách thành công văn bản từ CV PDF.
- [ ] File PDF tạm thời biến mất hoàn toàn khỏi ổ cứng ngay sau khi parse xong (0 rò rỉ file).
- [ ] Kết quả phân tích trả về Backend chuẩn kiểu dữ liệu (`aiScore` 0-100, recommendation hợp lệ, các mảng kỹ năng đầy đủ).
- [ ] Chế độ `MockProvider` chạy hoàn hảo mà không cần bất kỳ API key hay Local AI nào.
- [ ] Chế độ `OllamaProvider` hoạt động chuẩn xác với Local LLM nội bộ qua cổng 11434.
- [ ] Dữ liệu ứng viên tuyệt đối được giữ kín trên máy trạm doanh nghiệp, không gửi tới bất kỳ dịch vụ đám mây bên thứ 3 nào.
- [ ] Nhấn `Ctrl+C` dừng worker êm ái mà không bị treo tiến trình.
