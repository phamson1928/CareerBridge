import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BriefcaseBusiness,
  Check,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  LoaderCircle,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import { getApiErrorMessage } from '../../auth/api';
import { useAppFeedback } from '../Feedback/AppFeedbackProvider';
import { placementsApi } from '../../placements/api';
import type { PlacementRecord, PlacementStatus } from '../../placements/types';
import { supervisionsApi } from '../../supervisions/api';
import type { LecturerOption } from '../../supervisions/types';

const statusLabel: Record<PlacementStatus, string> = {
  PENDING: 'Chờ phân công',
  ACTIVE: 'Đang thực tập',
  COMPLETED: 'Đã hoàn tất',
  CANCELLED: 'Đã hủy',
};

const statusClass: Record<PlacementStatus, string> = {
  PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
  ACTIVE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  COMPLETED: 'border-slate-200 bg-slate-100 text-slate-600',
  CANCELLED: 'border-rose-200 bg-rose-50 text-rose-700',
};

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value));
}

export const SupervisionManagement: React.FC = () => {
  const { confirm } = useAppFeedback();
  const [items, setItems] = useState<PlacementRecord[]>([]);
  const [lecturers, setLecturers] = useState<LecturerOption[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<PlacementStatus | ''>('');
  const [assignment, setAssignment] = useState<'ALL' | 'ASSIGNED' | 'UNASSIGNED'>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalPlacement, setModalPlacement] = useState<PlacementRecord | null>(null);
  const [selectedLecturer, setSelectedLecturer] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [placementPage, lecturerOptions] = await Promise.all([
        placementsApi.list({
          page,
          limit: 10,
          search: search.trim() || undefined,
          status: status || undefined,
          assignmentStatus: assignment === 'ALL' ? undefined : assignment,
        }),
        supervisionsApi.lecturerOptions(),
      ]);
      setItems(placementPage.items);
      setTotal(placementPage.pagination.total);
      setTotalPages(Math.max(placementPage.pagination.totalPages, 1));
      setLecturers(lecturerOptions);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);
  }, [page, search, status, assignment]);

  const metrics = useMemo(() => ({
    pending: items.filter((item) => item.status === 'PENDING').length,
    active: items.filter((item) => item.status === 'ACTIVE').length,
    assigned: items.filter((item) => Boolean(item.supervision)).length,
  }), [items]);

  const openAssign = (placement: PlacementRecord) => {
    setModalPlacement(placement);
    setSelectedLecturer(placement.supervision?.lecturerId ?? '');
  };

  const closeModal = () => {
    if (!saving) {
      setModalPlacement(null);
      setSelectedLecturer('');
    }
  };

  const saveAssignment = async () => {
    if (!modalPlacement || !selectedLecturer) return;
    setSaving(true);
    try {
      if (modalPlacement.supervision) {
        await supervisionsApi.reassign(modalPlacement.supervision.id, selectedLecturer);
      } else {
        await supervisionsApi.assign(modalPlacement.id, selectedLecturer);
      }
      closeModal();
      await load();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const cancelSupervision = async (placement: PlacementRecord) => {
    if (!placement.supervision) return;
    const accepted = await confirm({ title: 'Bỏ phân công', message: `Bỏ phân công cho ${placement.student.fullName}?`, confirmLabel: 'Bỏ phân công', tone: 'danger' });
    if (!accepted) return;
    try {
      await supervisionsApi.cancel(placement.supervision.id);
      await load();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 rounded-3xl bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 p-6 text-white shadow-lg sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-100">
            <ShieldCheck className="h-3.5 w-3.5" /> Placement control center
          </div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Phân công giảng viên</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100/80">Quản lý placement đã được xác nhận, phân công người hướng dẫn và theo dõi trạng thái thực tập trên dữ liệu thật.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-indigo-100/75"><UsersRound className="h-4 w-4" /> {lecturers.length} giảng viên đang hoạt động</div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: 'Tổng placement', value: total, icon: BriefcaseBusiness, tone: 'bg-indigo-50 text-indigo-600' },
          { label: 'Chờ phân công', value: metrics.pending, icon: AlertCircle, tone: 'bg-amber-50 text-amber-600' },
          { label: 'Đang thực tập', value: metrics.active, icon: Check, tone: 'bg-emerald-50 text-emerald-600' },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}><Icon className="h-4 w-4" /></div>
            <p className="text-xs font-semibold text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-5">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_190px_190px]">
          <label className="relative block">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input value={search} onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder="Tìm sinh viên, mã số, công ty, vị trí..." className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
          </label>
          <select value={status} onChange={(event) => { setPage(1); setStatus(event.target.value as PlacementStatus | ''); }} className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100">
            <option value="">Tất cả trạng thái</option>
            {Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select value={assignment} onChange={(event) => { setPage(1); setAssignment(event.target.value as typeof assignment); }} className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100">
            <option value="ALL">Tất cả phân công</option><option value="ASSIGNED">Đã phân công</option><option value="UNASSIGNED">Chưa phân công</option>
          </select>
        </div>
      </div>

      {error && <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        {loading ? <div className="flex min-h-64 items-center justify-center text-sm text-slate-500"><LoaderCircle className="mr-2 h-5 w-5 animate-spin" />Đang tải dữ liệu placement...</div> : items.length === 0 ? <div className="px-6 py-16 text-center"><BriefcaseBusiness className="mx-auto h-9 w-9 text-slate-300" /><p className="mt-3 text-sm font-bold text-slate-700">Chưa có placement phù hợp</p><p className="mt-1 text-xs text-slate-500">Placement sẽ xuất hiện sau khi doanh nghiệp chấp nhận đơn ứng tuyển.</p></div> : <div className="overflow-x-auto"><table className="min-w-[1040px] w-full text-left text-xs"><thead><tr className="border-b border-slate-100 bg-slate-50 text-slate-500"><th className="px-5 py-3 font-bold">Sinh viên</th><th className="px-5 py-3 font-bold">Vị trí / doanh nghiệp</th><th className="px-5 py-3 font-bold">Kỳ</th><th className="px-5 py-3 font-bold">Trạng thái</th><th className="px-5 py-3 font-bold">Giảng viên hướng dẫn</th><th className="px-5 py-3 text-right font-bold">Thao tác</th></tr></thead><tbody>{items.map((placement) => <tr key={placement.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80"><td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 font-black text-indigo-700">{placement.student.fullName.charAt(0)}</div><div><p className="font-bold text-slate-900">{placement.student.fullName}</p><p className="mt-0.5 font-mono text-[10px] text-slate-500">{placement.student.studentCode} · {placement.student.major}</p></div></div></td><td className="px-5 py-4"><p className="font-bold text-slate-800">{placement.internship.title}</p><p className="mt-1 text-slate-500">{placement.company.companyName} · {placement.internship.location ?? 'Chưa cập nhật'}</p></td><td className="px-5 py-4"><p className="font-semibold text-slate-700">{placement.semester.name}</p><p className="mt-1 text-[10px] text-slate-400">{formatDate(placement.startDate)} — {formatDate(placement.endDate)}</p></td><td className="px-5 py-4"><span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusClass[placement.status]}`}>{statusLabel[placement.status]}</span></td><td className="px-5 py-4">{placement.supervision ? <div><p className="font-bold text-slate-800">{placement.supervision.lecturer.fullName}</p><p className="mt-1 text-[10px] text-slate-500">{placement.supervision.lecturer.department}</p></div> : <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700"><AlertCircle className="h-3 w-3" /> Chưa phân công</span>}</td><td className="px-5 py-4 text-right"><div className="flex justify-end gap-2">{placement.status !== 'COMPLETED' && placement.status !== 'CANCELLED' && <button onClick={() => openAssign(placement)} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-[11px] font-bold text-white hover:bg-indigo-700"> <GraduationCap className="h-3.5 w-3.5" /> {placement.supervision ? 'Đổi GV' : 'Phân công'}</button>}{placement.supervision?.status === 'ACTIVE' && <button onClick={() => void cancelSupervision(placement)} className="rounded-lg border border-slate-300 px-3 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-100">Bỏ phân công</button>}</div></td></tr>)}</tbody></table></div>}
        {!loading && totalPages > 1 && <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3"><p className="text-xs text-slate-500">Trang {page} / {totalPages}</p><div className="flex gap-2"><button disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-slate-200 p-2 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button><button disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-slate-200 p-2 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button></div></div>}
      </div>

      {modalPlacement && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">{modalPlacement.supervision ? 'Cập nhật phân công' : 'Phân công mới'}</p><h2 className="mt-1 text-xl font-black text-slate-900">{modalPlacement.student.fullName}</h2><p className="mt-1 text-xs text-slate-500">{modalPlacement.internship.title} · {modalPlacement.company.companyName}</p></div><button onClick={closeModal} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button></div><div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4"><div className="flex items-center gap-3"><UserRound className="h-5 w-5 text-indigo-600" /><div><p className="text-xs font-bold text-indigo-950">Giảng viên phụ trách</p><p className="mt-0.5 text-[11px] text-indigo-700">Chọn tài khoản đang hoạt động và cân bằng workload.</p></div></div></div><select value={selectedLecturer} onChange={(event) => setSelectedLecturer(event.target.value)} className="mt-4 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"><option value="">Chọn giảng viên...</option>{lecturers.map((lecturer) => <option key={lecturer.id} value={lecturer.id}>{lecturer.fullName} · {lecturer.activeSupervisionCount} placement đang phụ trách</option>)}</select><div className="mt-6 flex justify-end gap-2"><button onClick={closeModal} className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50">Hủy</button><button disabled={!selectedLecturer || saving} onClick={() => void saveAssignment()} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">{saving && <LoaderCircle className="h-4 w-4 animate-spin" />}Lưu phân công</button></div></div></div>}
    </section>
  );
};
