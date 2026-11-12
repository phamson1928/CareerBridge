import { AlertCircle, ArrowRight, Building2, ClipboardList, Compass, Loader2, MapPin, RefreshCw, Settings, Target, UserRound } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { Application, Internship } from '../../types';
import { toLegacyInternship } from '../../internships/mappers';
import { recommendationsApi } from '../../recommendations/api';
import { formatRecommendationDate } from '../../recommendations/recommendationLabels';
import type { JobPreferences, RecommendationResponse } from '../../recommendations/types';
import { studentsApi } from '../../students/api';
import { getApiErrorMessage } from '../../auth/api';
import { JobPreferenceForm } from './JobPreferenceForm';
import { RecommendationCard } from './RecommendationCard';

interface JobRecommendationsProps {
  applications: Application[];
  onOpenProfile: () => void;
  onOpenDetail: (internship: Internship) => void;
  onApply: (internship: Internship) => void;
}

const emptyPreferences: JobPreferences = {
  desiredRoles: [],
  preferredLocations: [],
  preferredWorkTypes: [],
  createdAt: null,
  updatedAt: null,
};

const REFRESH_COOLDOWN_MS = 10 * 60_000;

function formatCooldown(remainingSeconds: number): string {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function JobRecommendations({
  applications,
  onOpenProfile,
  onOpenDetail,
  onApply,
}: JobRecommendationsProps) {
  const [response, setResponse] = useState<RecommendationResponse | null>(null);
  const [preferences, setPreferences] = useState<JobPreferences>(emptyPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [isPreferenceFormOpen, setIsPreferenceFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [current, savedPreferences] = await Promise.all([
        recommendationsApi.getCurrent(),
        studentsApi.getJobPreferences(),
      ]);
      setResponse(current);
      setPreferences(savedPreferences);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const refreshAvailableAt =
    response?.hasRecommendation && response.generatedAt
      ? new Date(response.generatedAt).getTime() + REFRESH_COOLDOWN_MS
      : null;

  useEffect(() => {
    if (!refreshAvailableAt || refreshAvailableAt <= Date.now()) {
      return;
    }

    setNow(Date.now());
    const intervalId = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(intervalId);
  }, [refreshAvailableAt]);

  const remainingRefreshSeconds = refreshAvailableAt
    ? Math.max(0, Math.ceil((refreshAvailableAt - now) / 1_000))
    : 0;
  const isRefreshCoolingDown = remainingRefreshSeconds > 0;

  const generate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const generated = await recommendationsApi.generate(response?.hasRecommendation === true);
      setResponse(generated);
    } catch (generateError) {
      setError(getApiErrorMessage(generateError));
    } finally {
      setIsGenerating(false);
    }
  };

  const savePreferences = async (
    value: Pick<JobPreferences, 'desiredRoles' | 'preferredLocations' | 'preferredWorkTypes'>,
  ) => {
    setIsSavingPreferences(true);
    try {
      const saved = await studentsApi.updateJobPreferences(value);
      setPreferences(saved);
      setResponse(await recommendationsApi.getCurrent());
    } finally {
      setIsSavingPreferences(false);
    }
  };

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Đang tải gợi ý dành cho bạn...
        </div>
      </section>
    );
  }

  if (!response) {
    return (
      <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-700" />
          <div>
            <h2 className="font-extrabold text-rose-900">Không thể tải gợi ý</h2>
            <p className="mt-1 text-sm text-rose-800">{error ?? 'Vui lòng thử lại sau.'}</p>
            <button type="button" onClick={() => void load()} className="mt-3 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-rose-800 ring-1 ring-rose-200 hover:bg-rose-100">
              Thử lại
            </button>
          </div>
        </div>
      </section>
    );
  }

  const hasFallback = response.recommendations.some(
    (item) => item.explanationStatus === 'FALLBACK',
  );

  const isHighReadiness = response.profileReadiness.level === 'HIGH';

  return (
    <section className="relative pt-10 sm:pt-12 pb-10 sm:pb-12 space-y-6" aria-label="Gợi ý việc làm phù hợp">
      {/* 1. Header căn giữa hoàn hảo, đồng bộ với Timeline ở trên */}
      <div className="flex flex-col items-center text-center max-w-4xl mx-auto px-4">
        <span className="inline-flex items-center rounded-full border border-teal-200/90 bg-teal-50/90 px-4 py-1 text-xs font-black uppercase tracking-wider text-teal-800 shadow-2xs">
          GỢI Ý PHÙ HỢP
        </span>

        <h2 className="mt-3.5 text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
          Vị trí thực tập đề xuất cho bạn
        </h2>

        <p className="mt-2.5 text-sm sm:text-base font-medium text-slate-600 max-w-2xl leading-relaxed">
          Điểm phù hợp được tính toán theo thời gian thực từ hồ sơ năng lực, kỹ năng và nguyện vọng của bạn.
        </p>
      </div>

      {/* 2. Thanh điều khiển hợp nhất: Gộp Mức độ sẵn sàng hồ sơ + Các nút tác vụ vào 1 thanh tinh gọn duy nhất */}
      <div className="max-w-4xl mx-auto w-full rounded-2xl border border-slate-200/90 bg-white/95 p-3.5 sm:px-5 sm:py-3.5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3.5">
        {/* Bên trái: Trạng thái hồ sơ */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-2xs ${
              isHighReadiness
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                : 'bg-amber-50 text-amber-700 border border-amber-200/80'
            }`}
          >
            <ClipboardList className="h-4.5 w-4.5" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-slate-800">
                Mức độ sẵn sàng hồ sơ
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-black border ${
                  isHighReadiness
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {response.profileReadiness.score}/100
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate mt-0.5">
              {isHighReadiness
                ? 'Hồ sơ đã đủ dữ liệu tối ưu cho các gợi ý việc làm.'
                : 'Bổ sung thêm kỹ năng để tăng độ chuẩn xác của gợi ý.'}
            </p>
          </div>
        </div>

        {/* Bên phải: Cụm nút hành động hợp nhất (Hồ sơ | Mong muốn | Làm mới) */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 sm:self-center">
          <button
            type="button"
            onClick={onOpenProfile}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition active:scale-95 cursor-pointer"
          >
            <UserRound className="h-3.5 w-3.5 text-slate-500" /> Hồ sơ
          </button>

          <button
            type="button"
            onClick={() => setIsPreferenceFormOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition active:scale-95 cursor-pointer"
          >
            <Settings className="h-3.5 w-3.5 text-slate-500" /> Mong muốn
          </button>

          {response.hasRecommendation && (
            <button
              type="button"
              onClick={() => void generate()}
              disabled={isGenerating || isRefreshCoolingDown}
              title={isRefreshCoolingDown ? `Có thể làm mới sau ${formatCooldown(remainingRefreshSeconds)}` : undefined}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-800 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 transition cursor-pointer"
            >
              {isGenerating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              {isGenerating
                ? 'Đang tải...'
                : isRefreshCoolingDown
                ? `Làm mới sau ${formatCooldown(remainingRefreshSeconds)}`
                : 'Làm mới'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50/90 p-3.5 text-sm text-rose-800 shadow-2xs">
          <span>{error}</span>
          <button type="button" onClick={() => void load()} className="shrink-0 font-bold underline cursor-pointer">
            Tải lại
          </button>
        </div>
      )}

      {hasFallback && (
        <div className="max-w-4xl mx-auto rounded-xl border border-amber-200/90 bg-amber-50/80 p-3 text-xs text-amber-900 shadow-2xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
          <span>Kết quả gợi ý hiện tại được tổng hợp trực tiếp từ hồ sơ năng lực và kỹ năng của bạn.</span>
        </div>
      )}

      {/* 4. Trạng thái chưa có gợi ý: Khối chào đón căn giữa, bỏ hoàn toàn các icon AI */}
      {!response.hasRecommendation ? (
        <div className="relative overflow-hidden rounded-3xl border border-teal-100/90 bg-gradient-to-b from-white via-white to-teal-50/20 p-8 sm:p-10 text-center shadow-[0_10px_30px_-10px_rgba(0,109,114,0.06)] max-w-4xl mx-auto w-full">
          {/* Icon định hướng nghề nghiệp (Compass) thay cho icon Sparkles AI */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 text-teal-700 shadow-2xs">
            <Compass className="h-7 w-7" />
          </div>

          <h3 className="mt-4 text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Khám phá các vị trí thực tập phù hợp nhất với bạn
          </h3>

          <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
            Hệ thống sẽ quét toàn bộ kỹ năng trong hồ sơ, định hướng chuyên ngành và nguyện vọng để tìm ra các cơ hội tuyển dụng tương thích cao nhất.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200/80 bg-teal-50/70 px-3 py-1 text-xs font-bold text-teal-800">
              <Target className="h-3 w-3 text-teal-600" /> Đối sánh kỹ năng chuẩn hóa
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200/80 bg-teal-50/70 px-3 py-1 text-xs font-bold text-teal-800">
              <MapPin className="h-3 w-3 text-teal-600" /> Ưu tiên địa điểm & chế độ làm việc
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200/80 bg-teal-50/70 px-3 py-1 text-xs font-bold text-teal-800">
              <Building2 className="h-3 w-3 text-teal-600" /> Đợt thực tập đang mở tuyển
            </span>
          </div>

          <button
            type="button"
            onClick={() => void generate()}
            disabled={isGenerating}
            className="sb-btn-glow mt-6 inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-[#00b4b8] via-[#009da0] to-[#006d72] px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-700/25 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {isGenerating ? 'Đang phân tích...' : 'Khám phá vị trí phù hợp ngay'}
          </button>
        </div>
      ) : response.recommendations.length === 0 ? (
        <div className="max-w-4xl mx-auto rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
          <h3 className="font-extrabold text-slate-800">Chưa có vị trí đủ điều kiện để gợi ý</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-lg mx-auto">
            Hiện chưa có vị trí đang mở, còn hạn và còn chỗ thuộc học kỳ hợp lệ mà bạn chưa ứng tuyển.
            Hãy xem danh sách tất cả vị trí bên dưới hoặc quay lại sau.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {response.recommendations.map((recommendation) => {
            const internship = toLegacyInternship(recommendation.internship);
            return (
              <RecommendationCard
                key={recommendation.internshipId}
                recommendation={recommendation}
                internship={internship}
                isApplied={applications.some((item) => item.internshipId === internship.id && item.status !== 'WITHDRAWN')}
                onOpenDetail={onOpenDetail}
                onApply={onApply}
              />
            );
          })}
        </div>
      )}

      {isPreferenceFormOpen && (
        <JobPreferenceForm
          initialValue={preferences}
          isSaving={isSavingPreferences}
          onClose={() => setIsPreferenceFormOpen(false)}
          onSave={savePreferences}
        />
      )}
    </section>
  );
}
