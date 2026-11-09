# Hướng Dẫn Phong Cách Thiết Kế Giao Diện (UI/UX Design Style Guide)
## CareerBridge Enterprise Admin Dashboard

Tài liệu này phân tích và định nghĩa chi tiết phong cách thiết kế giao diện từ màn hình **Trung tâm điều hành thực tập (CareerBridge - Quản trị tối cao)**. Tài liệu phục vụ làm chuẩn quy chiếu (Design System Reference) cho toàn bộ các trang giao diện Dashboard, Portal Quản trị, Giảng viên, Doanh nghiệp và Sinh viên trong hệ thống.

---

## 1. Tên gọi & Định danh phong cách (Design Style Classification)

Phong cách thiết kế này là sự giao thoa hài hòa giữa các xu hướng UI/UX hiện đại hàng đầu:

1. **Modern Clean SaaS / Enterprise Admin Dashboard**:
   - Chuẩn thiết kế của các nền tảng SaaS hiện đại (tương tự Linear, Vercel, Supabase, Tailwind UI, Stripe Dashboard).
   - Tối ưu cho việc quản lý dữ liệu lớn nhưng không gây cảm giác nặng nề, khô cứng như các hệ thống ERP/Admin truyền thống.
2. **Flat Design 2.0 (Semi-Flat / Soft UI)**:
   - Tiến hóa từ Flat Design nguyên bản: Loại bỏ bóng đổ nặng nề của Skeuomorphism, nhưng bổ sung chiều sâu tinh tế bằng **bóng mờ siêu nhẹ (soft shadows)**, **viền mỏng độ tương phản thấp (subtle borders)** và **bo góc lớn (rounded corners)**.
3. **Card-Based UI & Bento Grid Layout**:
   - Sử dụng các khối thẻ (Cards) độc lập để module hóa từng nhóm thông tin và chỉ số.
   - Bố cục dạng lưới ngăn nắp (Bento-inspired grid), giúp mắt người dùng dễ quét dữ liệu (visual scanning) theo nhóm.
4. **Functional Teal/Emerald Minimalist**:
   - Sử dụng tông màu chủ đạo là **Teal / Xanh mòng két / Emerald (Xanh ngọc bích)** kết hợp với nền trắng/xám băng (Cool Slate/Off-white).
   - Tạo cảm giác chuyên nghiệp, đáng tin cậy, tươi mới, dịu mắt cho nhân sự làm việc liên tục nhiều giờ.

---

## 2. Các đặc trưng nhận diện cốt lõi (Key Visual Signatures)

| Đặc trưng | Biểu hiện trên màn hình | Giá trị trải nghiệm (UX Value) |
| :--- | :--- | :--- |
| **Bo góc mềm mại (Large Corner Radii)** | Toàn bộ card, button, ô input đều bo cong (`rounded-xl` đến `rounded-2xl`, pill `rounded-full`). | Giảm bớt tính kỹ thuật cứng nhắc, tạo cảm giác thân thiện, hiện đại. |
| **Bảng màu dịu mát (Teal / Cool Slate)** | Nền xám mát `#F8FAFC`, thẻ trắng `#FFFFFF`, điểm nhấn xanh `#008080` / `#0D9488`. | Tăng độ tập trung, giảm mỏi mắt so với nền trắng chói hoặc giao diện quá rực rỡ. |
| **Thẻ chỉ số (Stat Metric Cards)** | Số to đậm (`text-3xl font-bold`), nhãn viết hoa tinh gọn phía trên, chú thích phụ mờ phía dưới. | Nhìn lướt trong 2 giây là nắm bắt ngay chỉ số cốt lõi (High Scannability). |
| **Icon trong hình tròn Pastel** | Icon nét mảnh (Lucide Icons) nằm trong vòng tròn nền nhạt màu tương ứng (Teal pastel, Rose pastel, Sky pastel). | Giúp nhận diện loại thông tin ngay tức thì qua hình ảnh và màu sắc. |
| **Accent Border Cards** | Thẻ tỷ lệ ở hàng dưới có dải màu dọc bên trái (Xanh ngọc cho tiến độ tốt, Đỏ cho việc cần xử lý). | Phân cấp thị giác mức độ ưu tiên mà không cần dùng cảnh báo giật gân. |
| **Thanh tìm kiếm SaaS thông minh** | Ô tìm kiếm có kèm phím tắt `/` (kiểu Linear / Raycast / Mac Spotlight). | Tiết kiệm thao tác, nâng cao hiệu suất làm việc của quản trị viên (Power User). |
| **Thanh lọc dữ liệu dạng dải (Segmented Toolbar)** | Gom 4 dropdown bộ lọc vào chung một dải card nền xám nhạt với bo viền liền mạch. | Gọn gàng, loại bỏ các nút lọc rải rác làm rối không gian hiển thị. |

