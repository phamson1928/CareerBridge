# CareerBridge AI Worker Client (On-Premise CV Scanner)

Ứng dụng nền (CLI Daemon) dành riêng cho Doanh nghiệp, phục vụ tự động quét và đánh giá CV ứng viên nội bộ.

---

## 1. Nguyên tắc Hoạt động
- **100% Nội bộ & Bảo mật (On-Premise Privacy):** File CV chỉ được tải về bộ nhớ tạm thời trên máy của doanh nghiệp, sau khi phân tích xong file sẽ được **xóa sạch ngay lập tức**.
- **Không chia sẻ ra ngoài:** Không gửi dữ liệu CV hay thông tin ứng viên tới bất kỳ dịch vụ đám mây công cộng nào.
- **Hỗ trợ 2 chế độ:**
  - `mock`: Chạy thuật toán so khớp từ khóa nội bộ (dành cho thử nghiệm/dev, không cần GPU).
  - `ollama`: Kết nối mô hình AI nội bộ (Ollama) như `qwen2.5:7b`, `llama3.2:3b`.

---

## 2. Hướng dẫn Cài đặt & Chạy trong 2 phút

### Bước 1: Sao chép file cấu hình
```bash
cp .env.example .env
```
Mở file `.env` và điền `WORKER_TOKEN` do doanh nghiệp của bạn tạo từ Cổng Quản Trị CareerBridge:
```env
BACKEND_URL=http://localhost:3000
WORKER_TOKEN=cwb_xxxxxxxxxxxxxxxxxxxxxxxx
AI_PROVIDER=mock
```

### Bước 2: Cài đặt thư viện
```bash
npm install
```

### Bước 3: Khởi chạy Worker
* **Chạy trực tiếp (Development):**
  ```bash
  npm run dev
  ```
* **Chạy sản xuất (Production):**
  ```bash
  npm run build
  npm start
  ```
* **Chạy với Docker:**
  ```bash
  docker build -t careerbridge-ai-worker .
  docker run -d --name ai-worker --env-file .env careerbridge-ai-worker
  ```

---

## 3. Kiểm thử & Đánh giá Hiệu năng
* **Chạy kiểm thử chức năng & bảo mật (24 tests):**
  ```bash
  npm test
  ```
* **Chạy kiểm thử phòng thủ Prompt Injection:**
  ```bash
  npm run test:security
  ```
* **Chạy kiểm thử tải đồng thời & cam kết không rò rỉ dữ liệu (Stress & Privacy Test):**
  ```bash
  npm run test:stress
  ```
