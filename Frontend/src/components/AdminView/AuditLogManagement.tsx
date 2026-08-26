import React, { useCallback, useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileSearch,
  Filter,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { getApiErrorMessage } from "../../auth/api";
import {
  auditLogsApi,
  type AuditLogRecord,
  type ListAuditLogsParams,
} from "../../audit-logs/api";

const PAGE_SIZE = 20;

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(value));
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

function getMetadataText(metadata: unknown) {
  if (metadata === null || metadata === undefined) return "Không có metadata.";
  return JSON.stringify(metadata, null, 2);
}

const FilterInput: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <label className="block min-w-0">
    <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
      {label}
    </span>
    {children}
  </label>
);

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
  const [detailLoading, setDetailLoading] = useState(false);

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

  const openDetail = async (log: AuditLogRecord) => {
    setSelectedLog(log);
    setDetailLoading(true);
    try {
      setSelectedLog(await auditLogsApi.getById(log.id));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <header className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 px-5 py-6 text-white sm:px-7">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="flex gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                <ShieldCheck className="h-5 w-5 text-cyan-200" />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-200">System observability</p>
                <h2 className="mt-1 text-xl font-black tracking-tight">Nhật ký hoạt động</h2>
                <p className="mt-1 max-w-2xl text-sm text-slate-300">Theo dõi các thay đổi quan trọng trong hệ thống. Metadata nhạy cảm đã được backend che trước khi trả về.</p>
              </div>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-2.5 ring-1 ring-white/10">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Bản ghi phù hợp</p>
              <p className="mt-0.5 text-2xl font-black tabular-nums">{new Intl.NumberFormat("vi-VN").format(total)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-5 sm:p-6">
          <FilterInput label="Tìm kiếm">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-indigo-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100">
              <Search className="h-4 w-4 shrink-0 text-slate-400" />
              <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Email, action, entity..." className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400" />
            </div>
          </FilterInput>
          <FilterInput label="Action">
            <input value={action} onChange={(event) => { setAction(event.target.value); setPage(1); }} placeholder="Ví dụ: USER_UPDATED" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
          </FilterInput>
          <FilterInput label="Entity">
            <input value={entity} onChange={(event) => { setEntity(event.target.value); setPage(1); }} placeholder="Ví dụ: User" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
          </FilterInput>
          <FilterInput label="Từ ngày (UTC)">
            <input type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1); }} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
          </FilterInput>
          <FilterInput label="Đến ngày (UTC)">
            <input type="date" value={to} onChange={(event) => { setTo(event.target.value); setPage(1); }} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
          </FilterInput>
          <div className="flex items-end gap-2 lg:col-span-5">
            <button onClick={resetFilters} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"><Filter className="h-3.5 w-3.5" /> Xóa bộ lọc</button>
            <button onClick={() => void loadLogs()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60"><RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Làm mới</button>
          </div>
        </div>
      </header>

      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div><h3 className="font-bold text-slate-900">Dòng thời gian hệ thống</h3><p className="mt-0.5 text-xs text-slate-500">Nhấn vào một dòng để xem metadata đã được redaction.</p></div>
          <Clock3 className="h-5 w-5 text-slate-400" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3.5">Thời điểm</th><th className="px-5 py-3.5">Hành động</th><th className="px-5 py-3.5">Đối tượng</th><th className="px-5 py-3.5">Người thực hiện</th><th className="px-5 py-3.5">Địa chỉ IP</th><th className="px-5 py-3.5 text-right">Chi tiết</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? <tr><td colSpan={6} className="px-5 py-14 text-center text-slate-500">Đang tải nhật ký...</td></tr> : logs.length === 0 ? <tr><td colSpan={6} className="px-5 py-14 text-center"><FileSearch className="mx-auto mb-2 h-7 w-7 text-slate-300" /><p className="font-semibold text-slate-700">Không tìm thấy hoạt động phù hợp.</p><p className="mt-1 text-slate-500">Thử điều chỉnh bộ lọc hoặc tải lại dữ liệu.</p></td></tr> : logs.map((log) => (
                <tr key={log.id} className="transition hover:bg-indigo-50/40">
                  <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-700">{formatDateTime(log.createdAt)}</td>
                  <td className="px-5 py-4"><span className="inline-flex rounded-lg bg-indigo-50 px-2 py-1 font-mono text-[11px] font-bold text-indigo-700">{log.action}</span></td>
                  <td className="px-5 py-4"><p className="font-semibold text-slate-800">{log.entity}</p>{log.entityId && <p className="mt-0.5 max-w-36 truncate font-mono text-[10px] text-slate-400">{log.entityId}</p>}</td>
                  <td className="px-5 py-4"><p className="font-medium text-slate-700">{log.actor?.email ?? "Hệ thống"}</p><p className="mt-0.5 text-[10px] text-slate-400">{formatRole(log.actor?.role)}</p></td>
                  <td className="px-5 py-4 font-mono text-[11px] text-slate-500">{log.ipAddress ?? "—"}</td>
                  <td className="px-5 py-4 text-right"><button onClick={() => void openDetail(log)} className="rounded-lg px-2.5 py-1.5 font-bold text-indigo-700 transition hover:bg-indigo-100">Xem</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span className="text-slate-500">{new Intl.NumberFormat("vi-VN").format(total)} bản ghi</span>
          <div className="flex items-center gap-2"><button disabled={loading || page <= 1} onClick={() => setPage((value) => value - 1)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="h-3.5 w-3.5" /> Trước</button><span className="min-w-24 text-center font-semibold text-slate-600">Trang {page} / {totalPages}</span><button disabled={loading || page >= totalPages} onClick={() => setPage((value) => value + 1)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40">Sau <ChevronRight className="h-3.5 w-3.5" /></button></div>
        </footer>
      </div>

      {selectedLog && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-slate-950/35 p-0 backdrop-blur-[1px]" role="dialog" aria-modal="true" aria-label="Chi tiết nhật ký">
          <button className="flex-1 cursor-default" aria-label="Đóng chi tiết" onClick={() => setSelectedLog(null)} />
          <aside className="flex h-full w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-2xl">
            <header className="flex items-start justify-between border-b border-slate-100 p-5"><div><p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Audit record</p><h3 className="mt-1 font-black text-slate-900">Chi tiết hoạt động</h3></div><button onClick={() => setSelectedLog(null)} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100" aria-label="Đóng"><X className="h-5 w-5" /></button></header>
            <div className="flex-1 space-y-6 overflow-y-auto p-5">
              {detailLoading && <p className="text-sm text-slate-500">Đang tải chi tiết mới nhất...</p>}
              <div className="grid grid-cols-2 gap-3"><DetailItem label="Action" value={selectedLog.action} mono /><DetailItem label="Entity" value={selectedLog.entity} /><DetailItem label="Thời điểm" value={formatDateTime(selectedLog.createdAt)} /><DetailItem label="IP" value={selectedLog.ipAddress ?? "Không có"} mono /><DetailItem label="Actor" value={selectedLog.actor?.email ?? "Hệ thống"} /><DetailItem label="Vai trò" value={formatRole(selectedLog.actor?.role)} /></div>
              <DetailItem label="Entity ID" value={selectedLog.entityId ?? "Không có"} mono />
              <div><p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Metadata</p><pre className="max-h-[48vh] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs leading-5 text-slate-100">{getMetadataText(selectedLog.metadata)}</pre></div>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
};

const DetailItem: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => (
  <div className="min-w-0 rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className={`mt-1 break-all text-xs font-semibold text-slate-700 ${mono ? "font-mono" : ""}`}>{value}</p></div>
);