---

## 3. Bảng màu chuẩn (Design Tokens / Color Palette)

```
Primary (Teal/Emerald):
  ├─ Brand Dark:    #004D40 / #0F766E  (Header, text nhấn mạnh, active)
  ├─ Brand Main:    #008080 / #0D9488  (Button chính, badge, icon chính)
  ├─ Brand Light:   #14B8A6 / #2DD4BF  (Hover, border sáng)
  └─ Brand Tint:    #F0FDFA / #CCFBF1  (Nền badge, nền icon pastel, menu active)

Neutral (Cool Gray / Slate):
  ├─ Canvas Background: #EDF0F4 (Nền xám nhạt tương phản cao, làm nổi bật card trắng)
  ├─ Surface Base:      #F8FAFC (Nền phụ, container lồng)
  ├─ Surface Card:      #FFFFFF (Nền thẻ card, nền input, nổi bật trên nền xám #EDF0F4)
  ├─ Border Light:      #E2E8F0 / #CBD5E1 (Đường viền mỏng 1px)
  ├─ Text Primary:      #0F172A (Chữ chính, tiêu đề H1/H2, con số KPI)
  ├─ Text Secondary:    #475569 (Nhãn danh mục, nội dung diễn giải)
  └─ Text Muted:        #94A3B8 (Placeholder, ghi chú phụ, ngày giờ)

Semantic / Status Accents:
  ├─ Success / Good Progress: #059669 (Green-600) | Nền: #ECFDF5
  ├─ Danger / Action Needed:  #E11D48 / #EF4444 (Rose-500) | Nền: #FFF1F2
  ├─ Info / Entities:         #0284C7 (Sky-600) | Nền: #F0F9FF
  └─ Warning / Pending:       #D97706 (Amber-600) | Nền: #FFFBEB
```

---

## 4. Typography & Spacing Rules

### Typography Scale
- **Họ Font khuyến nghị**: `Be Vietnam Pro`, `Plus Jakarta Sans`, hoặc `Inter` (sans-serif hình học, hỗ trợ tiếng Việt hoàn hảo, số hiển thị thẳng thớm).
- **H1 Page Title**: `24px - 28px` (Font-bold, Tracking-tight, Slate-900).
- **KPI Number**: `28px - 32px` (Font-bold, Tabular numbers, Slate-900).
- **Card Label (Kicker)**: `11px - 12px` (Font-semibold, Uppercase, Tracking-wider, Slate-500).
- **Body / Dropdown**: `14px` (Font-normal / medium, Slate-700).
- **Micro-copy / Caption**: `12px` (Font-normal, Slate-400 hoặc Slate-500).

### Border Radius (Bo góc)
- **Container / Modal / Large Card**: `16px` đến `20px` (`rounded-2xl`).
- **Standard Card / Filter Group**: `12px` đến `14px` (`rounded-xl`).
- **Button / Input Field**: `8px` đến `10px` (`rounded-lg` hoặc `rounded-xl`).
- **Status Badge / Active Tab**: `9999px` (`rounded-full`).

### Elevation & Shadows
- Tuyệt đối không dùng drop shadow đen đậm.
- **Card Shadow**: `0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.02)` (tương đương `shadow-xs` hoặc `shadow-sm` của Tailwind v4).
- Kết hợp viền siêu mảnh `border border-slate-100` hoặc `border-slate-200/70`.

---

## 5. Cấu trúc Component mẫu (Tailwind CSS v4 & React)

### 5.1. Thẻ chỉ số tổng quan (Standard Metric Card)
```tsx
interface MetricCardProps {
  label: string;
  value: string | number;
  subtext: string;
  icon: React.ReactNode;
  iconBgColor?: string;
  iconColor?: string;
}

export function MetricCard({
  label,
  value,
  subtext,
  icon,
  iconBgColor = "bg-teal-50",
  iconColor = "text-teal-700",
}: MetricCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {label}
          </span>
          <div className="text-3xl font-bold text-slate-900 mt-2 tracking-tight">
            {value}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-normal">
            {subtext}
          </p>
        </div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBgColor} ${iconColor}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
```

### 5.2. Thẻ chỉ số có vạch trạng thái (Accent Progress Card)
```tsx
interface AccentCardProps {
  title: string;
  percentageOrValue: string;
  detail: string;
  variant?: "teal" | "danger";
  showAction?: boolean;
}

export function AccentCard({
  title,
  percentageOrValue,
  detail,
  variant = "teal",
  showAction = false,
}: AccentCardProps) {
  const borderColor = variant === "teal" ? "border-l-teal-600" : "border-l-rose-500";
  const valueColor = variant === "teal" ? "text-teal-800" : "text-rose-600";

  return (
    <div className={`bg-white rounded-2xl p-5 border border-slate-100 border-l-4 ${borderColor} shadow-sm flex items-center justify-between`}>
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <div className={`text-3xl font-bold mt-2 tracking-tight ${valueColor}`}>
          {percentageOrValue}
        </div>
        <p className="text-xs text-slate-500 mt-1">
          {detail}
        </p>
      </div>
      {showAction && (
        <button className="w-9 h-9 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition-colors">
          →
        </button>
      )}
    </div>
  );
}
```

