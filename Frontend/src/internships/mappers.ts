import type { Internship } from '../types';
import type { InternshipRecord } from './api';
import { formatDate } from '../utils/format';

export function toLegacyInternship(record: InternshipRecord): Internship {
  const type = ['Full-time', 'Part-time', 'Hybrid', 'Remote'].includes(
    record.workType ?? '',
  )
    ? (record.workType as Internship['type'])
    : 'Full-time';

  return {
    id: record.id,
    companyId: record.companyId,
    companyName: record.company.companyName,
    companyLogo: record.company.logo ?? '',
    title: record.title,
    department: record.department ?? 'Chưa cập nhật',
    location: record.location ?? 'Chưa cập nhật',
    type,
    stipend: record.stipend ?? 'Thỏa thuận',
    description: record.description,
    requirements: record.requirements
      ? record.requirements.split('\n').filter(Boolean)
      : [],
    requiredSkills: record.skills.map((item) => item.name),
    slots: record.slots,
    filledSlots: record.filledSlots,
    deadline: formatDate(record.deadline, 'Không thời hạn'),
    createdAt: record.createdAt,
    status: record.status === 'OPEN' ? 'ACTIVE' : 'CLOSED',
  };
}
