import { CalendarDays, CheckCircle2, ChevronRight, Clock, MapPin, Send, Target } from 'lucide-react';
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
    <article className="sb-job-card group flex h-full flex-col justify-between overflow-hidden p-5 sm:p-6 card-interactive">
      <span className="sb-card-glow" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-teal-900/10 bg-white shadow-[0_8px_18px_-10px_rgb(0_80_84/0.45)] font-black text-teal-700">
              {internship.companyLogo ? (
                <img className="h-full w-full object-cover" src={internship.companyLogo} alt="" />
              ) : (
                internship.companyName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal-800 border border-teal-200">
                <Target className="h-2.5 w-2.5 text-teal-600" /> Hạng #{recommendation.rank}
              </span>
              <h3 className="mt-1 truncate text-base font-extrabold text-slate-900 group-hover:text-[#006d72] transition-colors">{internship.title}</h3>
              <p className="truncate text-xs font-semibold text-slate-500">{internship.companyName}</p>
            </div>
          </div>
          <div
            className="sb-match-ring grid h-12 w-12 shrink-0 place-items-center rounded-full"
            style={{ '--p': recommendation.overallScore } as React.CSSProperties}
            title={`Độ phù hợp tổng thể: ${recommendation.overallScore}%`}
          >
            <div className="flex h-10 w-10 flex-col items-center justify-center rounded-full bg-white">
              <span className="text-xs font-black leading-none text-[#006d72]">{recommendation.overallScore}%</span>
              <span className="mt-0.5 text-[7px] font-bold uppercase tracking-wider text-slate-400">Match</span>
            </div>
          </div>
        </div>

        <div className="mt-3.5 flex flex-wrap gap-1.5 text-xs text-slate-600">
          {internship.semester?.name && (
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-bold text-teal-800 border border-teal-200">
              <CalendarDays className="h-3 w-3 text-teal-600" /> {internship.semester.name}
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-0.5 text-[11px] border border-slate-200 text-slate-600">
            <MapPin className="h-3 w-3 text-slate-400" /> {internship.location}
          </span>
          {recommendation.explanationStatus === 'AI' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2.5 py-0.5 text-[11px] font-bold text-cyan-800 border border-cyan-200">
              <CheckCircle2 className="h-3 w-3 text-cyan-600" /> Đã đối sánh
            </span>
          )}
        </div>

        {(matchedSignals.length > 0 || missingSkills.length > 0) && (
          <div className="mt-3.5 space-y-1.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs">
            {matchedSignals.length > 0 && (
              <p className="text-slate-600 leading-relaxed"><span className="font-bold text-teal-800">✓ Điểm phù hợp: </span>{matchedSignals.join(' · ')}</p>
            )}
            {missingSkills.length > 0 && (
              <p className="text-amber-800 leading-relaxed"><span className="font-bold">⚡ Cần bổ sung: </span>{missingSkills.map((skill) => skill.name).join(' · ')}</p>
            )}
          </div>
        )}

        {recommendation.explanationStatus === 'AI' && recommendation.aiExplanation && (
          <RecommendationExplanation explanation={recommendation.aiExplanation} />
        )}
      </div>

      <div className="relative mt-4 flex items-center justify-between gap-3 border-t border-dashed border-teal-900/10 pt-3.5">
        <button
          type="button"
          onClick={() => onOpenDetail(internship)}
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-teal-700 transition-colors"
        >
          Xem chi tiết <ChevronRight className="sb-arrow h-3.5 w-3.5" />
        </button>
        {isApplied ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5" /> Đã ứng tuyển
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onApply(internship)}
            className="inline-flex items-center gap-1 rounded-full bg-gradient-to-br from-[#00a3a6] to-[#006d72] px-4 py-2 text-xs font-bold text-white shadow-[0_6px_16px_-6px_rgb(0_139_143/0.75)] hover:brightness-105 active:scale-95 transition-all"
          >
            <Send className="h-3.5 w-3.5" /> Ứng tuyển
          </button>
        )}
      </div>
    </article>
  );
}