### 5.3. Dải bộ lọc ngang (Horizontal Filter Bar)
```tsx
export function FilterToolbar() {
  return (
    <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/60">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Item 1 */}
        <div className="flex flex-col">
          <label className="text-xs text-slate-500 mb-1 font-medium">Kỳ thực tập</label>
          <select className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none">
            <option>Toàn hệ thống</option>
          </select>
        </div>
        {/* Item 2 */}
        <div className="flex flex-col">
          <label className="text-xs text-slate-500 mb-1 font-medium">Khoa</label>
          <select className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none">
            <option>Tất cả Khoa</option>
          </select>
        </div>
        {/* Item 3 */}
        <div className="flex flex-col">
          <label className="text-xs text-slate-500 mb-1 font-medium">Ngành đào tạo</label>
          <select className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none">
            <option>Tất cả Ngành</option>
          </select>
        </div>
        {/* Item 4 */}
        <div className="flex flex-col">
          <label className="text-xs text-slate-500 mb-1 font-medium">Khoảng thời gian</label>
          <select className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none">
            <option>6 tháng gần nhất</option>
          </select>
        </div>
      </div>
      <div className="mt-3 text-xs text-slate-400 flex items-center gap-2">
        <span>🕒 Cập nhật: 12:47 9 thg 11, 2026</span>
        <span>•</span>
        <span>Phạm vi: Toàn hệ thống</span>
      </div>
    </div>
  );
}
```

### 5.4. Thanh Header & Navbar Tinh Giản Chuẩn SaaS (Decluttered 64px Header)
Thiết kế tối ưu không gian, không nhồi nhét breadcrumb trùng lặp vào hàng ngang điều hướng, đảm bảo khoảng thở rộng rãi trên mọi độ phân giải.

```tsx
export function SaasNavbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-2xs">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4 lg:gap-8">
          {/* 1. Brand Identity */}
          <div className="flex items-center gap-2.5 shrink-0 cursor-pointer">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 border border-slate-200/80 p-1 shadow-2xs">
              <img src="/logo.svg" alt="CareerBridge" className="h-full w-full object-contain" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-slate-900 leading-none">CareerBridge</span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-teal-50 text-teal-800 border border-teal-200/70">
                Doanh nghiệp
              </span>
            </div>
          </div>

          {/* 2. Navigation Tabs (Clean Pill, Active Highlight) */}
          <nav className="hidden lg:flex items-center gap-1.5">
            <button className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold bg-teal-700 text-white shadow-xs">
              <span>Tổng quan</span>
            </button>
            <button className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition">
              <span>Tin tuyển dụng</span>
            </button>
            <button className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition">
              <span>Ứng viên & CV</span>
            </button>
            <button className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition">
              <span>Đánh giá thực tập</span>
            </button>
            <button className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition">
              <span>Hồ sơ công ty</span>
            </button>
          </nav>

          {/* 3. Utility Actions & Profile Chip */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick search */}
            <div className="hidden 2xl:flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs text-slate-400 w-44">
              <span className="text-[11px]">Tìm nhanh...</span>
              <kbd className="px-1.5 py-0.5 text-[9px] font-bold bg-white rounded border border-slate-200">/</kbd>
            </div>
            {/* Ghost buttons for Chat & Notifications */}
            <button className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition">
              <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-teal-600 text-[9px] font-bold text-white ring-2 ring-white">2</span>
            </button>
            <button className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition">
              <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-white animate-pulse">1</span>
            </button>
            {/* Divider */}
            <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />
            {/* Profile Dropdown Chip */}
            <button className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-100 transition">
              <div className="relative h-8 w-8 rounded-lg overflow-hidden border border-teal-200 bg-teal-50 flex items-center justify-center text-xs font-bold text-teal-800">
                <span>DN</span>
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-1.5 ring-white" />
              </div>
              <span className="text-xs font-bold text-slate-800 hidden sm:block truncate max-w-[130px]">Tên Doanh Nghiệp</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
```

### 5.5. Lộ Trình Tiến Trình & Bộ Thẻ Bento Milestone Sáng Tạo (Semester Campaign Timeline)
Nổi bật, rực rỡ và trực quan với dải gradient đỉnh card, thanh thước đo lấp đầy phần trăm tự động và 4 thẻ Bento Milestone theo từng giai đoạn màu sắc.

