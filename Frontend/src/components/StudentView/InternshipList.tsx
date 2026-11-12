import { ModalPortal } from "../ModalPortal";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Internship, StudentProfile, Application } from '../../types';
import { getApiErrorMessage } from '../../auth/api';
import { formatDate } from '../../utils/format';
import { SkillPicker, type SkillOption } from '../Skills/SkillPicker';
import { JobRecommendations } from './JobRecommendations';
import {
  Search,
  MapPin,
  DollarSign,
  Calendar,
  CalendarDays,
  Clock,
  GraduationCap,
  Building2,
  Check,
  CheckCircle2,
  Send,
  FileText,
  X,
  Loader2,
  Flag,
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Target,
  Users,
} from 'lucide-react';
import { ReportJobModal } from '../Internships/ReportJobModal';
import { SemesterCampaignBanner } from '../Semesters/SemesterCampaignBanner';
import { facultiesApi } from '../../organization/api';
import type { FacultyOption } from '../../organization/types';

type InternshipPage = {
  items: Internship[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

interface InternshipListProps {
  internships: Internship[];
  studentProfile: StudentProfile;
  applications: Application[];
  loadInternships: (params: {
    page: number;
    limit: number;
    search?: string;
    skillIds?: string[];
    facultyId?: string;
    majorId?: string;
    majorIds?: string[];
  }) => Promise<InternshipPage>;
  onApply: (internshipId: string, coverLetter: string, internshipTitle: string) => Promise<void>;
  onOpenProfile: () => void;
  onOpenApplications?: () => void;
}

const CompanyLogo: React.FC<{ src: string; name: string; className: string }> = ({ src, name, className }) =>
  src ? (
    <img src={src} alt={name} className={className} />
  ) : (
    <div className={`${className} flex items-center justify-center bg-indigo-50 text-sm font-black text-indigo-600`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );

const renderDeadlineBadge = (deadlineStr?: string | null) => {
  if (!deadlineStr || deadlineStr === 'Không thời hạn') return null;
  const d = new Date(deadlineStr);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const base = 'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold';
  if (diffDays < 0) {
    return (
      <span className={`${base} border-rose-200 bg-rose-50 text-rose-700`}>
        <Clock className="w-3 h-3 text-rose-500" /> Đã hết hạn nộp
      </span>
    );
  }
  if (diffDays === 0) {
    return (
      <span className={`${base} border-amber-200 bg-amber-50 text-amber-700`}>
        <span className="sb-live-dot h-1.5 w-1.5 rounded-full bg-amber-500 text-amber-500" /> Hạn chốt: Hôm nay!
      </span>
    );
  }
  if (diffDays <= 5) {
    return (
      <span className={`${base} border-amber-200 bg-amber-50 text-amber-700`}>
        <span className="sb-live-dot h-1.5 w-1.5 rounded-full bg-amber-500 text-amber-500" /> Còn {diffDays} ngày
      </span>
    );
  }
  return (
    <span className={`${base} border-emerald-200 bg-emerald-50 text-emerald-700`}>
      <Clock className="w-3 h-3 text-emerald-500" /> Còn {diffDays} ngày
    </span>
  );
};

export const InternshipList: React.FC<InternshipListProps> = ({
  internships,
  studentProfile,
  applications,
  loadInternships,
  onApply,
  onOpenProfile,
  onOpenApplications,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkillFilter, setSelectedSkillFilter] = useState<SkillOption[]>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [selectedMajorId, setSelectedMajorId] = useState('');
  const [faculties, setFaculties] = useState<FacultyOption[]>([]);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [internshipPage, setInternshipPage] = useState<InternshipPage>({
    items: internships,
    pagination: { page: 1, limit: 12, total: internships.length, totalPages: 1 },
  });
  const [isLoadingInternships, setIsLoadingInternships] = useState(false);
  const [internshipsError, setInternshipsError] = useState<string | null>(null);
  const [activeModalInternship, setActiveModalInternship] = useState<Internship | null>(null);
  const [applyModalInternship, setApplyModalInternship] = useState<Internship | null>(null);
  const [reportingInternship, setReportingInternship] = useState<Internship | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [selectedCvName, setSelectedCvName] = useState(studentProfile.cvName || 'Chưa tải CV lên hồ sơ');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedCvName(studentProfile.cvName || 'Chưa tải CV lên hồ sơ');
  }, [studentProfile.cvName]);

  useEffect(() => {
    facultiesApi
      .listOptions({ includeInactive: false })
      .then((data) => setFaculties(data.items))
      .catch(() => setFaculties([]));
  }, []);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      setIsLoadingInternships(true);
      setInternshipsError(null);
      try {
        const result = await loadInternships({
          page,
          limit: 12,
          search: searchTerm.trim() || undefined,
          skillIds: selectedSkillFilter.map((skill) => skill.id),
          facultyId: selectedFacultyId || undefined,
          majorId: selectedMajorId || undefined,
        });
        if (active) setInternshipPage(result);
      } catch (error) {
        if (active) setInternshipsError(getApiErrorMessage(error));
      } finally {
        if (active) setIsLoadingInternships(false);
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [loadInternships, page, searchTerm, selectedSkillFilter, selectedFacultyId, selectedMajorId, refreshKey]);

  const [isFacultyDropdownOpen, setIsFacultyDropdownOpen] = useState(false);
  const [isMajorDropdownOpen, setIsMajorDropdownOpen] = useState(false);
  const facultyDropdownRef = useRef<HTMLDivElement>(null);
  const majorDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (facultyDropdownRef.current && !facultyDropdownRef.current.contains(target)) {
        setIsFacultyDropdownOpen(false);
      }
      if (majorDropdownRef.current && !majorDropdownRef.current.contains(target)) {
        setIsMajorDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFacultyDropdownOpen(false);
        setIsMajorDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const currentFaculty = faculties.find((f) => f.id === selectedFacultyId);
  const allMajors = useMemo(() => faculties.flatMap((f) => f.majors), [faculties]);
  const currentMajor = allMajors.find((m) => m.id === selectedMajorId);

  const handleRefresh = () => {
    setSelectedFacultyId('');
    setSelectedMajorId('');
    setSearchTerm('');
    setSelectedSkillFilter([]);
    setPage(1);
    setIsFacultyDropdownOpen(false);
    setIsMajorDropdownOpen(false);
    setRefreshKey((k) => k + 1);
  };

  const filteredInternships = internshipPage.items;
  const getApplicationStatus = (internshipId: string) => {
    const app = applications.find((a) => a.internshipId === internshipId);
    return app ? app.status : null;
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyModalInternship) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onApply(applyModalInternship.id, coverLetter, applyModalInternship.title);
      setApplyModalInternship(null);
      setCoverLetter('');
    } catch (error) {
      setSubmitError(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToJobs = () =>
    document.getElementById('tin-tuyen-dung')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const firstName = studentProfile.fullname?.trim().split(/\s+/).pop() || 'bạn';
  const activeApplicationsCount = applications.filter((a) => a.status !== 'WITHDRAWN').length;
  const heroStats = [
    {
      id: 'jobs',
      icon: <Briefcase className="h-4 w-4" />,
      value: internshipPage.pagination.total,
      label: 'Vị trí thực tập',
      hint: 'Khám phá ngay',
      onClick: scrollToJobs,
    },
    {
      id: 'applications',
      icon: <Send className="h-4 w-4" />,
      value: activeApplicationsCount,
      label: 'Đơn ứng tuyển',
      hint: 'Theo dõi tiến độ',
      onClick: onOpenApplications || onOpenProfile,
    },
    {
      id: 'skills',
      icon: <Target className="h-4 w-4" />,
      value: studentProfile.skills.length,
      label: 'Kỹ năng trong hồ sơ',
      hint: 'Cập nhật CV',
      onClick: onOpenProfile,
    },
  ];

  return (
    <div className="w-full space-y-8">
      {/* Hero: ảnh nền tương lai độ nét cao 2.5K + lớp phủ aurora, tiêu đề, CTA và thống kê nhanh */}
      <section className="student-hero-hub relative left-1/2 m-0 h-[100svh] min-h-[620px] max-h-[960px] w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden bg-[#06181b]">
        <picture className="absolute inset-0 h-full w-full">
          <source srcSet="/homepage-hero.webp" type="image/webp" />
          <img
            className="h-full w-full object-cover object-right sm:object-center select-none pointer-events-none"
            src="/homepage-hero.jpg"
            alt="CareerBridge Hero"
            loading="eager"
            decoding="async"
          />
        </picture>
        {/* Lớp phủ & hiệu ứng ánh sáng aurora chuyển động */}
        <div className="sb-hero-overlay absolute inset-0" />
        <div className="sb-ambient-orb absolute -left-16 top-1/4 h-[420px] w-[420px] rounded-full bg-teal-400/20 blur-[130px] pointer-events-none" />
        <div className="sb-ambient-orb-2 absolute left-[15%] bottom-1/4 h-[360px] w-[360px] rounded-full bg-emerald-400/15 blur-[120px] pointer-events-none" />

        <div className="relative z-10 mx-auto flex h-full max-w-[1240px] flex-col justify-center px-4 sm:px-6 lg:px-8 pt-20 pb-12">
          <div className="max-w-2xl text-center sm:text-left flex flex-col items-center sm:items-start mx-auto sm:mx-0">
            <span className="sb-anim-1 sb-glass-dark inline-flex items-center gap-2.5 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-teal-100 shadow-[0_4px_20px_rgba(0,163,166,0.18)]">
              <span className="sb-beacon relative flex h-2 w-2 rounded-full bg-emerald-400" />
              Cổng Thông Tin Thực Tập
            </span>
            <h1 className="sb-anim-2 sb-hero-title mt-5 text-3xl sm:text-5xl lg:text-[3.35rem] font-black leading-[1.08] tracking-tight">
              Chào {firstName},<br />
              sẵn sàng cho kỳ thực tập mới?
            </h1>
            <p className="sb-anim-3 mt-4 max-w-xl text-sm sm:text-lg leading-relaxed text-teal-50/85">
              Khám phá vị trí phù hợp với kỹ năng của bạn, nộp hồ sơ chỉ với một cú nhấp và theo dõi
              toàn bộ hành trình thực tập tại một nơi.
            </p>
            <div className="sb-anim-4 mt-6 flex flex-wrap items-center justify-center sm:justify-start gap-3.5">
              <button
                type="button"
                onClick={scrollToJobs}
                className="sb-btn-glow group inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-[#00b4b8] via-[#009da0] to-[#006d72] px-6 py-3.5 text-sm font-bold text-white transition-all hover:brightness-110 active:scale-[0.98]"
              >
                Khám phá vị trí <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                type="button"
                onClick={onOpenProfile}
                className="sb-btn-cv group inline-flex items-center gap-2.5 rounded-full px-6 py-3.5 text-sm font-bold text-white transition-all active:scale-[0.98]"
              >
                <FileText className="h-4 w-4 text-teal-300 transition-transform duration-300 group-hover:scale-115 group-hover:rotate-6 group-hover:text-teal-200" />
                <span>Hồ sơ & CV của tôi</span>
                <ArrowUpRight className="h-4 w-4 text-teal-300/80 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white" />
              </button>
            </div>
          </div>

          <div className="sb-anim-5 mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3 max-w-[780px]">
            {heroStats.map((stat) => (
              <button
                key={stat.id}
                type="button"
                onClick={stat.onClick}
                className="sb-glass-dark sb-stat-card group flex items-center justify-between gap-2.5 sm:gap-3 rounded-2xl px-3.5 sm:px-4 py-3 text-left cursor-pointer transition-all duration-300 hover:border-teal-400/50 hover:bg-[#0c2e33]/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 active:scale-[0.98]"
                title={`${stat.label} - Bấm để ${stat.hint.toLowerCase()}`}
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <span className="sb-stat-icon flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border border-teal-300/30 bg-teal-400/10 text-teal-200 transition-all duration-300 group-hover:scale-110 group-hover:bg-teal-400/25 group-hover:text-white group-hover:border-teal-300/60">
                    {stat.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="sb-stat-value text-2xl sm:text-3xl font-black leading-none tracking-tight">
                      {stat.value}
                      <span className="text-lg sm:text-xl">+</span>
                    </p>
                    <p className="mt-1 text-xs font-semibold text-teal-50/85 transition-colors group-hover:text-teal-100 whitespace-nowrap">
                      {stat.label}
                    </p>
                  </div>
                </div>
                <div className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full border border-teal-300/20 bg-teal-400/5 text-teal-300/70 transition-all duration-300 group-hover:translate-x-1 group-hover:border-teal-300/60 group-hover:bg-teal-400/20 group-hover:text-teal-100">
                  <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </div>
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={scrollToJobs}
          className="sb-scroll-cue absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full p-2 text-teal-100/80 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
          aria-label="Xem tin tuyển dụng"
        >
          <ChevronDown className="h-6 w-6" />
        </button>
      </section>

      {/* Tiến trình Đợt thực tập / Campaign Timeline Banner */}
      <SemesterCampaignBanner role="STUDENT" onExploreJobs={scrollToJobs} studentName={studentProfile.fullname} />

      {/* Thanh ngang phân tách 1 - Kéo dài ngang toàn màn hình */}
      <hr className="relative left-1/2 -translate-x-1/2 w-screen max-w-[100vw] my-6 sm:my-8 border-0 border-t border-slate-200/90 pointer-events-none" />

      {/* Gợi ý việc làm phù hợp */}
      <JobRecommendations
        applications={applications}
        onOpenProfile={onOpenProfile}
        onOpenDetail={setActiveModalInternship}
        onApply={setApplyModalInternship}
      />

      {/* Thanh ngang phân tách 2 - Kéo dài ngang toàn màn hình */}
      <hr className="relative left-1/2 -translate-x-1/2 w-screen max-w-[100vw] my-6 sm:my-8 border-0 border-t border-slate-200/90 pointer-events-none" />

      {/* Tiêu đề khu vực tin tuyển dụng - Căn giữa */}
      <div id="tin-tuyen-dung" className="scroll-mt-24 flex flex-col items-center text-center max-w-4xl mx-auto px-4 pt-10 sm:pt-12 pb-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200/90 bg-teal-50/90 px-4 py-1 text-xs font-black uppercase tracking-wider text-teal-800 shadow-2xs">
          <Briefcase className="h-3.5 w-3.5 text-teal-700" /> Tin tuyển dụng
        </span>

        <h2 className="mt-3.5 text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
          Khám phá cơ hội thực tập
        </h2>

        <p className="mt-2.5 text-sm sm:text-base font-medium text-slate-600 max-w-2xl leading-relaxed">
          Lọc theo vị trí, kỹ năng và chuyên ngành để tìm nơi phù hợp nhất với bạn.
        </p>
      </div>

      {/* Filter Hub: Thanh tìm kiếm & bộ lọc trải rộng bằng các thẻ việc làm */}
      <div className="relative z-20 w-full rounded-2xl border border-slate-200/90 bg-white/95 p-3.5 sm:p-4 shadow-sm backdrop-blur-md transition-all">
        {/* Hàng 1: Thanh tìm kiếm theo vị trí & Nút Làm mới */}
        <div className="flex flex-col sm:flex-row gap-2.5 w-full items-center">
          <div className="relative flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2 text-slate-800 transition-all hover:border-slate-300 focus-within:border-teal-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-teal-500/10 min-h-11 w-full sm:flex-1">
            <Search className="h-4.5 w-4.5 shrink-0 text-teal-600" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo vị trí (Backend, Frontend, Tester, Data Analyst...)"
              style={{ border: 'none', boxShadow: 'none', outline: 'none' }}
              className="sb-bare-input w-full bg-transparent text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setPage(1);
                }}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 transition"
                aria-label="Xóa từ khóa tìm kiếm"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Nút Làm mới - Tông màu đỏ nhẹ (soft red / rose) */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoadingInternships}
            title="Đặt lại bộ lọc và làm mới danh sách tin tuyển dụng"
            className="inline-flex w-full sm:w-auto shrink-0 h-11 items-center justify-center gap-1.5 rounded-xl border border-rose-200/90 bg-rose-50/70 px-4 text-xs font-bold text-rose-700 shadow-2xs transition-all hover:bg-rose-100 hover:border-rose-300 hover:text-rose-800 active:scale-95 disabled:opacity-50 whitespace-nowrap"
          >
            <RefreshCw className={`h-3.5 w-3.5 shrink-0 text-rose-600 ${isLoadingInternships ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>

        {/* Hàng 2: Các bộ lọc (Kỹ năng từ bên trái, Khoa, Ngành) */}
        <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-2.5 w-full items-start">
          {/* Lọc theo kỹ năng */}
          <div className="w-full">
            <SkillPicker
              variant="teal"
              multiple
              selected={selectedSkillFilter}
              onChange={(skills) => {
                setSelectedSkillFilter(skills);
                setPage(1);
              }}
              placeholder="Lọc theo kỹ năng..."
              className="w-full"
            />
          </div>

          {/* Custom Dropdown: Khoa */}
          <div ref={facultyDropdownRef} className="relative w-full">
            <button
              type="button"
              onClick={() => {
                setIsFacultyDropdownOpen((prev) => !prev);
                setIsMajorDropdownOpen(false);
              }}
              className={`h-11 w-full rounded-xl border pl-3.5 pr-3 text-xs font-semibold transition-all outline-none shadow-2xs flex items-center justify-between text-left cursor-pointer ${selectedFacultyId
                  ? 'border-teal-500 bg-teal-50/90 text-teal-800 font-bold'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50/30'
                }`}
            >
              <span className="truncate pr-2">{currentFaculty ? currentFaculty.name : 'Tất cả các Khoa'}</span>
              <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isFacultyDropdownOpen ? 'rotate-180 text-teal-700' : selectedFacultyId ? 'text-teal-700' : 'text-slate-400'
                }`} />
            </button>

            {isFacultyDropdownOpen && (
              <div
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                className="absolute left-0 top-full z-50 mt-1.5 w-full min-w-[240px] max-h-64 overflow-y-auto no-scrollbar rounded-2xl border border-slate-200/90 bg-white/95 p-1.5 shadow-xl backdrop-blur-md"
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFacultyId('');
                    setSelectedMajorId('');
                    setPage(1);
                    setIsFacultyDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${!selectedFacultyId ? 'bg-teal-50 text-teal-900 font-bold' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                >
                  <span>Tất cả các Khoa</span>
                  {!selectedFacultyId && <Check className="h-3.5 w-3.5 text-teal-700 shrink-0" />}
                </button>

                {faculties.map((f) => {
                  const isSelected = selectedFacultyId === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setSelectedFacultyId(f.id);
                        setSelectedMajorId('');
                        setPage(1);
                        setIsFacultyDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${isSelected ? 'bg-teal-50 text-teal-900 font-bold' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                    >
                      <span className="truncate">{f.code ? `${f.code} — ` : ''}{f.name}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-teal-700 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Custom Dropdown: Ngành */}
          <div ref={majorDropdownRef} className="relative w-full">
            <button
              type="button"
              onClick={() => {
                setIsMajorDropdownOpen((prev) => !prev);
                setIsFacultyDropdownOpen(false);
              }}
              className={`h-11 w-full rounded-xl border pl-3.5 pr-3 text-xs font-semibold transition-all outline-none shadow-2xs flex items-center justify-between text-left cursor-pointer ${selectedMajorId
                  ? 'border-teal-500 bg-teal-50/90 text-teal-800 font-bold'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50/30'
                }`}
            >
              <span className="truncate pr-2">{currentMajor ? currentMajor.name : 'Tất cả các Ngành'}</span>
              <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isMajorDropdownOpen ? 'rotate-180 text-teal-700' : selectedMajorId ? 'text-teal-700' : 'text-slate-400'
                }`} />
            </button>

            {isMajorDropdownOpen && (
              <div
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                className="absolute left-0 top-full z-50 mt-1.5 w-full min-w-[280px] max-h-72 overflow-y-auto no-scrollbar rounded-2xl border border-slate-200/90 bg-white/95 p-1.5 shadow-xl backdrop-blur-md"
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMajorId('');
                    setPage(1);
                    setIsMajorDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${!selectedMajorId ? 'bg-teal-50 text-teal-900 font-bold' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                >
                  <span>Tất cả các Ngành</span>
                  {!selectedMajorId && <Check className="h-3.5 w-3.5 text-teal-700 shrink-0" />}
                </button>

                {(selectedFacultyId
                  ? faculties.filter((f) => f.id === selectedFacultyId)
                  : faculties
                ).map((f) => {
                  if (!f.majors || f.majors.length === 0) return null;
                  const facultyLabel = f.name.startsWith('Khoa') ? f.name : `Khoa ${f.name}`;
                  return (
                    <div key={f.id} className="pt-2 first:pt-1">
                      <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 select-none">
                        {facultyLabel}
                      </div>
                      {f.majors.map((m) => {
                        const isSelected = selectedMajorId === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              setSelectedMajorId(m.id);
                              if (!selectedFacultyId) {
                                setSelectedFacultyId(f.id);
                              }
                              setPage(1);
                              setIsMajorDropdownOpen(false);
                            }}
                            className={`w-full text-left pl-4 pr-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${isSelected
                                ? 'bg-teal-50 text-teal-900 font-bold'
                                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                              }`}
                          >
                            <span className="truncate">{m.name}</span>
                            {isSelected && <Check className="h-3.5 w-3.5 text-teal-700 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {selectedSkillFilter.length > 1 && (
          <p className="mt-2 px-1 text-[11px] font-medium text-slate-500">
            Chỉ hiển thị vị trí có đủ {selectedSkillFilter.length} kỹ năng đã chọn.
          </p>
        )}
      </div>

      {internshipsError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Không thể tải vị trí thực tập: {internshipsError}
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoadingInternships && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((skeletonId) => (
            <div key={skeletonId} className="sb-job-card space-y-4 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-2xl skeleton-shimmer" />
                  <div className="space-y-2">
                    <div className="h-3.5 w-24 rounded-md skeleton-shimmer" />
                    <div className="h-4 w-40 rounded-md skeleton-shimmer" />
                  </div>
                </div>
                <div className="h-9 w-9 rounded-xl skeleton-shimmer" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="h-12 rounded-xl skeleton-shimmer" />
                <div className="h-12 rounded-xl skeleton-shimmer" />
              </div>
              <div className="space-y-1.5">
                <div className="h-3 w-full rounded-md skeleton-shimmer" />
                <div className="h-3 w-3/4 rounded-md skeleton-shimmer" />
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <div className="h-3.5 w-24 rounded-md skeleton-shimmer" />
                <div className="h-9 w-24 rounded-xl skeleton-shimmer" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoadingInternships && !internshipsError && filteredInternships.length === 0 && (
        <div className="flex flex-col items-center rounded-[1.5rem] border border-dashed border-teal-300/70 bg-white/70 px-6 py-14 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 ring-8 ring-teal-50/50">
            <Search className="h-6 w-6" />
          </span>
          <p className="mt-4 text-base font-extrabold text-slate-800">Không có vị trí thực tập phù hợp</p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Thử bỏ bớt bộ lọc kỹ năng hoặc chuyên ngành, hoặc tìm với từ khóa khác.
          </p>
        </div>
      )}

      {/* Internship Bento Cards Grid */}
      {!isLoadingInternships && (
        <div className="bento-stagger grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredInternships.map((job) => {
            const appStatus = getApplicationStatus(job.id);
            const remainingSlots = Math.max(0, (job.slots || 0) - (job.filledSlots || 0));

            return (
              <article key={job.id} className="sb-job-card group flex flex-col justify-between overflow-hidden p-5 sm:p-6">
                <span className="sb-card-glow" />
                <div className="relative">
                  {/* Logo, công ty, tiêu đề */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3.5">
                      <CompanyLogo
                        src={job.companyLogo}
                        name={job.companyName}
                        className="h-14 w-14 shrink-0 rounded-2xl border border-teal-900/10 bg-white object-cover shadow-[0_8px_18px_-10px_rgb(0_80_84/0.45)]"
                      />
                      <div className="min-w-0">
                        <p className="flex items-center gap-1 truncate text-xs font-semibold text-slate-500">
                          <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" /> {job.companyName}
                        </p>
                        <h3 className="mt-0.5 line-clamp-2 text-base font-extrabold leading-snug text-slate-900 transition-colors group-hover:text-[#006d72]">
                          {job.title}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Badges: đợt, hạn, hình thức */}
                  <div className="mt-4 flex flex-wrap items-center gap-1.5">
                    {job.semester?.name && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-[11px] font-bold text-teal-800">
                        <CalendarDays className="h-3 w-3 text-teal-600" />
                        {job.semester.name}
                      </span>
                    )}
                    {renderDeadlineBadge(job.rawDeadline || job.deadline)}
                    {job.type && (
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                        {job.type}
                      </span>
                    )}
                  </div>

                  {/* Meta tiles */}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2">
                      <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <MapPin className="h-3 w-3" /> Địa điểm
                      </p>
                      <p className="mt-0.5 truncate font-bold text-slate-700">{job.location}</p>
                    </div>
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2">
                      <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600/80">
                        <DollarSign className="h-3 w-3" /> Trợ cấp
                      </p>
                      <p className="mt-0.5 truncate font-bold text-emerald-800">{job.stipend}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2">
                      <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <Calendar className="h-3 w-3" /> Hạn nộp
                      </p>
                      <p className="mt-0.5 truncate font-bold text-slate-700">{formatDate(job.deadline, 'Không thời hạn')}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2">
                      {job.startDate && job.endDate ? (
                        <>
                          <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            <GraduationCap className="h-3 w-3" /> Kỳ làm việc
                          </p>
                          <p className="mt-0.5 truncate font-bold text-slate-700">
                            {formatDate(job.startDate)} - {formatDate(job.endDate)}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            <Users className="h-3 w-3" /> Chỉ tiêu
                          </p>
                          <p className="mt-0.5 truncate font-bold text-slate-700">
                            {job.slots ? `Còn ${remainingSlots}/${job.slots}` : '—'}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Short Description */}
                  <p className="mt-4 line-clamp-2 text-xs leading-relaxed text-slate-600">{job.description}</p>

                  {/* Target Majors badges */}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {job.majors && job.majors.length > 0 ? (
                      job.majors.map((m) => {
                        const isStudentMajor =
                          (studentProfile.majorId && m.majorId === studentProfile.majorId) ||
                          m.name.toLowerCase() === studentProfile.major.toLowerCase();
                        return (
                          <span
                            key={m.majorId}
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors ${isStudentMajor
                              ? 'border-teal-200 bg-teal-50 font-semibold text-teal-800'
                              : 'border-slate-200 bg-white text-slate-600'
                              }`}
                          >
                            <GraduationCap className="h-3 w-3" />
                            {isStudentMajor ? '✓ ' : ''}
                            {m.name}
                          </span>
                        );
                      })
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
                        <GraduationCap className="h-3 w-3" /> Mở cho mọi ngành
                      </span>
                    )}
                  </div>

                  {/* Required Skills tags */}
                  {job.requiredSkills.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {job.requiredSkills.map((sk) => {
                        const isMatched = studentProfile.skills.includes(sk);
                        return (
                          <span
                            key={sk}
                            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors ${isMatched
                              ? 'border-teal-300 bg-gradient-to-r from-teal-50 to-emerald-50 font-semibold text-teal-800'
                              : 'border-slate-200 bg-slate-100/70 text-slate-600'
                              }`}
                          >
                            {isMatched ? '✓ ' : ''}{sk}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="relative mt-5 flex items-center justify-between gap-3 border-t border-dashed border-teal-900/10 pt-4">
                  <button
                    type="button"
                    onClick={() => setActiveModalInternship(job)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 transition-colors hover:text-[#006d72]"
                  >
                    Xem chi tiết <ArrowRight className="sb-arrow h-3.5 w-3.5" />
                  </button>

                  {appStatus && appStatus !== 'WITHDRAWN' ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Đã ứng tuyển
                    </span>
                  ) : (
                    <button
                      id={`btn-apply-${job.id}`}
                      type="button"
                      onClick={() => setApplyModalInternship(job)}
                      className="inline-flex items-center gap-1.5 bg-teal-700 px-4 py-2 text-xs font-bold text-white transition-all active:scale-95"
                    >
                      <Send className="h-3.5 w-3.5" />
                      {appStatus === 'WITHDRAWN' ? 'Ứng tuyển lại' : 'Ứng tuyển ngay'}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {internshipPage.pagination.totalPages > 1 && (
        <div className="flex flex-col items-center justify-center gap-2 pt-6 pb-2">
          <nav
            aria-label="Phân trang danh sách tin tuyển dụng"
            className="inline-flex items-center gap-1 p-1.5 rounded-2xl border border-slate-200/90 bg-white/95 shadow-sm backdrop-blur-md"
          >
            {/* Nút Trước */}
            <button
              type="button"
              disabled={isLoadingInternships || page <= 1}
              onClick={() => {
                setPage((val) => val - 1);
                document.getElementById('tin-tuyen-dung')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 active:scale-95 disabled:pointer-events-none disabled:opacity-30"
              aria-label="Trang trước"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Trước</span>
            </button>

            {/* Các số trang */}
            <div className="flex items-center gap-1 px-1">
              {(() => {
                const totalPages = internshipPage.pagination.totalPages;
                const delta = 1;
                const range: (number | string)[] = [];
                for (let i = 1; i <= totalPages; i++) {
                  if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
                    range.push(i);
                  } else if (range[range.length - 1] !== '...') {
                    range.push('...');
                  }
                }

                return range.map((p, idx) => {
                  if (p === '...') {
                    return (
                      <span key={`ellipsis-${idx}`} className="px-1.5 text-xs font-bold text-slate-400 select-none">
                        ...
                      </span>
                    );
                  }

                  const pageNum = p as number;
                  const isActive = pageNum === page;

                  return (
                    <button
                      key={pageNum}
                      type="button"
                      disabled={isLoadingInternships}
                      onClick={() => {
                        setPage(pageNum);
                        document.getElementById('tin-tuyen-dung')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={`h-9 min-w-[36px] px-3 rounded-xl text-xs font-bold transition-all ${isActive
                          ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-xs scale-105'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:scale-95'
                        }`}
                      aria-label={`Trang ${pageNum}`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {pageNum}
                    </button>
                  );
                });
              })()}
            </div>

            {/* Nút Sau */}
            <button
              type="button"
              disabled={isLoadingInternships || page >= internshipPage.pagination.totalPages}
              onClick={() => {
                setPage((val) => val + 1);
                document.getElementById('tin-tuyen-dung')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 active:scale-95 disabled:pointer-events-none disabled:opacity-30"
              aria-label="Trang sau"
            >
              <span className="hidden sm:inline">Sau</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        </div>
      )}

      {/* Detail Modal */}
      {activeModalInternship && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs modal-backdrop-appear">
            <div
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              className="bg-white rounded-[1.75rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto no-scrollbar p-6 shadow-2xl relative modal-scale-in border border-teal-900/10"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-28 rounded-t-[1.75rem] bg-[radial-gradient(30rem_8rem_at_80%_-20%,rgb(0_163_166/0.18),transparent_70%)]" />
              <button
                onClick={() => setActiveModalInternship(null)}
                className="absolute top-4 right-4 z-10 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative flex items-center gap-4 border-b border-slate-100 pb-4">
                <CompanyLogo
                  src={activeModalInternship.companyLogo}
                  name={activeModalInternship.companyName}
                  className="h-16 w-16 rounded-2xl border border-teal-900/10 object-cover shadow-[0_8px_18px_-10px_rgb(0_80_84/0.45)]"
                />
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{activeModalInternship.title}</h2>
                  <p className="text-xs font-semibold text-teal-700">{activeModalInternship.companyName}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span>📍 {activeModalInternship.location}</span>
                    <span>💵 {activeModalInternship.stipend}</span>
                    <span>📅 Hạn: {formatDate(activeModalInternship.deadline, "Không thời hạn")}</span>
                  </div>
                </div>
              </div>

              {/* Thông tin Đợt thực tập & Tiến trình học kỳ */}
              {activeModalInternship.semester && (
                <div className="mt-4 rounded-xl border border-teal-100 bg-gradient-to-r from-teal-50/70 via-cyan-50/40 to-white p-3.5 shadow-2xs">
                  <div className="flex items-center justify-between gap-2 border-b border-teal-100/70 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-700 text-white shadow-2xs">
                        <CalendarDays className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-teal-700">Đợt thực tập áp dụng</p>
                        <p className="text-xs font-extrabold text-slate-900">{activeModalInternship.semester.name}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                      Đang mở nhận hồ sơ
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2.5 text-xs sm:grid-cols-3">
                    <div>
                      <p className="text-[11px] font-medium text-slate-500">Hạn chốt nộp hồ sơ</p>
                      <p className="font-bold text-slate-800">{formatDate(activeModalInternship.deadline, "Không thời hạn")}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-slate-500">Kỳ làm việc dự kiến</p>
                      <p className="font-bold text-slate-800">
                        {activeModalInternship.startDate && activeModalInternship.endDate
                          ? `${formatDate(activeModalInternship.startDate)} - ${formatDate(activeModalInternship.endDate)}`
                          : `${formatDate(activeModalInternship.semester.startDate)} - ${formatDate(activeModalInternship.semester.endDate)}`}
                      </p>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <p className="text-[11px] font-medium text-slate-500">Chỉ tiêu còn lại</p>
                      <p className="font-bold text-teal-800">
                        {Math.max(0, activeModalInternship.slots - activeModalInternship.filledSlots)} / {activeModalInternship.slots} vị trí
                      </p>
                    </div>
                  </div>
                </div>
              )}

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
                      <span key={sk} className="bg-teal-50 text-teal-800 border border-teal-100 px-2.5 py-1 rounded-md font-semibold text-[11px]">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">Ngành đào tạo ưu tiên:</h4>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {activeModalInternship.majors && activeModalInternship.majors.length > 0 ? (
                      activeModalInternship.majors.map((m) => (
                        <span
                          key={m.majorId}
                          className="bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-1 rounded-md font-semibold text-[11px]"
                        >
                          {m.name} ({m.faculty.name})
                        </span>
                      ))
                    ) : (
                      <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-medium text-[11px]">
                        Mở cho sinh viên tất cả các ngành
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setReportingInternship(activeModalInternship)}
                  className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors"
                  title="Báo cáo bài đăng nếu có dấu hiệu lừa đảo, thu phí hoặc sai sự thật"
                >
                  <Flag className="w-3.5 h-3.5" /> Báo cáo tin vi phạm
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveModalInternship(null)}
                    className="px-4 py-2 border border-slate-300 rounded-full text-xs font-semibold text-slate-700 hover:bg-slate-50 transition active:scale-95"
                  >
                    Đóng
                  </button>
                  {(() => {
                    const status = getApplicationStatus(activeModalInternship.id);
                    if (status && status !== 'WITHDRAWN') return null;
                    return (
                      <button
                        type="button"
                        onClick={() => {
                          setApplyModalInternship(activeModalInternship);
                          setActiveModalInternship(null);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-[#00a3a6] to-[#006d72] px-5 py-2 text-xs font-bold text-white shadow-[0_8px_20px_-10px_rgb(0_139_143/0.8)] transition hover:brightness-110 active:scale-95"
                      >
                        <Send className="w-3.5 h-3.5" /> Ứng tuyển ngay
                      </button>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Apply Modal */}
      {applyModalInternship && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs modal-backdrop-appear">
            <div className="bg-white rounded-[1.75rem] max-w-lg w-full p-6 shadow-2xl relative modal-scale-in border border-teal-900/10">
              <button
                onClick={() => setApplyModalInternship(null)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-gradient-to-br from-[#00a3a6] to-[#006d72] text-white rounded-2xl shadow-[0_8px_20px_-10px_rgb(0_139_143/0.8)]">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Ứng tuyển vị trí thực tập</h3>
                  <p className="text-xs text-slate-500 line-clamp-1">{applyModalInternship.title} — {applyModalInternship.companyName}</p>
                </div>
              </div>

              <form onSubmit={handleApplySubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Hồ sơ CV đính kèm:</label>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-teal-700" />
                      <span className="font-semibold text-slate-800">{selectedCvName}</span>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Đã chọn
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Thư giới thiệu:</label>
                  <textarea
                    rows={4}
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    placeholder="Nêu lý do bạn phù hợp với vị trí này, định hướng nghề nghiệp và kinh nghiệm liên quan..."
                    className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-600 text-xs transition-all"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setApplyModalInternship(null)}
                    className="px-4 py-2 border border-slate-300 rounded-full font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-gradient-to-br from-[#00a3a6] to-[#006d72] hover:brightness-110 active:scale-95 text-white font-bold rounded-full shadow-[0_8px_20px_-10px_rgb(0_139_143/0.8)] flex items-center gap-2 disabled:opacity-50 transition-all"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{isSubmitting ? 'Đang nộp...' : 'Xác nhận nộp đơn'}</span>
                  </button>
                </div>
                {submitError && <p className="text-xs text-rose-600">{submitError}</p>}
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Report Modal */}
      {reportingInternship && (
        <ReportJobModal
          internshipId={reportingInternship.id}
          internshipTitle={reportingInternship.title}
          companyName={reportingInternship.companyName}
          onClose={() => setReportingInternship(null)}
        />
      )}
    </div>
  );
};
