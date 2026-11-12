import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ModalPortal } from "../ModalPortal";
import {
  Activity,
  AlertTriangle,
  Calendar,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileSearch,
  FileText,
  Info,
  LoaderCircle,
  RotateCcw,
  Search,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { getApiErrorMessage } from "../../auth/api";
import {
  auditLogsApi,
  type AuditLogRecord,
  type ListAuditLogsParams,
} from "../../audit-logs/api";

const PAGE_SIZE = 20;

const ACTION_MAP: Record<
  string,
  { label: string; category: string; tone: "emerald" | "rose" | "blue" | "amber" | "slate" }
> = {
  // Semester
  SEMESTER_CREATED: { label: "Tạo kỳ thực tập", category: "Học kỳ", tone: "emerald" },
  SEMESTER_UPDATED: { label: "Cập nhật kỳ thực tập", category: "Học kỳ", tone: "blue" },
  SEMESTER_STATUS_CHANGED: { label: "Đổi trạng thái học kỳ", category: "Học kỳ", tone: "amber" },
  SEMESTER_DELETED: { label: "Xóa kỳ thực tập", category: "Học kỳ", tone: "rose" },

  // Company
  COMPANY_APPROVED: { label: "Duyệt doanh nghiệp", category: "Doanh nghiệp", tone: "emerald" },
  COMPANY_REJECTED: { label: "Từ chối doanh nghiệp", category: "Doanh nghiệp", tone: "rose" },
  COMPANY_SUSPENDED: { label: "Tạm dừng doanh nghiệp", category: "Doanh nghiệp", tone: "rose" },
  COMPANY_UNSUSPENDED: { label: "Khôi phục doanh nghiệp", category: "Doanh nghiệp", tone: "emerald" },
  COMPANY_REVIEW_REQUESTED: { label: "Yêu cầu duyệt hồ sơ", category: "Doanh nghiệp", tone: "amber" },
  COMPANY_PROFILE_CREATED: { label: "Tạo hồ sơ doanh nghiệp", category: "Doanh nghiệp", tone: "emerald" },
  COMPANY_PROFILE_UPDATED: { label: "Cập nhật hồ sơ công ty", category: "Doanh nghiệp", tone: "blue" },
  COMPANY_PROFILE_SUBMITTED: { label: "Gửi duyệt hồ sơ doanh nghiệp", category: "Doanh nghiệp", tone: "amber" },
  COMPANY_PROFILE_DELETED: { label: "Xóa hồ sơ công ty", category: "Doanh nghiệp", tone: "rose" },

  // Internship
  INTERNSHIP_CREATED: { label: "Đăng tin tuyển dụng", category: "Tin tuyển dụng", tone: "emerald" },
  INTERNSHIP_MODERATED: { label: "Kiểm duyệt / Gỡ tin", category: "Tin tuyển dụng", tone: "rose" },
  INTERNSHIP_APPROVED: { label: "Duyệt tin tuyển dụng", category: "Tin tuyển dụng", tone: "emerald" },
  INTERNSHIP_REJECTED: { label: "Từ chối / Gỡ tin tuyển dụng", category: "Tin tuyển dụng", tone: "rose" },
  INTERNSHIP_DELETED: { label: "Xóa tin tuyển dụng", category: "Tin tuyển dụng", tone: "rose" },
  INTERNSHIP_REPOSTED: { label: "Đăng lại tin tuyển dụng", category: "Tin tuyển dụng", tone: "blue" },
  INTERNSHIP_CREATED_FROM_TEMPLATE: { label: "Tạo tin từ mẫu", category: "Tin tuyển dụng", tone: "emerald" },
  INTERNSHIP_REPORTED: { label: "Báo cáo tin vi phạm", category: "Tin tuyển dụng", tone: "amber" },
  INTERNSHIP_REPORT_REVIEWED: { label: "Xử lý báo cáo vi phạm", category: "Tin tuyển dụng", tone: "blue" },
  INTERNSHIP_TEMPLATE_CREATED: { label: "Tạo mẫu tin", category: "Tin tuyển dụng", tone: "emerald" },
  INTERNSHIP_TEMPLATE_UPDATED: { label: "Cập nhật mẫu tin", category: "Tin tuyển dụng", tone: "blue" },
  INTERNSHIP_TEMPLATE_DELETED: { label: "Xóa mẫu tin", category: "Tin tuyển dụng", tone: "rose" },

  // Users
  USER_REGISTERED: { label: "Đăng ký tài khoản", category: "Tài khoản", tone: "emerald" },
  USER_CREATED: { label: "Tạo người dùng mới", category: "Tài khoản", tone: "emerald" },
  USER_UPDATED: { label: "Cập nhật người dùng", category: "Tài khoản", tone: "blue" },
  USER_DELETED: { label: "Xóa tài khoản", category: "Tài khoản", tone: "rose" },
  VERIFICATION_EMAIL_RESENT: { label: "Gửi lại email xác thực", category: "Tài khoản", tone: "amber" },

  // Placement & Supervision
  PLACEMENT_CREATED: { label: "Tiếp nhận thực tập", category: "Hồ sơ thực tập", tone: "emerald" },
  PLACEMENT_SCHEDULE_UPDATED: { label: "Cập nhật lịch thực tập", category: "Hồ sơ thực tập", tone: "blue" },
  PLACEMENT_STATUS_CHANGED: { label: "Đổi trạng thái thực tập", category: "Hồ sơ thực tập", tone: "amber" },
  SUPERVISION_ASSIGNED: { label: "Phân công hướng dẫn", category: "Hồ sơ thực tập", tone: "blue" },
  SUPERVISION_COMPLETED: { label: "Hoàn tất hướng dẫn", category: "Hồ sơ thực tập", tone: "emerald" },
  SUPERVISION_CANCELLED: { label: "Hủy phân công", category: "Hồ sơ thực tập", tone: "rose" },

  // Applications
  APPLICATION_CREATED: { label: "Nộp hồ sơ ứng tuyển", category: "Ứng tuyển", tone: "emerald" },
  APPLICATION_RESUBMITTED: { label: "Nộp lại hồ sơ", category: "Ứng tuyển", tone: "blue" },
  APPLICATION_INTERVIEW_SCHEDULED: { label: "Hẹn phỏng vấn", category: "Ứng tuyển", tone: "amber" },
  APPLICATION_OFFER_SENT: { label: "Gửi đề nghị tiếp nhận", category: "Ứng tuyển", tone: "emerald" },
  APPLICATION_OFFER_ACCEPTED: { label: "Đồng ý nhận offer", category: "Ứng tuyển", tone: "emerald" },
  APPLICATION_OFFER_DECLINED: { label: "Từ chối nhận offer", category: "Ứng tuyển", tone: "rose" },
  APPLICATION_REJECTED: { label: "Từ chối hồ sơ ứng tuyển", category: "Ứng tuyển", tone: "rose" },
  APPLICATION_HIDDEN: { label: "Ẩn đơn ứng tuyển", category: "Ứng tuyển", tone: "slate" },
  APPLICATION_STATUS_CHANGED: { label: "Đổi trạng thái ứng tuyển", category: "Ứng tuyển", tone: "amber" },

  // Evaluations & Reports
  REPORT_SUBMITTED: { label: "Nộp báo cáo thực tập", category: "Báo cáo", tone: "blue" },
  EVALUATION_CREATED: { label: "Tạo phiếu đánh giá", category: "Đánh giá", tone: "emerald" },
  EVALUATION_UPDATED: { label: "Cập nhật đánh giá", category: "Đánh giá", tone: "blue" },
  EVALUATION_DELETED: { label: "Xóa phiếu đánh giá", category: "Đánh giá", tone: "rose" },

  // Faculty & Major
  FACULTY_CREATED: { label: "Thêm mới Khoa", category: "Khoa & Ngành", tone: "emerald" },
  FACULTY_UPDATED: { label: "Cập nhật Khoa", category: "Khoa & Ngành", tone: "blue" },
  FACULTY_DELETED: { label: "Xóa Khoa", category: "Khoa & Ngành", tone: "rose" },
  FACULTY_ACTIVATED: { label: "Kích hoạt khoa", category: "Khoa & Ngành", tone: "emerald" },
  FACULTY_DEACTIVATED: { label: "Ngừng kích hoạt khoa", category: "Khoa & Ngành", tone: "rose" },
  MAJOR_CREATED: { label: "Thêm mới Ngành", category: "Khoa & Ngành", tone: "emerald" },
  MAJOR_UPDATED: { label: "Cập nhật Ngành", category: "Khoa & Ngành", tone: "blue" },
  MAJOR_DELETED: { label: "Xóa Ngành", category: "Khoa & Ngành", tone: "rose" },
  MAJOR_ACTIVATED: { label: "Kích hoạt ngành", category: "Khoa & Ngành", tone: "emerald" },
  MAJOR_DEACTIVATED: { label: "Ngừng kích hoạt ngành", category: "Khoa & Ngành", tone: "rose" },

  // Support
  SUPPORT_REQUEST_CREATED: { label: "Gửi yêu cầu hỗ trợ", category: "Hỗ trợ", tone: "amber" },
  SUPPORT_REQUEST_REPLIED: { label: "Phản hồi yêu cầu", category: "Hỗ trợ", tone: "emerald" },
};

const ENTITY_NAME_MAP: Record<string, string> = {
  Semester: "Học kỳ & Đợt thực tập",
  CompanyProfile: "Doanh nghiệp",
  Company: "Doanh nghiệp",
  Internship: "Tin tuyển dụng",
  User: "Tài khoản người dùng",
  Placement: "Hồ sơ thực tập",
  InternshipPlacement: "Hồ sơ thực tập",
  Application: "Đơn ứng tuyển",
  Faculty: "Khoa đào tạo",
  Major: "Chuyên ngành",
  Supervision: "Phân công hướng dẫn",
  Report: "Báo cáo thực tập",
  InternshipReport: "Báo cáo thực tập",
  Evaluation: "Đánh giá thực tập",
  SupportRequest: "Yêu cầu hỗ trợ",
  InternshipTemplate: "Mẫu tin tuyển dụng",
};

const STATUS_MAP: Record<string, string> = {
  ACTIVE: "Đang hoạt động",
  INACTIVE: "Ngừng hoạt động",
  PENDING: "Chờ xét duyệt",
  APPROVED: "Đã phê duyệt",
  REJECTED: "Đã từ chối",
  SUSPENDED: "Tạm dừng hoạt động",
  BANNED: "Đã khóa",
  DRAFT: "Bản nháp",
  OPEN: "Đang mở tuyển",
  CLOSED: "Đã đóng",
  ARCHIVED: "Đã lưu trữ",
  CANCELLED: "Đã hủy",
  COMPLETED: "Đã hoàn thành",
  PASSED: "Đạt",
  FAILED: "Không đạt",
  INTERVIEWING: "Đang phỏng vấn",
  OFFERED: "Đã gửi đề nghị",
  ACCEPTED: "Đã chấp nhận",
  DECLINED: "Đã từ chối",
  SUBMITTED: "Đã nộp",
  REVIEWED: "Đã duyệt",
  WAITING: "Đang chờ",
  CONFIRMED: "Đã xác nhận",
  UNAUTHORIZED_FEE: "Thu phí sinh viên trái quy định",
  INAPPROPRIATE_CONTENT: "Nội dung không phù hợp",
  MISLEADING_INFO: "Thông tin sai lệch",
  OTHER: "Khác",
};

function formatEntityCategory(entity?: string): string {
  if (!entity) return "Hệ thống";
  const key = entity.toUpperCase();
  if (key.includes("FACULTY") || key.includes("MAJOR")) return "Khoa & Ngành";
  if (key.includes("SEMESTER")) return "Học kỳ";
  if (key.includes("COMPANY")) return "Doanh nghiệp";
  if (key.includes("INTERNSHIP") || key.includes("TEMPLATE")) return "Tin tuyển dụng";
  if (key.includes("USER") || key.includes("ACCOUNT")) return "Tài khoản";
  if (key.includes("PLACEMENT") || key.includes("SUPERVISION")) return "Hồ sơ thực tập";
  if (key.includes("APPLICATION")) return "Ứng tuyển";
  if (key.includes("REPORT")) return "Báo cáo";
  if (key.includes("EVALUATION")) return "Đánh giá";
  if (key.includes("SUPPORT")) return "Hỗ trợ";
  return ENTITY_NAME_MAP[entity] || entity;
}

function formatActionLabel(
  action: string,
  entity?: string
): { label: string; category: string; tone: "emerald" | "rose" | "blue" | "amber" | "slate" } {
  if (ACTION_MAP[action]) return ACTION_MAP[action];

  const category = formatEntityCategory(entity);
  const entityName = (entity && ENTITY_NAME_MAP[entity]) || entity || "đối tượng";
  let label = action.replace(/_/g, " ");
  let tone: "emerald" | "rose" | "blue" | "amber" | "slate" = "slate";

  if (action.endsWith("_ACTIVATED")) {
    label = `Kích hoạt ${entityName.toLowerCase()}`;
    tone = "emerald";
  } else if (action.endsWith("_DEACTIVATED")) {
    label = `Ngừng kích hoạt ${entityName.toLowerCase()}`;
    tone = "rose";
  } else if (action.endsWith("_CREATED")) {
    label = `Tạo mới ${entityName.toLowerCase()}`;
    tone = "emerald";
  } else if (action.endsWith("_UPDATED")) {
    label = `Cập nhật ${entityName.toLowerCase()}`;
    tone = "blue";
  } else if (action.endsWith("_DELETED")) {
    label = `Xóa ${entityName.toLowerCase()}`;
    tone = "rose";
  } else if (action.endsWith("_REJECTED")) {
    label = `Từ chối ${entityName.toLowerCase()}`;
    tone = "rose";
  } else if (action.endsWith("_APPROVED")) {
    label = `Duyệt ${entityName.toLowerCase()}`;
    tone = "emerald";
  } else if (action.endsWith("_REVIEW_REQUESTED")) {
    label = `Yêu cầu duyệt ${entityName.toLowerCase()}`;
    tone = "amber";
  } else if (action.endsWith("_STATUS_CHANGED")) {
    label = `Đổi trạng thái ${entityName.toLowerCase()}`;
    tone = "amber";
  }

  return { label, category, tone };
}

const ENTITY_OPTIONS = [
  { value: "", label: "Tất cả phân hệ tác động" },
  { value: "CompanyProfile", label: "Doanh nghiệp" },
  { value: "Internship", label: "Tin tuyển dụng" },
  { value: "Placement", label: "Hồ sơ thực tập" },
  { value: "Supervision", label: "Phân công hướng dẫn" },
  { value: "Application", label: "Đơn ứng tuyển" },
  { value: "Semester", label: "Học kỳ & Đợt thực tập" },
  { value: "Faculty", label: "Khoa đào tạo" },
  { value: "Major", label: "Chuyên ngành đào tạo" },
  { value: "User", label: "Tài khoản người dùng" },
  { value: "Report", label: "Báo cáo thực tập" },
  { value: "Evaluation", label: "Đánh giá thực tập" },
  { value: "SupportRequest", label: "Yêu cầu hỗ trợ" },
];

function formatDateTime(value: string) {
  const d = new Date(value);
  return {
    time: d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    date: d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }),
  };
}

