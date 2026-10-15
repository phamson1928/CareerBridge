import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  Ban,
  Building2,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  LoaderCircle,
  RefreshCw,
  Search,
  Send,
  Undo2,
  X,
  XCircle,
} from "lucide-react";
import { getApiErrorMessage } from "../../auth/api";
import {
  companiesApi,
  CompanyChecklistCode,
  CompanyProfileRecord,
  CompanyProfileStatus,
  CompanyRejectionReasonCode,
  CompanySuspensionReasonCode,
  COMPANY_CHECKLIST_DEFINITIONS,
  REQUIRED_CHECKLIST_CODES,
  REJECTION_REASON_LABELS,
  SUSPENSION_REASON_LABELS,
} from "../../companies/api";
import { downloadPrivateFile } from "../../files/api";

const statusOptions: Array<{ value: CompanyProfileStatus | "ALL"; label: string }> = [
  { value: "PENDING", label: "Chờ duyệt" },
  { value: "APPROVED", label: "Đã duyệt" },
  { value: "REJECTED", label: "Cần bổ sung" },
  { value: "SUSPENDED", label: "Đã tạm dừng" },
  { value: "ALL", label: "Tất cả" },
];

const statusLabel: Record<CompanyProfileStatus, string> = {
  DRAFT: "Bản nháp",
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Cần bổ sung",
  SUSPENDED: "Đã tạm dừng",
};

const statusClass: Record<CompanyProfileStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
  PENDING: "bg-amber-50 text-amber-800 border-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  REJECTED: "bg-rose-50 text-rose-800 border-rose-200",
  SUSPENDED: "bg-slate-200 text-slate-800 border-slate-300",
};

