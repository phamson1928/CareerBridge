import React from 'react';
import { Internship, Application, CompanyProfile, Evaluation } from '../../types';
import { Briefcase, Users, CheckCircle, Clock, Plus, Building2, TrendingUp, Award, ArrowUpRight } from 'lucide-react';

interface CompanyDashboardProps {
  companyProfile: CompanyProfile;
  internships: Internship[];
  applications: Application[];
  onNavigateTab: (tab: string) => void;
  onOpenCreatePosting: () => void;
}

export const CompanyDashboard: React.FC<CompanyDashboardProps> = ({
  companyProfile,
  internships,
  applications,
  onNavigateTab,
  onOpenCreatePosting,
}) => {
  const companyJobs = internships.filter((i) => i.companyId === companyProfile.id);
  const companyApps = applications.filter((a) => a.companyId === companyProfile.id);

  const pendingAppsCount = companyApps.filter((a) => a.status === 'PENDING' || a.status === 'REVIEWING').length;
  const hiredCount = companyApps.filter((a) => a.status === 'ACCEPTED').length;

  return (
    <div className="space-y-6">
      {/* Hero Welcome */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={companyProfile.logo}
            alt={companyProfile.companyName}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-400 shadow-md"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black">{companyProfile.companyName}</h1>
              {companyProfile.verified && (
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                  ✓ Verified Enterprise
                </span>
              )}
            </div>
            <p className="text-slate-300 text-xs mt-1">{companyProfile.tagline}</p>
          </div>
        </div>

        <button
          id="btn-post-job-hero"
          onClick={onOpenCreatePosting}
          className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold rounded-xl text-xs shadow-lg flex items-center gap-2 transition-all whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Đăng Tuyển Thực Tập Mới
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tin tuyển dụng</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{companyJobs.length}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng ứng viên</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{companyApps.length}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cần duyệt gấp</span>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{pendingAppsCount}</h3>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Thực tập sinh chính thức</span>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{hiredCount}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Quick Action Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div
          onClick={() => onNavigateTab('applicants')}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-600 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" /> Quản Lý & Phê Duyệt Hồ Sơ Ứng Viên
            </h3>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Xem danh sách sinh viên ứng tuyển, đối chiếu điểm Skill Match %, xem CV và phản hồi trực tiếp.
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('interns-evaluation')}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-600 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" /> Theo Dõi & Đánh Giá Thực Tập Sinh
            </h3>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Xem báo cáo thực tập hàng tuần của sinh viên đang làm việc tại doanh nghiệp và chấm điểm đánh giá kết thúc đợt.
          </p>
        </div>
      </div>
    </div>
  );
};