function formatRole(role?: string) {
  const labels: Record<string, string> = {
    ADMIN: "Quản trị viên",
    STUDENT: "Sinh viên",
    COMPANY: "Doanh nghiệp",
    LECTURER: "Giảng viên",
  };
  return labels[role ?? ""] ?? role ?? "Hệ thống";
}

const FIELD_LABELS: Record<string, string> = {
  name: "Tên đối tượng",
  title: "Tiêu đề",
  companyName: "Tên doanh nghiệp",
  email: "Email tài khoản",
  phone: "Số điện thoại",
  status: "Trạng thái",
  fromStatus: "Trạng thái trước",
  toStatus: "Trạng thái sau",
  from: "Từ",
  to: "Sang",
  reasonDetail: "Lý do chi tiết",
  reasonCode: "Mã lý do",
  reason: "Lý do",
  details: "Chi tiết",
  changedFields: "Các trường cập nhật",
  code: "Mã",
  semester: "Học kỳ",
  department: "Khoa / Bộ môn",
  major: "Chuyên ngành",
  role: "Vai trò",
  studentCode: "Mã số sinh viên",
  taxCode: "Mã số thuế",
  address: "Địa chỉ",
  website: "Trang web",
  internshipTitle: "Vị trí tuyển dụng",
  quota: "Chỉ tiêu",
  startDate: "Ngày bắt đầu",
  endDate: "Ngày kết thúc",
  student: "Sinh viên",
  lecturer: "Giảng viên",
  description: "Mô tả",
  location: "Địa điểm",
  stipend: "Mức hỗ trợ",
  totalSlots: "Tổng chỉ tiêu",
  maxSupervision: "Chỉ tiêu hướng dẫn tối đa",
  academicStatus: "Trạng thái học vụ",
  isActive: "Hoạt động",
  action: "Hành động thực hiện",
  companyId: "Mã doanh nghiệp",
  studentId: "Mã sinh viên",
  lecturerId: "Mã giảng viên",
  placementId: "Mã hồ sơ thực tập",
  semesterId: "Mã học kỳ",
  internshipId: "Mã tin tuyển dụng",
};

