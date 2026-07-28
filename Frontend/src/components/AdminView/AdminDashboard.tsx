import React from 'react';
import { DashboardStats } from '../../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { LayoutDashboard, Users, Building2, Briefcase, FileText, CheckCircle2, TrendingUp, ShieldAlert, Sparkles } from 'lucide-react';

interface AdminDashboardProps {
  stats: DashboardStats;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ stats }) => {
  // Mock monthly placement trends data for Recharts
  const monthlyData = [
    { month: 'Tháng 3', applications: 120, placed: 85 },
    { month: 'Tháng 4', applications: 210, placed: 150 },
    { month: 'Tháng 5', applications: 340, placed: 260 },
    { month: 'Tháng 6', applications: 520, placed: 410 },
    { month: 'Tháng 7', applications: 680, placed: 512 },
  ];

  // Top Skills demanded by companies
  const skillDemandData = [
    { name: 'NestJS / Node.js', count: 85 },
    { name: 'React / Next.js', count: 98 },
    { name: 'PostgreSQL / SQL', count: 72 },
    { name: 'Python / AI', count: 64 },
    { name: 'Docker / DevOps', count: 45 },
  ];

  // Status Distribution
  const pieData = [
    { name: 'Đã có nơi thực tập', value: stats.placementSuccessRate, color: '#10B981' },
    { name: 'Đang phỏng vấn/xét duyệt', value: 18.2, color: '#3B82F6' },
    { name: 'Đang tìm vị trí', value: 6.4, color: '#F59E0B' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="bg-rose-500/20 text-rose-300 text-xs font-semibold px-3 py-1 rounded-full border border-rose-400/30 inline-block mb-2">
            Quản Trị Viên Hệ Thống (System Admin)
          </span>
          <h1 className="text-2xl font-black">Báo Cáo Thống Kê Thực Tập Toàn Trường</h1>
          <p className="text-slate-300 text-xs mt-1">
            Tổng quan dữ liệu thời gian thực theo đúng Báo cáo đề tài thực tập tốt nghiệp.
          </p>
        </div>

        <div className="bg-white/10 p-3.5 rounded-2xl border border-white/20 backdrop-blur-md text-xs flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-amber-300" />
          <div>
            <span className="text-slate-300 block">Tỷ lệ sinh viên có nơi thực tập:</span>
            <strong className="text-2xl font-black text-amber-300">{stats.placementSuccessRate}%</strong>
          </div>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng Sinh Viên</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.totalStudents}</h3>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> +12% so với kỳ trước
            </span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Doanh Nghiệp Đã Tích Hợp</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.totalCompanies}</h3>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3" /> 100% Đã xác thực
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bài Đăng Tuyển Thực Tập</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.totalInternships}</h3>
            <span className="text-[10px] text-blue-600 font-bold flex items-center gap-1 mt-1">
              Đang hoạt động
            </span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lượt Ứng Tuyển</span>
            <h3 className="text-2xl font-black text-rose-600 mt-1">{stats.totalApplications}</h3>
            <span className="text-[10px] text-rose-600 font-bold flex items-center gap-1 mt-1">
              Hệ thống xử lý mượt mà
            </span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
            <FileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Biểu Đồ Tăng Trưởng Lượt Ứng Tuyển & Nhận Thực Tập</h3>
            <span className="text-[11px] text-slate-400 font-medium">Đơn vị: Lượt sinh viên</span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPlaced" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="applications" stroke="#3B82F6" fillOpacity={1} fill="url(#colorApps)" name="Tổng lượt nộp" />
                <Area type="monotone" dataKey="placed" stroke="#10B981" fillOpacity={1} fill="url(#colorPlaced)" name="Đã nhận thực tập" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Skill Demand Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Top Kỹ Năng Doanh Nghiệp Cần Nguồn Nhân Lực</h3>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={skillDemandData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={100} />
                <Tooltip contentStyle={{ fontSize: '12px' }} />
                <Bar dataKey="count" fill="#6366F1" radius={[0, 8, 8, 0]} name="Bài đăng tuyển" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
