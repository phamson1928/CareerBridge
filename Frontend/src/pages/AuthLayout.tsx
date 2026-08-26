import { BriefcaseBusiness, ShieldCheck } from 'lucide-react';
import { ReactNode } from 'react';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-900 lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden lg:flex overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-950 p-12 text-white">
        <div className="absolute -left-28 top-12 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-violet-400/20 blur-3xl" />
        <div className="relative z-10 flex max-w-xl flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 backdrop-blur">
              <BriefcaseBusiness className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xl font-black tracking-tight">InternConnect</p>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">Career Bridge Platform</p>
            </div>
          </div>
          <div className="py-16">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-indigo-100 backdrop-blur">
              <ShieldCheck className="h-4 w-4 text-emerald-300" /> Phiên đăng nhập được bảo vệ bằng JWT
            </span>
            <h1 className="mt-6 text-5xl font-black leading-tight tracking-tight">Kết nối sinh viên với cơ hội thực tập phù hợp.</h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-indigo-100/80">Một nền tảng chung để sinh viên, doanh nghiệp, giảng viên và nhà trường theo dõi toàn bộ hành trình thực tập.</p>
          </div>
          <p className="text-xs text-indigo-200/70">Nền tảng kết nối sinh viên, doanh nghiệp và giảng viên</p>
        </div>
      </section>
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
