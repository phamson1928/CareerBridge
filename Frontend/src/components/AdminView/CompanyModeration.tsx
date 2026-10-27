import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  Ban,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
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

const statusOptions: Array<{
  value: CompanyProfileStatus | "ALL";
  label: string;
}> = [
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
  DRAFT: "border-slate-200 bg-slate-100 text-slate-700",
  PENDING: "border-amber-200 bg-amber-50 text-amber-800",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  REJECTED: "border-rose-200 bg-rose-50 text-rose-800",
  SUSPENDED: "border-slate-300 bg-slate-200 text-slate-800",
};

export const CompanyModeration: React.FC = () => {
  const [companies, setCompanies] = useState<CompanyProfileRecord[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<
    CompanyProfileStatus | "ALL"
  >("PENDING");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<CompanyProfileRecord | null>(null);

  // Modal states
  const [rejecting, setRejecting] = useState<CompanyProfileRecord | null>(null);
  const [suspending, setSuspending] = useState<CompanyProfileRecord | null>(
    null,
  );
  const [unsuspending, setUnsuspending] =
    useState<CompanyProfileRecord | null>(null);

  // Form inputs for Reject / Suspend / Unsuspend
  const [rejectionReasonCode, setRejectionReasonCode] =
    useState<CompanyRejectionReasonCode>("MISSING_DOCUMENT");
  const [rejectionDetail, setRejectionDetail] = useState("");
  const [suspensionReasonCode, setSuspensionReasonCode] =
    useState<CompanySuspensionReasonCode>("POLICY_VIOLATION");
  const [suspensionDetail, setSuspensionDetail] = useState("");
  const [unsuspendDetail, setUnsuspendDetail] = useState("");

  // 6 manual checklist items - MUST be checked manually, not auto-ticked
  const [checklist, setChecklist] = useState<
    Record<CompanyChecklistCode, boolean>
  >({
    LEGAL_NAME_MATCH: false,
    REGISTRATION_NUMBER_MATCH: false,
    ADDRESS_CONSISTENT: false,
    CONTACT_REACHABLE: false,
    DOCUMENT_READABLE: false,
    ACCOUNT_EMAIL_VERIFIED: false,
  });

  const [error, setError] = useState<string | null>(null);

  const load = async (targetPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const result = await companiesApi.list(
        selectedStatus === "ALL" ? undefined : selectedStatus,
        search.trim() || undefined,
        targetPage,
        10,
      );
      setCompanies(result.items);
      setTotal(result.pagination.total);
      setTotalPages(Math.max(result.pagination.totalPages, 1));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(page);
  }, [selectedStatus, page]);

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

  const isChecklistComplete = REQUIRED_CHECKLIST_CODES.every(
    (code) => checklist[code],
  );

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
                Kiểm tra thông tin pháp lý, đối chiếu giấy phép và xác thực
                email trước khi cho phép hoạt động. Nhấn vào từng dòng để xem hồ
                sơ chi tiết.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />{" "}
            Tải lại
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-3 lg:flex-row">
          <label className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  setPage(1);
                  void load(1);
                }
              }}
              placeholder="Tìm theo tên doanh nghiệp, mã số ĐKDN hoặc email..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-500"
            />
          </label>
          <button
            type="button"
            onClick={() => {
              setPage(1);
              void load(1);
            }}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700"
          >
            Tìm kiếm
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setSelectedStatus(option.value);
                setPage(1);
              }}
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
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}
      </section>

      {/* Companies Table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">
            <LoaderCircle className="mx-auto mb-3 h-5 w-5 animate-spin text-indigo-600" />
            Đang tải hồ sơ doanh nghiệp...
          </div>
        ) : companies.length === 0 ? (
          <div className="p-14 text-center">
            <Building2 className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-bold text-slate-700">
              Không tìm thấy hồ sơ phù hợp
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Chưa có doanh nghiệp nào khớp với bộ lọc hiện tại.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3.5">Doanh nghiệp</th>
                    <th className="px-4 py-3.5">Mã số DN</th>
                    <th className="px-4 py-3.5">Liên hệ</th>
                    <th className="px-4 py-3.5">Địa chỉ</th>
                    <th className="px-4 py-3.5">Trạng thái</th>
                    <th className="px-4 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {companies.map((company) => {
                    const isPending = company.status === "PENDING";
                    const isOverdue = company.isOverdue;

                    return (
                      <tr
                        key={company.id}
                        onClick={() => void openDetail(company)}
                        className="cursor-pointer transition hover:bg-slate-50/90"
                      >
                        <td className="px-4 py-3.5 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-indigo-50 text-xs font-black text-indigo-700">
                              {company.logo ? (
                                <img
                                  src={company.logo}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                company.companyName.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0 max-w-[220px] xl:max-w-xs">
                              <p className="truncate text-sm font-bold text-slate-900">
                                {company.companyName}
                              </p>
                              <p className="mt-0.5 truncate text-[11px] text-slate-500">
                                {company.industry || "Chưa cập nhật lĩnh vực"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-4 py-3.5 align-middle font-mono text-xs font-semibold text-slate-700">
                          {company.businessRegistrationNumber || "Chưa cập nhật"}
                        </td>

                        <td className="max-w-[200px] px-4 py-3.5 align-middle">
                          <p className="truncate font-semibold text-slate-800">
                            {company.contactEmail ||
                              company.user?.email ||
                              "Chưa cập nhật"}
                          </p>
                          <p className="mt-0.5 truncate text-[11px] text-slate-500">
                            {company.contactPersonName ||
                              company.contactPhone ||
                              "Chưa có SĐT / người liên hệ"}
                          </p>
                        </td>

                        <td className="max-w-[220px] px-4 py-3.5 align-middle">
                          <p className="truncate text-xs text-slate-600">
                            {company.address || "Chưa cập nhật"}
                          </p>
                        </td>

                        <td className="whitespace-nowrap px-4 py-3.5 align-middle">
                          <div className="flex flex-col items-start gap-1">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusClass[company.status]}`}
                            >
                              {statusLabel[company.status]}
                            </span>
                            {isPending && company.reviewDueAt && (
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-semibold ${
                                  isOverdue ? "text-rose-600" : "text-amber-700"
                                }`}
                              >
                                <Clock className="h-3 w-3 shrink-0" />
                                {isOverdue
                                  ? "Quá hạn SLA"
                                  : `Còn ${company.hoursRemaining ?? 0}h`}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-4 py-3.5 text-right align-middle">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void openDetail(company);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100"
                          >
                            <Eye className="h-3.5 w-3.5" /> Xem chi tiết
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5 text-xs text-slate-600">
              <span className="font-medium text-slate-500">
                Tổng: <strong className="text-slate-700">{total}</strong> doanh
                nghiệp
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="rounded-lg border border-slate-200 bg-white p-2 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span>
                  Trang {page}/{totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages || loading}
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                  className="rounded-lg border border-slate-200 bg-white p-2 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Detail Modal */}
      {selected && !rejecting && !suspending && !unsuspending && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs"
          onClick={closeModals}
        >
          <div
            className="flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusClass[selected.status]}`}
                  >
                    {statusLabel[selected.status]}
                  </span>
                </div>
                <h3 className="mt-1.5 text-lg font-bold text-slate-900">
                  Hồ sơ xác minh doanh nghiệp
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  {selected.companyName} · Mã hồ sơ: {selected.id}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModals}
                className="rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
              {/* SLA Alert */}
              {selected.status === "PENDING" && selected.reviewDueAt && (
                <div
                  className={`flex items-center gap-2 rounded-xl border p-3 text-xs font-semibold ${
                    selected.isOverdue
                      ? "border-rose-200 bg-rose-50 text-rose-700"
                      : "border-amber-200 bg-amber-50 text-amber-800"
                  }`}
                >
                  <Clock className="h-4 w-4 shrink-0" />
                  <div>
                    <p>
                      {selected.isOverdue
                        ? "Hồ sơ đã quá thời hạn cam kết SLA!"
                        : `Thời hạn cam kết SLA: còn ${selected.hoursRemaining ?? 0} giờ`}
                    </p>
                    <p className="mt-0.5 text-[11px] font-normal opacity-90">
                      Hạn xử lý:{" "}
                      {new Date(selected.reviewDueAt).toLocaleString("vi-VN")}{" "}
                      (gửi ngày{" "}
                      {selected.submittedAt
                        ? new Date(selected.submittedAt).toLocaleDateString(
                            "vi-VN",
                          )
                        : "N/A"}
                      )
                    </p>
                  </div>
                </div>
              )}

              {/* Information Grid */}
              <div className="grid gap-4 rounded-xl border border-slate-200/70 bg-slate-50 p-4 text-xs sm:grid-cols-2">
                <Info label="Tên pháp lý" value={selected.companyName} />
                <Info
                  label="Mã số doanh nghiệp"
                  value={selected.businessRegistrationNumber}
                />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    Email tài khoản
                  </p>
                  <p className="mt-1 break-words text-sm font-medium text-slate-800">
                    {selected.user?.email || "Chưa có"}
                  </p>
                  {selected.user?.emailVerifiedAt ? (
                    <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" /> Đã xác thực (
                      {new Date(
                        selected.user.emailVerifiedAt,
                      ).toLocaleDateString("vi-VN")}
                      )
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
                      Giới thiệu doanh nghiệp
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-slate-700">
                      {selected.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Registration Document */}
              {selected.registrationDocumentFileId &&
              selected.registrationDocument ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
                  <div>
                    <p className="text-sm font-bold text-indigo-950">
                      Giấy đăng ký doanh nghiệp
                    </p>
                    <p className="mt-0.5 text-xs text-indigo-900/70">
                      {selected.registrationDocument.originalName} ·{" "}
                      {(
                        selected.registrationDocument.sizeBytes /
                        1024 /
                        1024
                      ).toFixed(2)}{" "}
                      MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      void downloadPrivateFile(
                        selected.registrationDocumentFileId!,
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-bold text-indigo-700 shadow-xs transition hover:bg-indigo-50"
                  >
                    <Download className="h-4 w-4" /> Xem & Tải về
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  Doanh nghiệp chưa tải lên tệp Giấy đăng ký doanh nghiệp.
                </div>
              )}

              {/* Checklist Section for Pending Status */}
              {selected.status === "PENDING" && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-900">
                      Checklist xác minh bắt buộc (6 tiêu chí)
                    </p>
                    <span className="text-xs font-semibold text-slate-500">
                      {
                        REQUIRED_CHECKLIST_CODES.filter((c) => checklist[c])
                          .length
                      }{" "}
                      / 6 đã kiểm tra
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Người duyệt cần kiểm tra và tích chọn thủ công từng tiêu
                    chí. Nút "Duyệt hồ sơ" chỉ mở khi cả 6 mục hợp lệ.
                  </p>

                  <div className="mt-4 space-y-2.5">
                    {REQUIRED_CHECKLIST_CODES.map((code) => {
                      const isEmailCheck = code === "ACCOUNT_EMAIL_VERIFIED";
                      const emailVerified = Boolean(
                        selected.user?.emailVerifiedAt,
                      );

                      return (
                        <label
                          key={code}
                          className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
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
                                (Lưu ý: Email tài khoản chưa được xác thực qua
                                liên kết gửi qua thư)
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
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
                  <p className="font-bold">
                    Yêu cầu bổ sung:{" "}
                    {selected.rejectionReasonCode
                      ? REJECTION_REASON_LABELS[selected.rejectionReasonCode]
                      : ""}
                  </p>
                  <p className="mt-1 text-slate-700">
                    {selected.rejectionReason}
                  </p>
                </div>
              )}
              {selected.suspensionReason && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
                  <p className="font-bold">
                    Lý do tạm dừng:{" "}
                    {selected.suspensionReasonCode
                      ? SUSPENSION_REASON_LABELS[selected.suspensionReasonCode]
                      : ""}
                  </p>
                  <p className="mt-1 text-slate-700">
                    {selected.suspensionReason}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-3.5">
              <button
                type="button"
                onClick={closeModals}
                disabled={processingId !== null}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
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
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" /> Yêu cầu bổ sung
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleApprove()}
                    disabled={processingId !== null || !isChecklistComplete}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 disabled:opacity-50"
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
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-800 transition hover:bg-amber-100 disabled:opacity-50"
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
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 disabled:opacity-50"
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
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs"
          onClick={closeModals}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-900">
              Yêu cầu bổ sung hồ sơ
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Chỉ rõ lý do và tài liệu còn thiếu để {rejecting.companyName}{" "}
              hoàn thiện và nộp lại.
            </p>

            <div className="mt-4 space-y-3 text-xs">
              <label className="block">
                <span className="font-bold text-slate-800">Nhóm lý do</span>
                <select
                  value={rejectionReasonCode}
                  onChange={(e) =>
                    setRejectionReasonCode(
                      e.target.value as CompanyRejectionReasonCode,
                    )
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs outline-none focus:border-indigo-500"
                >
                  {Object.entries(REJECTION_REASON_LABELS).map(
                    ([code, label]) => (
                      <option key={code} value={code}>
                        {label}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="block">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">
                    Mô tả chi tiết *
                  </span>
                  <span
                    className={`text-[11px] ${
                      rejectionDetail.trim().length >= 10
                        ? "text-emerald-600"
                        : "text-slate-400"
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
                disabled={
                  processingId !== null || rejectionDetail.trim().length < 10
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-700 disabled:opacity-50"
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
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs"
          onClick={closeModals}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-900">
              Tạm dừng hoạt động doanh nghiệp
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Tạm ngừng quyền đăng tin và tuyển dụng của{" "}
              {suspending.companyName}.
            </p>

            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              <p className="font-bold">Lưu ý quan trọng:</p>
              <p className="mt-0.5 leading-relaxed">
                Khi tạm dừng, toàn bộ tin tuyển dụng đang mở (OPEN) của doanh
                nghiệp này sẽ tự động chuyển thành ĐÃ ĐÓNG (CLOSED).
              </p>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <label className="block">
                <span className="font-bold text-slate-800">
                  Nhóm lý do tạm dừng
                </span>
                <select
                  value={suspensionReasonCode}
                  onChange={(e) =>
                    setSuspensionReasonCode(
                      e.target.value as CompanySuspensionReasonCode,
                    )
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs outline-none focus:border-indigo-500"
                >
                  {Object.entries(SUSPENSION_REASON_LABELS).map(
                    ([code, label]) => (
                      <option key={code} value={code}>
                        {label}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="block">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">
                    Mô tả lý do chi tiết *
                  </span>
                  <span
                    className={`text-[11px] ${
                      suspensionDetail.trim().length >= 10
                        ? "text-emerald-600"
                        : "text-slate-400"
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
                disabled={
                  processingId !== null || suspensionDetail.trim().length < 10
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-700 disabled:opacity-50"
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
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs"
          onClick={closeModals}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-900">
              Khôi phục hoạt động doanh nghiệp
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Cho phép {unsuspending.companyName} tiếp tục đăng bài và xét tuyển
              sinh viên.
            </p>

            <div className="mt-4 space-y-3 text-xs">
              <label className="block">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">
                    Lý do khôi phục hoạt động *
                  </span>
                  <span
                    className={`text-[11px] ${
                      unsuspendDetail.trim().length >= 10
                        ? "text-emerald-600"
                        : "text-slate-400"
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
                disabled={
                  processingId !== null || unsuspendDetail.trim().length < 10
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
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

const Info: React.FC<{ label: string; value?: string | null }> = ({
  label,
  value,
}) => (
  <div>
    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
      {label}
    </p>
    <p className="mt-1 break-words text-sm font-medium text-slate-800">
      {value || (
        <span className="font-normal text-slate-400">Chưa cập nhật</span>
      )}
    </p>
  </div>
);
