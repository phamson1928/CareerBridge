export type ReportStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";

export interface ReportRecord {
  id: string;
  placementId: string;
  week: number;
  title: string | null;
  content: string;
  fileId: string | null;
  status: ReportStatus;
  feedback: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  file: {
    id: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    createdAt: string;
  } | null;
  placement: {
    id: string;
    status: string;
    academicStatus: "PENDING" | "ACTIVE" | "CLOSED" | "CANCELLED";
    startDate: string | null;
    endDate: string | null;
    student: {
      id: string;
      userId: string;
      studentCode: string;
      fullName: string;
      major?: string;
      majorId?: string | null;
      majorRef?: {
        id: string;
        code: string;
        name: string;
        facultyId: string;
        faculty: { id: string; code: string; name: string };
      } | null;
    };
    company: { companyName: string };
    internship: { title: string };
    semester: { id?: string; name: string };
    supervision: {
      status: string;
      lecturer: {
        userId: string;
        fullName: string;
        department?: string;
        facultyId?: string | null;
        faculty?: { id: string; code: string; name: string } | null;
      };
    } | null;
  };
}

export interface ReportsPage {
  items: ReportRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
