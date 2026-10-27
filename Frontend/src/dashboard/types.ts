import type {
  ApplicationStatus,
  PlacementStatus,
  ReportStatus,
} from "../placements/types";

export interface StatusCount<T extends string> {
  status: T;
  count: number;
}

export interface DashboardScope {
  semester: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: string;
  } | null;
  months: number;
  from: string;
  to: string;
  generatedAt: string;
}

export interface DashboardGlobalStats {
  totalStudents: number;
  activeStudentUsers: number;
  totalLecturers: number;
  activeLecturerUsers: number;
  approvedCompanies: number;
  pendingCompanies: number;
}

export interface DashboardKpis {
  totalInternships: number;
  openInternships: number;
  totalSlots: number;
  filledSlots: number;
  slotOccupancyRate: number;
  totalApplications: number;
  acceptedApplications: number;
  applicantStudents: number;
  totalPlacements: number;
  pendingPlacements: number;
  activePlacements: number;
  completedPlacements: number;
  cancelledPlacements: number;
  unassignedPlacements: number;
  placedStudents: number;
  placementCoverageRate: number;
  reportsAwaitingReview: number;
}

export interface MonthlyTrendPoint {
  month: string;
  label: string;
  applications: number;
  placements: number;
  completedPlacements: number;
}

export interface TopSkillDemand {
  skillId: string;
  name: string;
  internshipCount: number;
  requiredCount: number;
  weightSum: number;
}

export interface AdminDashboardData {
  scope: DashboardScope;
  global: DashboardGlobalStats;
  kpis: DashboardKpis;
  distributions: {
    applicationStatus: StatusCount<ApplicationStatus>[];
    placementStatus: StatusCount<PlacementStatus>[];
    reportStatus: StatusCount<ReportStatus>[];
  };
  monthlyTrend: MonthlyTrendPoint[];
  topSkills: TopSkillDemand[];
}

export interface CompanyDashboardKpis {
  totalInternships: number;
  openInternships: number;
  closedInternships: number;
  draftInternships: number;
  cancelledInternships: number;
  totalSlots: number;
  filledSlots: number;
  fillRate: number; // 0 to 1
  totalViews: number;
  uniqueViewers: number;
  totalApplications: number;
  applicationsByStatus: Record<ApplicationStatus, number>;
  avgHoursToAccept: number | null;
  avgHoursToDecision: number | null;
}

export interface CompanyDashboardFunnel {
  applied: number;
  everReviewing: number;
  accepted: number;
  rejected: number;
  withdrawn: number;
  reviewRate: number | null;
  acceptRate: number | null;
  rejectRate: number | null;
  withdrawRate: number | null;
  acceptGivenReview: number | null;
}

export interface CompanyApplicantSkill {
  skillId: string;
  name: string;
  applicantCount: number;
  share: number; // 0 to 1
}

export interface CompanyPerInternshipItem {
  id: string;
  title: string;
  status: 'DRAFT' | 'OPEN' | 'CLOSED' | 'CANCELLED';
  semesterId: string;
  semesterName?: string;
  views: number;
  uniqueViewers: number;
  applications: number;
  filledSlots: number;
  slots: number;
  fillRate: number;
  acceptRate: number | null;
}

export interface CompanyDashboardData {
  kpis: CompanyDashboardKpis;
  funnel: CompanyDashboardFunnel;
  applicantSkills: CompanyApplicantSkill[];
  perInternship: {
    items: CompanyPerInternshipItem[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface RequiredSkillCoverageItem {
  skillId: string;
  name: string;
  isRequired: boolean;
  applicantHaveCount: number;
  applicantHaveRate: number | null; // 0 to 1 or null
}

export interface CompanyInternshipStatsData {
  internship: {
    id: string;
    title: string;
    status: 'DRAFT' | 'OPEN' | 'CLOSED' | 'CANCELLED';
    semesterId: string;
    semesterName?: string;
    department: string | null;
    location: string | null;
    workType: string | null;
    slots: number;
    filledSlots: number;
    fillRate: number;
    viewCount: number;
    uniqueViewerCount: number;
    createdAt: string;
  };
  kpis: {
    totalSlots: number;
    filledSlots: number;
    fillRate: number;
    views: number;
    uniqueViewers: number;
    totalApplications: number;
    applicationsByStatus: Record<ApplicationStatus, number>;
    avgHoursToAccept: number | null;
    avgHoursToDecision: number | null;
  };
  funnel: CompanyDashboardFunnel;
  requiredSkillCoverage: RequiredSkillCoverageItem[];
  topApplicantSkills: CompanyApplicantSkill[];
  matchScore: {
    avg: number | null;
    min: number | null;
    max: number | null;
    counted: number;
  };
}

