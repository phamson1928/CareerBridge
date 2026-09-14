import React, { useEffect, useState } from "react";
import { Ban, Building2, CheckCircle2, Download, Eye, LoaderCircle, RefreshCw, Search, Send, X, XCircle } from "lucide-react";
import { getApiErrorMessage } from "../../auth/api";
import { companiesApi, CompanyProfileRecord, CompanyProfileStatus } from "../../companies/api";
import { downloadPrivateFile } from "../../files/api";

const statusOptions: Array<{ value: CompanyProfileStatus | "ALL"; label: string }> = [
  { value: "PENDING", label: "Chờ duyệt" }, { value: "APPROVED", label: "Đã duyệt" },
  { value: "REJECTED", label: "Cần bổ sung" }, { value: "SUSPENDED", label: "Đã tạm dừng" }, { value: "ALL", label: "Tất cả" },
];
const statusLabel: Record<CompanyProfileStatus, string> = { DRAFT: "Bản nháp", PENDING: "Chờ duyệt", APPROVED: "Đã duyệt", REJECTED: "Cần bổ sung", SUSPENDED: "Đã tạm dừng" };
const statusClass: Record<CompanyProfileStatus, string> = { DRAFT: "bg-slate-100 text-slate-700", PENDING: "bg-amber-100 text-amber-800", APPROVED: "bg-emerald-100 text-emerald-800", REJECTED: "bg-rose-100 text-rose-800", SUSPENDED: "bg-slate-200 text-slate-800" };

