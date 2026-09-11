# KẾ HOẠCH TRIỂN KHAI AI GỢI Ý VIỆC LÀM CHO SINH VIÊN

> **Trạng thái:** Đã triển khai Phase 0–6 ngày 10/09/2026. Xem tài liệu vận hành tại [`docs/reports/AI_JOB_RECOMMENDATION_IMPLEMENTATION.md`](../reports/AI_JOB_RECOMMENDATION_IMPLEMENTATION.md).  
> **Phạm vi:** Backend NestJS + Frontend React hiện tại  
> **Chủ trì:** Người A, vì feature mở rộng trực tiếp từ `SkillsModule` và matching do Người A phụ trách  
> **Nguyên tắc:** Backend là nguồn dữ liệu duy nhất; AI chỉ giải thích, không tự quyết định điểm hoặc thứ hạng  
> **Đã audit lại:** 10/09/2026 theo schema, exception filter, module graph và flow frontend hiện tại

> **Ghi chú lịch sử:** Phần “hiện trạng” bên dưới ghi nhận khoảng trống trước khi triển khai; không phản ánh trạng thái code hiện tại.

## 1. Quyết định nghiệp vụ đã chốt

1. Hệ thống trả tối đa **10 internship phù hợp nhất** cho sinh viên.
2. Điểm và thứ hạng được tính bằng thuật toán xác định ở backend.
3. AI chỉ tạo phần giải thích chi tiết cho **top 3**; hạng 4-10 chỉ hiển thị dữ liệu matching có thể kiểm chứng.
4. Sinh viên chủ động bấm **Tạo gợi ý**; hệ thống không tự gọi AI khi mở trang.
5. Kết quả được cache theo phiên bản dữ liệu hồ sơ và internship để tránh gọi AI lặp lại.
6. Nguồn tính toán gồm:
   - ngành học và phần giới thiệu hồ sơ;
   - kỹ năng kèm cấp độ;
   - dự án của sinh viên;
   - mong muốn công việc;
   - kỹ năng, mô tả, yêu cầu, địa điểm và hình thức làm việc của internship.
7. Frontend phải nhắc sinh viên cập nhật hồ sơ và chỉ rõ dữ liệu nào còn thiếu để kết quả chi tiết hơn.
8. Điểm matching chỉ là thông tin hỗ trợ, không thay thế quyết định tuyển dụng của doanh nghiệp.
9. Dùng `gemini-3.5-flash-lite` ở Free Tier trong giai đoạn đồ án/thử nghiệm; model luôn lấy từ biến môi trường.
10. Toàn bộ code AI cũ do scaffold trước khi feature được thiết kế chính thức phải được xóa trước khi triển khai mới; không tái sử dụng endpoint, component hoặc prompt cũ.

## 2. Hiện trạng codebase và vấn đề cần xử lý

### 2.1. Thành phần có thể tái sử dụng

- `Backend/src/skills/matching.service.ts` đã có công thức matching kỹ năng theo level và weight.
- `Backend/src/skills/skills.module.ts` đã export `MatchingService`.
- `Backend/src/internships/internships.service.ts` đã có select đầy đủ company, semester và internship skills.
- Student profile đã có major, summary, skills, projects và CV metadata.
- `Application.matchScore` đã tồn tại trong Prisma schema và response API.
- Frontend đã có flow xem chi tiết và ứng tuyển internship, nên recommendation card phải tái sử dụng flow này.

### 2.2. Khoảng trống hiện tại

- Chưa có API batch recommendation ở NestJS.
- Chưa có cấu trúc dữ liệu lưu job preferences của sinh viên.
- `Frontend/src/utils/matching.ts` đang tự tính điểm và ép điểm tối thiểu giả; đây là nguồn dữ liệu thứ hai và phải loại bỏ khỏi flow thật.
- `Frontend/src/components/StudentView/InternshipList.tsx` đang dùng điểm tính ở client cho từng card.
- Hero của InternshipList đang ghi “Hệ thống đề xuất việc làm thông minh” và “tự động phân tích hồ sơ” dù chưa có recommendation backend thật.
- `Frontend/server.ts` có `/api/ai/suggest-internships`, nhưng endpoint này:
  - nhận toàn bộ profile và internship từ client;
  - không có JWT/RBAC của hệ thống NestJS;
  - không được UI hiện tại sử dụng;
  - cho AI tham gia đề xuất mà không có công thức backend kiểm chứng.
- `ApplicationsService.create()` chưa ghi `matchScore` khi tạo application dù field này đã có trong schema.
- Internship list hiện tại chưa áp dụng đầy đủ điều kiện company approved, còn slot và placement đang hiệu lực cho recommendation.

### 2.3. AI legacy phải xóa trước khi triển khai

- Không mở rộng legacy mapper trong `Frontend/src/App.tsx` để gắn thêm dữ liệu AI.
- Tạo type và API client riêng cho recommendation.
- Xóa việc hiển thị tên model/provider AI trên UI.
- Xóa cả `/api/ai/analyze-cv` và `/api/ai/suggest-internships` khỏi `Frontend/server.ts`.
- Xóa `Frontend/src/components/StudentView/AICVCoachModal.tsx`.
- Xóa import, state, callback và render `AICVCoachModal` khỏi `Frontend/src/App.tsx`.
- Xóa nút `AI CV & Gợi ý Job` và prop `onOpenAICoach` khỏi `Frontend/src/components/Navbar.tsx`.
- Gỡ `@google/genai` khỏi `Frontend/package.json` và đồng bộ các lockfile đang được repository sử dụng.
- Xóa `GEMINI_API_KEY` khỏi `Frontend/.env.example`.
- Xóa capability Gemini cũ khỏi `Frontend/metadata.json`.
- Xóa phần hướng dẫn AI cũ trong `Frontend/README.md`.
- Xóa copy “đề xuất thông minh/tự động phân tích” và score badge giả khỏi InternshipList trong cùng cleanup baseline.
- Giữ Express/Vite server và các phần phục vụ runtime không liên quan; chỉ bóc bỏ code AI.

