# AI Job Recommendation — Tài liệu triển khai

> **Trạng thái:** Hoàn thành Phase 0–6 ngày 10/09/2026  
> **Phạm vi:** Backend NestJS, Prisma/PostgreSQL và React frontend  
> **Kế hoạch gốc:** [AI_JOB_RECOMMENDATION_PLAN.md](../plans/AI_JOB_RECOMMENDATION_PLAN.md)

## 1. Mục tiêu và nguyên tắc

Tính năng gợi ý thực tập cung cấp tối đa 10 internship phù hợp cho sinh viên. Điểm và thứ hạng luôn do backend tính theo thuật toán xác định. AI không được thay đổi score, rank hoặc tự nộp đơn; AI chỉ tạo diễn giải tiếng Việt cho tối đa 3 recommendation đầu khi hồ sơ có đủ tín hiệu.

Kết quả được cache theo fingerprint của profile, skills, projects, preferences và tập candidate. Vì vậy việc mở tab Internship chỉ đọc cache, không tự gọi provider AI.

## 2. Kiến trúc đã thêm

```text
React Internship tab
  ├─ GET recommendation cache + profile readiness
  ├─ PUT job preferences
  └─ POST generate theo hành động chủ động của sinh viên
          ↓ JWT + role STUDENT
NestJS RecommendationsModule
  ├─ Candidate query và eligibility filter
  ├─ Deterministic scorer + stable sort
  ├─ Fingerprint/database cache/single-flight
  └─ Optional AI explanation adapter cho top 3
          ↓
PostgreSQL: StudentJobPreference + InternshipRecommendationCache
```

`RecommendationsModule` dùng `SkillsModule` và shared calculator để không có công thức skill-match bị copy ở nhiều nơi. `ApplicationsService` cũng dùng calculator này khi tạo application để lưu snapshot `matchScore` tại thời điểm nộp đơn.

## 3. Dữ liệu và rule nghiệp vụ

Migration `20260910030000_ai_recommendation_preferences_cache` bổ sung:

- `StudentJobPreference`: role, location và work type mong muốn; một bản ghi cho mỗi student profile.
- `InternshipRecommendationCache`: fingerprint SHA-256, kết quả JSON, nguồn kết quả, thời gian tạo và hết hạn.
- Enum `RecommendationSource`: `AI_ENHANCED`, `DETERMINISTIC_FALLBACK`, `DETERMINISTIC_ONLY`.

Một internship chỉ được làm candidate khi đang `OPEN`, chưa hết hạn, còn slot, company đã approved và active, semester active, student chưa ứng tuyển, và không có placement `PENDING`/`ACTIVE` trong cùng semester. Candidate được tải bằng query gộp, sau đó lọc slot còn lại trước khi score.

Scoring sử dụng skill compatibility, desired role, major, location, work type và project evidence. Thiếu preference/project không tự làm giảm điểm; phần đó không tham gia mẫu số. Missing required skills áp dụng penalty tối đa 20 điểm. Kết quả sort ổn định theo overall score, điều kiện required skills, deadline, thời điểm cập nhật và id.

Internship không khai báo kỹ năng trả `matchScore = null` cho application snapshot và không bị biến thành 100% giả. Recommendation scorer dùng điểm trung lập 50 cho component skill trong trường hợp này, đồng thời gắn cờ dữ liệu yêu cầu thấp.

## 4. API contract

Mọi success response dùng wrapper `{ success: true, data, timestamp }`. Tất cả route sau yêu cầu JWT và role `STUDENT`.

| Method | Route | Mục đích |
| --- | --- | --- |
| `GET` | `/api/v1/students/me/job-preferences` | Lấy preferences hiện tại; profile chưa có preferences trả ba mảng rỗng. |
| `PUT` | `/api/v1/students/me/job-preferences` | Thay toàn bộ preferences; trim và deduplicate không phân biệt hoa thường. |
| `GET` | `/api/v1/recommendations/internships/me` | Đọc cache còn hiệu lực cùng readiness; không gọi AI. |
| `POST` | `/api/v1/recommendations/internships/me/generate` | Tạo hoặc trả cache recommendation; response `200`. |

Generate có global throttle 6 request/phút. `force: true` có cooldown 10 phút theo student. Cùng một backend instance chỉ chạy một generate đồng thời cho một student.

