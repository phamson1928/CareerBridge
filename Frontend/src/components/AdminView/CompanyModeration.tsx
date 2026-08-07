import React, { useEffect, useState } from "react";
import {
  Building2,
  CheckCircle2,
  LoaderCircle,
  Send,
  XCircle,
} from "lucide-react";
import { getApiErrorMessage } from "../../auth/api";
import { companiesApi, CompanyProfileRecord } from "../../companies/api";

export const CompanyModeration: React.FC = () => {
  const [companies, setCompanies] = useState<CompanyProfileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<CompanyProfileRecord | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await companiesApi.list("PENDING");
      setCompanies(result.items);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const approve = async (id: string) => {
    setProcessingId(id);
    setError(null);
    try {
      await companiesApi.approve(id);
      setCompanies((current) => current.filter((company) => company.id !== id));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setProcessingId(null);
    }
  };

  const reject = async () => {
    if (!rejecting) return;
    const trimmedReason = reason.trim();
    if (trimmedReason.length < 3) {
      setError("Lý do từ chối cần có ít nhất 3 ký tự.");
      return;
    }
    setProcessingId(rejecting.id);
    setError(null);
    try {
      await companiesApi.reject(rejecting.id, trimmedReason);
      setCompanies((current) =>
        current.filter((company) => company.id !== rejecting.id),
      );
      setRejecting(null);
      setReason("");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="rounded-xl bg-indigo-600 p-2.5 text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Duyệt doanh nghiệp
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Các hồ sơ đang chờ xác minh.
              </p>
            </div>
          </div>
          <button
            onClick={() => void load()}
            disabled={loading}
            className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
          >
            Tải lại
          </button>
        </div>
        {error && (
          <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </p>
        )}
      </section>

      {loading ? (
        <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500">
          <LoaderCircle className="mx-auto mb-3 h-5 w-5 animate-spin" />
          Đang tải hồ sơ...
        </div>
      ) : companies.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500">
          Không có hồ sơ nào đang chờ duyệt.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {companies.map((company) => (
            <article
              key={company.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
            >
              <div className="flex gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-indigo-50 font-bold text-indigo-600">
                  {company.logo ? (
                    <img
                      src={company.logo}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    company.companyName.charAt(0)
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900">
                    {company.companyName}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {company.industry || "Chưa cập nhật lĩnh vực"}
                  </p>
                </div>
              </div>
              <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-slate-600">
                {company.description || "Chưa có phần giới thiệu."}
              </p>
              <div className="mt-4 space-y-1 text-xs text-slate-500">
                <p>Email: {company.contactEmail || "Chưa cập nhật"}</p>
                <p>Địa chỉ: {company.address || "Chưa cập nhật"}</p>
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-indigo-600 hover:underline"
                  >
                    {company.website}
                  </a>
                )}
              </div>
              <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">
                <button
                  onClick={() => void approve(company.id)}
                  disabled={processingId !== null}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Duyệt
                </button>
                <button
                  onClick={() => {
                    setRejecting(company);
                    setReason("");
                    setError(null);
                  }}
                  disabled={processingId !== null}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" />
                  Từ chối
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {rejecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Từ chối hồ sơ</h3>
            <p className="mt-1 text-sm text-slate-500">
              Nêu lý do để {rejecting.companyName} có thể bổ sung hồ sơ.
            </p>
            <textarea
              autoFocus
              rows={4}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="mt-4 w-full rounded-xl border border-slate-300 p-3 text-sm"
              placeholder="Ví dụ: Vui lòng bổ sung website hoặc email liên hệ hợp lệ."
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setRejecting(null)}
                disabled={processingId !== null}
                className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold"
              >
                Hủy
              </button>
              <button
                onClick={() => void reject()}
                disabled={processingId !== null}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                Gửi từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