export const CompanyModeration: React.FC = () => {
  const [companies, setCompanies] = useState<CompanyProfileRecord[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<CompanyProfileStatus | "ALL">("PENDING");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<CompanyProfileRecord | null>(null);

  // Modal states
  const [rejecting, setRejecting] = useState<CompanyProfileRecord | null>(null);
  const [suspending, setSuspending] = useState<CompanyProfileRecord | null>(null);
  const [unsuspending, setUnsuspending] = useState<CompanyProfileRecord | null>(null);

  // Form inputs for Reject / Suspend / Unsuspend
  const [rejectionReasonCode, setRejectionReasonCode] = useState<CompanyRejectionReasonCode>("MISSING_DOCUMENT");
  const [rejectionDetail, setRejectionDetail] = useState("");
  const [suspensionReasonCode, setSuspensionReasonCode] = useState<CompanySuspensionReasonCode>("POLICY_VIOLATION");
  const [suspensionDetail, setSuspensionDetail] = useState("");
  const [unsuspendDetail, setUnsuspendDetail] = useState("");

  // 6 manual checklist items - MUST be checked manually, not auto-ticked
  const [checklist, setChecklist] = useState<Record<CompanyChecklistCode, boolean>>({
    LEGAL_NAME_MATCH: false,
    REGISTRATION_NUMBER_MATCH: false,
    ADDRESS_CONSISTENT: false,
    CONTACT_REACHABLE: false,
    DOCUMENT_READABLE: false,
    ACCOUNT_EMAIL_VERIFIED: false,
  });

  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await companiesApi.list(
        selectedStatus === "ALL" ? undefined : selectedStatus,
        search.trim() || undefined,
      );
      setCompanies(result.items);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [selectedStatus]);

  const openDetail = async (company: CompanyProfileRecord) => {
    setError(null);
    setSelected(company);
    // Reset manual checklist (all false - no auto tick)
    setChecklist({
      LEGAL_NAME_MATCH: false,
      REGISTRATION_NUMBER_MATCH: false,
      ADDRESS_CONSISTENT: false,
      CONTACT_REACHABLE: false,
      DOCUMENT_READABLE: false,
      ACCOUNT_EMAIL_VERIFIED: false,
    });
    try {
      const detail = await companiesApi.getById(company.id);
      setSelected(detail);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  };

  const isChecklistComplete = REQUIRED_CHECKLIST_CODES.every((code) => checklist[code]);

  const handleApprove = async () => {
    if (!selected || !isChecklistComplete) return;
    setProcessingId(selected.id);
    setError(null);
    try {
      const payload = REQUIRED_CHECKLIST_CODES.map((code) => ({
        code,
        checked: Boolean(checklist[code]),
      }));
      const updated = await companiesApi.approve(selected.id, payload);
      setSelected(updated);
      await load();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejecting) return;
    const detail = rejectionDetail.trim();
    if (detail.length < 10) {
      setError("Lý do chi tiết cần có ít nhất 10 ký tự.");
      return;
    }
    setProcessingId(rejecting.id);
    setError(null);
    try {
      const updated = await companiesApi.reject(rejecting.id, {
        reasonCode: rejectionReasonCode,
        reasonDetail: detail,
      });
      setSelected(updated);
      setRejecting(null);
      setRejectionDetail("");
      await load();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setProcessingId(null);
    }
  };

  const handleSuspend = async () => {
    if (!suspending) return;
    const detail = suspensionDetail.trim();
    if (detail.length < 10) {
      setError("Lý do tạm dừng chi tiết cần có ít nhất 10 ký tự.");
      return;
    }
    setProcessingId(suspending.id);
    setError(null);
    try {
      const updated = await companiesApi.suspend(suspending.id, {
        reasonCode: suspensionReasonCode,
        reasonDetail: detail,
      });
      setSelected(updated);
      setSuspending(null);
      setSuspensionDetail("");
      await load();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setProcessingId(null);
    }
  };

  const handleUnsuspend = async () => {
    if (!unsuspending) return;
    const detail = unsuspendDetail.trim();
    if (detail.length < 10) {
      setError("Lý do khôi phục hoạt động cần có ít nhất 10 ký tự.");
      return;
    }
    setProcessingId(unsuspending.id);
    setError(null);
    try {
      const updated = await companiesApi.unsuspend(unsuspending.id, detail);
      setSelected(updated);
      setUnsuspending(null);
      setUnsuspendDetail("");
      await load();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setProcessingId(null);
    }
  };

  const closeModals = () => {
    if (processingId) return;
    setSelected(null);
    setRejecting(null);
    setSuspending(null);
    setUnsuspending(null);
    setRejectionDetail("");
    setSuspensionDetail("");
    setUnsuspendDetail("");
  };

  const toggleCheck = (code: CompanyChecklistCode) => {
    setChecklist((current) => ({
      ...current,
      [code]: !current[code],
    }));
  };

  return (
    <div className="admin-page admin-page--standard space-y-6">
      {/* Search & Header Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="rounded-xl bg-indigo-600 p-2.5 text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="admin-page-title text-xl font-bold text-slate-900">
                Xác minh doanh nghiệp
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Kiểm tra thông tin pháp lý, đối chiếu giấy phép và xác thực email trước khi cho phép hoạt động.
              </p>
            </div>
          </div>
          <button
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-50 transition"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Tải lại
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-3 lg:flex-row">
          <label className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void load();
              }}
              placeholder="Tìm theo tên doanh nghiệp, mã số ĐKDN hoặc email..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 transition"
            />
          </label>
          <button
            onClick={() => void load()}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 transition"
          >
            Tìm kiếm
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedStatus(option.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                selectedStatus === option.value
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}
      </section>

      {/* Companies List */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 shadow-xs">
          <LoaderCircle className="mx-auto mb-3 h-6 w-6 animate-spin text-indigo-600" />
          Đang tải danh sách hồ sơ...
        </div>
      ) : companies.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 shadow-xs">
          Không tìm thấy hồ sơ doanh nghiệp nào phù hợp bộ lọc.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {companies.map((company) => {
            const isPending = company.status === "PENDING";
            const isOverdue = company.isOverdue;

            return (
              <article
                key={company.id}
                className="relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-indigo-50 font-bold text-indigo-600 text-lg border border-indigo-100">
                        {company.logo ? (
                          <img src={company.logo} alt="" className="h-full w-full object-cover" />
                        ) : (
                          company.companyName.charAt(0)
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 leading-snug break-words">
                          {company.companyName}
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {company.industry || "Chưa cập nhật lĩnh vực"}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                        statusClass[company.status]
                      }`}
                    >
                      {statusLabel[company.status]}
                    </span>
                  </div>

                  {/* SLA Badge for Pending */}
                  {isPending && company.reviewDueAt && (
                    <div
                      className={`mt-3 flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold ${
                        isOverdue
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                    >
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      {isOverdue ? (
                        <span>
                          Quá hạn SLA ({new Date(company.reviewDueAt).toLocaleString("vi-VN")})
                        </span>
                      ) : (
                        <span>
                          Hạn SLA: còn {company.hoursRemaining ?? 0} giờ (
                          {new Date(company.reviewDueAt).toLocaleString("vi-VN")})
                        </span>
                      )}
                    </div>
                  )}

                  <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-600">
                    {company.description || "Chưa có phần giới thiệu."}
                  </p>

                  <div className="mt-3 space-y-1 text-xs text-slate-500 border-t border-slate-100 pt-3">
                    <p>
                      <strong className="text-slate-700">Mã số ĐKDN:</strong>{" "}
                      {company.businessRegistrationNumber || "Chưa cập nhật"}
                    </p>
                    <p>
                      <strong className="text-slate-700">Email liên hệ:</strong>{" "}
                      {company.contactEmail || "Chưa cập nhật"}
                    </p>
                    <p className="truncate">
                      <strong className="text-slate-700">Địa chỉ:</strong>{" "}
                      {company.address || "Chưa cập nhật"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Gửi lúc: {company.submittedAt ? new Date(company.submittedAt).toLocaleDateString("vi-VN") : "N/A"}
                  </span>
                  <button
                    onClick={() => void openDetail(company)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition"
                  >
                    <Eye className="h-3.5 w-3.5" /> Xem hồ sơ chi tiết
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selected && !rejecting && !suspending && !unsuspending && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 backdrop-blur-xs p-4 flex items-center justify-center"
          onClick={closeModals}
        >
          <div
            className="my-8 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span
                  className={`inline-block mb-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                    statusClass[selected.status]
                  }`}
                >
                  {statusLabel[selected.status]}
                </span>
                <h3 className="text-xl font-bold text-slate-900 leading-snug">
                  {selected.companyName}
                </h3>
                <p className="text-xs text-slate-500">Mã hồ sơ: {selected.id}</p>
              </div>
              <button
                onClick={closeModals}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* SLA Alert */}
            {selected.status === "PENDING" && selected.reviewDueAt && (
              <div
                className={`mt-4 flex items-center gap-2 rounded-xl border p-3 text-xs font-semibold ${
                  selected.isOverdue
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-amber-50 text-amber-800 border-amber-200"
                }`}
              >
                <Clock className="h-4 w-4 shrink-0" />
                <div>
                  <p>
                    {selected.isOverdue
                      ? "Hồ sơ đã quá thời hạn cam kết SLA!"
                      : `Thời hạn cam kết SLA: còn ${selected.hoursRemaining ?? 0} giờ`}
                  </p>
                  <p className="font-normal opacity-90 text-[11px] mt-0.5">
                    Hạn xử lý: {new Date(selected.reviewDueAt).toLocaleString("vi-VN")} (gửi ngày{" "}
                    {selected.submittedAt ? new Date(selected.submittedAt).toLocaleDateString("vi-VN") : "N/A"})
                  </p>
                </div>
              </div>
            )}

            {/* Information Grid */}
            <div className="mt-5 grid gap-4 sm:grid-cols-2 bg-slate-50 p-4 rounded-xl border border-slate-200/70 text-xs">
              <Info label="Tên pháp lý" value={selected.companyName} />
              <Info label="Mã số doanh nghiệp" value={selected.businessRegistrationNumber} />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  Email tài khoản
                </p>
                <p className="mt-1 break-words text-sm font-medium text-slate-800">
                  {selected.user?.email || "Chưa có"}
                </p>
                {selected.user?.emailVerifiedAt ? (
                  <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                    <CheckCircle2 className="h-3 w-3" /> Đã xác thực ({new Date(selected.user.emailVerifiedAt).toLocaleDateString("vi-VN")})
                  </span>
                ) : (
                  <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-amber-600">
                    <AlertTriangle className="h-3 w-3" /> Chưa xác thực email
                  </span>
                )}
              </div>
              <Info label="Email liên hệ" value={selected.contactEmail} />
              <Info label="Người liên hệ" value={selected.contactPersonName} />
              <Info label="Số điện thoại" value={selected.contactPhone} />
              <Info label="Địa chỉ hoạt động" value={selected.address} />
              <Info label="Website" value={selected.website} />
              <div className="sm:col-span-2">
                <Info label="Lĩnh vực" value={selected.industry} />
              </div>
              {selected.description && (
                <div className="sm:col-span-2">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    Mô tả doanh nghiệp
                  </p>
                  <p className="mt-1 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {selected.description}
                  </p>
                </div>
              )}
            </div>

            {/* Registration Document */}
            {selected.registrationDocumentFileId && selected.registrationDocument ? (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
                <div>
                  <p className="text-sm font-bold text-indigo-950">Giấy đăng ký doanh nghiệp</p>
                  <p className="mt-0.5 text-xs text-indigo-900/70">
                    {selected.registrationDocument.originalName} · {(selected.registrationDocument.sizeBytes / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void downloadPrivateFile(selected.registrationDocumentFileId!)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-bold text-indigo-700 shadow-xs hover:bg-indigo-50 transition border border-indigo-200"
                >
                  <Download className="h-4 w-4" /> Xem & Tải về
                </button>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                Doanh nghiệp chưa tải lên tệp Giấy đăng ký doanh nghiệp.
              </div>
            )}

            {/* Checklist Section for Pending Status */}
            {selected.status === "PENDING" && (
              <div className="mt-5 rounded-xl border border-slate-200 p-4 bg-white shadow-xs">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-900">
                    Checklist xác minh bắt buộc (6 tiêu chí)
                  </p>
                  <span className="text-xs font-semibold text-slate-500">
                    {REQUIRED_CHECKLIST_CODES.filter((c) => checklist[c]).length} / 6 đã kiểm tra
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Người duyệt cần kiểm tra và tích chọn thủ công từng tiêu chí. Nút "Duyệt hồ sơ" chỉ mở khi cả 6 mục hợp lệ.
                </p>

                <div className="mt-4 space-y-2.5">
                  {REQUIRED_CHECKLIST_CODES.map((code) => {
                    const isEmailCheck = code === "ACCOUNT_EMAIL_VERIFIED";
                    const emailVerified = Boolean(selected.user?.emailVerifiedAt);

                    return (
                      <label
                        key={code}
                        className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition ${
                          checklist[code]
                            ? "border-emerald-300 bg-emerald-50/50"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checklist[code]}
                          onChange={() => toggleCheck(code)}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="text-xs">
                          <p className="font-semibold text-slate-800">
                            {COMPANY_CHECKLIST_DEFINITIONS[code]}
                          </p>
                          {isEmailCheck && !emailVerified && (
                            <p className="mt-0.5 text-[11px] font-medium text-amber-700">
                              (Lưu ý: Email tài khoản chưa được xác thực qua liên kết gửi qua thư)
                            </p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Rejection / Suspension Notice if already set */}
            {selected.rejectionReason && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
                <p className="font-bold">
                  Yêu cầu bổ sung:{" "}
                  {selected.rejectionReasonCode
                    ? REJECTION_REASON_LABELS[selected.rejectionReasonCode]
                    : ""}
                </p>
                <p className="mt-1 text-slate-700">{selected.rejectionReason}</p>
              </div>
            )}
            {selected.suspensionReason && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
                <p className="font-bold">
                  Lý do tạm dừng:{" "}
                  {selected.suspensionReasonCode
                    ? SUSPENSION_REASON_LABELS[selected.suspensionReasonCode]
                    : ""}
                </p>
                <p className="mt-1 text-slate-700">{selected.suspensionReason}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={closeModals}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                Đóng
              </button>

              {selected.status === "PENDING" && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setRejecting(selected);
                      setRejectionReasonCode("MISSING_DOCUMENT");
                      setRejectionDetail("");
                    }}
                    disabled={processingId !== null}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 border border-rose-200 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50 transition"
                  >
                    <XCircle className="h-4 w-4" /> Yêu cầu bổ sung
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleApprove()}
                    disabled={processingId !== null || !isChecklistComplete}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition shadow-xs"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {processingId ? "Đang xử lý..." : "Duyệt hồ sơ (Đạt 6/6)"}
                  </button>
                </>
              )}

              {selected.status === "APPROVED" && (
                <button
                  type="button"
                  onClick={() => {
                    setSuspending(selected);
                    setSuspensionReasonCode("POLICY_VIOLATION");
                    setSuspensionDetail("");
                  }}
                  disabled={processingId !== null}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 disabled:opacity-50 transition"
                >
                  <Ban className="h-4 w-4" /> Tạm dừng doanh nghiệp
                </button>
              )}

              {selected.status === "SUSPENDED" && (
                <button
                  type="button"
                  onClick={() => {
                    setUnsuspending(selected);
                    setUnsuspendDetail("");
                  }}
                  disabled={processingId !== null}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition shadow-xs"
                >
                  <Undo2 className="h-4 w-4" /> Khôi phục hoạt động
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejecting && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4"
          onClick={closeModals}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-900">Yêu cầu bổ sung hồ sơ</h3>
            <p className="mt-1 text-xs text-slate-500">
              Chỉ rõ lý do và tài liệu còn thiếu để {rejecting.companyName} hoàn thiện và nộp lại.
            </p>

            <div className="mt-4 space-y-3 text-xs">
              <label className="block">
                <span className="font-bold text-slate-800">Nhóm lý do</span>
                <select
                  value={rejectionReasonCode}
                  onChange={(e) => setRejectionReasonCode(e.target.value as CompanyRejectionReasonCode)}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs bg-white outline-none focus:border-indigo-500"
                >
                  {Object.entries(REJECTION_REASON_LABELS).map(([code, label]) => (
                    <option key={code} value={code}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">Mô tả chi tiết *</span>
                  <span
                    className={`text-[11px] ${
                      rejectionDetail.trim().length >= 10 ? "text-emerald-600" : "text-slate-400"
                    }`}
                  >
                    {rejectionDetail.trim().length}/1000 ký tự (tối thiểu 10)
                  </span>
                </div>
                <textarea
                  autoFocus
                  rows={4}
                  value={rejectionDetail}
                  onChange={(event) => setRejectionDetail(event.target.value)}
                  maxLength={1000}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-xs outline-none focus:border-indigo-500"
                  placeholder="Nhập hướng dẫn cụ thể về tài liệu hoặc thông tin cần bổ sung..."
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejecting(null)}
                disabled={processingId !== null}
                className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void handleReject()}
                disabled={processingId !== null || rejectionDetail.trim().length < 10}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50 shadow-xs"
              >
                <Send className="h-4 w-4" />
                {processingId ? "Đang gửi..." : "Gửi yêu cầu bổ sung"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      {suspending && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4"
          onClick={closeModals}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-900">Tạm dừng hoạt động doanh nghiệp</h3>
            <p className="mt-1 text-xs text-slate-500">
              Tạm ngừng quyền đăng tin và tuyển dụng của {suspending.companyName}.
            </p>

            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              <p className="font-bold">Lưu ý quan trọng:</p>
              <p className="mt-0.5 leading-relaxed">
                Khi tạm dừng, toàn bộ tin tuyển dụng đang mở (OPEN) của doanh nghiệp này sẽ tự động chuyển thành ĐÃ ĐÓNG (CLOSED).
              </p>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <label className="block">
                <span className="font-bold text-slate-800">Nhóm lý do tạm dừng</span>
                <select
                  value={suspensionReasonCode}
                  onChange={(e) => setSuspensionReasonCode(e.target.value as CompanySuspensionReasonCode)}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs bg-white outline-none focus:border-indigo-500"
                >
                  {Object.entries(SUSPENSION_REASON_LABELS).map(([code, label]) => (
                    <option key={code} value={code}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">Mô tả lý do chi tiết *</span>
                  <span
                    className={`text-[11px] ${
                      suspensionDetail.trim().length >= 10 ? "text-emerald-600" : "text-slate-400"
                    }`}
                  >
                    {suspensionDetail.trim().length}/1000 ký tự (tối thiểu 10)
                  </span>
                </div>
                <textarea
                  autoFocus
                  rows={4}
                  value={suspensionDetail}
                  onChange={(event) => setSuspensionDetail(event.target.value)}
                  maxLength={1000}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-xs outline-none focus:border-indigo-500"
                  placeholder="Nhập lý do vi phạm hoặc căn cứ pháp lý để tạm dừng..."
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSuspending(null)}
                disabled={processingId !== null}
                className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void handleSuspend()}
                disabled={processingId !== null || suspensionDetail.trim().length < 10}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50 shadow-xs"
              >
                <Ban className="h-4 w-4" />
                {processingId ? "Đang xử lý..." : "Xác nhận tạm dừng"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unsuspend Modal */}
      {unsuspending && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4"
          onClick={closeModals}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-900">Khôi phục hoạt động doanh nghiệp</h3>
            <p className="mt-1 text-xs text-slate-500">
              Cho phép {unsuspending.companyName} tiếp tục đăng bài và xét tuyển sinh viên.
            </p>

            <div className="mt-4 space-y-3 text-xs">
              <label className="block">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">Lý do khôi phục hoạt động *</span>
                  <span
                    className={`text-[11px] ${
                      unsuspendDetail.trim().length >= 10 ? "text-emerald-600" : "text-slate-400"
                    }`}
                  >
                    {unsuspendDetail.trim().length}/1000 ký tự (tối thiểu 10)
                  </span>
                </div>
                <textarea
                  autoFocus
                  rows={4}
                  value={unsuspendDetail}
                  onChange={(event) => setUnsuspendDetail(event.target.value)}
                  maxLength={1000}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-xs outline-none focus:border-indigo-500"
                  placeholder="Ghi nhận lý do mở lại quyền hoạt động (ví dụ: đã giải quyết khiếu nại, bổ sung giấy tờ hợp lệ)..."
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setUnsuspending(null)}
                disabled={processingId !== null}
                className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void handleUnsuspend()}
                disabled={processingId !== null || unsuspendDetail.trim().length < 10}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 shadow-xs"
              >
                <Undo2 className="h-4 w-4" />
                {processingId ? "Đang xử lý..." : "Xác nhận khôi phục"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Info: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
  <div>
    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-1 break-words text-sm font-medium text-slate-800">
      {value || <span className="font-normal text-slate-400">Chưa cập nhật</span>}
    </p>
  </div>
);
