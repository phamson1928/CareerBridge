import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ApplicationStatus, CompanyStatus, FileType, InternshipStatus, PlacementStatus, Role, SemesterStatus } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/types/auth-user.type';
import { CreateApplicationDto } from './dto/create-application.dto';
import { ListApplicationsQueryDto } from './dto/list-applications-query.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';

const applicationSelect = {
  id: true,
  studentId: true,
  internshipId: true,
  coverLetter: true,
  cvFileId: true,
  matchScore: true,
  status: true,
  companyFeedback: true,
  appliedAt: true,
  acceptedAt: true,
  rejectedAt: true,
  withdrawnAt: true,
  updatedAt: true,
  student: {
    select: {
      id: true,
      userId: true,
      studentCode: true,
      fullName: true,
      major: true,
      user: { select: { email: true, status: true } },
    },
  },
  internship: {
    select: {
      id: true,
      title: true,
      status: true,
      deadline: true,
      startDate: true,
      endDate: true,
      slots: true,
      filledSlots: true,
      company: { select: { id: true, companyName: true, userId: true } },
      semester: { select: { id: true, name: true, status: true, startDate: true, endDate: true } },
    },
  },
  placement: {
    select: {
      id: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  },
} satisfies Prisma.ApplicationSelect;

const applicationHistorySelect = {
  id: true,
  applicationId: true,
  fromStatus: true,
  toStatus: true,
  changedById: true,
  note: true,
  createdAt: true,
} satisfies Prisma.ApplicationStatusHistorySelect;

type ApplicationRecord = Prisma.ApplicationGetPayload<{ select: typeof applicationSelect }>;
type PrismaClientLike = PrismaService | Prisma.TransactionClient;

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateApplicationDto, user: AuthUser) {
    if (user.role !== Role.STUDENT) {
      throw new ForbiddenException({
        code: 'FORBIDDEN_ROLE',
        message: 'Only students can submit applications',
      });
    }

    const student = await this.getStudentByUserId(user.id);
    const internship = await this.getOpenInternship(dto.internshipId);
    this.ensureInternshipAcceptingApplications(internship);
    await this.ensureCvFileIsOwnedByStudent(dto.cvFileId, user.id);

    try {
      const application = await this.prisma.$transaction(async (tx) => {
        const created = await tx.application.create({
          data: {
            studentId: student.id,
            internshipId: internship.id,
            coverLetter: dto.coverLetter.trim(),
            cvFileId: dto.cvFileId,
            status: ApplicationStatus.PENDING,
          },
          select: applicationSelect,
        });

        await tx.applicationStatusHistory.create({
          data: {
            applicationId: created.id,
            fromStatus: null,
            toStatus: ApplicationStatus.PENDING,
            changedById: user.id,
            note: 'Application submitted',
          },
        });

        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: 'APPLICATION_CREATED',
            entity: 'Application',
            entityId: created.id,
            metadata: { internshipId: internship.id, studentId: student.id },
          },
        });

        return created;
      });

      return this.toResponse(application);
    } catch (error: unknown) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  async list(query: ListApplicationsQueryDto, user: AuthUser) {
    if (user.role === Role.STUDENT) return this.paginateByStudent(query, user.id);
    if (user.role === Role.COMPANY) return this.paginateByCompany(query, user.id);
    if (user.role === Role.ADMIN) return this.paginate(query, {});
    throw new ForbiddenException({
      code: 'FORBIDDEN_ROLE',
      message: 'This role cannot access application lists',
    });
  }

  async findMine(query: ListApplicationsQueryDto, user: AuthUser) {
    return this.list(query, user);
  }

  async findOne(id: string, user: AuthUser) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      select: applicationSelect,
    });
    if (!application) throw this.notFound();
    await this.ensureCanAccess(application, user);
    return this.toResponse(application);
  }

  async getHistory(id: string, user: AuthUser) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      select: applicationSelect,
    });
    if (!application) throw this.notFound();
    await this.ensureCanAccess(application, user);

    const history = await this.prisma.applicationStatusHistory.findMany({
      where: { applicationId: id },
      select: applicationHistorySelect,
      orderBy: { createdAt: 'asc' },
    });

    return history;
  }

  async updateStatus(id: string, dto: UpdateApplicationStatusDto, user: AuthUser) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        studentId: true,
        internshipId: true,
        companyFeedback: true,
        student: { select: { userId: true } },
        internship: {
          select: {
            id: true,
            title: true,
            status: true,
            deadline: true,
            startDate: true,
            endDate: true,
            slots: true,
            filledSlots: true,
            companyId: true,
            company: { select: { userId: true, status: true } },
            semesterId: true,
            semester: { select: { status: true } },
          },
        },
        placement: { select: { id: true, status: true } },
      },
    });

    if (!application) throw this.notFound();

    if (dto.status === ApplicationStatus.WITHDRAWN) {
      return this.withdraw(application.id, user, dto);
    }

    if (user.role !== Role.COMPANY && user.role !== Role.ADMIN) {
      throw new ForbiddenException({
        code: 'FORBIDDEN_ROLE',
        message: 'Only company users can review applications',
      });
    }

    await this.ensureCompanyCanReview(application.internship.company.userId, user);

    if (dto.status === ApplicationStatus.REVIEWING) {
      return this.transition(application.id, user, ApplicationStatus.REVIEWING, dto.companyFeedback ?? null);
    }

    if (dto.status === ApplicationStatus.REJECTED) {
      return this.transition(application.id, user, ApplicationStatus.REJECTED, dto.companyFeedback?.trim() ?? null);
    }

    if (dto.status === ApplicationStatus.ACCEPTED) {
      return this.accept(application.id, user, dto.companyFeedback?.trim() ?? null);
    }

    throw new BadRequestException({
      code: 'INVALID_APPLICATION_TRANSITION',
      message: 'This status transition is not supported',
    });
  }

  async withdraw(id: string, user: AuthUser, dto?: { companyFeedback?: string | null }) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        student: { select: { userId: true } },
        internship: { select: { semesterId: true } },
      },
    });
    if (!application) throw this.notFound();
    if (user.role !== Role.STUDENT || application.student.userId !== user.id) {
      throw new ForbiddenException({
        code: 'APPLICATION_NOT_ACCESSIBLE',
        message: 'You cannot withdraw this application',
      });
    }
    if (!this.isOpenApplicationStatus(application.status)) {
      throw new BadRequestException({
        code: 'INVALID_APPLICATION_TRANSITION',
        message: 'Only pending or reviewing applications can be withdrawn',
      });
    }

    return this.transition(application.id, user, ApplicationStatus.WITHDRAWN, dto?.companyFeedback ?? null);
  }

  private async accept(id: string, user: AuthUser, feedback: string | null) {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.application.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          studentId: true,
          internshipId: true,
          student: { select: { userId: true } },
          internship: {
            select: {
              id: true,
              companyId: true,
              semesterId: true,
              startDate: true,
              endDate: true,
              company: { select: { userId: true, status: true } },
              semester: { select: { status: true } },
            },
          },
          placement: { select: { id: true, status: true } },
        },
      });
      if (!current) throw this.notFound();
      await this.ensureCompanyCanReview(current.internship.company.userId, user, tx);

      if (current.status === ApplicationStatus.ACCEPTED && current.placement) {
        return this.toResponse(await tx.application.findUniqueOrThrow({ where: { id }, select: applicationSelect }));
      }

      if (!this.isOpenApplicationStatus(current.status)) {
        throw new BadRequestException({
          code: 'APPLICATION_ALREADY_FINALIZED',
          message: 'Only pending or reviewing applications can be accepted',
        });
      }

      await this.ensureSemesterActive(current.internship.semesterId, tx);
      await this.ensureStudentHasNoActivePlacement(
        current.studentId,
        current.internship.semesterId,
        tx,
      );
      await this.reserveInternshipSlot(current.internshipId, tx);

      const updated = await tx.application.update({
        where: { id },
        data: {
          status: ApplicationStatus.ACCEPTED,
          acceptedAt: new Date(),
          rejectedAt: null,
          withdrawnAt: null,
          companyFeedback: feedback,
        },
        select: applicationSelect,
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId: id,
          fromStatus: current.status,
          toStatus: ApplicationStatus.ACCEPTED,
          changedById: user.id,
          note: feedback ?? 'Application accepted',
        },
      });

      await tx.internshipPlacement.create({
        data: {
          applicationId: id,
          studentId: current.studentId,
          companyId: current.internship.companyId,
          internshipId: current.internshipId,
          semesterId: current.internship.semesterId,
          status: PlacementStatus.PENDING,
          startDate: current.internship.startDate,
          endDate: current.internship.endDate,
        },
      });

      await tx.conversation.upsert({
        where: { applicationId: id },
        create: {
          applicationId: id,
          studentId: current.studentId,
          companyId: current.internship.companyId,
        },
        update: {
          studentId: current.studentId,
          companyId: current.internship.companyId,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'APPLICATION_ACCEPTED',
          entity: 'Application',
          entityId: id,
          metadata: { feedback },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'PLACEMENT_CREATED',
          entity: 'InternshipPlacement',
          entityId: id,
          metadata: {
            applicationId: id,
            studentId: current.studentId,
            internshipId: current.internshipId,
            semesterId: current.internship.semesterId,
          },
        },
      });

      return updated;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  private async transition(id: string, user: AuthUser, toStatus: ApplicationStatus, note: string | null) {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.application.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          studentId: true,
          internshipId: true,
          student: { select: { userId: true } },
          internship: {
            select: {
              companyId: true,
              company: { select: { userId: true } },
              semesterId: true,
            },
          },
        },
      });
      if (!current) throw this.notFound();
      await this.ensureCanTransition(current.status, toStatus, user, current.student.userId, current.internship.company.userId);

      const updated = await tx.application.update({
        where: { id },
        data: {
          status: toStatus,
          companyFeedback: note ?? undefined,
          acceptedAt: toStatus === ApplicationStatus.ACCEPTED ? new Date() : undefined,
          rejectedAt: toStatus === ApplicationStatus.REJECTED ? new Date() : undefined,
          withdrawnAt: toStatus === ApplicationStatus.WITHDRAWN ? new Date() : undefined,
        },
        select: applicationSelect,
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId: id,
          fromStatus: current.status,
          toStatus,
          changedById: user.id,
          note,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'APPLICATION_STATUS_CHANGED',
          entity: 'Application',
          entityId: id,
          metadata: { fromStatus: current.status, toStatus, note },
        },
      });

      return updated;
    });
  }

  private async paginate(query: ListApplicationsQueryDto, where: Prisma.ApplicationWhereInput) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.application.findMany({
        where: query.status ? { ...where, status: query.status } : where,
        select: applicationSelect,
        orderBy: { appliedAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.application.count({
        where: query.status ? { ...where, status: query.status } : where,
      }),
    ]);

    return {
      items: items.map((item) => this.toResponse(item)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  private paginateByStudent(query: ListApplicationsQueryDto, userId: string) {
    return this.paginate(query, { student: { userId } });
  }

  private paginateByCompany(query: ListApplicationsQueryDto, userId: string) {
    return this.paginate(query, { internship: { company: { userId } } });
  }

  private async ensureCanAccess(
    application: { id: string; student: { userId: string }; internship: { company: { userId: string } } },
    user: AuthUser,
  ) {
    if (user.role === Role.ADMIN) return;
    if (user.role === Role.STUDENT && application.student.userId === user.id) return;
    if (user.role === Role.COMPANY && application.internship.company.userId === user.id) return;
    throw new ForbiddenException({
      code: 'APPLICATION_NOT_ACCESSIBLE',
      message: 'You cannot access this application',
    });
  }

  private async ensureCanTransition(
    fromStatus: ApplicationStatus,
    toStatus: ApplicationStatus,
    user: AuthUser,
    studentUserId: string,
    companyUserId: string,
  ) {
    if (toStatus === ApplicationStatus.WITHDRAWN) {
      if (user.role !== Role.STUDENT || user.id !== studentUserId) {
        throw new ForbiddenException({
          code: 'APPLICATION_NOT_ACCESSIBLE',
          message: 'Only the owning student can withdraw the application',
        });
      }
      if (!this.isOpenApplicationStatus(fromStatus)) {
        throw new BadRequestException({
          code: 'INVALID_APPLICATION_TRANSITION',
          message: 'Only pending or reviewing applications can be withdrawn',
        });
      }
      return;
    }

    if (user.role !== Role.COMPANY && user.role !== Role.ADMIN) {
      throw new ForbiddenException({
        code: 'FORBIDDEN_ROLE',
        message: 'Only company users can review applications',
      });
    }
    if (user.role === Role.COMPANY && user.id !== companyUserId) {
      throw new ForbiddenException({
        code: 'APPLICATION_NOT_ACCESSIBLE',
        message: 'You cannot review this application',
      });
    }
    if (!this.isOpenApplicationStatus(fromStatus)) {
      throw new BadRequestException({
        code: 'APPLICATION_ALREADY_FINALIZED',
        message: 'This application is already finalized',
      });
    }
  }

  private async ensureCompanyCanReview(
    companyUserId: string,
    user: AuthUser,
    tx: PrismaClientLike = this.prisma,
  ) {
    const company = await tx.companyProfile.findUnique({
      where: { userId: companyUserId },
      select: { id: true, status: true, userId: true },
    });
    if (!company) {
      throw new NotFoundException({
        code: 'COMPANY_PROFILE_NOT_FOUND',
        message: 'Company profile not found',
      });
    }
    if (company.status !== CompanyStatus.APPROVED) {
      throw new ForbiddenException({
        code: 'COMPANY_NOT_APPROVED',
        message: 'Company must be approved before reviewing applications',
      });
    }
    if (user.role === Role.COMPANY && company.userId !== user.id) {
      throw new ForbiddenException({
        code: 'APPLICATION_NOT_ACCESSIBLE',
        message: 'You cannot review this application',
      });
    }
  }

  private async ensureSemesterActive(
    semesterId: string,
    tx: PrismaClientLike = this.prisma,
  ) {
    const semester = await tx.semester.findUnique({
      where: { id: semesterId },
      select: { status: true },
    });
    if (!semester) {
      throw new NotFoundException({
        code: 'SEMESTER_NOT_FOUND',
        message: 'Semester not found',
      });
    }
    if (semester.status !== SemesterStatus.ACTIVE) {
      throw new BadRequestException({
        code: 'SEMESTER_NOT_ACTIVE',
        message: 'Semester must be active before accepting applications',
      });
    }
  }

  private async ensureStudentHasNoActivePlacement(
    studentId: string,
    semesterId: string,
    tx: PrismaClientLike = this.prisma,
  ) {
    const existing = await tx.internshipPlacement.findFirst({
      where: {
        studentId,
        semesterId,
        status: { in: [PlacementStatus.PENDING, PlacementStatus.ACTIVE] },
      },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException({
        code: 'STUDENT_ALREADY_PLACED_IN_SEMESTER',
        message: 'Student already has a pending or active placement in this semester',
      });
    }
  }

  private isOpenApplicationStatus(status: ApplicationStatus) {
    return (
      status === ApplicationStatus.PENDING ||
      status === ApplicationStatus.REVIEWING
    );
  }

  private async reserveInternshipSlot(internshipId: string, tx: Prisma.TransactionClient) {
    const updated = await tx.$executeRaw`
      UPDATE "Internship"
      SET "filledSlots" = "filledSlots" + 1
      WHERE "id" = ${internshipId}
        AND "status" = ${InternshipStatus.OPEN}
        AND "filledSlots" < "slots"
    `;
    if (Number(updated) !== 1) {
      throw new ConflictException({
        code: 'INTERNSHIP_NO_AVAILABLE_SLOTS',
        message: 'Internship has no available slots',
      });
    }
  }

  private async getStudentByUserId(userId: string) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId },
      select: { id: true, userId: true },
    });
    if (!student) {
      throw new NotFoundException({
        code: 'STUDENT_PROFILE_NOT_FOUND',
        message: 'Student profile not found',
      });
    }
    return student;
  }

  private async ensureCvFileIsOwnedByStudent(cvFileId: string, userId: string) {
    const cvFile = await this.prisma.file.findUnique({
      where: { id: cvFileId },
      select: { ownerId: true, type: true },
    });
    if (!cvFile) {
      throw new NotFoundException({
        code: 'CV_FILE_NOT_FOUND',
        message: 'CV file not found',
      });
    }
    if (cvFile.ownerId !== userId || cvFile.type !== FileType.CV) {
      throw new ForbiddenException({
        code: 'INVALID_CV_FILE',
        message: 'The application CV must belong to the current student',
      });
    }
  }

  private async getOpenInternship(internshipId: string) {
    const internship = await this.prisma.internship.findUnique({
      where: { id: internshipId },
      select: {
        id: true,
        title: true,
        status: true,
        deadline: true,
        companyId: true,
        semesterId: true,
        startDate: true,
        endDate: true,
        company: { select: { status: true } },
      },
    });
    if (!internship) {
      throw new NotFoundException({
        code: 'INTERNSHIP_NOT_FOUND',
        message: 'Internship not found',
      });
    }
    return internship;
  }

  private ensureInternshipAcceptingApplications(internship: {
    status: InternshipStatus;
    deadline: Date | null;
    company: { status: CompanyStatus };
  }) {
    if (internship.status !== InternshipStatus.OPEN) {
      throw new BadRequestException({
        code: 'INTERNSHIP_NOT_OPEN',
        message: 'Only open internships accept applications',
      });
    }
    if (internship.deadline && internship.deadline <= new Date()) {
      throw new BadRequestException({
        code: 'INTERNSHIP_DEADLINE_PASSED',
        message: 'The internship deadline has passed',
      });
    }
    if (internship.company.status !== CompanyStatus.APPROVED) {
      throw new ForbiddenException({
        code: 'COMPANY_NOT_APPROVED',
        message: 'Company must be approved before receiving applications',
      });
    }
  }

  private toResponse(record: ApplicationRecord) {
    return record;
  }

  private notFound() {
    return new NotFoundException({
      code: 'APPLICATION_NOT_FOUND',
      message: 'Application not found',
    });
  }

  private rethrowKnownDatabaseError(error: unknown): never {
    if (this.isPrismaError(error, 'P2002')) {
      throw new ConflictException({
        code: 'APPLICATION_ALREADY_EXISTS',
        message: 'You have already applied for this internship',
      });
    }
    if (this.isPrismaError(error, 'P2025')) throw this.notFound();
    throw error;
  }

  private isPrismaError(error: unknown, code: string): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === code
    );
  }
}
