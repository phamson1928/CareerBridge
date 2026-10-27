import React, { FormEvent, useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Eye,
  LifeBuoy,
  LoaderCircle,
  MessageSquareReply,
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

const statusStyle: Record<SupportRequestStatus, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  RESOLVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const statusLabel: Record<SupportRequestStatus, string> = {
  PENDING: "Chờ phản hồi",
  RESOLVED: "Đã phản hồi",
};

export const StudentSupportRequests: React.FC = () => {
  const feedback = useAppFeedback();
  const [items, setItems] = useState<SupportRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selected, setSelected] = useState<SupportRequestRecord | null>(null);

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
      feedback.notify({
        title: "Đã gửi báo cáo",
        message: "Yêu cầu của bạn đã được gửi đến Quản trị viên.",
        tone: "success",
      });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Hỗ trợ &amp; Báo cáo với Quản trị viên
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Gửi yêu cầu hỗ trợ (chỉnh lịch thực tập, nhờ phân công giảng viên,
            báo cáo công ty có dấu hiệu lừa đảo...) để Admin kiểm tra và phản
            hồi trực tiếp.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Form gửi báo cáo */}
        <section className="lg:col-span-5">
          <form
            onSubmit={handleSubmit}
            className="sticky top-24 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs"
          >
            <div>
              <h2 className="text-base font-black text-slate-900">
                Tạo báo cáo / yêu cầu mới
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Admin sẽ nhận được thông báo ngay khi bạn gửi.
              </p>
            </div>

            <div>
              <label
                htmlFor="support-title"
                className="mb-1.5 block text-xs font-bold text-slate-700"
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
                placeholder="VD: Nhờ phân công giảng viên / Báo cáo công ty..."
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label
                htmlFor="support-content"
                className="mb-1.5 block text-xs font-bold text-slate-700"
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
                placeholder="Mô tả rõ vấn đề bạn đang gặp phải để Admin hỗ trợ nhanh nhất..."
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span>{saving ? "Đang gửi..." : "Gửi báo cáo cho Admin"}</span>
            </button>
          </form>
        </section>

        {/* Danh sách báo cáo đã gửi dạng List */}
        <section className="lg:col-span-7">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-base font-black text-slate-900">
                Danh sách báo cáo đã gửi ({items.length})
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Nhấn vào một báo cáo để xem chi tiết nội dung và phản hồi từ
                Admin.
              </p>
            </div>

            {loading ? (
              <div className="p-10 text-center text-sm text-slate-500">
                Đang tải danh sách báo cáo...
              </div>
            ) : items.length === 0 ? (
              <div className="p-12 text-center">
                <LifeBuoy className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 text-sm font-bold text-slate-700">
                  Bạn chưa gửi báo cáo nào
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Khi cần hỗ trợ từ nhà trường hoặc Admin, hãy điền biểu mẫu bên
                  cạnh.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelected(item)}
                    className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 transition hover:bg-slate-50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5">
                        <h3 className="truncate text-sm font-bold text-slate-900">
                          {item.title}
                        </h3>
                        <span
                          className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusStyle[item.status]}`}
                        >
                          {item.status === "RESOLVED" ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          {statusLabel[item.status]}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {item.content}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        Gửi lúc:{" "}
                        {new Date(item.createdAt).toLocaleString("vi-VN")}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected(item);
                      }}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Chi tiết
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Modal Box Chi tiết báo cáo cho Sinh viên */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[1px]"
          onClick={() => setSelected(null)}
        >
          <div
            className="flex max-h-[calc(100vh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 bg-slate-50/70 px-6 py-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="text-lg font-extrabold text-slate-900">
                    Chi tiết báo cáo hỗ trợ
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
                onClick={() => setSelected(null)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200/70 hover:text-slate-700"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  Tiêu đề
                </p>
                <h4 className="mt-1 text-base font-bold text-slate-900">
                  {selected.title}
                </h4>

                <p className="mt-4 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  Nội dung bạn đã gửi
                </p>
                <div className="mt-1.5 max-h-56 overflow-y-auto rounded-lg bg-slate-50 p-3.5 text-sm leading-relaxed text-slate-800 whitespace-pre-line">
                  {selected.content}
                </div>
              </div>

              {selected.adminReply ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-800">
                      <MessageSquareReply className="h-4 w-4" />
                      Phản hồi từ Quản trị viên
                    </span>
                    {selected.repliedAt && (
                      <span className="text-[11px] text-emerald-700">
                        {new Date(selected.repliedAt).toLocaleString("vi-VN")}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-emerald-950">
                    {selected.adminReply}
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-800">
                  Quản trị viên đã nhận được báo cáo của bạn và đang chờ xử lý,
                  phản hồi.
                </div>
              )}
            </div>

            <div className="flex shrink-0 justify-end border-t border-slate-100 bg-slate-50/50 px-6 py-3.5">
              <button
                type="button"
                onClick={() => setSelected(null)}
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
