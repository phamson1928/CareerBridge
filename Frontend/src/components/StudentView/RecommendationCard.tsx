import { CalendarDays, CheckCircle2, ChevronRight, Clock, MapPin, Send, Sparkles } from 'lucide-react';
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
    <article className="flex h-full flex-col rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:shadow-lg hover:-translate-y-1 hover:border-teal-300 transition-all duration-200 card-interactive">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-teal-50 font-black text-teal-700">
            {internship.companyLogo ? (
              <img className="h-full w-full object-cover" src={internship.companyLogo} alt="" />
            ) : (
              internship.companyName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-teal-700">Hạng #{recommendation.rank}</p>
            <h3 className="truncate text-base font-extrabold text-slate-900">{internship.title}</h3>
            <p className="truncate text-xs font-semibold text-slate-500">{internship.companyName}</p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-extrabold text-emerald-800 ring-1 ring-emerald-200">
          {recommendation.overallScore}%
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
        {internship.semester?.name && (
          <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-teal-800 ring-1 ring-teal-200">
            <CalendarDays className="h-3 w-3 text-teal-600" /> {internship.semester.name}
          </span>
        )}
        <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 ring-1 ring-slate-200">
          <MapPin className="h-3.5 w-3.5" /> {internship.location}
        </span>
        <span className="rounded-md bg-slate-50 px-2 py-1 ring-1 ring-slate-200">Kỹ năng {recommendation.skillScore}%</span>
        {recommendation.explanationStatus === 'AI' && (
          <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2 py-1 font-bold text-teal-800 ring-1 ring-teal-200">
            <Sparkles className="h-3.5 w-3.5 text-teal-600" /> Phân tích chi tiết
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
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-teal-700 transition-colors"
        >
          Xem chi tiết <ChevronRight className="h-3.5 w-3.5" />
        </button>
        {isApplied ? (
          <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5" /> Đã ứng tuyển
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onApply(internship)}
            className="inline-flex items-center gap-1 rounded-xl bg-teal-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-teal-800 active:scale-95 shadow-xs transition-all"
          >
            <Send className="h-3.5 w-3.5" /> Ứng tuyển
          </button>
        )}
      </div>
    </article>
  );
}
