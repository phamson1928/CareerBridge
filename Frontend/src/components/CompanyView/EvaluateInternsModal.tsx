import React, { useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import type { EvaluationRecord } from '../../evaluations/api';
import type { PlacementRecord } from '../../placements/types';

interface Props { placements: PlacementRecord[]; evaluations: EvaluationRecord[]; onSubmit: (input: { placementId: string; score: number; comment: string }) => Promise<void>; }

export function EvaluateInternsModal({ placements, evaluations, onSubmit }: Props) {
  const evaluable = useMemo(() => placements.filter((p) => p.status === 'ACTIVE' || p.status === 'COMPLETED'), [placements]);
  const [placementId, setPlacementId] = useState(''); const [score, setScore] = useState(8); const [comment, setComment] = useState(''); const [saving, setSaving] = useState(false);
  const selectedId = placementId || evaluable[0]?.id || '';
  const alreadyEvaluated = evaluations.some((item) => item.placementId === selectedId && item.type === 'COMPANY');
  const submit = async (event: React.FormEvent) => { event.preventDefault(); if (!selectedId) return; setSaving(true); try { await onSubmit({ placementId: selectedId, score, comment }); setComment(''); } finally { setSaving(false); } };
  return <div className="space-y-6"><div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs"><h2 className="text-xl font-bold text-slate-900">Đánh giá thực tập sinh</h2><p className="text-xs text-slate-500 mt-1">Mỗi sinh viên chỉ có một đánh giá doanh nghiệp cho mỗi đợt thực tập.</p></div>
    {evaluable.length === 0 ? <div className="bg-white rounded-2xl p-8 border border-slate-200 text-sm text-slate-500">Chưa có placement đang hoạt động hoặc đã hoàn thành để đánh giá.</div> : <form onSubmit={submit} className="bg-white rounded-2xl p-6 border border-slate-200 space-y-5 max-w-2xl"><label className="block text-sm font-bold">Thực tập sinh<select value={selectedId} onChange={(e) => setPlacementId(e.target.value)} className="mt-2 w-full p-3 border rounded-xl bg-white">{evaluable.map((p) => <option key={p.id} value={p.id}>{p.student.fullName} — {p.internship.title}</option>)}</select></label>{alreadyEvaluated && <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-xl">Sinh viên này đã có đánh giá doanh nghiệp.</p>}<label className="block text-sm font-bold">Điểm tổng kết (0–10)<input required type="number" min="0" max="10" step="0.01" value={score} onChange={(e) => setScore(Number(e.target.value))} className="mt-2 w-full p-3 border rounded-xl" /></label><label className="block text-sm font-bold">Nhận xét<textarea required rows={5} value={comment} onChange={(e) => setComment(e.target.value)} className="mt-2 w-full p-3 border rounded-xl" /></label><button disabled={saving || alreadyEvaluated} className="px-5 py-3 bg-emerald-600 disabled:bg-slate-400 text-white font-bold rounded-xl flex gap-2"><Save className="w-4 h-4" />{saving ? 'Đang lưu...' : 'Lưu đánh giá'}</button></form>}
  </div>;
}
