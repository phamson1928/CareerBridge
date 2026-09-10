import { CheckCircle2, ChevronRight, MapPin, Send, Sparkles } from 'lucide-react';
import type { Internship } from '../../types';
import type { RecommendationItem } from '../../recommendations/types';
import { RecommendationExplanation } from './RecommendationExplanation';

interface RecommendationCardProps {
  recommendation: RecommendationItem;
  internship: Internship;
  isApplied: boolean;
  onOpenDetail: (internship: Internship) => void;
  onApply: (internship: Internship) => void;
}

export function RecommendationCard({
  recommendation,
  internship,
  isApplied,
  onOpenDetail,
  onApply,
}: RecommendationCardProps) {
  const matchedSignals = recommendation.matchSummary.matchedSignals.slice(0, 3);
  const missingSkills = recommendation.missingRequiredSkills.slice(0, 3);

  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-indigo-50 font-black text-indigo-700">
            {internship.companyLogo ? (
              <img className="h-full w-full object-cover" src={internship.companyLogo} alt="" />
            ) : (
              internship.companyName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-indigo-600">Hạng #{recommendation.rank}</p>
            <h3 className="truncate text-base font-extrabold text-slate-900">{internship.title}</h3>
            <p className="truncate text-xs font-semibold text-slate-500">{internship.companyName}</p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-extrabold text-emerald-800 ring-1 ring-emerald-200">
          {recommendation.overallScore}%
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 ring-1 ring-slate-200">
          <MapPin className="h-3.5 w-3.5" /> {internship.location}
        </span>
        <span className="rounded-md bg-slate-50 px-2 py-1 ring-1 ring-slate-200">Kỹ năng {recommendation.skillScore}%</span>
        {recommendation.explanationStatus === 'AI' && (
          <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 px-2 py-1 font-bold text-violet-800 ring-1 ring-violet-200">
            <Sparkles className="h-3.5 w-3.5" /> Phân tích chi tiết
          </span>
        )}
      </div>

      {(matchedSignals.length > 0 || missingSkills.length > 0) && (
        <div className="mt-4 space-y-2 text-xs">
          {matchedSignals.length > 0 && (
            <p className="text-slate-600"><span className="font-bold text-slate-800">Phù hợp: </span>{matchedSignals.join(' · ')}</p>
          )}
          {missingSkills.length > 0 && (
            <p className="text-amber-800"><span className="font-bold">Cần bổ sung: </span>{missingSkills.map((skill) => skill.name).join(' · ')}</p>
          )}
        </div>
      )}

      {recommendation.explanationStatus === 'AI' && recommendation.aiExplanation && (
        <RecommendationExplanation explanation={recommendation.aiExplanation} />
      )}

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={() => onOpenDetail(internship)}
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-indigo-700"
        >
          Xem chi tiết <ChevronRight className="h-3.5 w-3.5" />
        </button>
        {isApplied ? (
          <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-800">
            <CheckCircle2 className="h-3.5 w-3.5" /> Đã ứng tuyển
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onApply(internship)}
            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
          >
            <Send className="h-3.5 w-3.5" /> Ứng tuyển
          </button>
        )}
      </div>
    </article>
  );
}