Cleanup này phải là commit/phase độc lập về mặt logic. Sau cleanup, `rg` không được còn route, component, dependency hoặc copy Gemini cũ trong runtime frontend. Tài liệu kế hoạch và cấu hình backend mới được phép nhắc tới AI.

## 3. Phạm vi và ngoài phạm vi

### 3.1. Trong phạm vi

- Job preferences của sinh viên.
- Profile readiness/completeness cho recommendation.
- Bộ lọc internship đủ điều kiện.
- Batch scoring không N+1.
- Top 10 recommendation.
- AI explanation cho top 3.
- Database cache theo fingerprint.
- UI tạo/làm mới gợi ý, trạng thái loading/empty/error/fallback.
- Loại bỏ điểm matching giả phía frontend.
- Lưu snapshot `matchScore` xác định khi sinh viên ứng tuyển.
- Dọn toàn bộ implementation AI frontend/Express cũ trước khi thêm implementation chính thức.
- Kiểm thử API bằng `curl` và kiểm tra UI thủ công; không viết unit test theo yêu cầu hiện tại.

### 3.2. Ngoài phạm vi phase đầu

- Chatbot nghề nghiệp.
- AI CV Coach và AI tự động đọc nội dung file CV.
- Embedding/vector database.
- Học từ hành vi click hoặc application của toàn bộ người dùng.
- Recommendation qua email/notification tự động.
- Cho doanh nghiệp xem prompt hoặc AI explanation riêng tư của sinh viên.
- AI tự nộp đơn, tự sửa profile hoặc tự thay đổi application.
- Redis; cache database là đủ cho quy mô hiện tại.

## 4. Luồng nghiệp vụ chuẩn

1. Sinh viên mở tab internship.
2. Frontend gọi API lấy recommendation cache hiện tại và profile readiness, nhưng không gọi provider AI.
3. UI hiển thị banner:
   - hồ sơ đủ dữ liệu: cho phép tạo gợi ý ngay;
   - hồ sơ thiếu dữ liệu: vẫn cho tạo, đồng thời chỉ rõ trường cần bổ sung;
   - chưa có StudentProfile: dùng notice hiện tại và chuyển sang tab hồ sơ.
4. Sinh viên có thể thiết lập/chỉnh sửa job preferences.
5. Sinh viên bấm **Tạo gợi ý**.
6. Backend xác thực JWT, role STUDENT và account ACTIVE.
7. Backend tải profile, skills, projects, preferences, applications và placements bằng query gộp.
8. Backend tải tập internship đủ điều kiện bằng một query, không gọi matching riêng từng internship.
9. Backend tính điểm xác định cho tất cả candidate, sort ổn định và lấy top 10.
10. Nếu cache fingerprint còn hợp lệ, trả cache mà không gọi AI.
11. Nếu cần tạo mới và hồ sơ đủ tín hiệu, backend gửi đúng top 3 cho AI để tạo giải thích.
12. Backend validate output AI, merge giải thích theo `internshipId`, lưu cache và trả response.
13. Nếu AI timeout, quota hoặc response sai schema, backend vẫn trả top 10 xác định với `source = DETERMINISTIC_FALLBACK`.
14. Sinh viên xem chi tiết hoặc ứng tuyển bằng flow hiện tại.

## 5. Điều kiện internship được đưa vào recommendation

Một internship chỉ là candidate khi thỏa toàn bộ điều kiện:

- `Internship.status = OPEN`.
- `deadline` không đặt hoặc `deadline > now`; dùng đúng boundary của application service đang từ chối `deadline <= now`.
- `filledSlots < slots`.
- company có `CompanyProfile.status = APPROVED` và company user có `User.status = ACTIVE`.
- semester có `Semester.status = ACTIVE`.
- sinh viên chưa từng có application cho internship đó; unique constraint hiện tại không cho phép nộp lại.
- sinh viên không có placement `PENDING` hoặc `ACTIVE` trong cùng semester.

Nếu không còn candidate, API trả mảng rỗng kèm reason rõ ràng; không coi đây là lỗi 4xx/5xx.

## 6. Dữ liệu job preferences

### 6.1. Prisma model mới

Thêm quan hệ một-một từ `StudentProfile` tới `StudentJobPreference`:

```prisma
model StudentJobPreference {
  id                 String   @id @default(cuid())
  studentId          String   @unique
  desiredRoles       String[] @default([])
  preferredLocations String[] @default([])
  preferredWorkTypes String[] @default([])
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  student StudentProfile @relation(fields: [studentId], references: [id], onDelete: Cascade)
}
```

Thêm vào `StudentProfile`:

```prisma
jobPreference StudentJobPreference?
recommendationCache InternshipRecommendationCache?
```

Không đưa `minimumStipend` vào phase đầu vì `Internship.stipend` hiện là chuỗi tự do, không đủ an toàn để so sánh số.

### 6.2. Quy tắc validate

- `desiredRoles`: tối đa 5 phần tử, mỗi phần tử 1-80 ký tự.
- `preferredLocations`: tối đa 5 phần tử, mỗi phần tử 1-100 ký tự.
- `preferredWorkTypes`: tối đa 5 phần tử, mỗi phần tử 1-50 ký tự.
- Trim, loại chuỗi rỗng, loại trùng không phân biệt hoa thường.
- Không nhận `studentId` từ client.
- `PUT` thay toàn bộ ba danh sách để hành vi idempotent và dễ đồng bộ UI.

