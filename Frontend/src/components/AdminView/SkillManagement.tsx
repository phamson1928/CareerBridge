import React, { useEffect, useState } from 'react';
import { Edit3, LoaderCircle, Plus, Search, Trash2 } from 'lucide-react';
import { getApiErrorMessage } from '../../auth/api';
import { skillsApi } from '../../skills/api';
import type { SkillRecord } from '../../skills/types';

export const SkillManagement: React.FC = () => {
  const [items, setItems] = useState<SkillRecord[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try { const result = await skillsApi.list({ page, limit: 10, search: search || undefined }); setItems(result.items); setTotalPages(result.pagination.totalPages); }
    catch (e) { setError(getApiErrorMessage(e)); } finally { setLoading(false); }
  };
  useEffect(() => { const timer = window.setTimeout(() => void load(), 300); return () => window.clearTimeout(timer); }, [page, search]);

  const create = async () => { const name = window.prompt('Tên kỹ năng mới:')?.trim(); if (!name) return; try { await skillsApi.create(name); setPage(1); await load(); } catch (e) { window.alert(getApiErrorMessage(e)); } };
  const edit = async (skill: SkillRecord) => { const name = window.prompt('Tên kỹ năng:', skill.name)?.trim(); if (!name || name === skill.name) return; try { await skillsApi.update(skill.id, name); await load(); } catch (e) { window.alert(getApiErrorMessage(e)); } };
  const remove = async (skill: SkillRecord) => { if (!window.confirm(`Xóa kỹ năng “${skill.name}”?`)) return; try { await skillsApi.remove(skill.id); await load(); } catch (e) { window.alert(getApiErrorMessage(e)); } };

  return <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-extrabold text-slate-900">Danh mục kỹ năng</h2><p className="text-xs text-slate-500">Quản lý catalogue dùng chung cho sinh viên và internship.</p></div><button onClick={() => void create()} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white"><Plus className="h-4 w-4" />Thêm kỹ năng</button></div>
    <div className="relative mb-4"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={search} onChange={e => { setPage(1); setSearch(e.target.value); }} placeholder="Tìm kỹ năng..." className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm" /></div>
    {error && <p className="mb-3 text-sm text-rose-600">{error}</p>}
    {loading ? <div className="p-8 text-center text-slate-500"><LoaderCircle className="mx-auto h-5 w-5 animate-spin" /></div> : items.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">Chưa có kỹ năng phù hợp.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b text-slate-500"><th className="p-3">Tên</th><th className="p-3">Sinh viên</th><th className="p-3">Internship</th><th className="p-3">Cập nhật</th><th className="p-3" /></tr></thead><tbody>{items.map(skill => <tr key={skill.id} className="border-b last:border-0"><td className="p-3 font-bold text-slate-800">{skill.name}</td><td className="p-3">{skill.studentCount}</td><td className="p-3">{skill.internshipCount}</td><td className="p-3">{new Date(skill.updatedAt).toLocaleDateString('vi-VN')}</td><td className="p-3 text-right"><button onClick={() => void edit(skill)} className="mr-2 text-indigo-600"><Edit3 className="h-4 w-4" /></button><button onClick={() => void remove(skill)} className="text-rose-600"><Trash2 className="h-4 w-4" /></button></td></tr>)}</tbody></table></div>}
    <div className="mt-4 flex items-center justify-end gap-2 text-xs"><button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded-lg bg-slate-100 px-3 py-1 disabled:opacity-40">Trước</button><span>{page}/{totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="rounded-lg bg-slate-100 px-3 py-1 disabled:opacity-40">Sau</button></div>
  </section>;
};