Response recommendation gồm `profileReadiness`, `source`, `cacheHit`, `generatedAt`, `emptyReason` và mảng `recommendations`. Mỗi item chứa internship đầy đủ, overall/skill score, breakdown, matched/missing skills, confidence, `matchSummary`, `explanationStatus` và `aiExplanation` nullable.

## 5. AI explanation, cache và privacy

Backend package `@google/genai` chỉ được cài trong `Backend`. Feature flag và cấu hình:

```dotenv
AI_RECOMMENDATIONS_ENABLED=false
GEMINI_API_KEY=
AI_RECOMMENDATION_MODEL=gemini-3.5-flash-lite
AI_RECOMMENDATION_TIMEOUT_MS=8000
AI_RECOMMENDATION_CACHE_TTL_MINUTES=360
```

Khi flag bật, key là bắt buộc lúc khởi động. Provider chỉ nhận major, summary, skills, project title/description, preferences, và dữ liệu cần thiết của top 3 internship. Email, phone, student code, CV URL/storage key, application history và dữ liệu sinh viên khác không được gửi.

Prompt yêu cầu JSON schema cố định. Backend kiểm tra đủ/chính xác internship id, không trùng, giới hạn độ dài, giới hạn array, plain-text sanitation và all-or-nothing validation. Provider timeout/quota/key sai/schema sai đều không làm API fail: hệ thống trả deterministic fallback. Timeout tổng là 8 giây, với tối đa một retry trong cùng budget.

Cache thường có TTL 6 giờ; deterministic fallback dùng TTL ngắn 15 phút. Fingerprint đổi khi profile, skills, projects, preferences, candidate data, feature flag hoặc model liên quan đổi.

## 6. Frontend

Tab Internship hiện gồm hai phần:

1. **Dành cho bạn**: readiness banner, preferences dạng tag, nút tạo/làm mới, state loading/empty/error/fallback và top-10 recommendation cards.
2. **Tất cả vị trí**: search/filter/list internship hiện hữu.

Card recommendation gọi lại modal xem chi tiết và ứng tuyển sẵn có. Chỉ item có `explanationStatus = AI` mới hiển thị diễn giải. Frontend không hiển thị tên provider/model, không có API key và không tự tính/ép score match cho list internship thường.

Legacy frontend AI đã được loại bỏ: route Express cũ, `AICVCoachModal`, dependency Gemini frontend, copy AI cũ và `calculateSkillMatch()` với score floor giả.

## 7. Kiểm thử đã thực hiện

| Hạng mục | Kết quả |
| --- | --- |
| Backend `npm run build` | PASS |
| Backend ESLint và Jest | PASS |
| Frontend `npm run lint` | PASS |
| Frontend `npm run build` | PASS |
| Curl regression | PASS: 401, 403, preference validation 400, update/read preferences 200, generate/cache 200, force cooldown 429 |
| Candidate UAT | PASS: 4 candidate hợp lệ, score sort giảm dần, candidate closed/full/expired/đã apply bị loại, cache invalidation theo preferences |
| AI UAT | PASS: `AI_ENHANCED`; top 3 có explanation, rank 4 `NOT_REQUESTED` và không có explanation |
| Cleanup runtime frontend AI legacy | PASS |

Script có thể chạy lại tại [`docs/testing/ai-recommendations/01-recommendations.ps1`](../testing/ai-recommendations/01-recommendations.ps1). Script mặc định không gọi generate; dùng `-RunGenerate` khi muốn kiểm tra generate. Nó tạm cập nhật và sau đó khôi phục preferences test.

Database seed mặc định không có internship eligible nên vẫn giữ empty-state test `DETERMINISTIC_ONLY`. Full UAT đã dùng fixture tạm `UAT-AI-20260910` trên development database: profile `HIGH`, company approved, semester active và bốn candidate. Fixture đã xác nhận response `AI_ENHANCED`, top-3 explanation, rank 4 không có explanation, eligibility, cache hit, preference fingerprint invalidation và cooldown; sau test fixture được cleanup. Hướng dẫn fixture nằm ở `docs/testing/ai-recommendations/README.md`.

## 8. Vận hành

- Không commit `.env`, API key hoặc credential test.
- Chỉ bật AI với key hợp lệ; production có dữ liệu sinh viên thật phải review chính sách privacy/provider trước khi sử dụng.
- Khi thay đổi Prisma schema ở môi trường dùng chung, áp dụng migration bằng `npm exec prisma migrate deploy`.
- Frontend dùng `VITE_API_URL`; không thêm key AI vào biến môi trường frontend.
