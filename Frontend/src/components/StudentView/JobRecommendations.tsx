import { AlertCircle, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { Application, Internship } from '../../types';
import { toLegacyInternship } from '../../internships/mappers';
import { recommendationsApi } from '../../recommendations/api';
import { formatRecommendationDate } from '../../recommendations/recommendationLabels';
import type { JobPreferences, RecommendationResponse } from '../../recommendations/types';
import { studentsApi } from '../../students/api';
import { getApiErrorMessage } from '../../auth/api';
import { JobPreferenceForm } from './JobPreferenceForm';
import { ProfileReadinessBanner } from './ProfileReadinessBanner';
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

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-indigo-700">
            <Sparkles className="h-3.5 w-3.5" /> AI hỗ trợ
          </div>
          <h2 className="mt-2 flex items-center gap-2 text-xl font-extrabold text-slate-900">
            <Sparkles className="h-5 w-5 text-indigo-600" /> Gợi ý AI cho vị trí thực tập
          </h2>
          <p className="mt-1 text-sm text-slate-500">Điểm phù hợp được tính từ hồ sơ, kỹ năng và mong muốn công việc của bạn.</p>
        </div>
        <button
          type="button"
          onClick={() => void generate()}
          disabled={isGenerating || isRefreshCoolingDown}
          title={isRefreshCoolingDown ? `Có thể làm mới sau ${formatCooldown(remainingRefreshSeconds)}` : undefined}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : response.hasRecommendation ? <RefreshCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          {isGenerating
            ? 'Đang tạo gợi ý...'
            : isRefreshCoolingDown
              ? `Làm mới sau ${formatCooldown(remainingRefreshSeconds)}`
              : response.hasRecommendation
                ? 'Làm mới gợi ý'
                : 'Tạo gợi ý'}
        </button>
      </div>

      <ProfileReadinessBanner
        readiness={response.profileReadiness}
        onOpenProfile={onOpenProfile}
        onOpenPreferences={() => setIsPreferenceFormOpen(true)}
      />

      <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-500">
        Khi bạn bấm tạo gợi ý, phần hồ sơ cần thiết như ngành học, giới thiệu, kỹ năng, dự án và mong muốn công việc có thể được tối giản để tạo phần giải thích chi tiết. Điểm và thứ hạng luôn do hệ thống tính toán.
      </p>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          <span>{error}</span>
          <button type="button" onClick={() => void load()} className="shrink-0 font-bold underline">Tải lại</button>
        </div>
      )}

      {hasFallback && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
          Phần phân tích chi tiết đang tạm thời không khả dụng; kết quả hiện tại vẫn được tính từ dữ liệu hồ sơ và kỹ năng.
        </div>
      )}

      {response.hasRecommendation && response.generatedAt && (
        <p className="text-xs text-slate-500">
          Cập nhật {formatRecommendationDate(response.generatedAt)}
          {response.cacheHit ? ' · Đang dùng kết quả đã lưu' : ''}
          {isRefreshCoolingDown
            ? ` · Có thể làm mới sau ${formatCooldown(remainingRefreshSeconds)}`
            : ''}
        </p>
      )}

      {!response.hasRecommendation ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-7 text-center">
          <h3 className="font-extrabold text-slate-800">Chưa có gợi ý nào</h3>
          <p className="mt-1 text-sm text-slate-500">Hoàn thiện hồ sơ hoặc bấm “Tạo gợi ý” để bắt đầu.</p>
        </div>
      ) : response.recommendations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-7 text-center">
          <h3 className="font-extrabold text-slate-800">Chưa có vị trí đủ điều kiện để gợi ý</h3>
          <p className="mt-1 text-sm text-slate-500">
            Hiện chưa có vị trí đang mở, còn hạn và còn chỗ thuộc công ty/học kỳ hợp lệ mà bạn chưa ứng tuyển.
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
                isApplied={applications.some((item) => item.internshipId === internship.id)}
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