## 7. Profile readiness và nhắc cập nhật hồ sơ

Readiness chỉ phản ánh lượng dữ liệu dùng cho recommendation, không phải chất lượng ứng viên:

| Nhóm dữ liệu | Điểm tối đa | Điều kiện |
|---|---:|---|
| Summary | 20 | Có nội dung sau khi trim |
| Skills | 35 | 15 điểm khi có 1 skill, 25 khi có 2, 35 khi có từ 3 skill |
| Projects | 20 | Có ít nhất 1 project và project có description |
| Job preferences | 25 | 10 desired role, 7.5 location, 7.5 work type |

Response phải trả:

- `score`: 0-100.
- `level`: `LOW`, `MEDIUM`, `HIGH`.
- `missingFields`: `SUMMARY`, `SKILLS`, `PROJECTS`, `DESIRED_ROLES`, `LOCATIONS`, `WORK_TYPES`.
- `canUseAiExplanation`: boolean.

Chỉ gọi AI khi có ít nhất một skill và ít nhất một trong ba tín hiệu: summary, project có mô tả hoặc desired role. Nếu chưa đủ, vẫn trả top 10 xác định nhưng các item trong `aiCandidateCount` có `explanationStatus = INSUFFICIENT_PROFILE`.

CV không được đưa vào readiness cho AI vì phase này không đọc nội dung CV. UI có thể nhắc tải CV để sẵn sàng ứng tuyển, nhưng không được tuyên bố rằng file CV làm AI chính xác hơn.

## 8. Thuật toán xếp hạng xác định

AI không tạo điểm và không thay đổi rank. Job preferences và projects là optional nên thiếu các nhóm này không được coi là mismatch. Điểm được chuẩn hóa trên những tín hiệu có thể áp dụng:

```text
availableWeight = sum(weight của các tín hiệu applicable)
baseScore = sum(signalRatio * signalWeight) / availableWeight * 100
overallScore = clamp(round(baseScore - missingRequiredPenalty), 0, 100)
```

Mỗi component trong response phải có `score` 0-100, `weight` và `applied`. `profileReadiness`/confidence cho biết kết quả dựa trên nhiều hay ít dữ liệu; không được hạ điểm chỉ vì sinh viên chưa nhập một field optional.

### 8.1. Skill compatibility: trọng số 60

- Tái sử dụng level factor hiện tại:
  - BEGINNER = 0.25
  - INTERMEDIATE = 0.50
  - ADVANCED = 0.75
  - EXPERT = 1.00
- Với mỗi `InternshipSkill`: `earnedWeight = levelFactor * weight` nếu sinh viên có skill, ngược lại bằng 0.
- `weightedSkillRatio = sum(earnedWeight) / sum(weight)`.
- Component skill dùng `weightedSkillRatio * 100` làm `score`, với `weight = 60`.
- Shared skill matcher trả `percentage = null` và `hasRequirements = false` nếu internship không khai báo skill; không trả 100% giả.
- Riêng recommendation scorer chuyển trường hợp không có requirement thành score trung lập 50 với `weight = 60` và gắn cờ `LOW_REQUIREMENT_DATA` để không làm các tín hiệu text nhỏ bị phóng đại.

### 8.2. Role và major relevance: tổng trọng số tối đa 20

- Desired role so với title/department: weight 12, chỉ `applied = true` khi có desired role.
- Major so với title/department/description/requirements: weight 8 và luôn áp dụng vì major là field bắt buộc của StudentProfile.
- Chuẩn hóa lowercase, bỏ dấu tiếng Việt, bỏ dấu câu, token ngắn và stop-word Việt/Anh đã định nghĩa cố định.
- Dùng token overlap xác định, không gọi AI cho bước tính điểm.

### 8.3. Preferences: tổng trọng số tối đa 15

- Location phù hợp: weight 7.5, chỉ áp dụng khi cả preference và internship location đều có dữ liệu.
- Work type phù hợp: weight 7.5, chỉ áp dụng khi cả preference và internship work type đều có dữ liệu.
- Nếu chưa cấu hình nhóm preference, component có `applied = false`, không tham gia mẫu số; readiness vẫn chỉ rõ dữ liệu thiếu.
- Matching dùng normalized exact/contains; không suy đoán khoảng cách địa lý trong phase đầu.

### 8.4. Project evidence: trọng số 5

- So sánh token từ project title/description với internship title, requirements và skill names.
- Lấy project có overlap cao nhất để tạo component score 0-100, weight 5.
- Chỉ áp dụng component khi có ít nhất một project với title/description dùng được.
- Repository/demo URL không tham gia tính điểm.

### 8.5. Missing required skills penalty: tối đa 20 điểm phần trăm

- Chỉ tính trên `InternshipSkill.isRequired = true`.
- Penalty tỷ lệ theo tổng weight của required skill còn thiếu.
- `missingRequiredPenalty = missingRequiredWeight / totalRequiredWeight * 20`.
- Response vẫn trả `meetsRequiredSkills` và danh sách skill thiếu; không tự cấm sinh viên ứng tuyển.

### 8.6. Sort ổn định

1. `overallScore` giảm dần.
2. `meetsRequiredSkills = true` trước.
3. `deadline` gần hơn trước, null sau cùng.
4. `internship.updatedAt` mới hơn trước.
5. `internship.id` tăng dần để kết quả ổn định tuyệt đối.

## 9. Hợp đồng AI cho top 3

`aiCandidateCount = min(3, recommendations.length)`. Nếu chỉ có một hoặc hai candidate thì AI chỉ giải thích số item thực tế; không yêu cầu đủ ba item giả.

