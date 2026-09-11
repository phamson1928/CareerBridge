import { ClipboardList, Settings, UserRound } from 'lucide-react';
import { readinessFieldLabels } from '../../recommendations/recommendationLabels';
import type { ProfileReadiness } from '../../recommendations/types';

interface ProfileReadinessBannerProps {
  readiness: ProfileReadiness;
  onOpenProfile: () => void;
  onOpenPreferences: () => void;
}

export function ProfileReadinessBanner({
  readiness,
  onOpenProfile,
  onOpenPreferences,
}: ProfileReadinessBannerProps) {
  const isHigh = readiness.level === 'HIGH';

  return (
    <section
      className={`rounded-2xl border p-4 ${
        isHigh
          ? 'border-emerald-200 bg-emerald-50/70'
          : 'border-amber-200 bg-amber-50/70'
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              isHigh ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
            }`}
          >
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-extrabold text-slate-900">Mức độ sẵn sàng hồ sơ</h2>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  isHigh
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {readiness.score}/100
              </span>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              {isHigh
                ? 'Hồ sơ đã có đủ tín hiệu để tạo phần giải thích chi tiết cho các gợi ý phù hợp nhất.'
                : 'Cập nhật hồ sơ để phần phân tích chi tiết sát với mục tiêu của bạn hơn.'}
            </p>
            {readiness.missingFields.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {readiness.missingFields.map((field) => (
                  <span
                    key={field}
                    className="rounded-md border border-amber-200 bg-white/80 px-2 py-1 text-[11px] font-semibold text-amber-900"
                  >
                    {readinessFieldLabels[field]}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={onOpenProfile}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            <UserRound className="h-3.5 w-3.5" /> Cập nhật hồ sơ
          </button>
          <button
            type="button"
            onClick={onOpenPreferences}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700"
          >
            <Settings className="h-3.5 w-3.5" /> Thiết lập mong muốn
          </button>
        </div>
      </div>
    </section>
  );
}