function formatMetadataValue(val: any): string {
  if (val === null || val === undefined) return "—";
  if (typeof val === "boolean") return val ? "Có" : "Không";
  if (typeof val === "object") return JSON.stringify(val);
  const str = String(val);
  if (STATUS_MAP[str]) return STATUS_MAP[str];
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(str)) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      if (str.includes("T00:00:00") || str.includes("T23:59:59")) {
        return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
      }
      return `${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} · ${d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}`;
    }
  }
  return str;
}

function getAuditLogSummary(log: AuditLogRecord) {
  const meta = formatActionLabel(log.action, log.entity);

  const md = (log.metadata && typeof log.metadata === "object" ? log.metadata : {}) as Record<string, any>;

  let primaryText = "";
  let subText = "";

  // Extract name/title
  if (md.name) {
    primaryText = String(md.name);
  } else if (md.title) {
    primaryText = String(md.title);
  } else if (md.companyName) {
    primaryText = String(md.companyName);
  } else if (md.internshipTitle) {
    primaryText = String(md.internshipTitle);
  } else if (md.student && md.lecturer) {
    primaryText = `SV: ${md.student} — GV: ${md.lecturer}`;
  } else if (md.student) {
    primaryText = `Sinh viên: ${md.student}`;
  } else if (md.lecturer) {
    primaryText = `Giảng viên: ${md.lecturer}`;
  } else if (md.email) {
    primaryText = String(md.email);
  } else if (md.before?.name) {
    primaryText = String(md.before.name);
  } else if (md.code) {
    primaryText = `${md.code}${md.name ? ` — ${md.name}` : ""}`;
  } else if (md.details) {
    primaryText = String(md.details);
  }

  // Extract context/diff
  if (md.from !== undefined && md.to !== undefined) {
    const fromStr = STATUS_MAP[String(md.from)] || md.from;
    const toStr = STATUS_MAP[String(md.to)] || md.to;
    subText = `Chuyển trạng thái: ${fromStr} ➔ ${toStr}`;
  } else if (md.fromStatus !== undefined && md.toStatus !== undefined) {
    const fromStr = STATUS_MAP[String(md.fromStatus)] || md.fromStatus;
    const toStr = STATUS_MAP[String(md.toStatus)] || md.toStatus;
    subText = `Trạng thái: ${fromStr} ➔ ${toStr}`;
  } else if (md.reasonDetail || md.details) {
    if (primaryText !== md.details && primaryText !== md.reasonDetail) {
      subText = `Lý do: ${String(md.reasonDetail || md.details)}`;
    }
  } else if (md.reasonCode || md.reason) {
    const reasonStr = STATUS_MAP[String(md.reasonCode || md.reason)] || String(md.reasonCode || md.reason);
    subText = `Lý do: ${reasonStr}`;
  } else if (md.changedFields && Array.isArray(md.changedFields)) {
    const vietnameseFields = md.changedFields.map((f: string) => FIELD_LABELS[f] || f);
    subText = `Cập nhật: ${vietnameseFields.join(", ")}`;
  } else if (md.status) {
    const statusStr = STATUS_MAP[String(md.status)] || md.status;
    subText = `Trạng thái: ${statusStr}`;
  }

  if (!primaryText) {
    if (log.entity) {
      primaryText = ENTITY_NAME_MAP[log.entity] || log.entity;
    } else {
      primaryText = meta.label;
    }
  }

  return {
    primaryText,
    subText,
    actionTitle: meta.label,
    category: meta.category,
    tone: meta.tone,
  };
}