### 9.1. Dữ liệu gửi provider

Chỉ gửi dữ liệu cần thiết:

- major, summary;
- skill name + level;
- project title + description;
- job preferences;
- top 3 internship: opaque id, title, department, location, work type, description, requirements, skill requirements;
- điểm/breakdown đã tính để AI giải thích đúng dữ liệu.

Không gửi email, phone, studentCode, CV URL/storage key, application history hoặc dữ liệu của sinh viên khác.

### 9.2. Output schema bắt buộc

Mỗi item AI chỉ được có:

```json
{
  "internshipId": "opaque-id",
  "reason": "Vì sao vị trí phù hợp",
  "strengths": ["Tối đa 3 điểm mạnh"],
  "skillGaps": ["Tối đa 3 khoảng trống"],
  "nextSteps": ["Tối đa 3 hành động cụ thể"]
}
```

- `reason`: tối đa 300 ký tự.
- Mỗi array tối đa 3 phần tử; mỗi phần tử tối đa 160 ký tự.
- Nội dung bằng tiếng Việt, trung lập, không hứa chắc trúng tuyển và không suy luận thuộc tính nhạy cảm của sinh viên.

Quy tắc backend:

- chỉ nhận đúng và đủ internship id trong `aiCandidateCount`, không trùng lặp;
- không nhận score/rank từ AI;
- giới hạn độ dài từng string và số phần tử array;
- loại HTML/script và chỉ lưu plain text;
- validate theo nguyên tắc all-or-nothing: thiếu id, thừa id hoặc một item sai schema thì bỏ toàn bộ AI response;
- mọi recommendation luôn có `matchSummary` xác định; `aiExplanation` chỉ khác null khi toàn bộ AI response hợp lệ;
- không để provider error/message thô lộ ra client.

`explanationStatus` chỉ gồm:

- `AI`: rank thuộc nhóm đầu và AI response hợp lệ;
- `FALLBACK`: đã gọi AI nhưng phải bỏ response/lỗi provider, dùng `matchSummary`;
- `INSUFFICIENT_PROFILE`: không gọi AI vì thiếu tín hiệu hồ sơ;
- `AI_DISABLED`: không gọi AI vì feature flag đang tắt;
- `NOT_REQUESTED`: rank ngoài `aiCandidateCount`.

`source = AI_ENHANCED` chỉ khi toàn bộ explanation cần thiết hợp lệ; không tạo trạng thái nửa AI/nửa fallback.

## 10. Cache và fingerprint

### 10.1. Prisma model cache

```prisma
enum RecommendationSource {
  AI_ENHANCED
  DETERMINISTIC_FALLBACK
  DETERMINISTIC_ONLY
}

model InternshipRecommendationCache {
  id          String   @id @default(cuid())
  studentId   String   @unique
  fingerprint String   @db.VarChar(64)
  result      Json
  source      RecommendationSource
  model       String?
  generatedAt DateTime @default(now())
  expiresAt   DateTime
  updatedAt   DateTime @updatedAt

  student StudentProfile @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@index([expiresAt])
}
```

### 10.2. Fingerprint

Dùng SHA-256 trên canonical JSON gồm:

- version cố định của scoring algorithm và prompt contract;
- trạng thái feature flag và model được cấu hình;
- profile fields thực sự dùng để tính;
- skills được sort theo `skillId` và level;
- projects được sort theo id với title, description, updatedAt;
- preferences được sort và normalized;
- candidate internship fields dùng để tính, gồm skills, status, slot, deadline và updatedAt.

Cache hợp lệ khi fingerprint giống và `expiresAt > now`. TTL mặc định 6 giờ cho `AI_ENHANCED`/`DETERMINISTIC_ONLY`; cache `DETERMINISTIC_FALLBACK` do provider lỗi chỉ tồn tại 15 phút để hệ thống sớm thử lại sau khi provider phục hồi.

Khi upsert một kết quả mới, phải cập nhật lại `generatedAt`, `expiresAt`, `source`, `model`, `fingerprint` và `result`; không dựa vào default `generatedAt` của row cũ.

`force = true` chỉ bỏ qua TTL, không bỏ qua throttle. UI chỉ hiện **Làm mới** khi đã có kết quả; backend áp cooldown tối thiểu 10 phút cho force refresh.

Cache không lưu PII và không lưu prompt đầy đủ. `result` chỉ chứa internship IDs, breakdown, top 3 explanations và metadata cần hiển thị.

Khi trả response, backend hydrate internship details từ candidate query hiện tại rồi merge với cache; không lưu toàn bộ internship/company object lâu dài trong JSON cache.

### 10.3. Chống gọi trùng

- Dùng single-flight map theo `studentId` trong process: các request generate đồng thời dùng chung một Promise.
- Xóa entry trong `finally`; tổng provider timeout bảo đảm Promise không treo vô hạn.
- Recheck cache ngay trước khi gọi provider.
- Không giữ Prisma transaction trong lúc chờ API Gemini.
- Thiết kế này phù hợp deployment một backend instance hiện tại. Nếu sau này chạy nhiều replica, thay bằng distributed lock PostgreSQL/Redis trước khi scale; không giả định in-memory lock hoạt động xuyên instance.

## 11. API contract

Tất cả endpoint dùng prefix hiện tại `/api/v1`, JWT guard, RolesGuard và role STUDENT.

### 11.1. Job preferences

#### `GET /api/v1/students/me/job-preferences`

Trả ba danh sách; nếu chưa có row thì trả các mảng rỗng.

#### `PUT /api/v1/students/me/job-preferences`

Body:

