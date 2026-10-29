import React, { useState } from "react";
import {
  AlertTriangle,
  DollarSign,
  FileWarning,
  HelpCircle,
  Loader2,
  Send,
  ShieldAlert,
  X,
} from "lucide-react";
import { getApiErrorMessage } from "../../auth/api";
import {
  internshipsApi,
  InternshipReportReasonCode,
  REPORT_REASON_LABELS,
} from "../../internships/api";
import { useAppFeedback } from "../Feedback/AppFeedbackProvider";

interface ReportJobModalProps {
  internshipId: string;
  internshipTitle: string;
  companyName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const REASONS: Array<{
  code: InternshipReportReasonCode;
  title: string;
  desc: string;
  icon: React.ReactNode;
}> = [
  {
    code: "FRAUD_SCAM",
    title: "Dấu hiệu lừa đảo, đa cấp, giả mạo",
    desc: "Công ty không có thật, trụ sở ảo, tuyển dụng lôi kéo theo mô hình đa cấp",
    icon: <ShieldAlert className="h-5 w-5 text-rose-500" />,
  },
  {
    code: "FEE_CHARGED",
    title: "Đòi thu tiền, đặt cọc giữ chỗ",
    desc: "Bắt nộp tiền cọc hồ sơ, chi phí phỏng vấn, bắt mua đồng phục hoặc khóa học",
    icon: <DollarSign className="h-5 w-5 text-amber-500" />,
  },
  {
    code: "MISLEADING_DESCRIPTION",
    title: "Mô tả công việc sai thực tế",
    desc: "Công việc thực tế khác xa nội dung bài đăng, ép làm thêm việc không liên quan",
    icon: <FileWarning className="h-5 w-5 text-orange-500" />,
  },
  {
    code: "UNPROFESSIONAL_BEHAVIOR",
    title: "Hành vi không đúng mực",
    desc: "Người phỏng vấn có thái độ xúc phạm, phân biệt đối xử hoặc quấy rối",
    icon: <AlertTriangle className="h-5 w-5 text-purple-500" />,
  },
  {
    code: "OTHER",
    title: "Vấn đề vi phạm khác",
    desc: "Các vi phạm quy chế hoặc nội quy thực tập khác chưa được liệt kê ở trên",
    icon: <HelpCircle className="h-5 w-5 text-blue-500" />,
  },
];

export const ReportJobModal: React.FC<ReportJobModalProps> = ({
  internshipId,
  internshipTitle,
  companyName,
  onClose,
  onSuccess,
}) => {
  const { notify } = useAppFeedback();
  const [selectedReason, setSelectedReason] =
    useState<InternshipReportReasonCode>("FRAUD_SCAM");
  const [detail, setDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await internshipsApi.report(internshipId, {
        reasonCode: selectedReason,
        reasonDetail: detail.trim() || undefined,
      });

      notify({
        tone: "success",
        title: "Báo cáo thành công",
        message:
          "Cảm ơn phản ánh của bạn! Ban quản trị sẽ tiến hành xác minh bài đăng này sớm nhất.",
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 p-6 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 shadow-xs">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Báo cáo tin tuyển dụng vi phạm
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                {internshipTitle} ·{" "}
                <span className="font-semibold text-slate-700">
                  {companyName}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              1. Chọn lý do phản ánh <span className="text-rose-500">*</span>
            </label>
            <div className="space-y-2">
              {REASONS.map((item) => {
                const isSelected = selectedReason === item.code;
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setSelectedReason(item.code)}
                    className={`flex w-full items-start gap-3.5 rounded-2xl p-3.5 text-left border transition-all duration-150 ${
                      isSelected
                        ? "border-rose-400 bg-rose-50/50 shadow-xs ring-2 ring-rose-200"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">{item.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">
                          {item.title}
                        </span>
                        <span
                          className={`h-4 w-4 rounded-full border flex items-center justify-center transition ${
                            isSelected
                              ? "border-rose-600 bg-rose-600"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {isSelected && (
                            <span className="h-1.5 w-1.5 rounded-full bg-white" />
                          )}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                2. Chi tiết bằng chứng / Ghi chú{" "}
                <span className="text-slate-400 font-normal lowercase">
                  (không bắt buộc)
                </span>
              </label>
              <span className="text-[11px] text-slate-400">
                {detail.length} / 1000
              </span>
            </div>
            <textarea
              rows={3}
              maxLength={1000}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="Vui lòng cung cấp thêm chi tiết (ví dụ: bị thu số tiền bao nhiêu, liên hệ qua số điện thoại/kênh nào, nội dung sai lệch ra sao...)"
              className="w-full resize-none rounded-2xl border border-slate-300 p-3.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-100 transition"
            />
          </div>

          <div className="rounded-2xl bg-amber-50/70 border border-amber-200/60 p-3.5 text-[11px] text-amber-800 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <span>
              Báo cáo của bạn sẽ được gửi thẳng tới Ban quản lý Nhà trường và được
              bảo mật danh tính đối với Doanh nghiệp.
            </span>
          </div>

          {/* Footer actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-600/20 hover:bg-rose-700 transition disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Gửi báo cáo
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
