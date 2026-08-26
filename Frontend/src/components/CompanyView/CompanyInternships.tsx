import { FormEvent, useEffect, useState } from 'react';
import { FilterX, LoaderCircle, Plus, Search, Trash2, X } from 'lucide-react';
import { getApiErrorMessage } from '../../auth/api';
import { useAppFeedback } from '../Feedback/AppFeedbackProvider';
import { internshipsApi, InternshipInput, InternshipRecord } from '../../internships/api';
import { semestersApi } from '../../semesters/api';
import type { SemesterRecord } from '../../semesters/types';
import { skillsApi } from '../../skills/api';
import { SkillPicker, type SkillOption } from '../Skills/SkillPicker';

const initialInput: InternshipInput = {
  title: '', description: '', slots: 1, department: '',
  location: '', workType: 'HYBRID', stipend: '', requirements: '',
  deadline: '', status: 'DRAFT',
};

export function CompanyInternships() {
  const { confirm } = useAppFeedback();
  const [items, setItems] = useState<InternshipRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<InternshipInput>(initialInput);
  const [selectedSkills, setSelectedSkills] = useState<SkillOption[]>([]);
  const [search, setSearch] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [filterSkills, setFilterSkills] = useState<SkillOption[]>([]);
  const [status, setStatus] = useState('');
  const [semesterOptions, setSemesterOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [activeSemesters, setActiveSemesters] = useState<SemesterRecord[]>([]);

  const load = async (filters = { search, semesterId, skillId: filterSkills[0]?.id ?? '', status }) => {
    setLoading(true);
    setError(null);
    try {
      const [page, activeSemesterPage] = await Promise.all([
        internshipsApi.listMine({
          page: 1,
          limit: 100,
          ...(filters.search ? { search: filters.search } : {}),
          ...(filters.semesterId ? { semesterId: filters.semesterId } : {}),
          ...(filters.skillId ? { skillId: filters.skillId } : {}),
          ...(filters.status ? { status: filters.status as InternshipRecord['status'] } : {}),
        }),
        semestersApi.list({ page: 1, limit: 100, status: 'ACTIVE' }),
      ]);
      setItems(page.items);
      setActiveSemesters(activeSemesterPage.items);
      setSemesterOptions((current) => {
        const all = new Map(current.map((semester) => [semester.id, semester]));
        page.items.forEach((item) => all.set(item.semester.id, { id: item.semester.id, name: item.semester.name }));
        return [...all.values()].sort((a, b) => a.name.localeCompare(b.name));
      });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void load();
  };

  const clearFilters = () => {
    const empty = { search: '', semesterId: '', skillId: '', status: '' };
    setSearch('');
    setSemesterId('');
    setFilterSkills([]);
    setStatus('');
    void load(empty);
  };

  const update = (key: keyof InternshipInput, value: string | number) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const input: InternshipInput = {
        ...form,
        ...(activeSemesters.length > 1 ? { semesterId: form.semesterId } : {}),
        title: form.title.trim(),
        description: form.description.trim(),
        department: form.department?.trim() || null,
        location: form.location?.trim() || null,
        workType: form.workType?.trim() || null,
        stipend: form.stipend?.trim() || null,
        requirements: form.requirements?.trim() || null,
        deadline: form.deadline ? new Date(`${form.deadline}T23:59:59`).toISOString() : null,
      };
      const internship = await internshipsApi.create(input);
      if (selectedSkills.length) {
        await skillsApi.syncInternship(internship.id, selectedSkills.map((skill) => ({ skillId: skill.id, isRequired: true, weight: 1 })));
      }
      setIsFormOpen(false);
      setForm(initialInput);
      setSelectedSkills([]);
      await load();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    const accepted = await confirm({ title: 'Xóa bài đăng', message: 'Xóa bài đăng này? Thao tác này không thể hoàn tác.', confirmLabel: 'Xóa bài đăng', tone: 'danger' });
    if (!accepted) return;
    try {
      await internshipsApi.remove(id);
      setItems((current) => current.filter((item) => item.id !== id));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  };

  return <div className="space-y-6">
    <section className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
      <div><h2 className="text-xl font-bold text-slate-900">Danh sách tin tuyển dụng</h2><p className="mt-1 text-xs text-slate-500">Dữ liệu được lấy trực tiếp từ hệ thống.</p></div>
      <button onClick={() => setIsFormOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"><Plus className="h-4 w-4" /> Đăng bài mới</button>
    </section>
    {error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    <form onSubmit={applyFilters} className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-xs md:grid-cols-5">
      <label className="md:col-span-2"><span className="sr-only">Tìm kiếm</span><div className="flex items-center gap-2 rounded-xl border border-slate-300 px-3"><Search className="h-4 w-4 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo vị trí, công ty, mô tả" className="w-full py-2.5 outline-none" /></div></label>
      <select value={semesterId} onChange={(event) => setSemesterId(event.target.value)} className="rounded-xl border border-slate-300 px-3 py-2.5"><option value="">Tất cả kỳ thực tập</option>{semesterOptions.map((semester) => <option key={semester.id} value={semester.id}>{semester.name}</option>)}</select>
      <SkillPicker selected={filterSkills} onChange={setFilterSkills} placeholder="Tìm kỹ năng để lọc..." />
      <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-slate-300 px-3 py-2.5"><option value="">Tất cả trạng thái</option><option value="DRAFT">Nháp</option><option value="OPEN">Đang mở</option><option value="CLOSED">Đã đóng</option><option value="CANCELLED">Đã hủy</option></select>
      <div className="flex gap-2 md:col-span-5"><button className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white">Lọc</button><button type="button" onClick={clearFilters} className="inline-flex items-center gap-1 rounded-xl border border-slate-300 px-3 py-2 font-bold text-slate-700"><FilterX className="h-3.5 w-3.5" /> Xóa bộ lọc</button></div>
    </form>
    {loading ? <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500"><LoaderCircle className="mx-auto mb-3 h-5 w-5 animate-spin" />Đang tải bài đăng...</div> :
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">{items.map((job) => <article key={job.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"><div className="flex justify-between gap-3"><div><h3 className="font-bold text-slate-900">{job.title}</h3><p className="mt-1 text-xs text-slate-500">{job.semester.name} · {job.department || 'Chưa phân phòng ban'}</p></div><span className="h-fit rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700">{job.status}</span></div><p className="mt-3 text-xs text-slate-600">{job.location || 'Chưa có địa điểm'} · Hạn: {job.deadline ? new Date(job.deadline).toLocaleDateString('vi-VN') : 'Không giới hạn'}</p><div className="mt-3 flex flex-wrap gap-1">{job.skills.map((skill) => <span key={skill.skillId} className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">{skill.name}</span>)}</div><div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs"><span>{job.filledSlots}/{job.slots} chỗ đã tuyển</span><button onClick={() => void remove(job.id)} className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-800"><Trash2 className="h-3.5 w-3.5" /> Xóa</button></div></article>)}</div>}
    {!loading && items.length === 0 && <p className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500">Chưa có bài đăng nào.</p>}
    {isFormOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"><form onSubmit={(event) => void submit(event)} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><h2 className="text-xl font-bold">Đăng vị trí thực tập</h2><p className="mt-1 text-xs text-slate-500">Chọn Draft để lưu nháp; Open để công khai ngay.</p></div><button type="button" onClick={() => setIsFormOpen(false)}><X className="h-5 w-5" /></button></div><div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">{activeSemesters.length === 1 ? <>Tin tuyển dụng sẽ tự động áp dụng cho kỳ thực tập: <strong>{activeSemesters[0].name}</strong>.</> : activeSemesters.length > 1 ? <>Có nhiều kỳ thực tập đang hoạt động. Vui lòng chọn kỳ áp dụng cho tin này.</> : <>Chưa có kỳ thực tập đang hoạt động. Vui lòng liên hệ quản trị viên để mở kỳ trước khi đăng tin.</>}</div><div className="mt-5 grid grid-cols-1 gap-4 text-xs md:grid-cols-2">{activeSemesters.length > 1 && <label className="font-bold md:col-span-2">Kỳ thực tập *<select required value={form.semesterId ?? ''} onChange={(event) => update('semesterId', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 font-normal"><option value="" disabled>Chọn kỳ thực tập</option>{activeSemesters.map((semester) => <option key={semester.id} value={semester.id}>{semester.name}</option>)}</select></label>}<Field label="Tên vị trí *" value={form.title} onChange={(value) => update('title', value)} required /><Field label="Phòng ban" value={form.department ?? ''} onChange={(value) => update('department', value)} /><Field label="Địa điểm" value={form.location ?? ''} onChange={(value) => update('location', value)} /><Field label="Hình thức" value={form.workType ?? ''} onChange={(value) => update('workType', value)} /><Field label="Trợ cấp" value={form.stipend ?? ''} onChange={(value) => update('stipend', value)} /><Field label="Số lượng *" type="number" value={String(form.slots)} onChange={(value) => update('slots', Number(value))} required /><Field label="Hạn nộp" type="date" value={form.deadline ?? ''} onChange={(value) => update('deadline', value)} /><label className="font-bold md:col-span-2">Mô tả *<textarea required rows={4} value={form.description} onChange={(event) => update('description', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 font-normal" /></label><label className="font-bold md:col-span-2">Yêu cầu khác<textarea rows={3} value={form.requirements ?? ''} onChange={(event) => update('requirements', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 font-normal" /></label><label className="font-bold">Trạng thái<select value={form.status} onChange={(event) => update('status', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 font-normal"><option value="DRAFT">DRAFT — lưu nháp</option><option value="OPEN">OPEN — công khai</option></select></label><fieldset className="md:col-span-2"><legend className="font-bold">Kỹ năng yêu cầu</legend><SkillPicker multiple selected={selectedSkills} onChange={setSelectedSkills} placeholder="Tìm và thêm kỹ năng..." className="mt-1" /></fieldset></div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setIsFormOpen(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold">Hủy</button><button disabled={saving || !activeSemesters.length || (activeSemesters.length > 1 && !form.semesterId)} className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{saving ? 'Đang lưu...' : 'Lưu bài đăng'}</button></div></form></div>}
  </div>;
}

function Field({ label, value, onChange, required, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string }) {
  return <label className="font-bold">{label}<input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 font-normal" /></label>;
}