```json
{
  "desiredRoles": ["Backend Developer"],
  "preferredLocations": ["Ho Chi Minh"],
  "preferredWorkTypes": ["Hybrid", "Remote"]
}
```

### 11.2. Recommendation metadata/cache

#### `GET /api/v1/recommendations/internships/me`

- Không gọi AI.
- Trả profile readiness và cache hiện tại nếu fingerprint còn hợp lệ.
- Nếu chưa có cache hoặc cache stale, trả `hasRecommendation = false`; không dùng 404.

### 11.3. Generate recommendation

#### `POST /api/v1/recommendations/internships/me/generate`

Body:

```json
{
  "force": false
}
```

Response data chính:

```json
{
  "generatedAt": "2026-09-10T00:00:00.000Z",
  "cacheHit": false,
  "source": "AI_ENHANCED",
  "profileReadiness": {
    "score": 80,
    "level": "HIGH",
    "missingFields": ["PROJECTS"],
    "canUseAiExplanation": true
  },
  "recommendations": [
    {
      "rank": 1,
      "internship": {},
      "overallScore": 83,
      "skillScore": 78,
      "meetsRequiredSkills": true,
      "matchedSkills": [],
      "missingRequiredSkills": [],
      "scoreBreakdown": {
        "skills": { "score": 78, "weight": 60, "applied": true },
        "desiredRole": { "score": 100, "weight": 12, "applied": true },
        "major": { "score": 75, "weight": 8, "applied": true },
        "location": { "score": 100, "weight": 7.5, "applied": true },
        "workType": { "score": 100, "weight": 7.5, "applied": true },
        "projects": { "score": 60, "weight": 5, "applied": true },
        "requiredSkillPenalty": 0
      },
      "matchSummary": {
        "matchedSignals": [],
        "missingSignals": []
      },
      "explanationStatus": "AI",
      "aiExplanation": {}
    }
  ]
}
```

`source` gồm `AI_ENHANCED`, `DETERMINISTIC_FALLBACK`, `DETERMINISTIC_ONLY`. `aiExplanation` bắt buộc null ngoài `aiCandidateCount` và trong mọi fallback.

### 11.4. Error behavior

- `404 STUDENT_PROFILE_NOT_FOUND`: user chưa có StudentProfile.
- `400 VALIDATION_ERROR`: DTO preferences/generate không hợp lệ, đúng convention của global exception filter hiện tại.
- `429 TOO_MANY_REQUESTS`: vượt cooldown force refresh hoặc global throttle, đúng convention của exception filter hiện tại.
- AI lỗi không trả 5xx nếu deterministic result vẫn tạo được.
- Không có candidate trả 200 với `recommendations: []` và `emptyReason`.

## 12. Kiến trúc backend

Tạo module mới:

```text
Backend/src/recommendations/
├── dto/
│   └── generate-recommendations.dto.ts
├── types/
│   └── recommendation.types.ts
├── ai-recommendation.service.ts
├── profile-readiness.service.ts
├── recommendation-cache.service.ts
├── recommendation-scorer.service.ts
├── recommendations.controller.ts
├── recommendations.service.ts
└── recommendations.module.ts
```

Phân trách nhiệm:

- `RecommendationsController`: route, guard, role, current user, throttle.
- `RecommendationsService`: orchestration, candidate query, sort, top 10, fallback.
- `RecommendationScorerService`: hàm thuần tính điểm/breakdown theo batch.
- `ProfileReadinessService`: readiness và missing fields.
- `AiRecommendationService`: provider adapter, prompt, structured output, timeout.
- `RecommendationCacheService`: fingerprint, read/upsert cache và cooldown.

`RecommendationsModule` import `PrismaModule`, `SkillsModule`, `ConfigModule`; đăng ký trong `Backend/src/app.module.ts`. `StudentsModule` tiếp tục sở hữu GET/PUT preferences và không import ngược RecommendationsModule, tránh coupling/vòng phụ thuộc.

Không gọi `MatchingService.calculateForUser()` mười lần. Tách phần công thức kỹ năng thuần có thể tái sử dụng từ `MatchingService`, còn query batch nằm trong RecommendationsService.

## 13. Đồng bộ `Application.matchScore`

Khi tạo application:

1. Backend tải student skills và internship skills trong luồng create.
2. Tính lại điểm matching xác định tại thời điểm nộp, không tin score từ frontend/cache.
3. Ghi `matchScore` cùng transaction tạo application.

`matchScore` trong application giữ ý nghĩa **skill matching snapshot** để tương thích hệ thống hiện tại, không lưu overall AI recommendation score. Nếu cần lưu overall score trong tương lai phải thêm field có tên riêng, không tái sử dụng mơ hồ.

Nếu internship không khai báo skills thì snapshot `matchScore = null`, không ghi 100 hoặc 50. Application cũ có `matchScore = null` không backfill bằng dữ liệu hiện tại vì sẽ không còn là snapshot tại thời điểm nộp.

`ApplicationsModule` có thể import `SkillsModule` vì `SkillsModule` không phụ thuộc `ApplicationsModule`; không cần `forwardRef`.

## 14. Cấu hình AI và khả năng chịu lỗi

Thêm biến môi trường backend:

```dotenv
AI_RECOMMENDATIONS_ENABLED=false
GEMINI_API_KEY=
AI_RECOMMENDATION_MODEL=gemini-3.5-flash-lite
AI_RECOMMENDATION_TIMEOUT_MS=8000
AI_RECOMMENDATION_CACHE_TTL_MINUTES=360
```

Quy tắc:

