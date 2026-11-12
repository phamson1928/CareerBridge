import { Lightbulb, ListChecks, Sparkles, Target } from 'lucide-react';
import type { RecommendationExplanation as RecommendationExplanationData } from '../../recommendations/types';

export function RecommendationExplanation({
  explanation,
}: {
  explanation: RecommendationExplanationData;
}) {
  return (
    <section className="mt-4 rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50/80 via-white to-cyan-50/60 p-4 text-xs text-slate-700 shadow-2xs">
      <p className="flex items-center gap-1.5 font-bold text-teal-900">
        <Sparkles className="h-3.5 w-3.5 text-teal-600" /> Phân tích chi tiết AI
      </p>
      <p className="mt-2 leading-relaxed text-slate-700">{explanation.reason}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <ExplanationList icon={Sparkles} label="Điểm mạnh" values={explanation.strengths} />
        <ExplanationList icon={Target} label="Cần bồi dưỡng" values={explanation.skillGaps} />
        <ExplanationList icon={ListChecks} label="Bước tiếp theo" values={explanation.nextSteps} />
      </div>
    </section>
  );
}

function ExplanationList({
  icon: Icon,
  label,
  values,
}: {
  icon: typeof Lightbulb;
  label: string;
  values: string[];
}) {
  if (values.length === 0) return null;
  return (
    <div>
      <p className="flex items-center gap-1 font-bold text-slate-800">
        <Icon className="h-3.5 w-3.5 text-teal-700" /> {label}
      </p>
      <ul className="mt-1.5 space-y-1 text-slate-600">
        {values.map((value) => (
          <li key={value} className="leading-relaxed">• {value}</li>
        ))}
      </ul>
    </div>
  );
}
