import React, { useState } from 'react';
import { Internship, StudentProfile, Application } from '../../types';
import { calculateSkillMatch } from '../../utils/matching';
import {
  Search,
  Filter,
  MapPin,
  DollarSign,
  Calendar,
  Sparkles,
  Building2,
  CheckCircle2,
  Send,
  FileText,
  X,
  Upload,
} from 'lucide-react';

interface InternshipListProps {
  internships: Internship[];
  studentProfile: StudentProfile;
  applications: Application[];
  onApply: (internshipId: string, coverLetter: string, cvUrl: string) => void;
}

export const InternshipList: React.FC<InternshipListProps> = ({
  internships,
  studentProfile,
  applications,
  onApply,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkillFilter, setSelectedSkillFilter] = useState<string>('ALL');
  const [selectedLocation, setSelectedLocation] = useState<string>('ALL');
  const [activeModalInternship, setActiveModalInternship] = useState<Internship | null>(null);
  const [applyModalInternship, setApplyModalInternship] = useState<Internship | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [selectedCvName, setSelectedCvName] = useState(studentProfile.cvName || 'Pham_Hoang_Son_CV.pdf');

  // Available skills filter list
  const allSkills = Array.from(
    new Set(internships.flatMap((item) => item.requiredSkills))
  );

  const filteredInternships = internships.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSkill =
      selectedSkillFilter === 'ALL' || item.requiredSkills.includes(selectedSkillFilter);

    const matchesLocation =
      selectedLocation === 'ALL' || item.location.includes(selectedLocation);

    return matchesSearch && matchesSkill && matchesLocation;
  });

  const getApplicationStatus = (internshipId: string) => {
    const app = applications.find((a) => a.internshipId === internshipId);
    return app ? app.status : null;
  };

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyModalInternship) return;
    onApply(
      applyModalInternship.id,
      coverLetter,
      studentProfile.cvUrl || 'https://pdfobject.com/pdf/sample.pdf'
    );
    setApplyModalInternship(null);
    setCoverLetter('');
  };

  return (
    <div className="space-y-6">
      {/* Hero Header & Filter Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <span className="bg-blue-500/20 text-blue-300 text-xs font-semibold px-3 py-1 rounded-full border border-blue-400/30 inline-flex items-center gap-1 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Hệ thống đề xuất việc làm thông minh
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Tìm Kiếm Vị Trí Thực Tập Đóng Góp Cho Sự Nghiệp
          </h1>
          <p className="text-slate-300 text-sm mt-2 leading-relaxed">
            Hệ thống tự động phân tích hồ sơ sinh viên <strong className="text-white">{studentProfile.fullname}</strong> ({studentProfile.major}) để tính chỉ số <strong>Matching %</strong> với yêu cầu thực tập của doanh nghiệp.
          </p>

          {/* Search bar inside hero */}
          <div className="mt-6 flex flex-col sm:flex-row gap-2 bg-white/10 p-2 rounded-xl backdrop-blur-md border border-white/20">
            <div className="flex-1 flex items-center gap-2 bg-white rounded-lg px-3 py-2 text-slate-800">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm vị trí (ví dụ: Backend Developer, React, Data...)"
                className="w-full text-xs sm:text-sm focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedSkillFilter}
                onChange={(e) => setSelectedSkillFilter(e.target.value)}
                className="bg-slate-800 text-white text-xs rounded-lg px-3 py-2 border border-slate-700 focus:outline-none"
              >
                <option value="ALL">Tất cả Kỹ năng</option>
                {allSkills.map((sk) => (
                  <option key={sk} value={sk}>
                    {sk}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Internship Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
        {filteredInternships.map((job) => {
          const matchScore = calculateSkillMatch(studentProfile.skills, job.requiredSkills);
          const appStatus = getApplicationStatus(job.id);

          return (
            <div
              key={job.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden"
            >
              {/* Top Row: Logo, Title, Match Badge */}
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={job.companyLogo}
                      alt={job.companyName}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs"
                    />
                    <div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {job.title}
                      </h3>
                      <p className="text-xs font-semibold text-slate-600 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" /> {job.companyName}
                      </p>
                    </div>
                  </div>

                  {/* Skill Match Badge */}
                  <div className="flex flex-col items-end">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border ${
                        matchScore >= 80
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : matchScore >= 60
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      {matchScore}% Match
                    </span>
                  </div>
                </div>

                {/* Job Metadata tags */}
                <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-slate-600">
                  <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {job.location}
                  </span>
                  <span className="flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-md border border-emerald-200 font-medium">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> {job.stipend}
                  </span>
                  <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Hạn: {job.deadline}
                  </span>
                </div>

                {/* Short Description */}
                <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                  {job.description}
                </p>

                {/* Required Skills tags */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {job.requiredSkills.map((sk) => {
                    const isMatched = studentProfile.skills.includes(sk);
                    return (
                      <span
                        key={sk}
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${
                          isMatched
                            ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {isMatched ? '✓ ' : ''}{sk}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setActiveModalInternship(job)}
                  className="text-xs font-semibold text-slate-700 hover:text-blue-600 transition-colors"
                >
                  Xem chi tiết công việc →
                </button>

                {appStatus ? (
                  <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 flex items-center gap-1 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Đã Ứng Tuyển
                  </span>
                ) : (
                  <button
                    id={`btn-apply-${job.id}`}
                    onClick={() => setApplyModalInternship(job)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" /> Ứng Tuyển Ngay
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Modal */}
      {activeModalInternship && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative animate-in fade-in zoom-in duration-150">
            <button
              onClick={() => setActiveModalInternship(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
              <img
                src={activeModalInternship.companyLogo}
                alt={activeModalInternship.companyName}
                className="w-14 h-14 rounded-2xl object-cover border border-slate-200"
              />
              <div>
                <h2 className="text-lg font-bold text-slate-900">{activeModalInternship.title}</h2>
                <p className="text-xs font-semibold text-blue-600">{activeModalInternship.companyName}</p>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span>📍 {activeModalInternship.location}</span>
                  <span>💵 {activeModalInternship.stipend}</span>
                </div>
              </div>
            </div>

            <div className="py-4 space-y-4 text-xs text-slate-700">
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">Mô tả công việc:</h4>
                <p className="leading-relaxed text-slate-600">{activeModalInternship.description}</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">Yêu cầu ứng viên:</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  {activeModalInternship.requirements.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">Kỹ năng bắt buộc:</h4>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {activeModalInternship.requiredSkills.map((sk) => (
                    <span key={sk} className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md font-semibold text-[11px]">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setActiveModalInternship(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply Modal */}
      {applyModalInternship && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setApplyModalInternship(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Gửi Đơn Ứng Tuyển Realtime</h3>
                <p className="text-xs text-slate-500">{applyModalInternship.title} - {applyModalInternship.companyName}</p>
              </div>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Hồ sơ CV đính kèm:</label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-slate-800">{selectedCvName}</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Đã chọn
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Thư giới thiệu / Cover Letter:</label>
                <textarea
                  rows={4}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Nêu lý do bạn phù hợp với vị trí này, định hướng nghề nghiệp và kinh nghiệm liên quan..."
                  className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setApplyModalInternship(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Xác nhận nộp đơn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