```tsx
export function SemesterCampaignBanner() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm">
      {/* 1. Dải Gradient viền đỉnh card */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500" />

      {/* 2. Header với icon gradient và badge đếm ngược */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-600 text-white flex items-center justify-center shadow-md shadow-teal-700/20">
            📅
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-teal-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              TIẾN TRÌNH HỌC KỲ & TUYỂN DỤNG
            </div>
            <div className="flex items-center gap-2 mt-1">
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Học kỳ 2 (2026 - 2027) - Kỳ Xuân</h2>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-0.5 text-xs font-bold text-emerald-800 shadow-2xs">
                ⏱ Đang mở tuyển: Còn 22 ngày trước khi chốt đợt
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Thanh Thước Đo Tiến Trình (Continuous Progress Gauge) */}
      <div className="mt-6 mb-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1.5">
          <span className="text-slate-700 font-bold">Lộ trình triển khai</span>
          <span className="text-teal-800 font-extrabold bg-teal-50 border border-teal-200/80 px-2.5 py-0.5 rounded-full text-[11px]">
            Giai đoạn 2/4 • Mở nhận hồ sơ (50%)
          </span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/70 shadow-inner">
          <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 relative">
            <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
          </div>
        </div>
      </div>

      {/* 4. Bộ 4 thẻ Bento Milestone đa sắc */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Milestone 1: Emerald (Completed) */}
        <div className="rounded-2xl border border-emerald-200/90 bg-gradient-to-b from-emerald-50/40 via-white to-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">✓ Đã hoàn tất</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">✓</div>
          </div>
          <h4 className="text-sm font-bold text-slate-900 mt-3">Lên kế hoạch</h4>
          <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60 mt-1.5">Trước 01/11/2026</span>
          <p className="mt-3 text-xs text-slate-500">Chuẩn bị đợt & tiếp nhận chỉ tiêu DN</p>
        </div>

        {/* Milestone 2: Teal/Cyan (ACTIVE / CURRENT - Nhấn mạnh nổi bật) */}
        <div className="rounded-2xl border-2 border-teal-500 bg-gradient-to-b from-teal-50/70 via-white to-white p-4 shadow-md shadow-teal-500/10 ring-4 ring-teal-500/10 sm:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-700 px-2.5 py-0.5 text-[10px] font-black uppercase text-white shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-ping" />
              HIỆN TẠI
            </span>
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-teal-600 to-cyan-600 text-white shadow-sm flex items-center justify-center">💼</div>
          </div>
          <h4 className="text-sm font-black text-teal-950 mt-3">Mở nhận hồ sơ</h4>
          <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-md bg-teal-100/90 text-teal-900 border border-teal-200 mt-1.5">01/11/2026 - 01/12/2026</span>
          <p className="mt-3 text-xs text-slate-500">DN đăng tin, SV ứng tuyển & phỏng vấn</p>
        </div>

        {/* Milestone 3: Amber (Upcoming Execution) */}
        <div className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4 shadow-2xs hover:border-amber-300 hover:bg-white transition">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-slate-100 text-slate-500 px-2 py-0.5 text-[10px] font-bold">Giai đoạn 03</span>
            <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold">🎓</div>
          </div>
          <h4 className="text-sm font-bold text-slate-700 mt-3">Thực tập & Báo cáo</h4>
          <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/70 mt-1.5">01/12/2026 - 01/04/2027</span>
          <p className="mt-3 text-xs text-slate-500">SV làm việc tại DN, GV hướng dẫn & đánh giá</p>
        </div>

        {/* Milestone 4: Purple (Wrap-up & Completion) */}
        <div className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4 shadow-2xs hover:border-purple-300 hover:bg-white transition">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-slate-100 text-slate-500 px-2 py-0.5 text-[10px] font-bold">Giai đoạn 04</span>
            <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center font-bold">🏆</div>
          </div>
          <h4 className="text-sm font-bold text-slate-700 mt-3">Hoàn thành đợt</h4>
          <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/70 mt-1.5">Sau 01/04/2027</span>
          <p className="mt-3 text-xs text-slate-500">Nghiệm thu học phần & tổng kết điểm số</p>
        </div>
      </div>

      {/* 5. Khung lưu ý nghiệp vụ (Creative Callout Banner) */}
      <div className="mt-5 flex items-start gap-3.5 rounded-2xl border border-teal-200/90 bg-gradient-to-r from-teal-50/90 via-emerald-50/50 to-cyan-50/60 p-4 shadow-2xs relative overflow-hidden">
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">✨</div>
        <div className="text-xs text-slate-700 leading-relaxed">
          <strong className="text-teal-950 font-extrabold">Dành cho Doanh nghiệp tuyển dụng:</strong> Cổng tiếp nhận hồ sơ đang mở. Mọi tin tuyển dụng ở trạng thái <em>Mở (OPEN)</em> sẽ tự động chốt khi kỳ thực tập chính thức bắt đầu vào ngày <strong className="text-teal-900 font-extrabold underline">01/12/2026</strong>.
        </div>
      </div>
    </div>
  );
}
```

