import { ClipboardList, Settings, UserRound, AlertTriangle } from 'lucide-react';
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
    <div
      className={`rounded-2xl border px-4 py-3 sm:px-5 sm:py-3.5 transition-all bg-white/95 shadow-xs ${
        isHigh
          ? 'border-emerald-200/90'
          : 'border-amber-200/90'
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-2xs ${
              isHigh
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                : 'bg-amber-50 text-amber-700 border border-amber-200/80'
            }`}
          >
            {isHigh ? <ClipboardList className="h-4.5 w-4.5" /> : <AlertTriangle className="h-4.5 w-4.5" />}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-slate-800">
                Mức độ sẵn sàng hồ sơ
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-black border ${
                  isHigh
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {readiness.score}/100
              </span>
              <span className="hidden lg:inline text-slate-300">•</span>
              <span className="hidden lg:inline text-xs text-slate-500 truncate max-w-[480px]">
                {isHigh
                  ? 'Hồ sơ đã đủ tín hiệu để thuật toán AI đề xuất việc làm chuẩn xác.'
                  : 'Cập nhật thêm thông tin để tăng độ sát hợp của gợi ý.'}
              </span>
            </div>
            {readiness.missingFields.length > 0 && (
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-amber-800">
                <span className="font-semibold">Còn thiếu:</span>
                {readiness.missingFields.map((field) => (
                  <span
                    key={field}
                    className="rounded-md border border-amber-200 bg-amber-50/80 px-1.5 py-0.5 text-[10px] font-bold"
                  >
                    {readinessFieldLabels[field]}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:self-center">
          <button
            type="button"
            onClick={onOpenProfile}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition active:scale-95 cursor-pointer"
          >
            <UserRound className="h-3.5 w-3.5 text-slate-500" /> Cập nhật hồ sơ
          </button>
          <button
            type="button"
            onClick={onOpenPreferences}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-800 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:brightness-110 transition active:scale-95 cursor-pointer"
          >
            <Settings className="h-3.5 w-3.5" /> Thiết lập mong muốn
          </button>
        </div>
      </div>
    </div>
  );
}
