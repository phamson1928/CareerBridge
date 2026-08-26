# Week 7 Person A — Backend curl regression

Các script này xác minh phần backend của Người A:

- Week 6: Evaluation CRUD, authorization, audit và notification.
- Week 7: Audit Log API, validation, RBAC, filter, detail và tính read-only.

## Chuẩn bị

1. Khởi động backend và seed database test. Nếu cấu hình test có `THROTTLE_LIMIT` thấp, chạy hai suite cách nhau ít nhất một cửa sổ rate-limit hoặc tăng giá trị này trực tiếp trong cấu hình test trước khi khởi động backend.
2. Sao chép `env.example.ps1` thành file local không commit, rồi điền mật khẩu test.
3. Nạp biến môi trường và chạy các script trong PowerShell:

```powershell
. .\env.local.ps1
.\05-notification-audit.ps1
.\04-supervision-report-evaluation.ps1
```

Các script chỉ gọi REST API bằng `curl.exe`. Script Evaluation tạo hai evaluation trên placement test, kiểm tra audit/notification rồi xóa evaluation; audit log được giữ lại theo đúng tính bất biến.

Không dùng các script này với database production.