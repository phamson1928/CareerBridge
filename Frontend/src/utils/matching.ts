import { ApplicationStatus, ReportStatus } from '../types';

export function calculateSkillMatch(studentSkills: string[], requiredSkills: string[]): number {
  if (!requiredSkills || requiredSkills.length === 0) return 100;
  if (!studentSkills || studentSkills.length === 0) return 30;

  const normalize = (s: string) => s.trim().toLowerCase();
  const normalizedStudent = studentSkills.map(normalize);
  
  let matchedCount = 0;
  requiredSkills.forEach(req => {
    const normReq = normalize(req);
    const hasMatch = normalizedStudent.some(st => st.includes(normReq) || normReq.includes(st));
    if (hasMatch) matchedCount++;
  });

  const percentage = Math.round((matchedCount / requiredSkills.length) * 100);
  // Guarantee a reasonable base match score between 40% and 98%
  return Math.min(98, Math.max(42, percentage));
}

export function getStatusBadge(status: ApplicationStatus) {
  switch (status) {
    case 'PENDING':
      return {
        label: 'Chờ duyệt',
        bg: 'bg-amber-100 text-amber-800 border-amber-200',
        dot: 'bg-amber-500',
      };
    case 'REVIEWING':
      return {
        label: 'Đang xem xét',
        bg: 'bg-blue-100 text-blue-800 border-blue-200',
        dot: 'bg-blue-500',
      };
    case 'ACCEPTED':
      return {
        label: 'Đã nhận',
        bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        dot: 'bg-emerald-500',
      };
    case 'REJECTED':
      return {
        label: 'Từ chối',
        bg: 'bg-rose-100 text-rose-800 border-rose-200',
        dot: 'bg-rose-500',
      };
    default:
      return {
        label: status,
        bg: 'bg-slate-100 text-slate-800 border-slate-200',
        dot: 'bg-slate-500',
      };
  }
}

export function getReportStatusBadge(status: ReportStatus) {
  switch (status) {
    case 'DRAFT':
      return {
        label: 'Bản nháp',
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
      };
    case 'SUBMITTED':
      return {
        label: 'Đã nộp - Chờ duyệt',
        bg: 'bg-amber-100 text-amber-800 border-amber-200',
      };
    case 'APPROVED':
      return {
        label: 'Đã duyệt',
        bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      };
    case 'NEEDS_REVISION':
      return {
        label: 'Cần sửa đổi',
        bg: 'bg-rose-100 text-rose-800 border-rose-200',
      };
  }
}
