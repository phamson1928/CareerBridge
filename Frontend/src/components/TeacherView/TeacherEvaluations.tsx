import React, { useEffect, useMemo, useState } from 'react';
import { Award, Save, UserRound } from 'lucide-react';
import type { EvaluationRecord } from '../../evaluations/api';
import type { PlacementRecord } from '../../placements/types';

interface Props {
  placements: PlacementRecord[];
  evaluations: EvaluationRecord[];
  onSubmit: (input: { placementId: string; score: number; comment: string }) => Promise<void>;
  onUpdate: (id: string, input: { score: number; comment: string }) => Promise<void>;
}

const evaluatorRoleLabel: Record<string, string> = { COMPANY: 'Doanh nghiệp', LECTURER: 'Giảng viên', ADMIN: 'Quản trị viên', STUDENT: 'Sinh viên' };

export function TeacherEvaluations({ placements, evaluations, onSubmit, onUpdate }: Props) {
  const evaluable = useMemo(() => placements.filter((placement) => placement.academicStatus === 'ACTIVE'), [placements]);
  const [placementId, setPlacementId] = useState('');
  const [score, setScore] = useState(8);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const selectedId = placementId || evaluable[0]?.id || '';
  const lecturerEvaluation = evaluations.find((item) => item.placementId === selectedId && item.type === 'LECTURER');
  const companyEvaluations = evaluations.filter((item) => item.type === 'COMPANY');

  useEffect(() => {
    setScore(lecturerEvaluation?.score ?? 8);
    setComment(lecturerEvaluation?.comment ?? '');
  }, [lecturerEvaluation?.id, selectedId]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedId) return;
    setSaving(true);
    try {
      if (lecturerEvaluation) await onUpdate(lecturerEvaluation.id, { score, comment });
      else await onSubmit({ placementId: selectedId, score, comment });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-bold">Tổng hợp đánh giá thực tập</h2><p className="mt-1 text-xs text-slate-500">Điểm giảng viên là một đánh giá độc lập, không ghi đè đánh giá doanh nghiệp.</p></div>
      {companyEvaluations.map((evaluation) => <article key={evaluation.id} className="rounded-2xl border bg-white p-5"><div className="flex justify-between gap-3"><div><h3 className="font-bold">{evaluation.placement.student.fullName}</h3><p className="text-xs text-slate-500">{evaluation.placement.company.companyName} · {evaluation.placement.internship.title}</p></div><span className="font-bold text-emerald-700"><Award className="inline h-4 w-4" /> {evaluation.score}/10</span></div><div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-600"><p className="flex items-center gap-2 font-semibold text-slate-700"><UserRound className="h-4 w-4 text-indigo-500" />Người đánh giá: {evaluation.evaluator.email}</p><p className="mt-1 pl-6">Vai trò: {evaluatorRoleLabel[evaluation.evaluator.role] ?? evaluation.evaluator.role}</p></div><p className="mt-3 text-sm text-slate-600">{evaluation.comment || 'Không có nhận xét'}</p></article>)}
      {evaluable.length > 0 && <form onSubmit={submit} className="space-y-4 rounded-2xl border bg-white p-6"><h3 className="font-bold">{lecturerEvaluation ? 'Cập nhật đánh giá của giảng viên' : 'Thêm đánh giá của giảng viên'}</h3>{lecturerEvaluation && <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">Người đánh giá: {lecturerEvaluation.evaluator.email} · {evaluatorRoleLabel[lecturerEvaluation.evaluator.role] ?? lecturerEvaluation.evaluator.role}</p>}<select value={selectedId} onChange={(event) => setPlacementId(event.target.value)} className="w-full rounded-xl border p-3">{evaluable.map((placement) => <option key={placement.id} value={placement.id}>{placement.student.fullName} — {placement.internship.title}</option>)}</select><input required type="number" min="0" max="10" step="0.01" value={score} onChange={(event) => setScore(Number(event.target.value))} className="w-full rounded-xl border p-3" /><textarea required rows={4} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Nhận xét tổng kết" className="w-full rounded-xl border p-3" /><button disabled={saving} className="flex gap-2 rounded-xl bg-purple-600 px-5 py-3 font-bold text-white disabled:bg-slate-400"><Save className="w-4" />{saving ? 'Đang lưu...' : lecturerEvaluation ? 'Cập nhật đánh giá' : 'Lưu đánh giá'}</button></form>}
    </div>
  );
}
