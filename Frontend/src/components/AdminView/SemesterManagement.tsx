import React, { FormEvent, useEffect, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleX,
  Edit3,
  LoaderCircle,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { getApiErrorMessage } from '../../auth/api';
import { semestersApi } from '../../semesters/api';
import type {
  SemesterInput,
  SemesterRecord,
  SemesterStatus,
} from '../../semesters/types';

const emptyForm: SemesterInput = { name: '', startDate: '', endDate: '' };

const statusLabels: Record<SemesterStatus, string> = {
  UPCOMING: 'Sắp diễn ra',
  ACTIVE: 'Đang hoạt động',
  COMPLETED: 'Đã hoàn thành',
  CANCELLED: 'Đã hủy',
};

const statusClasses: Record<SemesterStatus, string> = {
  UPCOMING: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  ACTIVE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  COMPLETED: 'border-slate-200 bg-slate-100 text-slate-700',
  CANCELLED: 'border-rose-200 bg-rose-50 text-rose-700',
};

function toDateInput(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function toStartOfDay(value: string) {
  return `${value}T00:00:00.000Z`;
}

function toEndOfDay(value: string) {
  return `${value}T23:59:59.999Z`;
}

export const SemesterManagement: React.FC = () => {
  const [items, setItems] = useState<SemesterRecord[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<SemesterStatus | ''>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<SemesterInput>(emptyForm);
  const [editing, setEditing] = useState<SemesterRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await semestersApi.list({
        page,
        limit: 10,
        search: search || undefined,
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
    const timer = window.setTimeout(() => void load(), 300);
    return () => window.clearTimeout(timer);
  }, [page, search, status]);

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (semester: SemesterRecord) => {
    setEditing(semester);
    setForm({
      name: semester.name,
      startDate: toDateInput(semester.startDate),
      endDate: toDateInput(semester.endDate),
    });
    setFormError(null);
    setModalOpen(true);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedName = form.name.trim();
    if (!normalizedName || !form.startDate || !form.endDate) {
      setFormError('Vui lòng nhập đầy đủ tên và khoảng thời gian của kỳ thực tập.');
      return;
    }
    if (form.startDate >= form.endDate) {
      setFormError('Ngày bắt đầu phải trước ngày kết thúc.');
      return;
    }

    setSaving(true);
    setFormError(null);
    const payload: SemesterInput = {
      name: normalizedName,
      startDate: toStartOfDay(form.startDate),
      endDate: toEndOfDay(form.endDate),
    };
    try {
      if (editing) {
        const updatePayload: Partial<SemesterInput> = {
          name: payload.name,
          endDate: payload.endDate,
          ...(editing.status === 'UPCOMING'
            ? { startDate: payload.startDate }
            : {}),
        };
        await semestersApi.update(editing.id, updatePayload);
      } else {
        await semestersApi.create(payload);
        if (page !== 1) setPage(1);
      }
      closeModal();
      await load();
    } catch (requestError) {
      setFormError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (semester: SemesterRecord, next: SemesterStatus) => {
    const label = statusLabels[next].toLowerCase();
    if (!window.confirm(`Chuyển kỳ “${semester.name}” sang trạng thái ${label}?`)) {
      return;
    }
    try {
      await semestersApi.updateStatus(semester.id, next);
      await load();
    } catch (requestError) {
      window.alert(getApiErrorMessage(requestError));
    }
  };

  const remove = async (semester: SemesterRecord) => {
    if (!window.confirm(`Xóa kỳ thực tập “${semester.name}”? Thao tác này không thể hoàn tác.`)) {
      return;
    }
    try {
      await semestersApi.remove(semester.id);
      if (items.length === 1 && page > 1) setPage((current) => current - 1);
      else await load();
    } catch (requestError) {
      window.alert(getApiErrorMessage(requestError));
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Quản lý kỳ thực tập</h2>
          <p className="mt-1 text-xs text-slate-500">
            Thiết lập khoảng thời gian để doanh nghiệp đăng và sinh viên tìm vị trí thực tập.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Tạo kỳ thực tập
        </button>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
            placeholder="Tìm theo tên kỳ thực tập..."
            className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <select
          value={status}
          onChange={(event) => {
            setPage(1);
            setStatus(event.target.value as SemesterStatus | '');
          }}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        >
          <option value="">Tất cả trạng thái</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="mb-4 text-sm text-rose-600">{error}</p>}

      {loading ? (
        <div className="flex min-h-48 items-center justify-center text-sm text-slate-500">
          <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
          Đang tải kỳ thực tập...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 px-5 py-12 text-center text-sm text-slate-500">
          Chưa có kỳ thực tập phù hợp.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full text-left text-xs">
            <thead>
              <tr className="border-y border-slate-100 bg-slate-50 text-slate-500">
                <th className="px-3 py-3 font-bold">Kỳ thực tập</th>
                <th className="px-3 py-3 font-bold">Thời gian</th>
                <th className="px-3 py-3 font-bold">Trạng thái</th>
                <th className="px-3 py-3 text-center font-bold">Vị trí</th>
                <th className="px-3 py-3 text-center font-bold">Placement</th>
                <th className="px-3 py-3 text-right font-bold">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((semester) => (
                <tr key={semester.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-4 font-bold text-slate-800">{semester.name}</td>
                  <td className="px-3 py-4 text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                      {new Date(semester.startDate).toLocaleDateString('vi-VN')} –{' '}
                      {new Date(semester.endDate).toLocaleDateString('vi-VN')}
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 font-bold ${statusClasses[semester.status]}`}>
                      {statusLabels[semester.status]}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-center font-semibold text-slate-700">
                    {semester.internshipCount}
                  </td>
                  <td className="px-3 py-4 text-center font-semibold text-slate-700">
                    {semester.placementCount}
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex justify-end gap-1.5">
                      {(semester.status === 'UPCOMING' || semester.status === 'ACTIVE') && (
                        <button
                          onClick={() => openEdit(semester)}
                          title="Chỉnh sửa"
                          className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                      )}
                      {semester.status === 'UPCOMING' && (
                        <>
                          <button
                            onClick={() => void changeStatus(semester, 'ACTIVE')}
                            title="Kích hoạt"
                            className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => void changeStatus(semester, 'CANCELLED')}
                            title="Hủy kỳ"
                            className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"
                          >
                            <CircleX className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {semester.status === 'ACTIVE' && (
                        <>
                          <button
                            onClick={() => void changeStatus(semester, 'COMPLETED')}
                            title="Hoàn thành"
                            className="rounded-lg p-2 text-slate-700 hover:bg-slate-100"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => void changeStatus(semester, 'CANCELLED')}
                            title="Hủy kỳ"
                            className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"
                          >
                            <CircleX className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {(semester.status === 'UPCOMING' || semester.status === 'CANCELLED') && (
                        <button
                          onClick={() => void remove(semester)}
                          title="Xóa"
                          className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-5 flex items-center justify-end gap-2 text-xs text-slate-600">
        <button
          disabled={page <= 1 || loading}
          onClick={() => setPage((current) => current - 1)}
          className="rounded-lg border border-slate-200 p-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span>Trang {page}/{totalPages}</span>
        <button
          disabled={page >= totalPages || loading}
          onClick={() => setPage((current) => current + 1)}
          className="rounded-lg border border-slate-200 p-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={(event) => void submit(event)}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  {editing ? 'Chỉnh sửa kỳ thực tập' : 'Tạo kỳ thực tập'}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {editing?.status === 'ACTIVE'
                    ? 'Kỳ đang hoạt động nên không thể thay đổi ngày bắt đầu.'
                    : 'Thiết lập tên và khoảng thời gian cho kỳ thực tập.'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-800">Tên kỳ thực tập *</label>
                <input
                  required
                  maxLength={100}
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Ví dụ: Học kỳ doanh nghiệp 2027"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-800">Ngày bắt đầu *</label>
                  <input
                    type="date"
                    required
                    disabled={editing?.status === 'ACTIVE'}
                    value={form.startDate}
                    onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-800">Ngày kết thúc *</label>
                  <input
                    type="date"
                    required
                    value={form.endDate}
                    onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
                  />
                </div>
              </div>
              {formError && <p className="text-xs text-rose-600">{formError}</p>}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}
                {editing ? 'Lưu thay đổi' : 'Tạo kỳ thực tập'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
};
