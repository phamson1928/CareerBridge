export type PlacementStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface PlacementRecord {
  id: string;
  applicationId: string;
  status: PlacementStatus;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  student: { id: string; userId?: string; studentCode: string; fullName: string; major: string };
  company: { id: string; userId?: string; companyName: string; logo: string | null };
  internship: { id: string; title: string; department: string | null; location: string | null; workType: string | null };
  semester: { id: string; name: string; status: string; startDate: string; endDate: string };
  supervision: {
    id: string;
    lecturerId: string;
    status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    assignedAt: string;
    completedAt: string | null;
    lecturer: { id: string; userId: string; fullName: string; department: string; title: string | null };
  } | null;
  application: { id: string; status: string; acceptedAt: string | null };
}

export interface PlacementPage {
  items: PlacementRecord[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}
