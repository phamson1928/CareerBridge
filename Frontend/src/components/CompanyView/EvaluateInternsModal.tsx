import React, { useEffect, useMemo, useState } from "react";
import { Save, UserRound } from "lucide-react";
import type { EvaluationRecord } from "../../evaluations/api";
import type { PlacementRecord } from "../../placements/types";

interface Props {
  placements: PlacementRecord[];
  evaluations: EvaluationRecord[];
  onSubmit: (input: {
    placementId: string;
    score: number;
    comment: string;
  }) => Promise<void>;
  onUpdate: (
    id: string,
    input: { score: number; comment: string },
  ) => Promise<void>;
}
const evaluatorRoleLabel: Record<string, string> = {
  COMPANY: "Doanh nghiệp",
  LECTURER: "Giảng viên",
  ADMIN: "Quản trị viên",
  STUDENT: "Sinh viên",
};

export function EvaluateInternsModal({
  placements,
  evaluations,
  onSubmit,
  onUpdate,
}: Props) {
  const evaluable = useMemo(
    () =>
      placements.filter((placement) => placement.academicStatus === "ACTIVE"),
    [placements],
  );
  const [placementId, setPlacementId] = useState("");
  const [score, setScore] = useState(8);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const selectedId = placementId || evaluable[0]?.id || "";
  const existing = evaluations.find(
    (item) => item.placementId === selectedId && item.type === "COMPANY",
  );

  useEffect(() => {
    setScore(existing?.score ?? 8);
    setComment(existing?.comment ?? "");
  }, [existing?.id, selectedId]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedId) return;
    setSaving(true);
    try {
      if (existing) await onUpdate(existing.id, { score, comment });
      else await onSubmit({ placementId: selectedId, score, comment });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900">
          Đánh giá thực tập sinh
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Mỗi sinh viên chỉ có một đánh giá doanh nghiệp cho mỗi đợt thực tập.
        </p>
      </div>
      {evaluable.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
          Chưa có hồ sơ thực tập nào đang trong thời gian nhà trường theo dõi để
          đánh giá.
        </div>
      ) : (
        <form
          onSubmit={submit}
          className="max-w-2xl space-y-5 rounded-2xl border border-slate-200 bg-white p-6"
        >
          <label className="block text-sm font-bold">
            Thực tập sinh
            <select
              value={selectedId}
              onChange={(event) => setPlacementId(event.target.value)}
              className="mt-2 w-full rounded-xl border bg-white p-3"
            >
              {evaluable.map((placement) => (
                <option key={placement.id} value={placement.id}>
                  {placement.student.fullName} — {placement.internship.title}
                </option>
              ))}
            </select>
          </label>
          {existing && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-xs text-indigo-900">
              <p className="flex items-center gap-2 font-semibold">
                <UserRound className="h-4 w-4" />
                Người đánh giá: {existing.evaluator.email}
              </p>
              <p className="mt-1 pl-6">
                Vai trò:{" "}
                {evaluatorRoleLabel[existing.evaluator.role] ??
                  existing.evaluator.role}
              </p>
            </div>
          )}
          <label className="block text-sm font-bold">
            Điểm tổng kết (0–10)
            <input
              required
              type="number"
              min="0"
              max="10"
              step="0.01"
              value={score}
              onChange={(event) => setScore(Number(event.target.value))}
              className="mt-2 w-full rounded-xl border p-3"
            />
          </label>
          <label className="block text-sm font-bold">
            Nhận xét
            <textarea
              required
              rows={5}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              className="mt-2 w-full rounded-xl border p-3"
            />
          </label>
          <button
            disabled={saving}
            className="flex gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white disabled:bg-slate-400"
          >
            <Save className="h-4 w-4" />
            {saving
              ? "Đang lưu..."
              : existing
                ? "Cập nhật đánh giá"
                : "Lưu đánh giá"}
          </button>
        </form>
      )}
    </div>
  );
}