function getBadgeClasses(tone: "emerald" | "rose" | "blue" | "amber" | "slate") {
  switch (tone) {
    case "emerald":
      return "border-[#cbebeb] bg-[#e6f6f6] text-[#00878a]";
    case "rose":
      return "border-[#ffd6db] bg-[#fff0f2] text-[#da1c2d]";
    case "blue":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "amber":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "slate":
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

interface DropdownOption {
  value: string;
  label: string;
}

function CustomDropdown({
  value,
  onChange,
  options,
  placeholder = "Chọn...",
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  return (
    <div className={`relative ${isOpen ? "z-40" : "z-auto"} ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`group flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-xl border bg-white px-3.5 text-left text-xs font-semibold transition outline-none shadow-2xs ${
          isOpen
            ? "border-[#00878a] ring-2 ring-[#00878a]/20"
            : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <span className={`truncate ${value ? "text-slate-800" : "text-slate-600"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#00878a]" : "group-hover:text-slate-600"
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 z-50 min-w-full sm:min-w-[210px] rounded-xl border border-slate-100 bg-white p-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-slate-800">
          <div className="space-y-0.5">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
                  opt.value === value
                    ? "bg-[#e6f6f6] font-semibold text-[#00878a]"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {opt.value === value && (
                  <Check className="h-3.5 w-3.5 shrink-0 text-[#00878a]" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export const AuditLogManagement: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [entity, setEntity] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params: ListAuditLogsParams = {
      page,
      limit: PAGE_SIZE,
      search: search.trim() || undefined,
      action: action.trim() || undefined,
      entity: entity.trim() || undefined,
      from: from || undefined,
      to: to || undefined,
    };

    try {
      const result = await auditLogsApi.list(params);
      setLogs(result.items);
      setTotal(result.pagination.total);
      setTotalPages(Math.max(result.pagination.totalPages, 1));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [action, entity, from, page, search, to]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadLogs(), 250);
    return () => window.clearTimeout(timer);
  }, [loadLogs]);

  const resetFilters = () => {
    setSearch("");
    setAction("");
    setEntity("");
    setFrom("");
    setTo("");
    setPage(1);
  };

  // Quick stats computed for dashboard style
  const stats = useMemo(() => {
    const todayStr = new Date().toDateString();
    let todayCount = 0;
    let adminCount = 0;
    let criticalCount = 0;

    logs.forEach((log) => {
      if (new Date(log.createdAt).toDateString() === todayStr) {
        todayCount++;
      }
      if (log.actor?.role === "ADMIN") {
        adminCount++;
      }
      if (
        log.action.includes("DELETE") ||
        log.action.includes("SUSPEND") ||
        log.action.includes("REJECT") ||
        log.action.includes("CANCEL")
      ) {
        criticalCount++;
      }
    });

    return { todayCount, adminCount, criticalCount };
  }, [logs]);

  return (
    <section className="admin-page space-y-4 sm:space-y-5">
      {/* 1. Header Card - Dashboard standard */}
      <header className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-5 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#cbebeb] bg-[#e6f6f6] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#00878a]">
              <ShieldCheck className="h-3 w-3" /> Giám sát vận hành
            </span>
            {loading && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-[#00878a]">
                <LoaderCircle className="h-3 w-3 animate-spin" /> Đang đồng bộ...
              </span>
            )}
          </div>
          <h1 className="mt-1.5 text-2xl font-black tracking-tight text-[#006f72] sm:text-[26px]">
            Nhật ký hệ thống
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Ghi nhận và tra cứu toàn bộ lịch sử thao tác, cập nhật dữ liệu của Quản trị viên và người dùng.
          </p>
        </div>
      </header>

      {/* 2. Stat Cards - Dashboard standard */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "Tổng số bản ghi",
            value: new Intl.NumberFormat("vi-VN").format(total),
            sub: "Toàn bộ lịch sử hệ thống",
            icon: Activity,
            tone: "bg-[#e6f6f6] text-[#00878a]",
          },
          {
            label: "Ghi nhận hôm nay",
            value: stats.todayCount,
            sub: "Sự kiện trong 24 giờ qua",
            icon: Clock3,
            tone: "bg-sky-50 text-sky-700",
          },
          {
            label: "Thao tác Quản trị",
            value: stats.adminCount,
            sub: "Do quản trị viên thực hiện",
            icon: ShieldCheck,
            tone: "bg-emerald-50 text-emerald-700",
          },
          {
            label: "Xóa & Cảnh báo",
            value: stats.criticalCount,
            sub: "Hành động hủy/xóa/tạm dừng",
            icon: AlertTriangle,
            tone: "bg-[#fff0f2] text-[#da1c2d]",
          },
        ].map((item) => {
          const IconComponent = item.icon;
          return (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all"
            >
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold ${item.tone}`}>
                  <IconComponent className="h-3.5 w-3.5" />
                  {item.label}
                </span>
              </div>
              <p className="mt-3 text-2xl font-black tracking-tight text-slate-800">
                {item.value}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">{item.sub}</p>
            </div>
          );
        })}
      </div>

      {/* 3. Main Data Card: Filters + Table + Pagination */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
        {/* Filters Toolbar */}
        <div className="border-b border-slate-100 p-4 sm:p-5 rounded-t-2xl">
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
            {/* Search Input */}
            <div className="flex h-10 min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-2xs transition focus-within:border-[#00878a] focus-within:ring-2 focus-within:ring-[#00878a]/20">
              <Search className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Tìm theo email, hành động, tên đối tượng..."
                className="w-full text-xs text-slate-800 outline-none placeholder:text-slate-400"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                  className="cursor-pointer text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Entity Select */}
            <CustomDropdown
              value={entity}
              onChange={(val) => {
                setEntity(val);
                setPage(1);
              }}
              options={ENTITY_OPTIONS}
              className="w-full shrink-0 sm:w-[200px]"
            />

            {/* Date Pickers */}
            <div className="flex items-center gap-2 w-full shrink-0 sm:w-auto">
              <div className="relative flex-1 sm:w-[145px]">
                <input
                  type="date"
                  value={from}
                  onChange={(e) => {
                    setFrom(e.target.value);
                    setPage(1);
                  }}
                  title="Từ ngày"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 outline-none transition focus:border-[#00878a] focus:ring-1 focus:ring-[#00878a]/20 cursor-pointer shadow-2xs"
                />
              </div>
              <span className="text-slate-400 text-xs shrink-0">đến</span>
              <div className="relative flex-1 sm:w-[145px]">
                <input
                  type="date"
                  value={to}
                  onChange={(e) => {
                    setTo(e.target.value);
                    setPage(1);
                  }}
                  title="Đến ngày"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 outline-none transition focus:border-[#00878a] focus:ring-1 focus:ring-[#00878a]/20 cursor-pointer shadow-2xs"
                />
              </div>
            </div>

            {/* Nút Làm mới ngay sau ngày tháng năm */}
            <button
              type="button"
              onClick={resetFilters}
              disabled={loading}
              className="inline-flex cursor-pointer shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[#cbebeb] bg-[#e6f6f6] px-3.5 h-10 text-xs font-semibold text-[#00878a] shadow-2xs transition hover:bg-[#d5eeee] active:scale-[0.98] disabled:opacity-50 whitespace-nowrap"
              title="Đặt lại bộ lọc và tải lại dữ liệu"
            >
              <RotateCcw className={`h-4 w-4 shrink-0 ${loading ? "animate-spin" : ""}`} />
              <span>Làm mới</span>
            </button>

            {/* Reset button if filtered */}
            {(search || entity || action || from || to) && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-10 cursor-pointer shrink-0 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 shadow-2xs transition hover:bg-rose-100 active:scale-[0.98] whitespace-nowrap"
                title="Xóa tất cả bộ lọc"
              >
                <X className="h-3.5 w-3.5" />
                <span>Xóa lọc</span>
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="m-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 min-w-[900px]">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-5 py-3.5">Thời điểm</th>
                <th className="px-5 py-3.5">Hành động</th>
                <th className="px-5 py-3.5">Nội dung đối tượng</th>
                <th className="px-5 py-3.5">Người thực hiện</th>
                <th className="px-5 py-3.5">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-slate-500">
                    <LoaderCircle className="mx-auto mb-2 h-6 w-6 animate-spin text-[#00878a]" />
                    Đang tải nhật ký hệ thống...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <FileSearch className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    <p className="font-bold text-slate-700 text-sm">
                      Không tìm thấy bản ghi hoạt động nào
                    </p>
                    <p className="mt-1 text-slate-500 text-xs">
                      Thử xóa hoặc điều chỉnh bộ lọc tìm kiếm để xem thêm kết quả.
                    </p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const summary = getAuditLogSummary(log);
                  const dt = formatDateTime(log.createdAt);
                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="cursor-pointer transition-colors hover:bg-slate-50/80 group"
                    >
                      {/* Time */}
                      <td className="whitespace-nowrap px-5 py-3.5 font-medium text-slate-700">
                        <div className="font-semibold text-slate-800">{dt.time}</div>
                        <div className="text-[10px] text-slate-400">{dt.date}</div>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold ${getBadgeClasses(
                            summary.tone
                          )}`}
                        >
                          <span className="text-[10px] uppercase font-bold opacity-75">
                            [{summary.category}]
                          </span>
                          <span>{summary.actionTitle}</span>
                        </span>
                      </td>

                      {/* Content / Entity */}
                      <td className="px-5 py-3.5 max-w-[280px]">
                        <p className="font-bold text-slate-800 truncate" title={summary.primaryText}>
                          {summary.primaryText}
                        </p>
                        {summary.subText && (
                          <p className="text-[11px] text-slate-500 truncate mt-0.5" title={summary.subText}>
                            {summary.subText}
                          </p>
                        )}
                      </td>

                      {/* Actor */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <p className="font-semibold text-slate-800">
                          {log.actor?.email ?? "Hệ thống tự động"}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {formatRole(log.actor?.role)}
                        </p>
                      </td>

                      {/* IP */}
                      <td className="px-5 py-3.5 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {log.ipAddress ?? "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && total > 0 && (
          <footer className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-600">
            <span className="font-medium text-slate-500">
              Tổng:{" "}
              <strong className="text-slate-700">
                {new Intl.NumberFormat("vi-VN").format(total)}
              </strong>{" "}
              sự kiện
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={loading || page <= 1}
                onClick={() => setPage((value) => value - 1)}
                className="rounded-lg border border-slate-200 p-2 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span>
                Trang {page}/{totalPages}
              </span>
              <button
                disabled={loading || page >= totalPages}
                onClick={() => setPage((value) => value + 1)}
                className="rounded-lg border border-slate-200 p-2 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </footer>
        )}
      </div>

      {/* Modal Chi tiết nhật ký - Căn giữa màn hình */}
      {selectedLog && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedLog(null)}
            role="dialog"
            aria-modal="true"
          >
          <div
            className="flex max-h-[calc(100vh-2.5rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/70 p-5">
              <div>
                {(() => {
                  const summary = getAuditLogSummary(selectedLog);
                  return (
                    <>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold ${getBadgeClasses(
                            summary.tone
                          )}`}
                        >
                          [{summary.category}] {summary.actionTitle}
                        </span>
                      </div>
                      <h3 className="mt-1.5 text-base font-bold text-slate-900 leading-snug">
                        {summary.primaryText}
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Thời điểm: {formatDateTime(selectedLog.createdAt).time} · {formatDateTime(selectedLog.createdAt).date}
                      </p>
                    </>
                  );
                })()}
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 transition cursor-pointer"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            {/* Modal Body */}
            <div className="min-h-0 flex-1 space-y-3.5 overflow-y-auto p-5 text-xs [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {/* 1. Tóm tắt nội dung chính */}
              {(() => {
                const summary = getAuditLogSummary(selectedLog);
                return (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 leading-relaxed">
                    <p className="text-slate-700">
                      Người dùng <strong className="text-slate-900">{selectedLog.actor?.email ?? "Hệ thống"}</strong> ({formatRole(selectedLog.actor?.role)}) đã thực hiện thao tác{" "}
                      <strong className="text-[#00878a]">{summary.actionTitle}</strong> cho đối tượng{" "}
                      <strong className="text-slate-900">{summary.primaryText}</strong>.
                    </p>
                    {summary.subText && (
                      <div className="mt-2.5 rounded-lg border border-[#cbebeb] bg-[#f2fafb] px-3 py-2 font-medium text-[#00878a]">
                        {summary.subText}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* 2. Bảng thông tin đối chiếu ngắn gọn */}
              <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                  Thông tin thao tác
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Người thực hiện</span>
                    <p className="font-semibold text-slate-800 mt-0.5 truncate" title={selectedLog.actor?.email ?? ""}>
                      {selectedLog.actor?.email ?? "Hệ thống"}
                    </p>
                    <span className="text-slate-500 text-[11px] block">
                      {formatRole(selectedLog.actor?.role)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Phân hệ tác động</span>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      {selectedLog.entity
                        ? (ENTITY_NAME_MAP[selectedLog.entity] || ENTITY_OPTIONS.find((o) => o.value === selectedLog.entity)?.label || selectedLog.entity)
                        : "Hệ thống"}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Thời gian ghi nhận</span>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      {formatDateTime(selectedLog.createdAt).time} - {formatDateTime(selectedLog.createdAt).date}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Địa chỉ IP</span>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      {selectedLog.ipAddress || "Mạng nội bộ"}
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. Dữ liệu liên quan (chỉ hiện các trường có ý nghĩa nghiệp vụ) */}
              {(() => {
                const md = (selectedLog.metadata && typeof selectedLog.metadata === "object" ? selectedLog.metadata : {}) as Record<string, any>;
                const summary = getAuditLogSummary(selectedLog);
                const IGNORED_KEYS = new Set([
                  "id",
                  "cuid",
                  "entityId",
                  "token",
                  "password",
                  "hash",
                  "createdAt",
                  "updatedAt",
                  "before",
                  ...(summary.primaryText ? ["name", "title", "companyName"] : []),
                ]);

                const relevantKeys = Object.keys(md).filter((k) => !IGNORED_KEYS.has(k));
                if (relevantKeys.length === 0 && !md.before) return null;

                return (
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Dữ liệu liên quan
                    </p>

                    {md.before && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-2.5 text-xs space-y-1">
                        <span className="font-bold text-amber-800">Dữ liệu trước cập nhật:</span>
                        <div className="text-[11px] text-slate-700 bg-white/80 p-2 rounded border border-amber-100">
                          {Object.entries(md.before)
                            .filter(([k]) => !IGNORED_KEYS.has(k))
                            .map(([k, v]) => (
                              <div key={k} className="flex justify-between py-0.5">
                                <span className="text-slate-500">{FIELD_LABELS[k] || k}:</span>
                                <span className="font-medium text-slate-800">{formatMetadataValue(v)}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {relevantKeys.length > 0 && (
                      <div className="space-y-1.5">
                        {relevantKeys.map((key) => {
                          const val = md[key];
                          return (
                            <div key={key} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5">
                              <span className="font-medium text-slate-500">{FIELD_LABELS[key] || key}:</span>
                              <span className="font-semibold text-slate-800 break-all">{formatMetadataValue(val)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <footer className="border-t border-slate-100 bg-slate-50/70 px-5 py-3 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer shadow-2xs"
              >
                Đóng
              </button>
            </footer>
          </div>
        </div>
        </ModalPortal>
      )}
    </section>
  );
};