### 5.6. Khung Nhắn Tin Realtime Chuẩn SaaS (Modern Clean Chat Drawer)
Thay thế giao diện chat tối màu/gradient cũ kỹ bằng chuẩn Flat 2.0 sạch sẽ, thoáng đãng.
- **Header:** Nền trắng tinh khôi, viền xám mảnh `border-slate-200/80`, thông tin người nhận kèm trạng thái online thời gian thực.
- **Danh bạ:** Phân cách danh sách hội thoại với dải viền mỏng, ô tìm kiếm danh bạ phẳng bo tròn `rounded-xl`.
- **Bong bóng tin nhắn (Message Bubbles):**
  - Tin nhắn gửi đi (Sent): Nền `bg-teal-700 text-white font-medium shadow-xs rounded-2xl rounded-tr-xs`.
  - Tin nhắn nhận về (Received): Nền trắng tinh `bg-white border border-slate-200 text-slate-800 shadow-2xs rounded-2xl rounded-tl-xs`.
- **Khung soạn thảo (Compose Bar):** Input viền `border-slate-200` với focus ring màu Teal, nút gửi tin `bg-teal-700 hover:bg-teal-800 text-white shadow-xs rounded-xl`.

---

## 6. So sánh với các phong cách UI khác

| Tiêu chí | Phong cách này (Modern Clean SaaS Flat 2.0) | Material Design 2/3 (Google) | Neumorphism (Soft Emboss) | Brutalism / Neo-brutalism |
| :--- | :--- | :--- | :--- | :--- |
| **Bóng đổ (Shadow)** | Siêu nhẹ, chỉ tạo ranh giới mờ nhạt | Nhiều tầng cao độ (Elevation z1 - z5) | Bóng lõm lồi kép (khó tiếp cận thị giác) | Đen đậm, góc cạnh, không blur |
| **Màu sắc** | Teal, Slate, Pastel chọn lọc | Dynamic Material You / Hạt màu rực rỡ | Đồng màu nền (monochromatic) | Độ tương phản gắt, màu neon chói |
| **Tính ứng dụng B2B** | **Rất cao** (Tối ưu cho data, báo cáo, quản trị) | Tốt cho app Android / Mobile Consumer | Kém (khó đọc, không đạt chuẩn WCAG) | Thích hợp portfolio / nghệ thuật |
| **Cảm giác mang lại** | Hiện đại, tin cậy, nhẹ nhàng, sạch sẽ | Quy chuẩn, nhiều khoảng đệm | Cầu kỳ, nặng nề, khó scale | Phá cách, giật gân, nổi loạn |

---

## 7. Nguyên tắc triển khai nhất quán cho CareerBridge

Khi phát triển hoặc tái cấu trúc các màn hình khác trong CareerBridge, hãy tuân thủ 8 nguyên tắc vàng:
1. **Một màu chủ đạo (Teal)**: Nút hành động chính (Primary CTA), trạng thái active của menu, chỉ số tích cực đều dùng Teal `#008080` / `#0D9488`.
2. **Nền Canvas tương phản cao (`#EDF0F4`)**: Luôn sử dụng nền canvas xám nhạt mát mẻ `#EDF0F4` để các khối thẻ trắng (`bg-white`) có độ tương phản tự nhiên (~13%), tạo chiều sâu 3D/Flat 2.0 mà không cần bóng đen nặng nề.
3. **Nguyên tắc "Khoảng thở" cho Header (Whitespace First)**:
   - Header cố định chiều cao chuẩn **64px** (`h-16`).
   - Không nhồi nhét breadcrumb vào chung hàng ngang với các tab menu điều hướng (gây xung đột và chèn ép ở màn hình laptop).
   - Nhãn menu ngắn gọn, súc tích (10-15 ký tự).
   - Nhóm tiện ích bên phải dùng Ghost Icon Buttons (`hover:bg-slate-100 rounded-xl`) thay vì đóng khung hộp cứng nhắc.
4. **Phân cấp typography 3 tầng**: Tiêu đề nhóm (uppercase, nhỏ, xám) $\to$ Số liệu chính (rất to, đậm) $\to$ Chi tiết ngữ cảnh (nhỏ, xám nhạt).
5. **Tiến trình sinh động theo giai đoạn (Bento Journey Milestones)**:
   - Thể hiện tiến trình (tiến độ tuyển dụng, đồ án, thực tập) bằng thẻ Bento riêng biệt cho từng mốc thay vì chỉ dùng chấm tròn đơn điệu.
   - Thẻ đang diễn ra (ACTIVE) phải có visual weight cao nhất: viền màu chủ đạo, vòng hào quang `ring-4`, radar ping phát sáng.
   - Luôn kèm theo thanh thước đo tiến trình trực quan (`h-2 rounded-full bg-gradient`).
