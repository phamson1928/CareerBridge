import React from 'react';
import { StudentProfile, WeeklyReport, Evaluation, TeacherProfile } from '../../types';
import { Users, CheckSquare, GraduationCap, Award, Building2, CheckCircle2 } from 'lucide-react';

interface TeacherDashboardProps {
  teacherProfile: TeacherProfile;
  assignedStudents: StudentProfile[];
  reports: WeeklyReport[];
  evaluations: Evaluation[];
  onNavigateTab: (tab: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  teacherProfile,
  assignedStudents,
  reports,
  evaluations,
  onNavigateTab,
}) => {
  const pendingReportsCount = reports.filter((r) => r.status === 'SUBMITTED').length;

  return (
    <div className="space-y-6">
      {/* Hero Welcome */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="bg-purple-500/20 text-purple-300 text-xs font-semibold px-3 py-1 rounded-full border border-purple-400/30 inline-block mb-2">
            Phân hệ Giám sát Giảng viên
          </span>
          <h1 className="text-2xl font-black">{teacherProfile.fullname}</h1>
          <p className="text-slate-300 text-xs mt-1">{teacherProfile.department} • {teacherProfile.title}</p>
        </div>

        <div className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl border border-white/20 backdrop-blur-md text-xs">
          <div>
            <span className="text-purple-200 block">Sinh viên hướng dẫn:</span>
            <strong className="text-lg font-bold text-white">{assignedStudents.length} Sinh viên</strong>
          </div>
        </div>
      </div>

      {/* Assigned Student Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-600" /> Danh Sách Sinh Viên Đang Thực Tập
          </h3>
          <button
            onClick={() => onNavigateTab('review-reports')}
            className="text-xs text-purple-600 font-bold hover:underline"
          >
            Duyệt {pendingReportsCount} báo cáo tuần →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignedStudents.map((std) => (
            <div key={std.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{std.fullname}</h4>
                  <p className="text-slate-500">MSSV: {std.studentCode} • {std.major}</p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg border border-emerald-200 text-[11px]">
                  GPA {std.gpa}
                </span>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                <span className="text-slate-600 flex items-center gap-1 font-medium">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" /> FPT Software
                </span>
                <span className="text-emerald-600 font-bold">Đã nhận thực tập ✓</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
