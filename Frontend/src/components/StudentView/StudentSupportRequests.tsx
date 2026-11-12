import { ModalPortal } from "../ModalPortal";
import React, { FormEvent, useEffect, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  LifeBuoy,
  LoaderCircle,
  MessageSquareReply,
  Plus,
  Send,
  ShieldAlert,
  X,
} from "lucide-react";
import { getApiErrorMessage } from "../../auth/api";
import { useAppFeedback } from "../Feedback/AppFeedbackProvider";
import { supportRequestsApi } from "../../support-requests/api";
import type {
  SupportRequestRecord,
  SupportRequestStatus,
} from "../../support-requests/types";
import { StudentSupportSkeleton } from "./skeletons";

const statusStyle: Record<SupportRequestStatus, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  RESOLVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const statusLabel: Record<SupportRequestStatus, string> = {
  PENDING: "Chờ xử lý",
  RESOLVED: "Đã phản hồi",
};

const PAGE_SIZE = 5;

function formatTimestamp(dateString: string) {
  const d = new Date(dateString);
  const date = d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return { date, time };
}

export const StudentSupportRequests: React.FC = () => {
  const feedback = useAppFeedback();
  const [items, setItems] = useState<SupportRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selected, setSelected] = useState<SupportRequestRecord | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const page = await supportRequestsApi.mine({ limit: 50 });
      setItems(page.items);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    if (!trimmedTitle || !trimmedContent) {
      setError("Vui lòng nhập đầy đủ tiêu đề và nội dung báo cáo.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const created = await supportRequestsApi.create({
        title: trimmedTitle,
        content: trimmedContent,
      });
      setItems((prev) => [created, ...prev]);
      setTitle("");
      setContent("");
      setIsCreateOpen(false);
      setCurrentPage(1);
      feedback.notify({
        title: "Đã gửi báo cáo thành công",
        message: "Yêu cầu của bạn đã được gửi đến Quản trị viên và Nhà trường.",
        tone: "success",
      });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  // Pagination calculation
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const endIndex = Math.min(totalItems, startIndex + PAGE_SIZE);
  const currentItems = items.slice(startIndex, endIndex);

  if (loading && items.length === 0) {
    return <StudentSupportSkeleton />;
  }

  return (
    <div className="space-y-6 w-full">
      {/* Centered Open Typography Header */}
      <div className="text-center max-w-2xl mx-auto pt-2 pb-5 sm:pt-4 sm:pb-7 space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
          Hỗ Trợ &amp; Phản Ánh
        </h1>
        <p className="text-sm sm:text-base text-slate-500 font-normal leading-relaxed">
          Gửi yêu cầu hỗ trợ hoặc phản ánh vấn đề phát sinh trong kỳ thực tập tới nhà trường.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Table Card (Designed according to user reference) */}
      <div className="rounded-3xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
        {/* Table Top Header: Title & Action Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-7 border-b border-slate-100 text-center sm:text-left">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Danh sách báo cáo đã gửi
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Quản lý và theo dõi tiến độ các yêu cầu của bạn
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setError("");
              setIsCreateOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[#00a3a6] to-[#006d72] px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:brightness-105 active:scale-95 transition-all cursor-pointer shrink-0 self-center sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Tạo báo cáo mới
          </button>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="divide-y divide-slate-100 p-2 sm:p-0">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="px-6 py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl skeleton-shimmer shrink-0" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-48 rounded-md skeleton-shimmer" />
                    <div className="h-3 w-32 rounded-md skeleton-shimmer" />
                  </div>
                </div>
                <div className="h-6 w-24 rounded-full skeleton-shimmer" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center">
            <LifeBuoy className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-3 text-base font-bold text-slate-700">
              Bạn chưa gửi báo cáo nào
            </h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              Khi gặp khó khăn hoặc cần hỗ trợ từ nhà trường trong quá trình thực tập, hãy nhấn nút "Tạo báo cáo mới" ở trên.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile View: Clean card list to avoid horizontal squeeze */}
            <div className="block sm:hidden divide-y divide-slate-100 p-3.5 space-y-3">
              {currentItems.map((item) => {
                const { date, time } = formatTimestamp(item.updatedAt || item.createdAt);
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelected(item)}
                    className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 space-y-2.5 active:scale-[0.99] transition cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${statusStyle[item.status]}`}
                      >
                        {item.status === "RESOLVED" ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <Clock className="h-3.5 w-3.5" />
                        )}
                        {statusLabel[item.status]}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {date} · {time}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                        {item.title}
                      </h4>
                      <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                        {item.content}
                      </p>
                    </div>

                    <div className="flex items-center justify-end pt-2 border-t border-slate-200/60">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-700">
                        <Eye className="h-3.5 w-3.5" /> Chi tiết báo cáo
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop View: Full Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <th scope="col" className="px-6 py-4 w-[42%] max-w-sm">
                      Nội dung yêu cầu
                    </th>
                    <th scope="col" className="px-6 py-4 text-center w-36 whitespace-nowrap">
                      Trạng thái
                    </th>
                    <th scope="col" className="px-6 py-4 w-40 whitespace-nowrap">
                      Cập nhật lúc
                    </th>
                    <th scope="col" className="px-6 py-4 text-center w-28 whitespace-nowrap">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {currentItems.map((item) => {
                    const { date, time } = formatTimestamp(item.updatedAt || item.createdAt);

                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelected(item)}
                        className="hover:bg-teal-50/20 transition-colors cursor-pointer group"
                      >
                        {/* Cột 1: Nội dung yêu cầu */}
                        <td className="px-6 py-4 max-w-sm">
                          <p className="text-sm font-bold text-slate-800 group-hover:text-teal-900 transition-colors line-clamp-1">
                            {item.title}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                            {item.content}
                          </p>
                        </td>

                        {/* Cột 2: Trạng thái */}
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${statusStyle[item.status]}`}
                          >
                            {item.status === "RESOLVED" ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : (
                              <Clock className="h-3.5 w-3.5" />
                            )}
                            {statusLabel[item.status]}
                          </span>
                        </td>

                        {/* Cột 3: Cập nhật lúc */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-xs font-bold text-slate-700">{date}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{time}</p>
                        </td>

                        {/* Cột 4: Thao tác */}
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelected(item);
                            }}
                            className="inline-flex flex-col items-center justify-center gap-0.5 rounded-xl px-2.5 py-1 text-teal-700 hover:bg-teal-50 hover:text-teal-900 transition-colors cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="text-[11px] font-bold">Chi tiết</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Table Footer: Result Count & Pagination */}
        {totalItems > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500 text-center sm:text-left">
            <div className="font-medium text-slate-600">
              Tổng: <span className="font-bold text-slate-900">{totalItems} báo cáo</span>
            </div>

            <nav
              aria-label="Phân trang danh sách báo cáo"
              className="inline-flex items-center gap-1 p-1.5 rounded-2xl border border-slate-200/90 bg-white/95 shadow-sm backdrop-blur-md self-center sm:self-auto"
            >
              {/* Nút Trước */}
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 active:scale-95 disabled:pointer-events-none disabled:opacity-30 cursor-pointer"
                aria-label="Trang trước"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Trước</span>
              </button>

              {/* Các số trang */}
              <div className="flex items-center gap-1 px-1">
                {(() => {
                  const delta = 1;
                  const range: (number | string)[] = [];
                  for (let i = 1; i <= totalPages; i++) {
                    if (
                      i === 1 ||
                      i === totalPages ||
                      (i >= safePage - delta && i <= safePage + delta)
                    ) {
                      range.push(i);
                    } else if (range[range.length - 1] !== "...") {
                      range.push("...");
                    }
                  }

                  return range.map((p, idx) => {
                    if (p === "...") {
                      return (
                        <span
                          key={`ellipsis-${idx}`}
                          className="px-1.5 text-xs font-bold text-slate-400 select-none"
                        >
                          ...
                        </span>
                      );
                    }

                    const pageNum = p as number;
                    const isActive = pageNum === safePage;

                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`h-9 min-w-[36px] px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isActive
                            ? "bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-xs scale-105"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:scale-95"
                        }`}
                        aria-label={`Trang ${pageNum}`}
                        aria-current={isActive ? "page" : undefined}
                      >
                        {pageNum}
                      </button>
                    );
                  });
                })()}
              </div>

              {/* Nút Sau */}
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 active:scale-95 disabled:pointer-events-none disabled:opacity-30 cursor-pointer"
                aria-label="Trang sau"
              >
                <span>Sau</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* MODAL TẠO BÁO CÁO MỚI (Mở khi bấm nút [+ Tạo báo cáo mới]) */}
      {isCreateOpen && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs modal-backdrop-appear"
            onClick={() => !saving && setIsCreateOpen(false)}
          >
            <div
              className="max-h-[92vh] w-full max-w-lg overflow-y-auto no-scrollbar rounded-3xl bg-white shadow-2xl modal-scale-in border border-slate-200/90 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Accent Gradient Line */}
              <div className="h-1.5 w-full bg-gradient-to-r from-[#00a3a6] via-teal-500 to-[#006d72]" />

              <header className="flex items-start justify-between border-b border-slate-100 px-6 py-5 sm:px-8 bg-slate-50/50">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 border border-teal-200 px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-teal-800">
                    <Plus className="h-3.5 w-3.5 text-teal-700" />
                    Báo cáo / Yêu cầu mới
                  </div>
                  <h3 className="mt-2 text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Gửi yêu cầu hỗ trợ
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-slate-500 font-normal leading-relaxed">
                    Admin và Nhà trường sẽ nhận được thông báo ngay khi bạn gửi yêu cầu.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => !saving && setIsCreateOpen(false)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  title="Đóng cửa sổ"
                >
                  <X className="h-4 w-4" />
                </button>
              </header>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4 px-6 py-6 sm:px-8">
                  {error && (
                    <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700">
                      <ShieldAlert className="h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="support-title"
                      className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600"
                    >
                      Tiêu đề <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="support-title"
                      type="text"
                      required
                      maxLength={200}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="VD: Cấp chứng nhận bảo hiểm / Nhờ phân công lại GVHD..."
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-2xs outline-none transition-all placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="support-content"
                      className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600"
                    >
                      Nội dung chi tiết <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      id="support-content"
                      rows={6}
                      required
                      maxLength={2000}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Mô tả cụ thể vấn đề hoặc yêu cầu bạn cần nhà trường hỗ trợ..."
                      className="w-full resize-y rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-800 shadow-2xs outline-none transition-all placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                    />
                  </div>
                </div>

                <footer className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    disabled={saving}
                    className="rounded-full px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Hủy bỏ
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[#00a3a6] to-[#006d72] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:brightness-105 active:scale-95 transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {saving ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    <span>{saving ? "Đang gửi báo cáo..." : "Gửi báo cáo cho Admin"}</span>
                  </button>
                </footer>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL CHI TIẾT BÁO CÁO CHO SINH VIÊN */}
      {selected && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs modal-backdrop-appear"
            onClick={() => setSelected(null)}
          >
            <div
              className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-2xl modal-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Accent Gradient Line */}
              <div className="h-1.5 w-full bg-gradient-to-r from-[#00a3a6] via-teal-500 to-[#006d72]" />

              <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/50 px-6 py-5 sm:px-8">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      Chi tiết báo cáo hỗ trợ
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-bold ${statusStyle[selected.status]}`}
                    >
                      {selected.status === "RESOLVED" ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <Clock className="h-3.5 w-3.5" />
                      )}
                      {statusLabel[selected.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Gửi lúc: {new Date(selected.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  title="Đóng cửa sổ"
                >
                  <X className="h-4 w-4" />
                </button>
              </header>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto no-scrollbar p-6 sm:p-8">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Tiêu đề yêu cầu
                  </p>
                  <h4 className="mt-1 text-base font-black text-slate-900">
                    {selected.title}
                  </h4>

                  <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Nội dung bạn đã gửi
                  </p>
                  <div className="mt-1.5 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-800 whitespace-pre-line border border-slate-100">
                    {selected.content}
                  </div>
                </div>

                {selected.adminReply ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-2xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-800">
                        <MessageSquareReply className="h-4 w-4" />
                        Phản hồi từ Quản trị viên
                      </span>
                      {selected.repliedAt && (
                        <span className="text-[11px] font-semibold text-emerald-700">
                          {new Date(selected.repliedAt).toLocaleString("vi-VN")}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-emerald-950 font-medium">
                      {selected.adminReply}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs font-semibold text-amber-800 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>
                      Quản trị viên đã nhận được báo cáo của bạn và đang tiến hành xử lý, phản hồi.
                    </span>
                  </div>
                )}
              </div>

              <footer className="flex shrink-0 justify-end border-t border-slate-100 bg-slate-50/80 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-full bg-slate-200 px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-300 transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </footer>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};
