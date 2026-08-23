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
