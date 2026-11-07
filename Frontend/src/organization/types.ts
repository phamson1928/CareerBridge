export interface FacultyMajorSummary {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  studentCount: number;
}

export interface FacultyRecord {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  majorCount: number;
  activeMajorCount: number;
  lecturerCount: number;
  studentCount: number;
  majors: FacultyMajorSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface FacultyOption {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  majors: Array<{
    id: string;
    code: string;
    name: string;
    facultyId: string;
    isActive: boolean;
  }>;
}

export interface MajorRecord {
  id: string;
  facultyId: string;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  faculty: {
    id: string;
    code: string;
    name: string;
    isActive: boolean;
  };
  studentCount: number;
  internshipCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MajorOption {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  facultyId: string;
  faculty: {
    id: string;
    code: string;
    name: string;
    isActive: boolean;
  };
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FacultyInput {
  code: string;
  name: string;
  description?: string | null;
  isActive?: boolean;
}

export interface MajorInput {
  facultyId: string;
  code: string;
  name: string;
  description?: string | null;
  isActive?: boolean;
}
