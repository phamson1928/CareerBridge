import { ApplicationStatus, ReportStatus } from '../types';

export function getStatusBadge(status: ApplicationStatus) {
  switch (status) {
    case 'PENDING':
      return {
        label: 'Chờ duyệt',
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        dot: 'bg-amber-500',
      };
    case 'REVIEWING':
      return {
        label: 'Đang xem xét',
        bg: 'bg-[#e9f7f7] text-[#006d72] border-[#aad9da]',
        dot: 'bg-[#008b8f]',
      };
    case 'INTERVIEWING':
      return {
        label: 'Mời phỏng vấn',
        bg: 'bg-[#e9f7f7] text-[#12353b] border-[#aad9da]',
        dot: 'bg-[#008b8f]',
      };
    case 'OFFERED':
      return {
        label: 'Đã gửi Offer',
        bg: 'bg-[#e9f7f7] text-[#006d72] border-[#008b8f]/40',
        dot: 'bg-[#008b8f]',
      };
    case 'ACCEPTED':
      return {
        label: 'Đã nhận thực tập',
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        dot: 'bg-emerald-500',
      };
    case 'DECLINED':
      return {
        label: 'SV từ chối Offer',
        bg: 'bg-orange-50 text-orange-800 border-orange-200',
        dot: 'bg-orange-500',
      };
    case 'EXPIRED':
      return {
        label: 'Hết hạn',
        bg: 'bg-slate-100 text-slate-700 border-slate-300',
        dot: 'bg-slate-500',
      };
    case 'REJECTED':
      return {
        label: 'Từ chối',
        bg: 'bg-rose-50 text-rose-800 border-rose-200',
        dot: 'bg-rose-500',
      };
    case 'WITHDRAWN':
      return {
        label: 'Đã rút đơn',
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
        dot: 'bg-slate-500',
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
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
      };
    case 'APPROVED':
      return {
        label: 'Đã duyệt',
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      };
    case 'NEEDS_REVISION':
      return {
        label: 'Cần sửa đổi',
        bg: 'bg-rose-50 text-rose-800 border-rose-200',
      };
  }
}
