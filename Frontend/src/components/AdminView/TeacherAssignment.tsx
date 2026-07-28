import React, { useState } from 'react';
import { StudentProfile, TeacherProfile } from '../../types';
import {
  GraduationCap,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Zap,
  Filter,
  Sparkles,
  BookOpen,
  Building,
  RefreshCw,
} from 'lucide-react';

interface TeacherAssignmentProps {
  students: StudentProfile[];
  teachers: TeacherProfile[];
  onAssignTeacher: (studentId: string, teacherId: string | null) => void;
  onBatchAutoAssign?: () => void;
}

export const TeacherAssignment: React.FC<TeacherAssignmentProps> = ({
  students,
  teachers,
  onAssignTeacher,
  onBatchAutoAssign,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ASSIGNED' | 'UNASSIGNED'>('ALL');
  const [teacherFilter, setTeacherFilter] = useState<string>('ALL');
  const [majorFilter, setMajorFilter] = useState<string>('ALL');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Calculate statistics
  const totalStudents = students.length;
  const assignedStudents = students.filter((s) => Boolean(s.assignedTeacherId));
  const unassignedStudents = students.filter((s) => !s.assignedTeacherId);
  const totalTeachers = teachers.length;

  // List of unique majors
  const majors = Array.from(new Set(students.map((s) => s.major))).filter(Boolean);

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.major.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'ASSIGNED'
        ? Boolean(s.assignedTeacherId)
        : !s.assignedTeacherId;

    const matchesTeacher =
      teacherFilter === 'ALL'
        ? true
        : s.assignedTeacherId === teacherFilter;

    const matchesMajor = majorFilter === 'ALL' ? true : s.major === majorFilter;

    return matchesSearch && matchesStatus && matchesTeacher && matchesMajor;
  });

  const handleTeacherChange = (studentId: string, studentName: string, newTeacherId: string) => {
    if (newTeacherId === 'NONE') {
      onAssignTeacher(studentId, null);
      showToast(`Đã bỏ phân công giảng viên cho sinh viên ${studentName}`);
    } else {
      const teacherObj = teachers.find((t) => t.id === newTeacherId);
      onAssignTeacher(studentId, newTeacherId);
      showToast(`Đã phân công ${teacherObj?.fullname || 'Giảng viên'} hướng dẫn sinh viên ${studentName}`);
    }
  };

  const handleAutoAssignAll = () => {
    if (teachers.length === 0) {
      alert('Chưa có giảng viên nào trong hệ thống để phân công!');
      return;
    }
    if (unassignedStudents.length === 0) {
      alert('Tất cả sinh viên đã có Giảng viên hướng dẫn!');
      return;
    }

    if (onBatchAutoAssign) {
      onBatchAutoAssign();
      showToast(`Tự động phân công hoàn tất cho ${unassignedStudents.length} sinh viên!`);
    } else {
      // Fallback local logic
      unassignedStudents.forEach((student, index) => {
        const assignedTeacher = teachers[index % teachers.length];
        onAssignTeacher(student.id, assignedTeacher.id);
      });
      showToast(`Đã tự động phân công ${unassignedStudents.length} sinh viên cho các Giảng viên!`);
    }
  };

  const showToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Success Toast */}
      {successMessage && (
        <div className="p-4 bg-emerald-600 text-white rounded-xl shadow-lg font-bold text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-white hover:opacity-80">
            ×
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Kết Nối & Phân Công Giảng Viên Quản Lý</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gán Giảng viên hướng dẫn cho từng sinh viên thực tập để theo dõi, nhận xét báo cáo tuần và chấm điểm.
          </p>
        </div>

        <button
          onClick={handleAutoAssignAll}
          className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all"
          title="Tự động chia đều sinh viên chưa phân công cho giảng viên"
        >
          <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
          <span>Tự Động Phân Công Nhanh</span>
        </button>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Tổng Sinh Viên</span>
            <span className="text-2xl font-extrabold text-slate-900 mt-0.5 block">{totalStudents}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Đã Phân Công</span>
            <span className="text-2xl font-extrabold text-emerald-600 mt-0.5 block">{assignedStudents.length}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Chưa Phân Công</span>
            <span className="text-2xl font-extrabold text-amber-600 mt-0.5 block">{unassignedStudents.length}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">Giảng Viên Quản Lý</span>
            <span className="text-2xl font-extrabold text-indigo-600 mt-0.5 block">{totalTeachers}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Lecturers Workload Summary Cards */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-indigo-600" /> Thống kê Khối Lượng Quản Lý Của Giảng Viên:
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {teachers.map((t) => {
            const count = students.filter((s) => s.assignedTeacherId === t.id).length;
            return (
              <div
                key={t.id}
                className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
              >
                <div>
                  <h4 className="font-bold text-slate-900">{t.fullname}</h4>
                  <p className="text-[11px] text-slate-500">{t.department}</p>
                </div>
                <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 font-extrabold rounded-lg border border-indigo-200 text-xs">
                  {count} Sinh viên
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search & Filters Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search Input */}
        <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2 text-slate-700 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm tên sinh viên, MSSV, ngành học..."
            className="bg-transparent focus:outline-none w-full text-xs"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="p-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ASSIGNED">Đã phân công GV</option>
            <option value="UNASSIGNED">Chưa phân công GV</option>
          </select>
        </div>

        {/* Teacher Filter */}
        <select
          value={teacherFilter}
          onChange={(e) => setTeacherFilter(e.target.value)}
          className="p-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold text-slate-700 focus:outline-none"
        >
          <option value="ALL">Tất cả Giảng viên</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.fullname}
            </option>
          ))}
        </select>

        {/* Major Filter */}
        {majors.length > 0 && (
          <select
            value={majorFilter}
            onChange={(e) => setMajorFilter(e.target.value)}
            className="p-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">Tất cả ngành học</option>
            {majors.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Sinh viên</th>
                <th className="p-4">MSSV / Ngành</th>
                <th className="p-4">GPA</th>
                <th className="p-4">Doanh nghiệp Thực tập</th>
                <th className="p-4">Giảng viên Hướng dẫn Quản lý</th>
                <th className="p-4 text-right">Thao tác Phân công</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Không tìm thấy sinh viên nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((std) => {
                  const currentTeacherObj = teachers.find((t) => t.id === std.assignedTeacherId);

                  return (
                    <tr key={std.id} className="hover:bg-slate-50 transition-colors">
                      {/* Student Name */}
                      <td className="p-4 font-bold text-slate-900 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                          {std.fullname.charAt(0)}
                        </div>
                        <div>
                          <span>{std.fullname}</span>
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {std.university}
                          </span>
                        </div>
                      </td>

                      {/* MSSV & Major */}
                      <td className="p-4">
                        <span className="font-mono text-slate-800 font-bold block">{std.studentCode}</span>
                        <span className="text-[11px] text-slate-500">{std.major}</span>
                      </td>

                      {/* GPA */}
                      <td className="p-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 font-extrabold rounded border text-[11px]">
                          {std.gpa}
                        </span>
                      </td>

                      {/* Internship Status */}
                      <td className="p-4">
                        {std.activeInternshipId ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg border border-emerald-200 text-[11px]">
                            <Building className="w-3 h-3" /> FPT Software
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Chưa nhận việc</span>
                        )}
                      </td>

                      {/* Assigned Teacher Badge */}
                      <td className="p-4">
                        {currentTeacherObj ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-800 font-bold rounded-xl border border-indigo-200 text-xs">
                            <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                            <div>
                              <span>{currentTeacherObj.fullname}</span>
                              <span className="block text-[9px] font-medium text-indigo-500">
                                {currentTeacherObj.department}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 font-semibold rounded-lg border border-amber-200 text-xs">
                            <AlertCircle className="w-3.5 h-3.5" /> Chưa phân công
                          </span>
                        )}
                      </td>

                      {/* Select Dropdown Action */}
                      <td className="p-4 text-right">
                        <select
                          value={std.assignedTeacherId || 'NONE'}
                          onChange={(e) => handleTeacherChange(std.id, std.fullname, e.target.value)}
                          className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer focus:outline-none ${
                            std.assignedTeacherId
                              ? 'bg-white border-indigo-300 text-indigo-900 hover:border-indigo-500'
                              : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                          }`}
                        >
                          <option value="NONE">-- Chọn Giảng viên --</option>
                          {teachers.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.fullname} ({t.department})
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
