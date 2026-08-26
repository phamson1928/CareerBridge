import { useEffect, useState } from 'react';
import { ArrowUpRight, Briefcase, CheckCircle, Clock, LoaderCircle, Plus, Users } from 'lucide-react';
import { getApiErrorMessage } from '../../auth/api';
import { companiesApi, CompanyProfileRecord } from '../../companies/api';
import { internshipsApi, InternshipRecord } from '../../internships/api';

interface CompanyDashboardProps {
  onNavigateTab: (tab: string) => void;
  onOpenCreatePosting: () => void;
}

export function CompanyDashboard({ onNavigateTab, onOpenCreatePosting }: CompanyDashboardProps) {
  const [company, setCompany] = useState<CompanyProfileRecord | null>(null);
  const [internships, setInternships] = useState<InternshipRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [profile, page] = await Promise.all([
          companiesApi.getMine(),
          internshipsApi.listMine({ page: 1, limit: 100 }),
        ]);
        if (active) {
          setCompany(profile);
          setInternships(page.items);
        }
      } catch (requestError) {
        if (active) setError(getApiErrorMessage(requestError));
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, []);

  if (loading) return <LoadingState />;
  if (!company) return <div className="rounded-2xl bg-white p-8 text-center text-sm text-rose-700">{error || 'Chưa có hồ sơ doanh nghiệp. Hãy hoàn thiện hồ sơ trước.'}</div>;

  const openCount = internships.filter((item) => item.status === 'OPEN').length;
  const draftCount = internships.filter((item) => item.status === 'DRAFT').length;
  const filledSlots = internships.reduce((sum, item) => sum + item.filledSlots, 0);

  return <div className="space-y-6">
    <section className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 text-white shadow-xl md:flex-row md:items-center">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-emerald-400 bg-emerald-100 text-xl font-black text-emerald-800 shadow-md">{company.logo ? <img src={company.logo} alt="" className="h-full w-full rounded-2xl object-cover" /> : company.companyName.charAt(0)}</div>
        <div><div className="flex items-center gap-2"><h1 className="text-2xl font-black">{company.companyName}</h1>{company.status === 'APPROVED' && <span className="rounded-full border border-emerald-400/30 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">✓ Đã xác minh</span>}</div><p className="mt-1 text-xs text-slate-300">{company.tagline || 'Quản lý cơ hội thực tập của doanh nghiệp'}</p></div>
      </div>
      <button onClick={onOpenCreatePosting} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-xs font-extrabold text-slate-950 shadow-lg hover:bg-emerald-600"><Plus className="h-4 w-4" /> Đăng tuyển thực tập mới</button>
    </section>
    {error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Tin tuyển dụng" value={internships.length} icon={<Briefcase className="h-6 w-6" />} tone="emerald" /><Metric label="Đang mở" value={openCount} icon={<CheckCircle className="h-6 w-6" />} tone="blue" /><Metric label="Bài nháp" value={draftCount} icon={<Clock className="h-6 w-6" />} tone="amber" /><Metric label="Đã nhận" value={filledSlots} icon={<Users className="h-6 w-6" />} tone="emerald" /></div>
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2"><Action title="Quản lý bài đăng" body="Xem, lọc và quản lý các vị trí thuộc doanh nghiệp của bạn." onClick={() => onNavigateTab('postings')} /><Action title="Ứng viên & duyệt CV" body="Theo dõi hồ sơ ứng tuyển, cập nhật trạng thái và trao đổi với ứng viên." onClick={() => onNavigateTab('applicants')} /></div>
  </div>;
}

function Metric({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone: 'emerald' | 'blue' | 'amber' }) {
  const classes = { emerald: 'bg-emerald-50 text-emerald-600', blue: 'bg-blue-50 text-blue-600', amber: 'bg-amber-50 text-amber-600' }[tone];
  return <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"><div><span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span><h3 className="mt-1 text-2xl font-black text-slate-900">{value}</h3></div><div className={`rounded-xl p-3 ${classes}`}>{icon}</div></div>;
}

function Action({ title, body, onClick }: { title: string; body: string; onClick: () => void }) {
  return <button onClick={onClick} className="group rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-xs transition-all hover:border-emerald-300"><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600">{title}</h3><ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600" /></div><p className="text-xs leading-relaxed text-slate-500">{body}</p></button>;
}

function LoadingState() { return <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500"><LoaderCircle className="mx-auto mb-3 h-5 w-5 animate-spin" />Đang tải tổng quan doanh nghiệp...</div>; }
