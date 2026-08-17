import type { PlacementRecord } from '../placements/types';

export type SupervisionStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface SupervisionRecord {
  id: string;
  placementId: string;
  lecturerId: string;
  assignedById: string | null;
  status: SupervisionStatus;
  assignedAt: string;
  completedAt: string | null;
  placement: Pick<PlacementRecord, 'id' | 'status' | 'student' | 'company' | 'internship' | 'semester'> & {
    _count: { reports: number; evaluations: number };
  };
  lecturer: { id: string; userId: string; fullName: string; department: string; title: string | null };
}

export interface LecturerOption {
  id: string;
  userId: string;
  fullName: string;
  department: string;
  title: string | null;
  email: string;
  activeSupervisionCount: number;
}

export interface SupervisionPage {
  items: SupervisionRecord[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}
