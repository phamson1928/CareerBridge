export type SemesterStatus =
  | 'UPCOMING'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED';

export interface SemesterRecord {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: SemesterStatus;
  internshipCount: number;
  placementCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SemesterPage {
  items: SemesterRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SemesterInput {
  name: string;
  startDate: string;
  endDate: string;
}

export interface ListSemestersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: SemesterStatus;
}
