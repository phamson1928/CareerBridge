import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  Eye,
  LifeBuoy,
  LoaderCircle,
  MessageSquareReply,
  RefreshCw,
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
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="admin-page-title text-xl font-bold text-slate-900">
              Hỗ trợ &amp; Báo cáo từ sinh viên
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Tiếp nhận và phản hồi trực tiếp các yêu cầu hỗ trợ hoặc báo cáo
              từ sinh viên.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Tải lại
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
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
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-[#00878a] focus:ring-2 focus:ring-[#00878a]/15"
            />
          </div>
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
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                status === tab.value
                  ? "bg-indigo-600 text-white"
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
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xs font-black text-indigo-700">
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
                          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100"
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

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5 text-xs text-slate-600">
                <span>
                  Trang <strong>{page}</strong> / {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 font-semibold disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Trước
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 font-semibold disabled:opacity-40"
                  >
                    Sau <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Modal Box Chi tiết & Phản hồi khi nhấn vào báo cáo */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[1px]"
          onClick={closeModal}
        >
          <div
            className="flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 bg-slate-50/70 px-6 py-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="text-lg font-extrabold text-slate-900">
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
                <p className="mt-1 text-xs text-slate-500">
                  Gửi lúc:{" "}
                  {new Date(selected.createdAt).toLocaleString("vi-VN")}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200/70 hover:text-slate-700"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
              {/* Thông tin sinh viên */}
              <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    Sinh viên gửi
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-slate-900">
                    {selected.student.fullName} ({selected.student.studentCode})
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    Chuyên ngành
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-700">
                    {selected.student.major}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    Email tài khoản
                  </p>
                  <p className="mt-0.5 break-all text-sm text-slate-700">
                    {selected.student.user.email}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    Số điện thoại
                  </p>
                  <p className="mt-0.5 text-sm text-slate-700">
                    {selected.student.phone || "Chưa cập nhật"}
                  </p>
                </div>
              </div>

              {/* Nội dung báo cáo */}
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  Tiêu đề báo cáo
                </p>
                <h4 className="mt-1 text-base font-bold text-slate-900">
                  {selected.title}
                </h4>

                <p className="mt-4 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  Nội dung chi tiết
                </p>
                <div className="mt-1.5 max-h-56 overflow-y-auto rounded-lg bg-slate-50 p-3.5 text-sm leading-relaxed text-slate-800 whitespace-pre-line">
                  {selected.content}
                </div>
              </div>

              {/* Khu vực phản hồi của Admin */}
              {isEditingReply ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <label
                    htmlFor="admin-reply-input"
                    className="block text-xs font-bold text-slate-800"
                  >
                    Phản hồi từ Quản trị viên
                  </label>
                  <textarea
                    id="admin-reply-input"
                    autoFocus
                    rows={4}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Nhập nội dung phản hồi hoặc hướng giải quyết cho sinh viên..."
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-800 outline-none transition focus:border-[#00878a] focus:ring-2 focus:ring-[#00878a]/15"
                  />
                  <div className="mt-3 flex justify-end gap-2">
                    {selected.status === "RESOLVED" && (
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => {
                          setReplyText(selected.adminReply ?? "");
                          setIsEditingReply(false);
                        }}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                      >
                        Hủy sửa
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => void handleReplySubmit()}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {submitting ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      {submitting ? "Đang gửi..." : "Gửi phản hồi"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-800">
                      <MessageSquareReply className="h-4 w-4" />
                      Phản hồi của Quản trị viên
                      {selected.repliedAt && (
                        <span className="font-normal text-emerald-700">
                          •{" "}
                          {new Date(selected.repliedAt).toLocaleString("vi-VN")}
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingReply(true)}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2.5 py-1 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      <Edit3 className="h-3.5 w-3.5" /> Sửa phản hồi
                    </button>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-emerald-950">
                    {selected.adminReply}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex shrink-0 justify-end border-t border-slate-100 bg-slate-50/50 px-6 py-3.5">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl bg-slate-200/80 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-300"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
