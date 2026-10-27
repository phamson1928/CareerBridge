export type SupportRequestStatus = 'PENDING' | 'RESOLVED';

export interface SupportRequestRecord {
  id: string;
  studentId: string;
  title: string;
  content: string;
  status: SupportRequestStatus;
  adminReply: string | null;
  repliedById: string | null;
  repliedAt: string | null;
  createdAt: string;
  updatedAt: string;
  student: {
    id: string;
    userId: string;
    studentCode: string;
    fullName: string;
    major: string;
    phone: string | null;
    user: {
      email: string;
    };
  };
  repliedBy: {
    id: string;
    email: string;
  } | null;
}

export interface SupportRequestsPage {
  items: SupportRequestRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