6. **Không nhồi nhét icon không cần thiết**: Mỗi thẻ chỉ dùng 1 icon đại diện bọc trong vòng tròn hoặc ô vuông bo góc màu pastel nhẹ nhàng.
7. **Cảnh báo có chọn lọc**: Chỉ dùng màu đỏ (`rose-500`) cho chỉ số thực sự cần hành động ngay (ví dụ: *Hồ sơ chưa phân công*, *Báo cáo chờ duyệt quá hạn*).
8. **Viền nhấn màu Gradient (Subtle Color Strips)**: Sử dụng các đường viền gradient đa sắc siêu mảnh (`h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500`) trên đỉnh các banner hoặc card quan trọng để tạo điểm nhấn hiện đại, năng động.
9. **Chuyển động mượt mà (Smooth Micro-Interactions)**: Mọi modal, drawer và bảng nhỏ bật lên đều phải có hoạt họa fade-in kết hợp zoom/slide mượt mà theo chuẩn `cubic-bezier(0.16, 1, 0.3, 1)`, thời lượng dưới 380ms để tạo cảm giác phản hồi tức thì và cao cấp.

---

## 8. Hệ Thống Chuyển Động & Hoạt Họa (Motion & Animation System)

Chuyển động trong phong cách Modern Clean SaaS tuân thủ triết lý **"Nhanh, tinh tế và có chủ đích"** (Fast, subtle, and meaningful). Animation không được làm chậm trễ thao tác của người dùng mà giúp tạo cảm giác mượt mà, có chiều sâu vật lý.

### 8.1. Thông số tiêu chuẩn (Animation Tokens)
- **Đường cong gia tốc chuẩn (Easing Curve):** `cubic-bezier(0.16, 1, 0.3, 1)` (Gia tốc giảm dần kiểu Apple/Linear: bắt đầu nhanh và dừng lại cực kỳ êm ái).
- **Thời lượng mở Drawer (Lớn):** `360ms - 380ms`.
- **Thời lượng mở Modal / Bảng nhỏ (Vừa):** `250ms - 280ms`.
- **Thời lượng Popover / Dropdown (Nhỏ):** `180ms - 220ms`.
- **Thời lượng Micro-action (Button, hover, badge):** `150ms ease`.

---

### 8.2. Hoạt họa mở Khung Chat Realtime (Chat Drawer Motion)
Khi bấm mở chat, màn đen nền xuất hiện đồng thời làm mờ nhẹ nội dung phía sau, khung chat trượt mượt mà từ cạnh phải màn hình:

```css
/* Nền làm mờ nhẹ */
.chat-backdrop {
  background: rgb(15 23 42 / 0.45);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  animation: chat-backdrop-fade 0.28s cubic-bezier(0.16, 1, 0.3, 1) both;
}

/* Khung trượt từ mép phải */
.chat-drawer {
  box-shadow: -16px 0 48px rgb(15 23 42 / 0.20);
  animation: chat-drawer-slide 0.36s cubic-bezier(0.16, 1, 0.3, 1) both;
  will-change: transform;
}

@keyframes chat-backdrop-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes chat-drawer-slide {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

/* Bong bóng tin nhắn nảy nhẹ khi tải/gửi */
.chat-message {
  animation: chat-msg-appear 0.22s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes chat-msg-appear {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
```

---

### 8.3. Hoạt họa mở Các Bảng Nhỏ & Hộp Thoại (Modals & Small Panels)
Toàn bộ các modal (Tạo tin, Xem chi tiết CV, Thống kê tuyển dụng, Chấm điểm...) và các bảng nhỏ trung tâm được áp dụng hiệu ứng **Springy Pop-in**: phóng to nhẹ từ `94%` lên `100%` kết hợp trượt nhẹ lên trên:

```css
/* Backdrop mờ nền của Modal */
.modal-backdrop-animate,
div[class*="fixed inset-0"][class*="z-50"]:not(.chat-backdrop),
div[class*="fixed inset-0"][class*="z-[60]"]:not(.chat-backdrop) {
  animation: modal-backdrop-appear 0.22s cubic-bezier(0.16, 1, 0.3, 1) both;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

@keyframes modal-backdrop-appear {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Thẻ Modal phóng to và lướt nhẹ lên */
.modal-scale-in,
div[class*="fixed inset-0"][class*="z-50"]:not(.chat-backdrop) > form,
div[class*="fixed inset-0"][class*="z-50"]:not(.chat-backdrop) > div:not(.chat-drawer),
div[class*="fixed inset-0"][class*="z-[60]"]:not(.chat-backdrop) > form,
div[class*="fixed inset-0"][class*="z-[60]"]:not(.chat-backdrop) > div {
  animation: modal-card-pop 0.28s cubic-bezier(0.16, 1, 0.3, 1) both;
  will-change: transform, opacity;
}

@keyframes modal-card-pop {
  from {
    opacity: 0;
    transform: scale(0.94) translateY(12px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
```

