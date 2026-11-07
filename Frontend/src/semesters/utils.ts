import type { SemesterRecord } from './types';

/**
 * Tìm học kỳ phù hợp nhất làm mặc định:
 * - Đối với Giảng viên: ưu tiên đợt MONITORING (đang theo dõi thực tập), kế đến RECRUITING, UPCOMING, hoặc kỳ mới nhất.
 * - Đối với Doanh nghiệp: ưu tiên đợt RECRUITING (đang nhận hồ sơ), kế đến MONITORING, UPCOMING, hoặc kỳ mới nhất.
 */
export function findDefaultSemester(
  semesters: SemesterRecord[],
  role?: 'COMPANY' | 'LECTURER' | 'TEACHER' | 'STUDENT' | 'ADMIN',
): SemesterRecord | null {
  if (!semesters || semesters.length === 0) return null;

  if (role === 'LECTURER' || role === 'TEACHER') {
    const monitoring = semesters.find(
      (s) => s.phase === 'MONITORING' || s.status === 'MONITORING',
    );
    if (monitoring) return monitoring;
  }

  const recruiting = semesters.find(
    (s) => s.phase === 'RECRUITING' || s.status === 'RECRUITING',
  );
  if (recruiting) return recruiting;

  const monitoring = semesters.find(
    (s) => s.phase === 'MONITORING' || s.status === 'MONITORING',
  );
  if (monitoring) return monitoring;

  const upcoming = semesters.find(
    (s) => s.phase === 'UPCOMING' || s.status === 'UPCOMING',
  );
  if (upcoming) return upcoming;

  return semesters[0] ?? null;
}

export function toSemesterSlug(semesterName?: string | null): string {
  if (!semesterName) return 'all';
  return semesterName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
