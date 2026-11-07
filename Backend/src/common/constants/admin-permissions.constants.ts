export enum AdminPermission {
  DASHBOARD = 'DASHBOARD',
  COMPANIES = 'COMPANIES',
  INTERNSHIPS = 'INTERNSHIPS',
  PLACEMENTS = 'PLACEMENTS',
  SEMESTERS = 'SEMESTERS',
  SUPPORT = 'SUPPORT',
}

export const ADMIN_PERMISSION_LABELS: Record<AdminPermission, string> = {
  [AdminPermission.DASHBOARD]: 'Thống kê hệ thống',
  [AdminPermission.COMPANIES]: 'Quản lý & Duyệt doanh nghiệp',
  [AdminPermission.INTERNSHIPS]: 'Quản lý Tin tuyển dụng & Kỹ năng',
  [AdminPermission.PLACEMENTS]: 'Quản lý Thực tập & Phân công giảng viên',
  [AdminPermission.SEMESTERS]: 'Quản lý Đợt thực tập',
  [AdminPermission.SUPPORT]: 'Hỗ trợ & Khiếu nại sinh viên',
};