---

### 8.4. Hoạt họa Bảng Nhỏ Thả Xuống (Dropdowns & Popovers)
Áp dụng cho Menu tài khoản Profile, Xem nhanh thông báo (Notification Preview card), Popover lọc:

```css
.popover-spring,
.notification-hover-card,
.group:hover > div[class*="absolute"][class*="top-full"],
.group:focus-within > div[class*="absolute"][class*="top-full"] {
  animation: popover-drop 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
  transform-origin: top right;
  will-change: transform, opacity;
}

@keyframes popover-drop {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-6px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
```

---

### 8.5. Khả năng tiếp cận & Chế độ Giảm chuyển động (Reduced Motion)
Khi hệ điều hành của người dùng kích hoạt tính năng giảm chuyển động (Reduced Motion), toàn bộ hiệu ứng di chuyển sẽ tự động tắt, chỉ hiển thị ngay lập tức hoặc fade-in nhẹ để chống chóng mặt:

```css
@media (prefers-reduced-motion: reduce) {
  .chat-backdrop,
  .chat-drawer,
  .chat-thread-panel,
  .chat-message,
  .modal-backdrop-animate,
  .modal-scale-in,
  .popover-spring,
  .notification-hover-card,
  div[class*="fixed inset-0"][class*="z-50"] > form,
  div[class*="fixed inset-0"][class*="z-50"] > div {
    animation: none !important;
    transition: none !important;
    transform: none !important;
  }
}

---

## 9. Thiết Kế Chuẩn Phân Hệ Sinh Viên (Student Portal Specifications)

Toàn bộ các trang phía Sinh viên (`InternshipList`, `StudentApplications`, `StudentReports`, `PlacementOverview`) đều áp dụng đồng bộ ngôn ngữ **Modern Clean SaaS / Bento Grid**:

### 9.1. Nền Canvas & Bố Cục Thẻ Bento
- **Canvas Nền**: Đồng bộ mã màu `#EDF0F4`, giúp các thẻ trắng `#FFFFFF` nổi bật với độ tương phản sắc nét.
- **Thanh Tìm Kiếm & Lọc Ngành**: Thiết kế dải thẻ phẳng trắng độc lập, ô input có icon `Search`, phím xóa nhanh, viền focus Teal `#0D9488` kèm vòng sáng nhạt `ring-teal-100`.
- **Nút Lọc Ngành Tương Thích**: Nút `Phù hợp ngành của tôi` đổi màu linh hoạt giữa Teal Pastel (`bg-teal-50 text-teal-800 border-teal-200`) và Active Teal (`bg-teal-700 text-white shadow-2xs`).

### 9.2. Thẻ Công Việc Tương Tác (Interactive Job Cards Grid)
- **Container**: Lưới 2 cột (`grid-cols-1 md:grid-cols-2 gap-5`) kèm lớp `.bento-stagger` kích hoạt hiệu ứng xuất hiện so le khi đổi trang.
- **Card Motion**: Lớp `.card-interactive` kết hợp `hover:-translate-y-1 hover:shadow-lg hover:border-teal-300 transition-all duration-200` tạo cảm giác nhấc bổng 3D nhẹ nhàng.
- **Tiêu đề tin tuyển dụng**: Chuyển màu `group-hover:text-teal-700` đồng bộ với màu thương hiệu.
- **Hộp thông tin đợt thực tập**: Tích hợp trực tiếp huy hiệu đợt học kỳ (`bg-teal-50 text-teal-800 border-teal-200`) và huy hiệu hạn nộp dạng đếm ngược (`Clock` icon, cảnh báo tự động khi còn <= 5 ngày hoặc trong ngày).

### 9.3. Nhật Ký Báo Cáo & Nghiệm Thu Cuối Kỳ
- **Header SaaS Tiêu Chuẩn**: Loại bỏ hoàn toàn dải gradient tối hoặc rực rỡ, thay bằng Header thẻ trắng phẳng (`bg-white rounded-2xl border border-slate-200/90 p-6`), nhãn kickers `SỔ THEO DÕI & NGHIỆM THU THỰC TẬP` trong pill Teal pastel.
- **Bộ 3 Thẻ Bento Chỉ Số**:
  1. *Tiến độ Nhật ký tuần*: Icon đồng hồ `Clock3` trong khối tròn Teal pastel, đếm tuần đã mở / đã nộp và số tuần đã duyệt.
  2. *Báo cáo tổng kết cuối kỳ*: Icon `BookOpenCheck` trong khối tròn Indigo pastel, phản ánh trạng thái nghiệm thu.
  3. *Giảng viên hướng dẫn*: Icon `FileCheck2` trong khối tròn Purple pastel, hiển thị họ tên GVHD và lịch thực tập.
