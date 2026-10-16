import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
import { CompanyDashboardQueryDto } from './dto/company-dashboard-query.dto';

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

  async getCompanyDashboard(userId: string, query: CompanyDashboardQueryDto) {
    const company = await this.prisma.companyProfile.findUnique({
      where: { userId },
      select: { id: true, status: true, companyName: true },
    });
    if (!company) {
      throw new NotFoundException({
        code: 'COMPANY_PROFILE_NOT_FOUND',
        message: 'Hồ sơ doanh nghiệp không tồn tại',
      });
    }

    if (
      company.status !== CompanyStatus.APPROVED &&
      company.status !== CompanyStatus.SUSPENDED
    ) {
      throw new ForbiddenException({
        code: 'COMPANY_STATS_FORBIDDEN',
        message:
          'Chỉ doanh nghiệp đã được phê duyệt hoặc đang tạm dừng mới có thể xem thống kê tuyển dụng',
      });
    }

    const semester = query.semesterId
      ? await this.prisma.semester.findUnique({
          where: { id: query.semesterId },
          select: { id: true, name: true },
        })
      : null;
    if (query.semesterId && !semester) {
      throw new NotFoundException({
        code: 'SEMESTER_NOT_FOUND',
        message: 'Học kỳ không tồn tại',
      });
    }

    const internshipWhere: Prisma.InternshipWhereInput = {
      companyId: company.id,
      ...(semester ? { semesterId: semester.id } : {}),
    };

    const allInternships = await this.prisma.internship.findMany({
      where: internshipWhere,
      select: {
        id: true,
        title: true,
        status: true,
        semesterId: true,
        semester: { select: { name: true } },
        slots: true,
        filledSlots: true,
        viewCount: true,
        uniqueViewerCount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalInternships = allInternships.length;
    let openInternships = 0;
    let closedInternships = 0;
    let draftInternships = 0;
    let cancelledInternships = 0;
    let totalSlots = 0;
    let filledSlots = 0;
    let totalViews = 0;
    let uniqueViewers = 0;

    for (const job of allInternships) {
      if (job.status === InternshipStatus.OPEN) openInternships++;
      else if (job.status === InternshipStatus.CLOSED) closedInternships++;
      else if (job.status === InternshipStatus.DRAFT) draftInternships++;
      else if (job.status === InternshipStatus.CANCELLED) cancelledInternships++;

      totalSlots += job.slots;
      filledSlots += job.filledSlots;
      totalViews += job.viewCount;
      uniqueViewers += job.uniqueViewerCount;
    }

    const fillRate =
      totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 1000) / 1000 : 0;

    const internshipIds = allInternships.map((i) => i.id);

    const applications =
      internshipIds.length > 0
        ? await this.prisma.application.findMany({
            where: { internshipId: { in: internshipIds } },
            select: {
              id: true,
              studentId: true,
              internshipId: true,
              status: true,
              appliedAt: true,
              acceptedAt: true,
              rejectedAt: true,
              withdrawnAt: true,
              matchScore: true,
              statusHistory: {
                select: { toStatus: true },
              },
            },
          })
        : [];

    const totalApplications = applications.length;
    const applicationsByStatus: Record<ApplicationStatus, number> = {
      PENDING: 0,
      REVIEWING: 0,
      ACCEPTED: 0,
      REJECTED: 0,
      WITHDRAWN: 0,
    };

    const hoursToAcceptList: number[] = [];
    const hoursToDecisionList: number[] = [];
    let everReviewingCount = 0;

    for (const app of applications) {
      applicationsByStatus[app.status]++;

      const hasReviewHistory =
        app.statusHistory.some(
          (h) => h.toStatus === ApplicationStatus.REVIEWING,
        ) ||
        app.status === ApplicationStatus.REVIEWING ||
        app.status === ApplicationStatus.ACCEPTED ||
        app.status === ApplicationStatus.REJECTED;

      if (hasReviewHistory) {
        everReviewingCount++;
      }

      if (app.status === ApplicationStatus.ACCEPTED && app.acceptedAt) {
        const diffHours =
          (app.acceptedAt.getTime() - app.appliedAt.getTime()) / (3600 * 1000);
        if (diffHours >= 0) {
          hoursToAcceptList.push(diffHours);
          hoursToDecisionList.push(diffHours);
        }
      } else if (app.status === ApplicationStatus.REJECTED && app.rejectedAt) {
        const diffHours =
          (app.rejectedAt.getTime() - app.appliedAt.getTime()) / (3600 * 1000);
        if (diffHours >= 0) {
          hoursToDecisionList.push(diffHours);
        }
      }
    }

    const avgHoursToAccept =
      hoursToAcceptList.length > 0
        ? Math.round(
            (hoursToAcceptList.reduce((a, b) => a + b, 0) /
              hoursToAcceptList.length) *
              10,
          ) / 10
        : null;

    const avgHoursToDecision =
      hoursToDecisionList.length > 0
        ? Math.round(
            (hoursToDecisionList.reduce((a, b) => a + b, 0) /
              hoursToDecisionList.length) *
              10,
          ) / 10
        : null;

    const applied = totalApplications;
    const accepted = applicationsByStatus.ACCEPTED;
    const rejected = applicationsByStatus.REJECTED;
    const withdrawn = applicationsByStatus.WITHDRAWN;

    const reviewRate =
      applied > 0 ? Math.round((everReviewingCount / applied) * 1000) / 1000 : null;
    const acceptRate =
      applied > 0 ? Math.round((accepted / applied) * 1000) / 1000 : null;
    const rejectRate =
      applied > 0 ? Math.round((rejected / applied) * 1000) / 1000 : null;
    const withdrawRate =
      applied > 0 ? Math.round((withdrawn / applied) * 1000) / 1000 : null;
    const acceptGivenReview =
      everReviewingCount > 0
        ? Math.round((accepted / everReviewingCount) * 1000) / 1000
        : null;

    // Applicant Skills (top 10 distinct)
    const distinctStudentIds = Array.from(
      new Set(applications.map((a) => a.studentId)),
    );
    let applicantSkills: Array<{
      skillId: string;
      name: string;
      applicantCount: number;
      share: number;
    }> = [];

    if (distinctStudentIds.length > 0) {
      const studentSkills = await this.prisma.studentSkill.findMany({
        where: { studentId: { in: distinctStudentIds } },
        select: {
          studentId: true,
          skillId: true,
          skill: { select: { id: true, name: true } },
        },
      });

      const skillMap = new Map<
        string,
        { skillId: string; name: string; studentIds: Set<string> }
      >();
      for (const ss of studentSkills) {
        if (!skillMap.has(ss.skillId)) {
          skillMap.set(ss.skillId, {
            skillId: ss.skillId,
            name: ss.skill.name,
            studentIds: new Set(),
          });
        }
        skillMap.get(ss.skillId)!.studentIds.add(ss.studentId);
      }

      applicantSkills = Array.from(skillMap.values())
        .map((s) => ({
          skillId: s.skillId,
          name: s.name,
          applicantCount: s.studentIds.size,
          share:
            Math.round(
              (s.studentIds.size / distinctStudentIds.length) * 1000,
            ) / 1000,
        }))
        .sort(
          (a, b) =>
            b.applicantCount - a.applicantCount ||
            a.name.localeCompare(b.name),
        )
        .slice(0, 10);
    }

    // Per Internship list with pagination
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const totalPages = Math.ceil(totalInternships / limit) || 1;
    const pagedInternships = allInternships.slice(
      (page - 1) * limit,
      page * limit,
    );

    const appByJobMap = new Map<
      string,
      { total: number; accepted: number }
    >();
    for (const app of applications) {
      const current = appByJobMap.get(app.internshipId) || {
        total: 0,
        accepted: 0,
      };
      current.total++;
      if (app.status === ApplicationStatus.ACCEPTED) current.accepted++;
      appByJobMap.set(app.internshipId, current);
    }

    const perInternshipItems = pagedInternships.map((job) => {
      const jobStats = appByJobMap.get(job.id) || { total: 0, accepted: 0 };
      const jobFillRate =
        job.slots > 0 ? Math.round((job.filledSlots / job.slots) * 1000) / 1000 : 0;
      const jobAcceptRate =
        jobStats.total > 0
          ? Math.round((jobStats.accepted / jobStats.total) * 1000) / 1000
          : null;

      return {
        id: job.id,
        title: job.title,
        status: job.status,
        semesterId: job.semesterId,
        semesterName: job.semester?.name,
        views: job.viewCount,
        uniqueViewers: job.uniqueViewerCount,
        applications: jobStats.total,
        filledSlots: job.filledSlots,
        slots: job.slots,
        fillRate: jobFillRate,
        acceptRate: jobAcceptRate,
      };
    });

    return {
      kpis: {
        totalInternships,
        openInternships,
        closedInternships,
        draftInternships,
        cancelledInternships,
        totalSlots,
        filledSlots,
        fillRate,
        totalViews,
        uniqueViewers,
        totalApplications,
        applicationsByStatus,
        avgHoursToAccept,
        avgHoursToDecision,
      },
      funnel: {
        applied,
        everReviewing: everReviewingCount,
        accepted,
        rejected,
        withdrawn,
        reviewRate,
        acceptRate,
        rejectRate,
        withdrawRate,
        acceptGivenReview,
      },
      applicantSkills,
      perInternship: {
        items: perInternshipItems,
        meta: {
          page,
          limit,
          total: totalInternships,
          totalPages,
        },
        pagination: {
          page,
          limit,
          total: totalInternships,
          totalPages,
        },
      },
    };
  }

  async getCompanyInternshipStats(userId: string, id: string) {
    const company = await this.prisma.companyProfile.findUnique({
      where: { userId },
      select: { id: true, status: true },
    });
    if (!company) {
      throw new NotFoundException({
        code: 'COMPANY_PROFILE_NOT_FOUND',
        message: 'Hồ sơ doanh nghiệp không tồn tại',
      });
    }

    if (
      company.status !== CompanyStatus.APPROVED &&
      company.status !== CompanyStatus.SUSPENDED
    ) {
      throw new ForbiddenException({
        code: 'COMPANY_STATS_FORBIDDEN',
        message:
          'Chỉ doanh nghiệp đã được phê duyệt hoặc đang tạm dừng mới có thể xem thống kê tuyển dụng',
      });
    }

    const internship = await this.prisma.internship.findUnique({
      where: { id },
      select: {
        id: true,
        companyId: true,
        title: true,
        status: true,
        semesterId: true,
        semester: { select: { name: true } },
        department: true,
        location: true,
        workType: true,
        slots: true,
        filledSlots: true,
        viewCount: true,
        uniqueViewerCount: true,
        createdAt: true,
        skills: {
          select: {
            skillId: true,
            isRequired: true,
            skill: { select: { name: true } },
          },
          orderBy: { skill: { name: 'asc' } },
        },
      },
    });

    if (!internship || internship.companyId !== company.id) {
      throw new NotFoundException({
        code: 'INTERNSHIP_NOT_FOUND',
        message: 'Bài đăng tuyển dụng không tìm thấy',
      });
    }

    const applications = await this.prisma.application.findMany({
      where: { internshipId: id },
      select: {
        id: true,
        studentId: true,
        status: true,
        appliedAt: true,
        acceptedAt: true,
        rejectedAt: true,
        withdrawnAt: true,
        matchScore: true,
        statusHistory: {
          select: { toStatus: true },
        },
      },
    });

    const totalApplications = applications.length;
    const applicationsByStatus: Record<ApplicationStatus, number> = {
      PENDING: 0,
      REVIEWING: 0,
      ACCEPTED: 0,
      REJECTED: 0,
      WITHDRAWN: 0,
    };

    const hoursToAcceptList: number[] = [];
    const hoursToDecisionList: number[] = [];
    let everReviewingCount = 0;

    for (const app of applications) {
      applicationsByStatus[app.status]++;

      const hasReviewHistory =
        app.statusHistory.some(
          (h) => h.toStatus === ApplicationStatus.REVIEWING,
        ) ||
        app.status === ApplicationStatus.REVIEWING ||
        app.status === ApplicationStatus.ACCEPTED ||
        app.status === ApplicationStatus.REJECTED;

      if (hasReviewHistory) {
        everReviewingCount++;
      }

      if (app.status === ApplicationStatus.ACCEPTED && app.acceptedAt) {
        const diffHours =
          (app.acceptedAt.getTime() - app.appliedAt.getTime()) / (3600 * 1000);
        if (diffHours >= 0) {
          hoursToAcceptList.push(diffHours);
          hoursToDecisionList.push(diffHours);
        }
      } else if (app.status === ApplicationStatus.REJECTED && app.rejectedAt) {
        const diffHours =
          (app.rejectedAt.getTime() - app.appliedAt.getTime()) / (3600 * 1000);
        if (diffHours >= 0) {
          hoursToDecisionList.push(diffHours);
        }
      }
    }

    const avgHoursToAccept =
      hoursToAcceptList.length > 0
        ? Math.round(
            (hoursToAcceptList.reduce((a, b) => a + b, 0) /
              hoursToAcceptList.length) *
              10,
          ) / 10
        : null;

    const avgHoursToDecision =
      hoursToDecisionList.length > 0
        ? Math.round(
            (hoursToDecisionList.reduce((a, b) => a + b, 0) /
              hoursToDecisionList.length) *
              10,
          ) / 10
        : null;

    const applied = totalApplications;
    const accepted = applicationsByStatus.ACCEPTED;
    const rejected = applicationsByStatus.REJECTED;
    const withdrawn = applicationsByStatus.WITHDRAWN;

    const reviewRate =
      applied > 0 ? Math.round((everReviewingCount / applied) * 1000) / 1000 : null;
    const acceptRate =
      applied > 0 ? Math.round((accepted / applied) * 1000) / 1000 : null;
    const rejectRate =
      applied > 0 ? Math.round((rejected / applied) * 1000) / 1000 : null;
    const withdrawRate =
      applied > 0 ? Math.round((withdrawn / applied) * 1000) / 1000 : null;
    const acceptGivenReview =
      everReviewingCount > 0
        ? Math.round((accepted / everReviewingCount) * 1000) / 1000
        : null;

    // Student Skills Coverage & Top Skills
    const distinctStudentIds = Array.from(
      new Set(applications.map((a) => a.studentId)),
    );

    let studentSkills: Array<{
      studentId: string;
      skillId: string;
      skill: { id: string; name: string };
    }> = [];

    if (distinctStudentIds.length > 0) {
      studentSkills = await this.prisma.studentSkill.findMany({
        where: { studentId: { in: distinctStudentIds } },
        select: {
          studentId: true,
          skillId: true,
          skill: { select: { id: true, name: true } },
        },
      });
    }

    const skillToStudentsMap = new Map<string, Set<string>>();
    for (const ss of studentSkills) {
      if (!skillToStudentsMap.has(ss.skillId)) {
        skillToStudentsMap.set(ss.skillId, new Set());
      }
      skillToStudentsMap.get(ss.skillId)!.add(ss.studentId);
    }

    // Required Skill Coverage
    const requiredSkillCoverage = internship.skills.map((s) => {
      const applicantHaveCount = skillToStudentsMap.get(s.skillId)?.size || 0;
      const applicantHaveRate =
        totalApplications > 0
          ? Math.round((applicantHaveCount / totalApplications) * 1000) / 1000
          : null;

      return {
        skillId: s.skillId,
        name: s.skill.name,
        isRequired: s.isRequired,
        applicantHaveCount,
        applicantHaveRate,
      };
    });

    // Top Applicant Skills (top 10)
    const skillNameMap = new Map<string, string>();
    for (const ss of studentSkills) {
      skillNameMap.set(ss.skillId, ss.skill.name);
    }

    const topApplicantSkills = Array.from(skillToStudentsMap.entries())
      .map(([skillId, studentSet]) => ({
        skillId,
        name: skillNameMap.get(skillId) || skillId,
        applicantCount: studentSet.size,
        share:
          distinctStudentIds.length > 0
            ? Math.round(
                (studentSet.size / distinctStudentIds.length) * 1000,
              ) / 1000
            : 0,
      }))
      .sort(
        (a, b) =>
          b.applicantCount - a.applicantCount ||
          a.name.localeCompare(b.name),
      )
      .slice(0, 10);

    // Match Score
    const matchScores = applications
      .map((a) => a.matchScore)
      .filter((s): s is number => s !== null && s !== undefined);

    const matchScore =
      matchScores.length > 0
        ? {
            avg:
              Math.round(
                (matchScores.reduce((a, b) => a + b, 0) /
                  matchScores.length) *
                  10,
              ) / 10,
            min: Math.min(...matchScores),
            max: Math.max(...matchScores),
            counted: matchScores.length,
          }
        : { avg: null, min: null, max: null, counted: 0 };

    const fillRate =
      internship.slots > 0
        ? Math.round((internship.filledSlots / internship.slots) * 100) / 100
        : 0;

    return {
      internship: {
        id: internship.id,
        title: internship.title,
        status: internship.status,
        semesterId: internship.semesterId,
        semesterName: internship.semester?.name,
        department: internship.department,
        location: internship.location,
        workType: internship.workType,
        slots: internship.slots,
        filledSlots: internship.filledSlots,
        fillRate,
        viewCount: internship.viewCount,
        uniqueViewerCount: internship.uniqueViewerCount,
        createdAt: internship.createdAt,
      },
      kpis: {
        totalSlots: internship.slots,
        filledSlots: internship.filledSlots,
        fillRate,
        views: internship.viewCount,
        uniqueViewers: internship.uniqueViewerCount,
        totalApplications,
        applicationsByStatus,
        avgHoursToAccept,
        avgHoursToDecision,
      },
      funnel: {
        applied,
        everReviewing: everReviewingCount,
        accepted,
        rejected,
        withdrawn,
        reviewRate,
        acceptRate,
        rejectRate,
        withdrawRate,
        acceptGivenReview,
      },
      requiredSkillCoverage,
      topApplicantSkills,
      matchScore,
    };
  }
}