- Nếu `AI_RECOMMENDATIONS_ENABLED=false`, key là optional và backend chạy deterministic-only.
- Nếu `AI_RECOMMENDATIONS_ENABLED=true` nhưng thiếu `GEMINI_API_KEY`, env validation phải fail fast khi khởi động; không âm thầm chạy sai cấu hình.
- Key sai/hết quyền/quota hoặc provider lỗi tại runtime phải fallback và không làm hỏng deterministic result.
- Không hard-code tên model trong UI.
- Model phải cấu hình từ env và được validate có điều kiện.
- Free Tier chỉ dùng cho đồ án/thử nghiệm; dữ liệu gửi provider phải được tối giản và loại PII vì điều khoản Free Tier có thể cho phép dùng nội dung để cải thiện sản phẩm.
- Khi vận hành với dữ liệu sinh viên thật ở production, phải review privacy và chuyển Paid Tier hoặc provider có điều khoản xử lý dữ liệu phù hợp.
- Tổng time budget cho provider là 8 giây, tối đa 1 retry nằm trong cùng budget; không phải 8 giây cho mỗi lần thử.
- Global ThrottlerGuard hiện tại vẫn giới hạn theo tracker mặc định. Giới hạn chi phí theo sinh viên được enforce trong service/cache: cache hit không gọi AI và force refresh có cooldown 10 phút theo `studentId`.
- Không log API key, prompt đầy đủ, summary/project description hoặc AI raw response.
- Log kỹ thuật chỉ gồm request id, student profile id băm/ẩn, source, latency, candidate count, cache hit và error category.

## 15. Bảo mật và privacy

- Client không gửi profile hoặc danh sách internship cho endpoint AI.
- Backend tự lấy dữ liệu theo JWT current user.
- Không cho role khác truy cập recommendation của sinh viên.
- Nội dung profile, project và internship được coi là untrusted data trong prompt; provider được yêu cầu không làm theo instruction nằm trong dữ liệu.
- Response AI phải qua schema validation và plain-text sanitization.
- Không render AI text bằng `dangerouslySetInnerHTML`.
- Không bật Google Search grounding, URL context, code execution hoặc tool calling; feature chỉ cần text structured output.
- Không lưu prompt chứa PII vào AuditLog.
- Recommendation generation không phải thao tác thay đổi nghiệp vụ nhạy cảm, nên không tạo AuditLog cho mỗi lần bấm; chỉ lưu cache metadata.
- Ngay cạnh nút tạo gợi ý, frontend phải thông báo ngắn rằng major, summary, skills, projects và preferences đã tối giản sẽ được gửi tới dịch vụ AI bên thứ ba; không nêu model/provider trong marketing copy.

## 16. Thiết kế frontend

### 16.1. Vị trí UI

Giữ tab **Internship** hiện tại và chia nội dung thành hai phần:

1. **Dành cho bạn**: profile readiness, preferences, nút tạo/làm mới, top 10.
2. **Tất cả vị trí**: search/filter/list hiện tại.

Không tạo route hoặc navigation cấp cao mới nếu không cần thiết.

### 16.2. Component/type đề xuất

```text
Frontend/src/recommendations/
├── api.ts
├── types.ts
└── recommendationLabels.ts

Frontend/src/internships/
└── mappers.ts

Frontend/src/components/StudentView/
├── JobRecommendations.tsx
├── ProfileReadinessBanner.tsx
├── JobPreferenceForm.tsx
├── RecommendationCard.tsx
└── RecommendationExplanation.tsx
```

Không thêm recommendation vào legacy `Frontend/src/types.ts`. API client phải parse response wrapper chuẩn của backend.

Recommendation response dùng lại `InternshipRecord` từ `Frontend/src/internships/api.ts`. Di chuyển `toLegacyInternship` khỏi `App.tsx` sang `Frontend/src/internships/mappers.ts` để danh sách thường và recommendation dùng chung adapter; không tạo mapper thứ hai hoặc duplicate detail/apply modal.

Detail/apply modal phải được tách thành component dùng chung hoặc nhận cùng model từ shared mapper. Recommendation card chỉ gọi callback mở detail/apply; không tự triển khai một submission flow thứ hai.

### 16.3. Profile reminder

Khi readiness chưa HIGH, hiển thị banner màu amber/blue, không dùng browser alert:

> Cập nhật hồ sơ để AI phân tích chi tiết và sát với mục tiêu của bạn hơn.

Hiển thị chip/action theo field thiếu:

- Thêm kỹ năng.
- Viết giới thiệu.
- Thêm dự án có mô tả.
- Chọn vị trí mong muốn.
- Chọn địa điểm/hình thức làm việc.

Nút **Cập nhật hồ sơ** chuyển sang tab profile hiện tại. Bổ sung prop `onOpenProfile` từ `App.tsx` xuống `InternshipList`/`JobRecommendations`; không để component tự sửa global tab. Nút **Thiết lập mong muốn** mở form trong modal chuẩn của hệ thống.

### 16.4. Top 10 presentation

- Chỉ item có `explanationStatus = AI` mới hiện nhãn `AI phân tích`, reason, strengths, skill gaps và next steps.
- Item fallback/insufficient/disabled và các hạng ngoài `aiCandidateCount` chỉ có score, breakdown, matched/missing skills và `matchSummary`; không dựng section AI rỗng.
- Không ghi “AI recommended 84%”; label đúng là `Độ phù hợp 84%`.
- Nếu fallback, hiển thị thông báo nhẹ: “AI đang tạm thời không khả dụng; kết quả hiện tại được tính từ dữ liệu hồ sơ và kỹ năng.”
- Mỗi card tái sử dụng action xem chi tiết và ứng tuyển hiện tại.
- Có skeleton loading, empty state, stale state và retry; không dùng `window.alert`, `prompt` hoặc `confirm`.

### 16.5. Loại bỏ score giả

