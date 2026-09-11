import type { ReadinessMissingField } from './types';

export const readinessFieldLabels: Record<ReadinessMissingField, string> = {
  SUMMARY: 'Viết giới thiệu',
  SKILLS: 'Thêm kỹ năng',
  PROJECTS: 'Thêm dự án có mô tả',
  DESIRED_ROLES: 'Chọn vị trí mong muốn',
  LOCATIONS: 'Chọn địa điểm mong muốn',
  WORK_TYPES: 'Chọn hình thức làm việc',
};

export function formatRecommendationDate(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}