export const CompanyModeration: React.FC = () => {
  const [companies, setCompanies] = useState<CompanyProfileRecord[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<CompanyProfileStatus | "ALL">("PENDING");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<CompanyProfileRecord | null>(null);
  const [rejecting, setRejecting] = useState<CompanyProfileRecord | null>(null);
  const [suspending, setSuspending] = useState<CompanyProfileRecord | null>(null);
  const [reason, setReason] = useState("");
  const [checks, setChecks] = useState({ name: false, registration: false, address: false });
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const result = await companiesApi.list(selectedStatus === "ALL" ? undefined : selectedStatus, search.trim() || undefined);
      setCompanies(result.items);
    } catch (requestError) { setError(getApiErrorMessage(requestError)); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [selectedStatus]);

  const openDetail = async (company: CompanyProfileRecord) => {
    setError(null); setSelected(company);
    try {
      const detail = await companiesApi.getById(company.id);
      setSelected(detail);
      setChecks({ name: Boolean(detail.companyName.trim()), registration: Boolean(detail.businessRegistrationNumber && detail.registrationDocumentFileId), address: Boolean(detail.address?.trim()) });
    } catch (requestError) { setError(getApiErrorMessage(requestError)); }
  };
  const approve = async () => {
    if (!selected || !checks.name || !checks.registration || !checks.address) return;
    setProcessingId(selected.id); setError(null);
    try { setSelected(await companiesApi.approve(selected.id)); await load(); }
    catch (requestError) { setError(getApiErrorMessage(requestError)); }
    finally { setProcessingId(null); }
  };
  const reject = async () => {
    if (!rejecting) return;
    const trimmedReason = reason.trim();
    if (trimmedReason.length < 3) { setError("Lý do từ chối cần có ít nhất 3 ký tự."); return; }
    setProcessingId(rejecting.id); setError(null);
    try { setSelected(await companiesApi.reject(rejecting.id, trimmedReason)); setRejecting(null); setReason(""); await load(); }
    catch (requestError) { setError(getApiErrorMessage(requestError)); }
    finally { setProcessingId(null); }
  };
  const suspend = async () => {
    if (!suspending) return;
    const trimmedReason = reason.trim();
    if (trimmedReason.length < 3) { setError("Lý do tạm dừng cần có ít nhất 3 ký tự."); return; }
    setProcessingId(suspending.id); setError(null);
    try { setSelected(await companiesApi.suspend(suspending.id, trimmedReason)); setSuspending(null); setReason(""); await load(); }
    catch (requestError) { setError(getApiErrorMessage(requestError)); }
    finally { setProcessingId(null); }
  };
  const closeModals = () => { if (processingId) return; setSelected(null); setRejecting(null); setSuspending(null); setReason(""); };

  return <div className="admin-page admin-page--standard space-y-6">
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-4"><div className="flex gap-3"><div className="rounded-xl bg-indigo-600 p-2.5 text-white"><Building2 className="h-5 w-5" /></div><div><h2 className="admin-page-title text-xl font-bold text-slate-900">Xác minh doanh nghiệp</h2><p className="mt-1 text-xs text-slate-500">Kiểm tra thông tin pháp lý trước khi cho phép đăng tuyển.</p></div></div><button onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Tải lại</button></div>
      <div className="mt-5 flex flex-col gap-3 lg:flex-row"><label className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void load(); }} placeholder="Tìm theo tên, mã số doanh nghiệp hoặc email" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-400" /></label><button onClick={() => void load()} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700">Tìm kiếm</button></div>
      <div className="mt-4 flex flex-wrap gap-2">{statusOptions.map((option) => <button key={option.value} onClick={() => setSelectedStatus(option.value)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${selectedStatus === option.value ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{option.label}</button>)}</div>
      {error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    </section>
    {loading ? <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500"><LoaderCircle className="mx-auto mb-3 h-5 w-5 animate-spin" />Đang tải hồ sơ...</div> : companies.length === 0 ? <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500">Không tìm thấy hồ sơ phù hợp.</div> : <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">{companies.map((company) => <article key={company.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"><div className="flex items-start justify-between gap-3"><div className="flex gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-indigo-50 font-bold text-indigo-600">{company.logo ? <img src={company.logo} alt="" className="h-full w-full object-cover" /> : company.companyName.charAt(0)}</div><div className="min-w-0"><h3 className="font-bold text-slate-900">{company.companyName}</h3><p className="mt-0.5 text-xs text-slate-500">{company.industry || "Chưa cập nhật lĩnh vực"}</p></div></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${statusClass[company.status]}`}>{statusLabel[company.status]}</span></div><p className="mt-4 line-clamp-3 text-sm leading-relaxed text-slate-600">{company.description || "Chưa có phần giới thiệu."}</p><div className="mt-4 space-y-1 text-xs text-slate-500"><p>Email: {company.contactEmail || "Chưa cập nhật"}</p><p>Mã số doanh nghiệp: {company.businessRegistrationNumber || "Chưa cập nhật"}</p><p>Địa chỉ: {company.address || "Chưa cập nhật"}</p></div><div className="mt-5 border-t border-slate-100 pt-4"><button onClick={() => void openDetail(company)} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100"><Eye className="h-4 w-4" /> Xem hồ sơ chi tiết</button></div></article>)}</div>}

    {selected && !rejecting && !suspending && <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 p-4" onClick={closeModals}><div className="mx-auto my-8 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-4"><div><h3 className="text-xl font-bold text-slate-900">Hồ sơ xác minh doanh nghiệp</h3><p className="mt-1 text-sm text-slate-500">{selected.companyName}</p></div><button onClick={closeModals} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><Info label="Tên pháp lý" value={selected.companyName} /><Info label="Mã số doanh nghiệp" value={selected.businessRegistrationNumber} /><Info label="Email tài khoản" value={selected.user?.email} /><Info label="Email liên hệ" value={selected.contactEmail} /><Info label="Người liên hệ" value={selected.contactPersonName} /><Info label="Số điện thoại" value={selected.contactPhone} /><Info label="Địa chỉ" value={selected.address} /><Info label="Trạng thái" value={statusLabel[selected.status]} /></div>{selected.registrationDocumentFileId && selected.registrationDocument && <div className="mt-5 flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-4"><div><p className="text-sm font-bold text-slate-800">Giấy đăng ký doanh nghiệp</p><p className="mt-1 text-xs text-slate-500">{selected.registrationDocument.originalName} · {(selected.registrationDocument.sizeBytes / 1024 / 1024).toFixed(2)} MB</p></div><button onClick={() => void downloadPrivateFile(selected.registrationDocumentFileId!)} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-bold text-indigo-700 shadow-sm hover:bg-indigo-50"><Download className="h-4 w-4" /> Tải xuống</button></div>}<div className="mt-5 rounded-xl border border-slate-200 p-4"><p className="text-sm font-bold text-slate-800">Checklist xác minh</p><div className="mt-3 space-y-2 text-sm"><Check label="Có tên pháp lý" checked={checks.name} onChange={(value) => setChecks((current) => ({ ...current, name: value }))} /><Check label="Có mã số doanh nghiệp và giấy đăng ký" checked={checks.registration} onChange={(value) => setChecks((current) => ({ ...current, registration: value }))} /><Check label="Có địa chỉ đăng ký" checked={checks.address} onChange={(value) => setChecks((current) => ({ ...current, address: value }))} /></div></div>{selected.rejectionReason && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700"><strong>Lý do cần bổ sung:</strong> {selected.rejectionReason}</p>}{selected.suspensionReason && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800"><strong>Lý do tạm dừng:</strong> {selected.suspensionReason}</p>}<div className="mt-6 flex flex-wrap justify-end gap-2">{selected.status === "PENDING" && <><button onClick={() => { setRejecting(selected); setReason(""); }} disabled={processingId !== null} className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 disabled:opacity-50"><XCircle className="h-4 w-4" /> Yêu cầu bổ sung</button><button onClick={() => void approve()} disabled={processingId !== null || !checks.name || !checks.registration || !checks.address} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><CheckCircle2 className="h-4 w-4" /> {processingId ? "Đang xử lý..." : "Duyệt hồ sơ"}</button></>}{selected.status === "APPROVED" && <button onClick={() => { setSuspending(selected); setReason(""); }} disabled={processingId !== null} className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 disabled:opacity-50"><Ban className="h-4 w-4" /> Tạm dừng doanh nghiệp</button>}</div></div></div>}
    {(rejecting || suspending) && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/40 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"><h3 className="text-lg font-bold text-slate-900">{rejecting ? "Yêu cầu bổ sung hồ sơ" : "Tạm dừng doanh nghiệp"}</h3><p className="mt-1 text-sm text-slate-500">{rejecting ? `Nêu lý do để ${rejecting.companyName} có thể bổ sung hồ sơ.` : `Nêu lý do tạm dừng quyền hoạt động của ${suspending?.companyName}.`}</p><textarea autoFocus rows={4} value={reason} onChange={(event) => setReason(event.target.value)} className="mt-4 w-full rounded-xl border border-slate-300 p-3 text-sm" placeholder="Nhập lý do cụ thể..." /><div className="mt-4 flex justify-end gap-2"><button onClick={() => { setRejecting(null); setSuspending(null); }} disabled={processingId !== null} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold">Hủy</button><button onClick={() => void (rejecting ? reject() : suspend())} disabled={processingId !== null} className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-white disabled:opacity-50 ${rejecting ? "bg-rose-600" : "bg-amber-600"}`}><Send className="h-4 w-4" /> Xác nhận</button></div></div></div>}
  </div>;
};

const Info: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => <div><p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 break-words text-sm text-slate-700">{value || "Chưa cập nhật"}</p></div>;
const Check: React.FC<{ label: string; checked: boolean; onChange: (value: boolean) => void }> = ({ label, checked, onChange }) => <label className="flex items-center gap-2 text-slate-700"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600" />{label}</label>;