- **Thẻ Cuốn Báo Cáo Tổng Kết (Final Report)**: Thiết kế dạng Bento Feature Card nổi bật, nút nộp và duyệt đính kèm tài liệu PDF/DOCX mượt mà.

---

## 10. Thiết Kế Chuẩn Phân Hệ Giảng Viên (Teacher Portal Specifications)

Toàn bộ các trang phía Giảng viên (`TeacherDashboard`, `SupervisedPlacements`, `ReviewReports`, `TeacherEvaluations`) đã được chuẩn hóa đồng nhất:

### 10.1. Header SaaS & Thẻ Định Danh Giảng Viên (Lecturer Identity Pill)
- Header thanh thoát, nút xuất bảng điểm / danh sách sinh viên Excel định dạng chuẩn nghiệp vụ, nút chuyển hướng nhanh đến phân công phụ trách.
- Thẻ định danh giảng viên (`Lecturer Identity Card`) với avatar ký tự viết hoa lớn, huy hiệu học hàm / học vị (`TS.`, `ThS.`, `PGS.`) và liên kết nhanh đến Hồ sơ cá nhân.

### 10.2. Bento Grid 4 Chỉ Số Tương Tác (Interactive Metric Filter Cards)
- Tại trang `ReviewReports`, 4 thẻ chỉ số vừa đóng vai trò hiển thị con số KPI, vừa hoạt động như **Bộ lọc nhanh (Quick Filter Switchers)**:
  - *Đang chờ duyệt*: Màu vàng hổ phách (`Amber`).
  - *Báo cáo tổng kết chờ duyệt*: Màu Teal ngọc bích.
  - *Đã phê duyệt*: Màu xanh lá (`Emerald`).
  - *Yêu cầu sửa lại*: Màu đỏ hoa hồng (`Rose`).
- Mỗi thẻ có vòng sáng kích hoạt (`ring-2 ring-teal-400/30`), hỗ trợ click tactile scale `active:scale-95`.

### 10.3. Bảng Điểm & Biểu Mẫu Đánh Giá Bento
- Trang `TeacherEvaluations` chia bố cục Bento 2 cột cân xứng: Form chấm điểm bên trái (thang điểm 10 với thanh tính điểm trung bình tổng kết 50% DN + 50% GVHD realtime) và Thông tin sinh viên & tiến độ báo cáo bên phải.

---

## 11. Bảng Tổng Hợp Hệ Thống Hoạt Họa & Tương Tác Vi Mô (Micro-interactions Master Index)

| Thành phần UI | Tên Class / Trigger | Hiệu ứng thị giác (Motion Effect) | Easing & Thời lượng |
| :--- | :--- | :--- | :--- |
| **Toàn bộ trang web** | `.page-fade-in` | Chuyển tab mượt, trượt lên 8px kết hợp mờ dần | `0.26s cubic-bezier(0.16, 1, 0.3, 1)` |
| **Thẻ Bento / Thẻ tin** | `.card-interactive` | Nâng card lên 3-4px, mở rộng bóng đổ và làm sáng viền Teal | `0.2s cubic-bezier(0.16, 1, 0.3, 1)` |
| **Lưới thẻ Bento** | `.bento-stagger > *` | Các thẻ con xuất hiện so le từ 1 đến 8 | Delay `0.04s` mỗi phần tử |
| **Nút bấm (Buttons)** | `button:active` | Thu nhỏ nhẹ (`scale(0.975)` hoặc `active:scale-95`) | `0.08s ease-out` |
| **Hộp thoại / Modal** | `.modal-scale-in` | Phóng to từ 94% lên 100%, trượt lên 12px | `0.28s cubic-bezier(0.16, 1, 0.3, 1)` |
| **Nền Modal** | `modal-backdrop-appear` | Mờ nền tối dần kèm bộ lọc nhòe kính `backdrop-blur-xs` | `0.22s ease-out` |
| **Drawer Chat** | `.chat-drawer` | Trượt từ mép phải 100% vào trong với lò xo tự nhiên | `0.32s cubic-bezier(0.16, 1, 0.3, 1)` |
| **Huy hiệu Radar** | `.pulse-beacon` | Vòng sáng lan tỏa cảnh báo sự kiện đang diễn ra | `2.4s infinite ease-out` |
| **Menu Popover** | `.popover-spring` | Thả nhẹ xuống 6px từ góc neo | `0.2s cubic-bezier(0.16, 1, 0.3, 1)` |

```