- `InternshipList.tsx` không gọi `calculateSkillMatch()` nữa.
- Internship list API hiện không trả batch score, vì vậy card ở danh sách thường phải bỏ badge score; score chỉ xuất hiện trong recommendation và endpoint match chi tiết thật.
- Không ép min 42/max 98 và không mặc định 100 khi internship thiếu skills.
- `getStatusBadge` có thể được tách khỏi `utils/matching.ts`; xóa file nếu sau khi refactor không còn chức năng runtime nào dùng.
- `ApplicationRecord.matchScore` đang nullable; sửa legacy mapper/type và Company Applicants UI để hiển thị “Chưa tính” hoặc ẩn badge khi null, không biến null thành `0%`.

### 16.6. Navbar sau cleanup

- Xóa hoàn toàn nút và modal AI CV Coach cũ.
- Recommendation mới chỉ xuất hiện trong Internship view.
- Không đưa lại tên provider/model vào copy frontend.

## 17. Thứ tự triển khai

### Phase 0 — Xóa sạch AI legacy

1. Xóa `AICVCoachModal` và toàn bộ wiring trong App/Navbar.
2. Xóa hai route `/api/ai/analyze-cv` và `/api/ai/suggest-internships` cùng import/helper Gemini trong `Frontend/server.ts`.
3. Xóa `express.json({ limit: '10mb' })` nếu sau cleanup không còn route frontend nào nhận JSON body.
4. Gỡ `@google/genai` khỏi frontend package, `package-lock.json` và `bun.lock`.
5. Dọn `.env.example`, `metadata.json` và README frontend.
6. Xóa hero copy AI/matching, `calculateSkillMatch()` và score badge giả khỏi InternshipList; tách `getStatusBadge` trước khi xóa phần util không còn dùng.
7. Chạy `rg` xác minh không còn AI runtime cũ hoặc score floor 42/98.
8. Chạy frontend lint/build và smoke test login/navigation/internship để bảo đảm cleanup không ảnh hưởng runtime.

Chỉ bắt đầu Phase 1 sau khi Phase 0 đạt. SDK Gemini mới chỉ được cài ở `Backend`, không cài lại vào `Frontend`.

### Phase 1 — Data contract và migration

1. Thêm `StudentJobPreference` và `InternshipRecommendationCache`.
2. Tạo Prisma migration có tên rõ ràng.
3. Generate Prisma client.
4. Mở rộng StudentsModule với GET/PUT preferences.

### Phase 2 — Scoring core

1. Tách công thức skill matching thành phần thuần tái sử dụng.
2. Sửa endpoint match hiện tại để trả `percentage = null`, `hasRequirements = false` khi internship không có skills.
3. Viết batch candidate query.
4. Áp eligibility rules.
5. Tính breakdown, penalty, confidence và stable sort.
6. Đồng bộ `Application.matchScore` khi create và giữ null cho application không có skill requirements.

Phần công thức thuần đặt tại `Backend/src/skills/skill-match.calculator.ts`; `MatchingService`, `RecommendationScorerService` và application snapshot cùng dùng một implementation, không copy công thức ba nơi. `ApplicationsModule` import `SkillsModule`; không tạo `forwardRef`.

### Phase 3 — Recommendation API và cache

1. Tạo RecommendationsModule.
2. Thêm readiness service.
3. Thêm fingerprint/cache service.
4. Hoàn thiện GET cache và POST generate deterministic-only.
5. Xác minh response contract bằng curl trước khi thêm AI.

### Phase 4 — AI top 3

1. Thêm backend AI SDK/provider adapter.
2. Thêm env validation có điều kiện.
3. Structured prompt/output validation.
4. Timeout, retry, fallback và throttle.
5. Xác minh top 3 có explanation, hạng 4-10 luôn null.

### Phase 5 — Frontend professional UI

1. Thêm typed API layer.
2. Thêm readiness banner và preference form.
3. Thêm create/refresh recommendation flow.
4. Thêm top 10 cards và AI explanation top 3.
5. Tích hợp xem chi tiết/apply.
6. Loại score giả và copy lộ công nghệ/provider.

### Phase 6 — Validation và tài liệu

1. Backend build/lint.
2. Frontend lint/build.
3. Chạy toàn bộ curl matrix.
4. Kiểm tra UI cho desktop/mobile và bốn trạng thái AI.
5. Cập nhật `Backend/README.md`, `Frontend/README.md`, `.env.example` và system design nếu API contract đã ổn định.

## 18. Kịch bản kiểm thử bằng curl

Không viết unit test trong scope hiện tại. Chuẩn bị script dưới `docs/testing/ai-recommendations/` và chạy ít nhất các case:

### 18.1. Auth/RBAC

- Không token -> 401.
- COMPANY/LECTURER/ADMIN token -> 403.
- STUDENT ACTIVE -> đúng quyền.
- Student chưa có profile -> 404 chuẩn.

### 18.2. Preferences

- GET khi chưa cấu hình -> ba mảng rỗng.
- PUT hợp lệ -> trim/deduplicate và GET lại đúng.
- Array quá giới hạn/string quá dài/field lạ -> 400.
- Không thể cập nhật preferences của student khác.

### 18.3. Eligibility/scoring

- Internship CLOSED không xuất hiện.
- Deadline quá hạn không xuất hiện.
- Hết slot không xuất hiện.
- Company chưa approved không xuất hiện.
- Student đã apply không được gợi ý lại.
- Placement active cùng semester loại candidate đúng.
- Thiếu required skill có penalty và danh sách thiếu đúng.
- Internship không khai báo skill không nhận 100% giả.
- Kết quả tối đa 10 và sort ổn định qua nhiều lần gọi.

### 18.4. AI/cache/fallback

