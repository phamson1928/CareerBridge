export type ReportStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface ReportRecord {
  id: string; placementId: string; week: number; title: string | null; content: string;
  fileId: string | null; status: ReportStatus; feedback: string | null;
  submittedAt: string | null; reviewedAt: string | null; createdAt: string; updatedAt: string;
  file: { id: string; originalName: string; mimeType: string; sizeBytes: number } | null;
  placement: { id: string; status: string; student: { id: string; userId: string; studentCode: string; fullName: string }; company: { companyName: string }; internship: { title: string }; semester: { name: string }; supervision: { status: string; lecturer: { userId: string; fullName: string } } | null };
}

export interface ReportsPage { items: ReportRecord[]; pagination: { page: number; limit: number; total: number; totalPages: number }; }
