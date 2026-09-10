# AI recommendations — curl regression

Script này kiểm tra contract REST cho job preferences và internship recommendations. Nó chỉ dùng `curl.exe`; không gửi API key hoặc prompt từ client.

## Chuẩn bị

1. Dùng database development/test, không dùng production.
2. Khởi động backend và bảo đảm migration đã được áp dụng.
3. Sao chép `env.example.ps1` thành `env.local.ps1`, điền credential test rồi nạp file đó.

```powershell
. .\env.local.ps1
.\01-recommendations.ps1
```

Mặc định script kiểm tra auth/RBAC, preferences, validation và đọc recommendation cache. Nó tạm ghi rồi khôi phục preferences của student test.

Để kiểm tra `POST generate`, chạy rõ ràng với switch sau. Lệnh này có thể tạo cache và, nếu môi trường có candidate hợp lệ cùng feature flag bật, có thể gọi provider để lấy explanation.

```powershell
.\01-recommendations.ps1 -RunGenerate
```

Trong database seed hiện tại chưa có internship eligible, generate vẫn là một kiểm tra hợp lệ: API trả `200`, `recommendations: []` và không gọi provider.

## UAT có candidate và AI explanation

Để kiểm tra top-10, eligibility filter, top-3 explanation và fingerprint cache trên database development/test, dùng fixture cô lập có tiền tố `UAT-AI-20260910`:

```powershell
cd Backend
npm exec tsx -- scripts/ai-recommendation-uat.ts create
```

Fixture tạo một student profile readiness `HIGH`, một company approved, semester active, bốn internship eligible và các posting bị loại bởi application/closed/full/expired. Sau khi login bằng tài khoản fixture, kiểm tra:

- generate trả tối đa 10 kết quả, sort score giảm dần;
- bốn candidate hợp lệ xuất hiện, posting bị loại không xuất hiện;
- chỉ rank 1–3 có `explanationStatus = AI` và `aiExplanation` khi provider hoạt động; rank 4 luôn `NOT_REQUESTED`/`null`;
- GET sau generate có `cacheHit = true`;
- sửa preferences làm cache miss; khôi phục preferences cũ trả lại cache theo fingerprint;
- `force: true` ngay sau generate trả `429`.

Luôn cleanup fixture sau UAT:

```powershell
npm exec tsx -- scripts/ai-recommendation-uat.ts cleanup
```

Không chạy fixture này trên database production.
