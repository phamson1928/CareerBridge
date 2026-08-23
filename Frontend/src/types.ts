export type UserRole = "STUDENT" | "COMPANY" | "TEACHER" | "ADMIN";

export type ApplicationStatus =
  "PENDING" | "REVIEWING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";

export type ReportStatus =
  "DRAFT" | "SUBMITTED" | "APPROVED" | "NEEDS_REVISION";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  fullname: string;
  studentCode: string;
  major: string;
  university: string;
  gpa: number;
  skills: string[];
  cvUrl?: string;
  cvName?: string;
  cvFileId?: string;
  summary?: string;
  phone?: string;
  assignedTeacherId?: string;
  assignedCompanyId?: string;
  activeInternshipId?: string;
  projects?: {
    name: string;
    description: string;
    techStack: string[];
    link?: string;
  }[];
}

export interface CompanyProfile {
  id: string;
  userId: string;
  companyName: string;
  tagline: string;
  description: string;
  industry: string;
  website: string;
  address: string;
  logo: string;
  verified: boolean;
  contactEmail: string;
}

export interface TeacherProfile {
  id: string;
  userId: string;
  fullname: string;
  department: string;
  title: string;
  assignedStudentIds: string[];
}

export interface Internship {
  id: string;
  companyId: string;
  companyName: string;
  companyLogo: string;
  title: string;
  department: string;
  location: string;
  type: "Full-time" | "Part-time" | "Hybrid" | "Remote";
  stipend: string;
  description: string;
  requirements: string[];
  requiredSkills: string[];
  slots: number;
  filledSlots: number;
  deadline: string;
  createdAt: string;
  status: "ACTIVE" | "CLOSED";
}

export interface Application {
  id: string;
  studentId: string;
  studentName: string;
  studentMajor: string;
  studentSkills: string[];
  internshipId: string;
  internshipTitle: string;
  companyId: string;
  companyName: string;
  cvUrl: string;
  cvFileId?: string;
  coverLetter?: string;
  matchScore: number;
  status: ApplicationStatus;
  companyFeedback?: string;
  appliedAt: string;
  updatedAt: string;
}

export interface WeeklyReport {
  id: string;
  studentId: string;
  studentName: string;
  internshipId: string;
  companyName: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  tasksCompleted: string;
  plansNextWeek: string;
  learningsAndChallenges: string;
  attachmentName?: string;
  attachmentUrl?: string;
  status: ReportStatus;
  companyComment?: string;
  teacherComment?: string;
  submittedAt: string;
}

export interface Evaluation {
  id: string;
  studentId: string;
  studentName: string;
  internshipId: string;
  companyId: string;
  companyName: string;
  teacherId?: string;

  // Scores (1-10)
  technicalScore: number;
  softSkillScore: number;
  disciplineScore: number;
  overallScore: number;

  companyFeedback: string;
  teacherFeedback?: string;
  evaluatedAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  receiverId: string;
  content: string;
  timestamp: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "APPLICATION" | "REPORT" | "EVALUATION" | "SYSTEM" | "CHAT";
  read: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalCompanies: number;
  totalInternships: number;
  totalApplications: number;
  placementSuccessRate: number;
}
