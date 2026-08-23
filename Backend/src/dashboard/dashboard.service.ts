import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ApplicationStatus,
  CompanyStatus,
  InternshipStatus,
  PlacementStatus,
  Prisma,
  ReportStatus,
  Role,
  UserStatus,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdminDashboardQueryDto } from './dto/admin-dashboard-query.dto';

const APPLICATION_STATUSES = Object.values(ApplicationStatus);
const PLACEMENT_STATUSES = Object.values(PlacementStatus);
const REPORT_STATUSES = Object.values(ReportStatus);

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getAdminDashboard(query: AdminDashboardQueryDto) {
    const semester = query.semesterId
      ? await this.prisma.semester.findUnique({
          where: { id: query.semesterId },
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            status: true,
          },
        })
      : null;
    if (query.semesterId && !semester) {
      throw new NotFoundException({
        code: 'SEMESTER_NOT_FOUND',
        message: 'Semester not found',
      });
    }

    const trendRange = this.trendRange(query.months);
    const internshipWhere: Prisma.InternshipWhereInput = {
      ...(semester ? { semesterId: semester.id } : {}),
    };
    const nonCancelledInternshipWhere: Prisma.InternshipWhereInput = {
      ...internshipWhere,
      status: { not: InternshipStatus.CANCELLED },
    };
    const applicationWhere: Prisma.ApplicationWhereInput = semester
      ? { internship: { semesterId: semester.id } }
      : {};
    const placementWhere: Prisma.InternshipPlacementWhereInput = semester
      ? { semesterId: semester.id }
      : {};
    const reportWhere: Prisma.ReportWhereInput = semester
      ? { placement: { semesterId: semester.id } }
      : {};

    const data = await this.prisma.$transaction(async (tx) => {
      const [
        totalStudents,
        activeStudentUsers,
        totalLecturers,
        activeLecturerUsers,
        approvedCompanies,
        pendingCompanies,
        internshipCounts,
        slotTotals,
        totalApplications,
        acceptedApplications,
        applicantStudentRows,
        placementCounts,
        placedStudentRows,
        reportsAwaitingReview,
        applicationStatuses,
        placementStatuses,
        reportStatuses,
        unassignedPlacements,
        applicationTrendRows,
        placementTrendRows,
        completedPlacementTrendRows,
        skillRows,
      ] = await Promise.all([
        tx.studentProfile.count(),
        tx.user.count({
          where: {
            role: Role.STUDENT,
            status: UserStatus.ACTIVE,
            studentProfile: { isNot: null },
          },
        }),
        tx.lecturerProfile.count(),
        tx.user.count({
          where: {
            role: Role.LECTURER,
            status: UserStatus.ACTIVE,
            lecturerProfile: { isNot: null },
          },
        }),
        tx.companyProfile.count({ where: { status: CompanyStatus.APPROVED } }),
        tx.companyProfile.count({ where: { status: CompanyStatus.PENDING } }),
        tx.internship.groupBy({
          by: ['status'],
          where: internshipWhere,
          _count: { _all: true },
        }),
        tx.internship.aggregate({
          where: nonCancelledInternshipWhere,
          _sum: { slots: true, filledSlots: true },
        }),
        tx.application.count({ where: applicationWhere }),
        tx.application.count({
          where: { ...applicationWhere, status: ApplicationStatus.ACCEPTED },
        }),
        tx.application.findMany({
          where: applicationWhere,
          distinct: ['studentId'],
          select: { studentId: true },
        }),
        tx.internshipPlacement.groupBy({
          by: ['status'],
          where: placementWhere,
          _count: { _all: true },
        }),
        tx.internshipPlacement.findMany({
          where: {
            ...placementWhere,
            status: {
              in: [
                PlacementStatus.PENDING,
                PlacementStatus.ACTIVE,
                PlacementStatus.COMPLETED,
              ],
            },
          },
          distinct: ['studentId'],
          select: { studentId: true },
        }),
        tx.report.count({
          where: { ...reportWhere, status: ReportStatus.SUBMITTED },
        }),
        tx.application.groupBy({
          by: ['status'],
          where: applicationWhere,
          _count: { _all: true },
        }),
        tx.internshipPlacement.groupBy({
          by: ['status'],
          where: placementWhere,
          _count: { _all: true },
        }),
        tx.report.groupBy({
          by: ['status'],
          where: reportWhere,
          _count: { _all: true },
        }),
        tx.internshipPlacement.count({
          where: {
            ...placementWhere,
            status: PlacementStatus.PENDING,
            NOT: { supervision: { is: { status: 'ACTIVE' } } },
          },
        }),
        tx.application.findMany({
          where: {
            ...applicationWhere,
            appliedAt: { gte: trendRange.from, lt: trendRange.toExclusive },
          },
          select: { appliedAt: true },
        }),
        tx.internshipPlacement.findMany({
          where: {
            ...placementWhere,
            createdAt: { gte: trendRange.from, lt: trendRange.toExclusive },
          },
          select: { createdAt: true },
        }),
        tx.internshipPlacement.findMany({
          where: {
            ...placementWhere,
            status: PlacementStatus.COMPLETED,
            updatedAt: { gte: trendRange.from, lt: trendRange.toExclusive },
          },
          select: { updatedAt: true },
        }),
        tx.internshipSkill.groupBy({
          by: ['skillId', 'isRequired'],
          where: { internship: nonCancelledInternshipWhere },
          _count: { _all: true },
          _sum: { weight: true },
        }),
      ]);

      const skillIds = [...new Set(skillRows.map((row) => row.skillId))];
      const skills = skillIds.length
        ? await tx.skill.findMany({
            where: { id: { in: skillIds } },
            select: { id: true, name: true },
          })
        : [];
      return {
        totalStudents,
        activeStudentUsers,
        totalLecturers,
        activeLecturerUsers,
        approvedCompanies,
        pendingCompanies,
        internshipCounts,
        slotTotals,
        totalApplications,
        acceptedApplications,
        applicantStudentRows,
        placementCounts,
        placedStudentRows,
        reportsAwaitingReview,
        applicationStatuses,
        placementStatuses,
        reportStatuses,
        unassignedPlacements,
        applicationTrendRows,
        placementTrendRows,
        completedPlacementTrendRows,
        skillRows,
        skills,
      };
    });

    const internships = this.countByStatus(data.internshipCounts);
    const placements = this.countByStatus(data.placementCounts);
    const slots = data.slotTotals._sum.slots ?? 0;
    const filledSlots = data.slotTotals._sum.filledSlots ?? 0;
    const applicantStudents = data.applicantStudentRows.length;
    const placedStudents = data.placedStudentRows.length;

    return {
      scope: {
        semester,
        months: query.months,
        from: trendRange.from,
        to: trendRange.to,
        generatedAt: new Date(),
      },
      global: {
        totalStudents: data.totalStudents,
        activeStudentUsers: data.activeStudentUsers,
        totalLecturers: data.totalLecturers,
        activeLecturerUsers: data.activeLecturerUsers,
        approvedCompanies: data.approvedCompanies,
        pendingCompanies: data.pendingCompanies,
      },
      kpis: {
        totalInternships: Object.values(internships).reduce(
          (sum, value) => sum + value,
          0,
        ),
        openInternships: internships[InternshipStatus.OPEN] ?? 0,
        totalSlots: slots,
        filledSlots,
        slotOccupancyRate: this.rate(filledSlots, slots),
        totalApplications: data.totalApplications,
        acceptedApplications: data.acceptedApplications,
        applicantStudents,
        totalPlacements: Object.values(placements).reduce(
          (sum, value) => sum + value,
          0,
        ),
        pendingPlacements: placements[PlacementStatus.PENDING] ?? 0,
        activePlacements: placements[PlacementStatus.ACTIVE] ?? 0,
        completedPlacements: placements[PlacementStatus.COMPLETED] ?? 0,
        cancelledPlacements: placements[PlacementStatus.CANCELLED] ?? 0,
        unassignedPlacements: data.unassignedPlacements,
        placedStudents,
        placementCoverageRate: this.rate(placedStudents, applicantStudents),
        reportsAwaitingReview: data.reportsAwaitingReview,
      },
      distributions: {
        applicationStatus: this.statusDistribution(
          APPLICATION_STATUSES,
          data.applicationStatuses,
        ),
        placementStatus: this.statusDistribution(
          PLACEMENT_STATUSES,
          data.placementStatuses,
        ),
        reportStatus: this.statusDistribution(
          REPORT_STATUSES,
          data.reportStatuses,
        ),
      },
      monthlyTrend: this.monthlyTrend(
        trendRange,
        data.applicationTrendRows.map((row) => row.appliedAt),
        data.placementTrendRows.map((row) => row.createdAt),
        data.completedPlacementTrendRows.map((row) => row.updatedAt),
      ),
      topSkills: this.topSkills(data.skillRows, data.skills),
    };
  }

  private countByStatus<T extends string>(
    rows: Array<{ status: T; _count: { _all: number } }>,
  ) {
    return Object.fromEntries(
      rows.map((row) => [row.status, row._count._all]),
    ) as Partial<Record<T, number>>;
  }

  private statusDistribution<T extends string>(
    statuses: T[],
    rows: Array<{ status: T; _count: { _all: number } }>,
  ) {
    const counts = this.countByStatus(rows);
    return statuses.map((status) => ({ status, count: counts[status] ?? 0 }));
  }

  private trendRange(months: number) {
    const now = new Date();
    const from = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - months + 1, 1),
    );
    const toExclusive = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    );
    const to = new Date(toExclusive.getTime() - 1);
    return { from, to, toExclusive, months };
  }

  private monthlyTrend(
    range: ReturnType<DashboardService['trendRange']>,
    applications: Date[],
    placements: Date[],
    completed: Date[],
  ) {
    const applicationCounts = this.monthCounts(applications);
    const placementCounts = this.monthCounts(placements);
    const completedCounts = this.monthCounts(completed);
    return Array.from({ length: range.months }, (_, index) => {
      const date = new Date(
        Date.UTC(
          range.from.getUTCFullYear(),
          range.from.getUTCMonth() + index,
          1,
        ),
      );
      const month = this.monthKey(date);
      return {
        month,
        label: `T${String(date.getUTCMonth() + 1).padStart(2, '0')}/${date.getUTCFullYear()}`,
        applications: applicationCounts.get(month) ?? 0,
        placements: placementCounts.get(month) ?? 0,
        completedPlacements: completedCounts.get(month) ?? 0,
      };
    });
  }

  private monthCounts(dates: Date[]) {
    return dates.reduce((counts, date) => {
      const key = this.monthKey(date);
      counts.set(key, (counts.get(key) ?? 0) + 1);
      return counts;
    }, new Map<string, number>());
  }

  private monthKey(date: Date) {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  private topSkills(
    rows: Array<{
      skillId: string;
      isRequired: boolean;
      _count: { _all: number };
      _sum: { weight: number | null };
    }>,
    skills: Array<{ id: string; name: string }>,
  ) {
    const skillNames = new Map(skills.map((skill) => [skill.id, skill.name]));
    const totals = new Map<
      string,
      { internshipCount: number; requiredCount: number; weightSum: number }
    >();
    for (const row of rows) {
      const total = totals.get(row.skillId) ?? {
        internshipCount: 0,
        requiredCount: 0,
        weightSum: 0,
      };
      total.internshipCount += row._count._all;
      total.requiredCount += row.isRequired ? row._count._all : 0;
      total.weightSum += row._sum.weight ?? 0;
      totals.set(row.skillId, total);
    }
    return [...totals.entries()]
      .map(([skillId, total]) => ({
        skillId,
        name: skillNames.get(skillId) ?? 'Unknown skill',
        ...total,
      }))
      .sort(
        (left, right) =>
          right.internshipCount - left.internshipCount ||
          right.requiredCount - left.requiredCount ||
          left.name.localeCompare(right.name),
      )
      .slice(0, 5);
  }

  private rate(numerator: number, denominator: number) {
    return denominator === 0
      ? 0
      : Math.round((numerator / denominator) * 1000) / 10;
  }
}
