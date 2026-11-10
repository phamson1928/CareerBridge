import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  Eye,
  FileText,
  LifeBuoy,
  LoaderCircle,
  Mail,
  MessageSquareReply,
  Phone,
  RotateCcw,
  Search,
  Send,
  X,
} from "lucide-react";
import { getApiErrorMessage } from "../../auth/api";
import { useAppFeedback } from "../Feedback/AppFeedbackProvider";
import { supportRequestsApi } from "../../support-requests/api";
import type {
  SupportRequestRecord,
  SupportRequestStatus,
} from "../../support-requests/types";

const statusStyle: Record<SupportRequestStatus, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  RESOLVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const statusLabel: Record<SupportRequestStatus, string> = {
  PENDING: "Chờ phản hồi",
  RESOLVED: "Đã phản hồi",
};

const filterTabs: Array<{ value: SupportRequestStatus | ""; label: string }> = [
  { value: "", label: "Tất cả" },
  { value: "PENDING", label: "Chờ phản hồi" },
  { value: "RESOLVED", label: "Đã phản hồi" },
];

export const SupportRequestManagement: React.FC = () => {
  const { notify } = useAppFeedback();
  const [items, setItems] = useState<SupportRequestRecord[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<SupportRequestStatus | "">("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected request for modal box
  const [selected, setSelected] = useState<SupportRequestRecord | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isEditingReply, setIsEditingReply] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await supportRequestsApi.listAll({
        page,
        limit: 10,
        search: search.trim() || undefined,
        status: status || undefined,
      });
      setItems(result.items);
      setTotal(result.pagination.total);
      setTotalPages(Math.max(result.pagination.totalPages, 1));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);
  }, [page, search, status]);

  const openModal = (item: SupportRequestRecord) => {
    setSelected(item);
    setReplyText(item.adminReply ?? "");
    setIsEditingReply(item.status === "PENDING");
  };

  const closeModal = () => {
    if (submitting) return;
    setSelected(null);
    setReplyText("");
    setIsEditingReply(false);
  };

  const handleReplySubmit = async () => {
    if (!selected) return;
    const draft = replyText.trim();
    if (!draft) {
      notify({
        title: "Thiếu nội dung phản hồi",
        message: "Vui lòng nhập nội dung phản hồi cho sinh viên.",
        tone: "error",
      });
      return;
    }

    setSubmitting(true);
    try {
      const updated = await supportRequestsApi.reply(selected.id, {
        adminReply: draft,
      });
      setItems((prev) =>
        prev.map((current) => (current.id === updated.id ? updated : current)),
      );
      setSelected(updated);
      setIsEditingReply(false);
      notify({
        title: "Đã gửi phản hồi",
        message: `Đã phản hồi báo cáo của sinh viên ${selected.student.fullName}.`,
        tone: "success",
      });
    } catch (requestError) {
      notify({
        title: "Không thể gửi phản hồi",
        message: getApiErrorMessage(requestError),
        tone: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-page admin-page--standard space-y-6">
      {/* Header & Bộ lọc */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div>
          <h2 className="admin-page-title text-xl font-bold text-slate-900">
            Hỗ trợ &amp; Báo cáo từ sinh viên
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Tiếp nhận và phản hồi trực tiếp các yêu cầu hỗ trợ hoặc báo cáo
            từ sinh viên.
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo tên sinh viên, MSSV, email, tiêu đề hoặc nội dung..."
              className="w-full h-10 rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-9 text-xs text-slate-800 outline-none transition focus:border-[#00878a] focus:ring-2 focus:ring-[#00878a]/15 shadow-2xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStatus("");
              setPage(1);
              void load();
            }}
            disabled={loading}
            className="inline-flex h-10 cursor-pointer shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[#cbebeb] bg-[#e6f6f6] px-3.5 text-xs font-semibold text-[#00878a] shadow-2xs transition hover:bg-[#d5eeee] active:scale-[0.98] disabled:opacity-50 whitespace-nowrap"
            title="Đặt lại bộ lọc và làm mới dữ liệu"
          >
            <RotateCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span>Làm mới</span>
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setStatus(tab.value);
                setPage(1);
              }}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                status === tab.value
                  ? "bg-[#00878a] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </p>
        )}
      </section>

      {/* Danh sách dạng List / Table gọn gàng */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">
            <LoaderCircle className="mx-auto mb-3 h-5 w-5 animate-spin" />
            Đang tải danh sách báo cáo...
          </div>
        ) : items.length === 0 ? (
          <div className="p-14 text-center">
            <LifeBuoy className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-bold text-slate-700">
              Không có báo cáo hỗ trợ nào
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Chưa có yêu cầu hỗ trợ nào khớp với bộ lọc hiện tại.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3.5">Sinh viên</th>
                    <th className="px-4 py-3.5">Tiêu đề &amp; Nội dung</th>
                    <th className="px-4 py-3.5">Thời gian gửi</th>
                    <th className="px-4 py-3.5">Trạng thái</th>
                    <th className="px-4 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => openModal(item)}
                      className="cursor-pointer transition hover:bg-slate-50/90"
                    >
                      <td className="px-4 py-3.5 align-middle">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e6f6f6] text-xs font-black text-[#00878a]">
                            {item.student.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-bold text-slate-900">
                              {item.student.fullName}
                            </p>
                            <p className="mt-0.5 truncate text-[11px] text-slate-500">
                              {item.student.studentCode} · {item.student.major}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="max-w-[260px] px-4 py-3.5 align-middle xl:max-w-sm">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {item.title}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {item.content}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 align-middle text-xs text-slate-500">
                        {new Date(item.createdAt).toLocaleString("vi-VN")}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 align-middle">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusStyle[item.status]}`}
                        >
                          {item.status === "RESOLVED" ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <Clock className="h-3.5 w-3.5" />
                          )}
                          {statusLabel[item.status]}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 text-right align-middle">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openModal(item);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[#cbebeb] bg-[#e6f6f6] px-3 py-1.5 text-xs font-bold text-[#00878a] shadow-2xs transition hover:bg-[#d5eeee] cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          {item.status === "PENDING"
                            ? "Xem & Phản hồi"
                            : "Xem chi tiết"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5 text-xs text-slate-600">
              <span className="font-medium text-slate-500">
                Tổng: <strong className="text-slate-700">{total}</strong> báo
                cáo hỗ trợ
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-slate-200 p-2 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span>
                  Trang {page}/{totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-slate-200 p-2 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Modal Box Chi tiết & Phản hồi khi nhấn vào báo cáo */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-xs transition-opacity"
          onClick={closeModal}
        >
          <div
            className="flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/70 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e6f6f6] font-extrabold text-[#00878a] text-sm shadow-2xs">
                  {selected.student.fullName ? selected.student.fullName.charAt(0).toUpperCase() : "S"}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900">
                      Chi tiết yêu cầu hỗ trợ
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusStyle[selected.status]}`}
                    >
                      {selected.status === "RESOLVED" ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                      {statusLabel[selected.status]}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Gửi lúc: {new Date(selected.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 transition cursor-pointer"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="min-h-0 flex-1 space-y-3.5 overflow-y-auto p-4 sm:p-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {/* 1. Thông tin sinh viên */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Thông tin sinh viên gửi yêu cầu
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Họ và tên &amp; MSSV</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">
                      {selected.student.fullName}{" "}
                      <span className="font-mono text-xs font-semibold text-slate-500">({selected.student.studentCode})</span>
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Chuyên ngành</span>
                    <p className="font-semibold text-slate-800 text-xs mt-0.5">
                      {selected.student.major}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Email tài khoản</span>
                    <a
                      href={`mailto:${selected.student.user.email}`}
                      className="font-medium text-[#00878a] hover:underline flex items-center gap-1.5 mt-0.5 break-all"
                    >
                      <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      {selected.student.user.email}
                    </a>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Số điện thoại</span>
                    <p className="font-medium text-slate-700 flex items-center gap-1.5 mt-0.5">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      {selected.student.phone || "Chưa cập nhật"}
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Nội dung báo cáo */}
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-[#00878a]" /> Nội dung phản ánh từ sinh viên
                </p>
                <h4 className="text-sm font-bold text-slate-900 leading-snug">
                  {selected.title}
                </h4>
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                  {selected.content}
                </div>
              </div>

              {/* 3. Khu vực phản hồi của Admin */}
              {isEditingReply ? (
                <div className="rounded-xl border border-[#cbebeb] bg-[#f2fafb] p-3.5 space-y-2">
                  <label
                    htmlFor="admin-reply-input"
                    className="block text-xs font-bold text-slate-800 flex items-center gap-1.5"
                  >
                    <MessageSquareReply className="h-4 w-4 text-[#00878a]" />
                    Nội dung phản hồi cho sinh viên
                  </label>
                  <textarea
                    id="admin-reply-input"
                    autoFocus
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Nhập nội dung phản hồi hướng dẫn hoặc hướng giải quyết cho sinh viên..."
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none transition focus:border-[#00878a] focus:ring-2 focus:ring-[#00878a]/20 resize-y min-h-[76px]"
                  />
                  <p className="text-[11px] text-slate-500">
                    Sinh viên sẽ nhận được phản hồi này trực tiếp trong phân hệ Hỗ trợ của tài khoản sinh viên.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-800">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Phản hồi của Quản trị viên
                      {selected.repliedAt && (
                        <span className="font-normal text-emerald-700">
                          • {new Date(selected.repliedAt).toLocaleString("vi-VN")}
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingReply(true)}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2.5 py-1 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 cursor-pointer shadow-2xs"
                    >
                      <Edit3 className="h-3.5 w-3.5" /> Sửa phản hồi
                    </button>
                  </div>
                  <p className="mt-2.5 whitespace-pre-line text-xs font-medium leading-relaxed text-emerald-950 bg-white/70 p-3 rounded-lg border border-emerald-100">
                    {selected.adminReply}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer - Fixed at bottom */}
            <div className="flex shrink-0 items-center justify-between border-t border-slate-100 bg-slate-50/70 px-6 py-3.5">
              <div>
                {isEditingReply && selected.status === "RESOLVED" && (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => {
                      setReplyText(selected.adminReply ?? "");
                      setIsEditingReply(false);
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer transition shadow-2xs"
                  >
                    Hủy chỉnh sửa
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer shadow-2xs"
                >
                  Đóng
                </button>
                {isEditingReply ? (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void handleReplySubmit()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#00878a] px-4 py-2 text-xs font-bold text-white shadow-sm shadow-[#00878a]/20 transition hover:bg-[#007477] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    <span>{submitting ? "Đang gửi..." : selected.status === "RESOLVED" ? "Lưu phản hồi" : "Gửi phản hồi"}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingReply(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#cbebeb] bg-[#e6f6f6] px-4 py-2 text-xs font-bold text-[#00878a] shadow-2xs transition hover:bg-[#d5eeee] active:scale-[0.98] cursor-pointer"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Sửa phản hồi</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