- Lần đầu generate -> `cacheHit = false`.
- Gọi lại không đổi dữ liệu -> `cacheHit = true`.
- Sửa skill/project/preference -> fingerprint đổi và regenerate.
- Chỉ các rank trong `aiCandidateCount` có thể có `aiExplanation`.
- Các rank ngoài `aiCandidateCount` luôn null.
- AI disabled -> deterministic-only, API vẫn 200.
- Key sai -> deterministic fallback, không lộ lỗi provider.
- Cấu hình timeout rất thấp trong môi trường kiểm thử rồi gọi bằng curl -> deterministic fallback trong tổng time budget.
- Schema validation all-or-nothing được review qua code và response thực tế; không dựng mock AI endpoint chỉ để ép provider trả JSON sai.
- Force refresh trước cooldown -> 429; sau cooldown chạy đúng.

### 18.5. Application snapshot

- Apply từ recommendation không gửi matchScore từ client.
- Application được tạo với skill `matchScore` do backend tính.
- Thay đổi profile sau đó không làm thay đổi snapshot của application cũ.
- Application cũ hoặc internship không có skill requirements hiển thị “Chưa tính”, không hiển thị 0%/100% giả.

## 19. Kiểm tra UI thủ công

- Student hồ sơ rỗng thấy reminder và action đúng.
- Student hồ sơ đầy đủ thấy readiness HIGH.
- Form preferences hỗ trợ search/tag, không phải select dài đơn thuần.
- Bấm tạo chỉ gửi một request generate và khóa nút khi loading.
- Hai tab/browser gửi generate đồng thời không tạo hai provider calls trên cùng backend instance.
- Khi provider hoạt động và hồ sơ đủ dữ liệu, các item trong `aiCandidateCount` có AI explanation; các item còn lại không có section AI rỗng.
- Fallback, empty, stale, 401/403 và network error có toast/modal chuẩn, không có browser alert.
- Search/filter danh sách internship thường vẫn hoạt động.
- Xem chi tiết và apply từ recommendation không làm hỏng flow cũ.
- Responsive ở mobile/tablet/desktop, nội dung AI dài không phá layout.
- Không còn copy “Gemini”, “NestJS”, “PostgreSQL” hoặc tuyên bố số lượng company không có dữ liệu thật.

## 20. Definition of Done

- [ ] Recommendation chạy hoàn toàn qua NestJS và JWT/RBAC.
- [ ] AI legacy cũ đã được xóa sạch trước khi thêm RecommendationsModule.
- [ ] Top 10 do deterministic backend score; AI không thể sửa score/rank.
- [ ] Chỉ top 3 có AI explanation.
- [ ] Có job preferences được lưu thật trong PostgreSQL.
- [ ] Có profile readiness và reminder actionable trên frontend.
- [ ] Candidate filter đúng status, deadline, slot, company, semester, application và placement.
- [ ] Batch query không N+1.
- [ ] Generate có single-flight, không giữ database transaction khi chờ provider.
- [ ] Cache invalidates khi profile/preferences/candidate thay đổi.
- [ ] Provider lỗi không làm recommendation endpoint thất bại nếu deterministic result vẫn có.
- [ ] `Application.matchScore` được backend ghi tại lúc nộp và không nhận từ client.
- [ ] Không còn score giả trong `Frontend/src/utils/matching.ts`/InternshipList.
- [ ] Match endpoint và application giữ `null` khi internship không có skill requirements; frontend không ép null thành 0/100.
- [ ] Không còn `/api/ai/analyze-cv`, `/api/ai/suggest-internships`, `AICVCoachModal` hoặc `@google/genai` trong frontend runtime.
- [ ] Không lộ provider/model, prompt, API key hoặc PII trên UI/log.
- [ ] Backend build/lint và frontend lint/build đạt.
- [ ] Curl matrix và UI checklist đạt; không yêu cầu unit test.

## 21. Rủi ro và phương án giảm thiểu

| Rủi ro | Giảm thiểu |
|---|---|
| AI trả nội dung sai hoặc không đúng schema | Structured output, validate, whitelist id, fallback xác định |
| Chi phí/quota AI tăng | Chỉ top 3, user chủ động bấm, fingerprint cache, TTL và throttle |
| Điểm thiếu minh bạch | Backend breakdown rõ ràng, AI không tạo điểm |
| Profile nghèo dữ liệu | Readiness banner, missing-field actions, không overclaim độ chính xác |
| Dữ liệu internship tự do khó match | Normalize có kiểm soát; chưa suy diễn stipend/địa lý |
| N+1 và response chậm | Query gộp profile/candidate, scoring in-memory và AI timeout; phase đầu không đặt cap tùy tiện làm mất candidate phù hợp |
| AI scaffold cũ gây xung đột hoặc hai nguồn sự thật | Xóa toàn bộ ở Phase 0, chỉ sau đó mới xây NestJS feature mới |
| Migration cần rollback | Hai model mới độc lập, relation cascade; code fallback khi feature disabled |

## 22. Tiêu chí bắt đầu viết code

Trước khi triển khai, cần giữ nguyên các quyết định sau trừ khi có yêu cầu đổi:

- top 10, AI explanation chỉ top 3;
- backend deterministic ranking;
- preferences gồm desired role, location và work type;
- database cache 6 giờ cho kết quả bình thường, fallback provider 15 phút, force cooldown 10 phút;
- AI failure luôn fallback;
- không parse CV trong phase đầu;
- dùng `gemini-3.5-flash-lite` Free Tier ở giai đoạn đồ án, cấu hình model bằng env;
- xóa sạch toàn bộ AI legacy frontend/Express trước khi triển khai;
- không viết unit test, kiểm API bằng curl.
