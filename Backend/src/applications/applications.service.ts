import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  AiScanStatus,
  ApplicationStatus,
  CompanyStatus,
  EmailLogStatus,
  EmailLogType,
  FileType,
  InternshipStatus,
  InterviewMode,
  Role,
  SemesterStatus,
  PlacementStatus,
  NotificationAction,
  NotificationType,
} from '../generated/prisma/client';
import { randomUUID } from 'node:crypto';
import { PlacementsService } from '../placements/placements.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/types/auth-user.type';
import { CreateApplicationDto } from './dto/create-application.dto';
import { ListApplicationsQueryDto } from './dto/list-applications-query.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { ScheduleInterviewDto } from './dto/schedule-interview.dto';
import { SendOfferDto } from './dto/send-offer.dto';
import { RejectApplicationDto } from './dto/reject-application.dto';
import {
  EmailPreviewKind,
  EmailPreviewQueryDto,
} from './dto/email-preview-query.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { SemesterLifecycleService } from '../semesters/semester-lifecycle.service';
import { MailerService } from '../mailer/mailer.service';
import { calculateSkillMatch } from '../skills/skill-match.calculator';

const DAY_MS = 24 * 60 * 60 * 1000;

const applicationSelect = {
  id: true,
  studentId: true,
  internshipId: true,
  coverLetter: true,
  cvFileId: true,
  cvFile: {
    select: {
      id: true,
      originalName: true,
      mimeType: true,
      sizeBytes: true,
    },
  },
  matchScore: true,
  aiScore: true,
  status: true,
  companyFeedback: true,
  rejectionReason: true,
  offeredAt: true,
  offerExpiresAt: true,
  offerMessage: true,
  respondedAt: true,
  appliedAt: true,
  acceptedAt: true,
  rejectedAt: true,
  withdrawnAt: true,
  hiddenByStudentAt: true,
  hiddenByCompanyAt: true,
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
      company: {
        select: {
          id: true,
          companyName: true,
          contactEmail: true,
          contactPersonName: true,
          contactPhone: true,
          address: true,
          userId: true,
          user: { select: { email: true } },
        },
      },
      semester: {
        select: {
          id: true,
          name: true,
          status: true,
          startDate: true,
          endDate: true,
        },
      },
    },
  },
  interview: {
    select: {
      id: true,
      scheduledAt: true,
      mode: true,
      meetingLink: true,
      location: true,
      contactName: true,
      contactEmail: true,
      contactPhone: true,
      note: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  emailLogs: {
    select: {
      id: true,
      type: true,
      to: true,
      subject: true,
      status: true,
      error: true,
      sentAt: true,
    },
    orderBy: { sentAt: 'desc' },
    take: 5,
  },
  placement: {
    select: {
      id: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  aiScanJob: {
    select: {
      id: true,
      status: true,
      aiScore: true,
      recommendation: true,
      experienceYears: true,
      extractedSkills: true,
      matchedSkills: true,
      missingSkills: true,
      strengths: true,
      weaknesses: true,
      summary: true,
      attempts: true,
      maxAttempts: true,
      errorDetails: true,
      completedAt: true,
      createdAt: true,
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

type ApplicationRecord = Prisma.ApplicationGetPayload<{
  select: typeof applicationSelect;
}>;
type PrismaClientLike = PrismaService | Prisma.TransactionClient;

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly placementsService: PlacementsService,
    private readonly notifications: NotificationsService,
    private readonly lifecycle: SemesterLifecycleService,
    private readonly mailer: MailerService,
  ) {}

  async create(dto: CreateApplicationDto, user: AuthUser) {
    if (user.role !== Role.STUDENT) {
      throw new ForbiddenException({
        code: 'FORBIDDEN_ROLE',
        message: 'Only students can submit applications',
      });
    }

    const student = await this.getStudentByUserId(user.id);
    await this.lifecycle.reconcile();
    const internship = await this.getOpenInternship(dto.internshipId);
    this.ensureInternshipAcceptingApplications(internship);
    await this.ensureCvFileIsOwnedByStudent(dto.cvFileId, user.id);

    const existingPlacement = await this.prisma.internshipPlacement.findFirst({
      where: {
        studentId: student.id,
        semesterId: internship.semesterId,
        status: { in: [PlacementStatus.PENDING, PlacementStatus.ACTIVE] },
      },
      select: { id: true },
    });
    if (existingPlacement) {
      throw new ConflictException({
        code: 'STUDENT_ALREADY_PLACED_IN_SEMESTER',
        message:
          'Bạn đã có vị trí thực tập trong đợt này nên không thể nộp thêm đơn mới.',
      });
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const [studentSkills, internshipSkills] = await Promise.all([
          tx.studentSkill.findMany({
            where: { studentId: student.id },
            select: { skillId: true, level: true },
          }),
          tx.internshipSkill.findMany({
            where: { internshipId: internship.id },
            select: {
              skillId: true,
              isRequired: true,
              weight: true,
              skill: { select: { name: true } },
            },
          }),
        ]);
        const skillMatch = calculateSkillMatch(
          studentSkills,
          internshipSkills.map(({ skill, ...requirement }) => ({
            ...requirement,
            name: skill.name,
          })),
        );

        const existingApp = await tx.application.findUnique({
          where: {
            studentId_internshipId: {
              studentId: student.id,
              internshipId: internship.id,
            },
          },
          select: { id: true, status: true },
        });

        if (existingApp && existingApp.status !== ApplicationStatus.WITHDRAWN) {
          throw new ConflictException({
            code: 'APPLICATION_ALREADY_EXISTS',
            message: 'You have already applied for this internship',
          });
        }

        let created: ApplicationRecord;
        if (existingApp) {
          await tx.applicationInterview.deleteMany({
            where: { applicationId: existingApp.id },
          });
          created = await tx.application.update({
            where: { id: existingApp.id },
            data: {
              coverLetter: dto.coverLetter.trim(),
              cvFileId: dto.cvFileId,
              matchScore: skillMatch.percentage,
              aiScore: null,
              status: ApplicationStatus.PENDING,
              appliedAt: new Date(),
              withdrawnAt: null,
              rejectedAt: null,
              acceptedAt: null,
              offeredAt: null,
              offerExpiresAt: null,
              offerMessage: null,
              offerReminderSentAt: null,
              respondedAt: null,
              rejectionReason: null,
              companyFeedback: null,
              hiddenByStudentAt: null,
              hiddenByCompanyAt: null,
            },
            select: applicationSelect,
          });

          if (internship.company.autoAiScanEnabled && dto.cvFileId) {
            await tx.aiScanJob.upsert({
              where: { applicationId: created.id },
              create: {
                applicationId: created.id,
                companyId: internship.company.id,
                status: AiScanStatus.PENDING,
              },
              update: {
                status: AiScanStatus.PENDING,
                attempts: 0,
                lockedUntil: null,
                lockedByWorkerId: null,
                errorDetails: null,
                aiScore: null,
                recommendation: null,
                experienceYears: null,
                extractedSkills: [],
                matchedSkills: [],
                missingSkills: [],
                strengths: [],
                weaknesses: [],
                summary: null,
                completedAt: null,
              },
            });
          }
        } else {
          created = await tx.application.create({
            data: {
              studentId: student.id,
              internshipId: internship.id,
              coverLetter: dto.coverLetter.trim(),
              cvFileId: dto.cvFileId,
              matchScore: skillMatch.percentage,
              status: ApplicationStatus.PENDING,
            },
            select: applicationSelect,
          });

          if (internship.company.autoAiScanEnabled && dto.cvFileId) {
            await tx.aiScanJob.create({
              data: {
                applicationId: created.id,
                companyId: internship.company.id,
                status: AiScanStatus.PENDING,
              },
            });
          }
        }

        await tx.applicationStatusHistory.create({
          data: {
            applicationId: created.id,
            fromStatus: existingApp ? ApplicationStatus.WITHDRAWN : null,
            toStatus: ApplicationStatus.PENDING,
            changedById: user.id,
            note: existingApp
              ? 'Application re-submitted after withdrawal'
              : 'Application submitted',
          },
        });

        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: existingApp
              ? 'APPLICATION_RESUBMITTED'
              : 'APPLICATION_CREATED',
            entity: 'Application',
            entityId: created.id,
            metadata: { internshipId: internship.id, studentId: student.id },
          },
        });

        const notification = await this.notifications.createInTransaction(tx, {
          userId: internship.company.userId,
          eventKey: existingApp
            ? `application:${created.id}:resubmitted:${Date.now()}`
            : `application:${created.id}:submitted:${internship.company.userId}`,
          type: NotificationType.APPLICATION,
          action: NotificationAction.OPEN_APPLICATION,
          title: existingApp
            ? 'Ứng viên nộp lại hồ sơ ứng tuyển'
            : 'Có hồ sơ ứng tuyển mới',
          content: existingApp
            ? `Ứng viên ${created.student.fullName} đã cập nhật và nộp lại hồ sơ ứng tuyển cho vị trí "${internship.title}".`
            : `Ứng viên ${created.student.fullName} vừa nộp hồ sơ ứng tuyển cho vị trí "${internship.title}".`,
          resourceId: created.id,
          metadata: { internshipId: internship.id },
        });
        return { application: created, notifications: [notification] };
      });

      this.notifications.publishMany(result.notifications);
      return this.toResponse(result.application);
    } catch (error: unknown) {
      this.rethrowKnownDatabaseError(error);
    }
  }

  async list(query: ListApplicationsQueryDto, user: AuthUser) {
    await this.lifecycle.reconcile();
    if (user.role === Role.STUDENT)
      return this.paginateByStudent(query, user.id);
    if (user.role === Role.COMPANY)
      return this.paginateByCompany(query, user.id);
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
    await this.lifecycle.reconcile();
    const application = await this.prisma.application.findUnique({
      where: { id },
      select: applicationSelect,
    });
    if (!application) throw this.notFound();
    this.ensureCanAccess(application, user);
    return this.toResponse(application);
  }

  async getHistory(id: string, user: AuthUser) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      select: applicationSelect,
    });
    if (!application) throw this.notFound();
    this.ensureCanAccess(application, user);

    const history = await this.prisma.applicationStatusHistory.findMany({
      where: { applicationId: id },
      select: applicationHistorySelect,
      orderBy: { createdAt: 'asc' },
    });

    return history;
  }

  async updateStatus(
    id: string,
    dto: UpdateApplicationStatusDto,
    user: AuthUser,
  ) {
    await this.lifecycle.reconcile();
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

    await this.ensureCompanyCanReview(
      application.internship.company.userId,
      user,
    );

    if (dto.status === ApplicationStatus.REVIEWING) {
      return this.transition(
        application.id,
        user,
        ApplicationStatus.REVIEWING,
        dto.companyFeedback ?? null,
      );
    }

    throw new BadRequestException({
      code: 'USE_DEDICATED_WORKFLOW_ENDPOINT',
      message:
        'Use /interview, /offer, or /reject endpoints to advance or reject applications',
    });
  }

  async scheduleInterview(
    id: string,
    dto: ScheduleInterviewDto,
    user: AuthUser,
  ) {
    await this.lifecycle.reconcile();
    const scheduledAt = new Date(dto.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
      throw new BadRequestException({
        code: 'INVALID_INTERVIEW_TIME',
        message: 'Thời gian phỏng vấn phải ở trong tương lai',
      });
    }
    if (dto.mode === InterviewMode.ONLINE && !dto.meetingLink) {
      throw new BadRequestException({
        code: 'MEETING_LINK_REQUIRED',
        message: 'Vui lòng nhập link họp trực tuyến',
      });
    }
    if (dto.mode === InterviewMode.OFFLINE && !dto.location) {
      throw new BadRequestException({
        code: 'INTERVIEW_LOCATION_REQUIRED',
        message: 'Vui lòng nhập địa điểm phỏng vấn',
      });
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const current = await tx.application.findUnique({
        where: { id },
        select: applicationSelect,
      });
      if (!current) throw this.notFound();
      await this.ensureCompanyCanReview(
        current.internship.company.userId,
        user,
        tx,
      );

      if (
        current.status !== ApplicationStatus.PENDING &&
        current.status !== ApplicationStatus.REVIEWING
      ) {
        throw new BadRequestException({
          code: 'INVALID_APPLICATION_TRANSITION',
          message:
            'Chỉ có thể gửi lời mời phỏng vấn cho đơn đang chờ duyệt hoặc đang xem xét',
        });
      }

      this.lifecycle.assertRecruitmentOpen(current.internship.semester);

      if (scheduledAt >= current.internship.semester.startDate) {
        throw new BadRequestException({
          code: 'INTERVIEW_AFTER_SEMESTER_START',
          message:
            'Thời gian phỏng vấn phải trước ngày bắt đầu kỳ theo dõi thực tập',
        });
      }

      await tx.applicationInterview.upsert({
        where: { applicationId: id },
        create: {
          applicationId: id,
          scheduledAt,
          mode: dto.mode,
          meetingLink:
            dto.mode === InterviewMode.ONLINE ? dto.meetingLink : null,
          location: dto.mode === InterviewMode.OFFLINE ? dto.location : null,
          contactName: dto.contactName,
          contactEmail: dto.contactEmail,
          contactPhone: dto.contactPhone ?? null,
          note: dto.note ?? null,
          createdById: user.id,
        },
        update: {
          scheduledAt,
          mode: dto.mode,
          meetingLink:
            dto.mode === InterviewMode.ONLINE ? dto.meetingLink : null,
          location: dto.mode === InterviewMode.OFFLINE ? dto.location : null,
          contactName: dto.contactName,
          contactEmail: dto.contactEmail,
          contactPhone: dto.contactPhone ?? null,
          note: dto.note ?? null,
          createdById: user.id,
        },
      });

      await tx.application.update({
        where: { id },
        data: {
          status: ApplicationStatus.INTERVIEWING,
          companyFeedback: dto.note ?? current.companyFeedback,
        },
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId: id,
          fromStatus: current.status,
          toStatus: ApplicationStatus.INTERVIEWING,
          changedById: user.id,
          note: dto.note ?? 'Đã gửi lời mời phỏng vấn',
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'APPLICATION_INTERVIEW_SCHEDULED',
          entity: 'Application',
          entityId: id,
          metadata: {
            scheduledAt,
            mode: dto.mode,
            contactEmail: dto.contactEmail,
          },
        },
      });

      const notification = await this.notifications.createInTransaction(tx, {
        userId: current.student.userId,
        eventKey: `application:${id}:interview:${randomUUID()}`,
        type: NotificationType.APPLICATION,
        action: NotificationAction.OPEN_APPLICATION,
        title: 'Thư mời phỏng vấn thực tập',
        content: `${current.internship.company.companyName} trân trọng mời bạn tham dự phỏng vấn vị trí "${current.internship.title}". Vui lòng kiểm tra email hoặc mục Đơn ứng tuyển để xem lịch hẹn chi tiết.`,
        resourceId: id,
        metadata: { status: ApplicationStatus.INTERVIEWING },
      });

      const updated = await tx.application.findUniqueOrThrow({
        where: { id },
        select: applicationSelect,
      });

      return { application: updated, notifications: [notification] };
    });

    this.notifications.publishMany(result.notifications);

    const template = this.mailer.renderInterviewInvitationTemplate({
      applicationId: id,
      studentName: result.application.student.fullName,
      companyName: result.application.internship.company.companyName,
      internshipTitle: result.application.internship.title,
      scheduledAt,
      mode: dto.mode,
      meetingLink: dto.meetingLink,
      location: dto.location,
      contactName: dto.contactName,
      contactEmail: dto.contactEmail,
      contactPhone: dto.contactPhone,
      note: dto.note,
    });
    await this.mailer.sendAndLogApplicationEmail({
      applicationId: id,
      type: EmailLogType.INTERVIEW_INVITATION,
      to: result.application.student.user.email,
      template,
    });

    const refreshed = await this.prisma.application.findUniqueOrThrow({
      where: { id },
      select: applicationSelect,
    });
    return this.toResponse(refreshed);
  }

  async sendOffer(id: string, dto: SendOfferDto, user: AuthUser) {
    await this.lifecycle.reconcile();
    const expiresInDays = dto.expiresInDays ?? 2;

    const result = await this.prisma.$transaction(
      async (tx) => {
        const current = await tx.application.findUnique({
          where: { id },
          select: applicationSelect,
        });
        if (!current) throw this.notFound();
        await this.ensureCompanyCanReview(
          current.internship.company.userId,
          user,
          tx,
        );

        if (current.status !== ApplicationStatus.INTERVIEWING) {
          throw new BadRequestException({
            code: 'INTERVIEW_REQUIRED_BEFORE_OFFER',
            message:
              'Ứng viên phải qua bước mời phỏng vấn trước khi gửi kết quả Đạt (Offer)',
          });
        }

        this.lifecycle.assertRecruitmentOpen(current.internship.semester);

        const now = new Date();
        const ActiveOfferCount = await tx.application.count({
          where: {
            internshipId: current.internshipId,
            status: ApplicationStatus.OFFERED,
          },
        });
        if (
          current.internship.filledSlots + ActiveOfferCount >=
          current.internship.slots
        ) {
          throw new ConflictException({
            code: 'INTERNSHIP_NO_AVAILABLE_SLOTS',
            message:
              'Vị trí đã đủ chỉ tiêu hoặc đang có các lời mời (offer) khác chờ sinh viên phản hồi',
          });
        }

        const rawExpiry = new Date(now.getTime() + expiresInDays * DAY_MS);
        const semesterStart = current.internship.semester.startDate;
        const offerExpiresAt =
          rawExpiry < semesterStart ? rawExpiry : semesterStart;
        if (offerExpiresAt <= now) {
          throw new BadRequestException({
            code: 'RECRUITMENT_WINDOW_CLOSING',
            message: 'Đợt tuyển dụng đã kết thúc, không thể gửi thêm lời mời',
          });
        }

        await tx.application.update({
          where: { id },
          data: {
            status: ApplicationStatus.OFFERED,
            offeredAt: now,
            offerExpiresAt,
            offerMessage: dto.offerMessage ?? null,
            companyFeedback: dto.offerMessage ?? current.companyFeedback,
          },
        });

        await tx.applicationStatusHistory.create({
          data: {
            applicationId: id,
            fromStatus: current.status,
            toStatus: ApplicationStatus.OFFERED,
            changedById: user.id,
            note: dto.offerMessage ?? 'Đạt phỏng vấn - Đã gửi lời mời thực tập',
          },
        });

        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: 'APPLICATION_OFFER_SENT',
            entity: 'Application',
            entityId: id,
            metadata: { offerExpiresAt, offerMessage: dto.offerMessage },
          },
        });

        const notification = await this.notifications.createInTransaction(tx, {
          userId: current.student.userId,
          eventKey: `application:${id}:offered:${randomUUID()}`,
          type: NotificationType.APPLICATION,
          action: NotificationAction.OPEN_APPLICATION,
          title: 'Chúc mừng! Bạn nhận được lời mời thực tập',
          content: `Bạn đã vượt qua vòng phỏng vấn vị trí "${current.internship.title}" tại ${current.internship.company.companyName}. Vui lòng phản hồi xác nhận nhận việc trước khi hết hạn.`,
          resourceId: id,
          metadata: {
            status: ApplicationStatus.OFFERED,
            offerExpiresAt,
          },
        });

        const updated = await tx.application.findUniqueOrThrow({
          where: { id },
          select: applicationSelect,
        });
        return {
          application: updated,
          offerExpiresAt,
          notifications: [notification],
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    this.notifications.publishMany(result.notifications);

    const contactEmail =
      result.application.interview?.contactEmail ||
      result.application.internship.company.contactEmail ||
      result.application.internship.company.user.email;

    const template = this.mailer.renderOfferSentTemplate({
      studentName: result.application.student.fullName,
      companyName: result.application.internship.company.companyName,
      internshipTitle: result.application.internship.title,
      startDate: result.application.internship.startDate,
      endDate: result.application.internship.endDate,
      offerExpiresAt: result.offerExpiresAt,
      offerMessage: dto.offerMessage,
      contactEmail,
    });
    await this.mailer.sendAndLogApplicationEmail({
      applicationId: id,
      type: EmailLogType.OFFER_SENT,
      to: result.application.student.user.email,
      template,
    });

    const refreshed = await this.prisma.application.findUniqueOrThrow({
      where: { id },
      select: applicationSelect,
    });
    return this.toResponse(refreshed);
  }

  async rejectApplication(
    id: string,
    dto: RejectApplicationDto,
    user: AuthUser,
  ) {
    await this.lifecycle.reconcile();
    const result = await this.prisma.$transaction(async (tx) => {
      const current = await tx.application.findUnique({
        where: { id },
        select: applicationSelect,
      });
      if (!current) throw this.notFound();
      await this.ensureCompanyCanReview(
        current.internship.company.userId,
        user,
        tx,
      );

      if (
        current.status !== ApplicationStatus.PENDING &&
        current.status !== ApplicationStatus.REVIEWING &&
        current.status !== ApplicationStatus.INTERVIEWING
      ) {
        throw new BadRequestException({
          code: 'INVALID_APPLICATION_TRANSITION',
          message:
            'Chỉ có thể từ chối đơn đang chờ duyệt, đang xem hoặc đang phỏng vấn',
        });
      }

      const afterInterview = current.status === ApplicationStatus.INTERVIEWING;
      const combinedFeedback =
        dto.companyFeedback ||
        dto.rejectionReason ||
        'Cảm ơn bạn đã quan tâm đến cơ hội thực tập tại doanh nghiệp.';

      await tx.application.update({
        where: { id },
        data: {
          status: ApplicationStatus.REJECTED,
          rejectedAt: new Date(),
          rejectionReason: dto.rejectionReason ?? null,
          companyFeedback: combinedFeedback,
        },
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId: id,
          fromStatus: current.status,
          toStatus: ApplicationStatus.REJECTED,
          changedById: user.id,
          note: combinedFeedback,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'APPLICATION_REJECTED',
          entity: 'Application',
          entityId: id,
          metadata: {
            fromStatus: current.status,
            rejectionReason: dto.rejectionReason,
            companyFeedback: dto.companyFeedback,
          },
        },
      });

      const notification = await this.notifications.createInTransaction(tx, {
        userId: current.student.userId,
        eventKey: `application:${id}:rejected:${randomUUID()}`,
        type: NotificationType.APPLICATION,
        action: NotificationAction.OPEN_APPLICATION,
        title: afterInterview
          ? 'Thông báo kết quả phỏng vấn'
          : 'Phản hồi hồ sơ ứng tuyển',
        content: afterInterview
          ? `Cảm ơn bạn đã tham gia phỏng vấn vị trí "${current.internship.title}" tại ${current.internship.company.companyName}. Rất tiếc kết quả đợt này chưa phù hợp, hẹn gặp bạn ở các cơ hội tiếp theo.`
          : `Cảm ơn bạn đã quan tâm đến vị trí "${current.internship.title}" tại ${current.internship.company.companyName}. Rất tiếc hồ sơ của bạn chưa phù hợp với tiêu chí tuyển dụng đợt này.`,
        resourceId: id,
        metadata: {
          fromStatus: current.status,
          toStatus: ApplicationStatus.REJECTED,
        },
      });

      const updated = await tx.application.findUniqueOrThrow({
        where: { id },
        select: applicationSelect,
      });
      return {
        application: updated,
        afterInterview,
        notifications: [notification],
      };
    });

    this.notifications.publishMany(result.notifications);

    const contactEmail =
      result.application.interview?.contactEmail ||
      result.application.internship.company.contactEmail ||
      result.application.internship.company.user.email;

    const template = this.mailer.renderApplicationRejectedTemplate({
      studentName: result.application.student.fullName,
      companyName: result.application.internship.company.companyName,
      internshipTitle: result.application.internship.title,
      afterInterview: result.afterInterview,
      rejectionReason: dto.rejectionReason,
      companyFeedback: dto.companyFeedback,
      contactEmail,
    });
    await this.mailer.sendAndLogApplicationEmail({
      applicationId: id,
      type: EmailLogType.APPLICATION_REJECTED,
      to: result.application.student.user.email,
      template,
    });

    const refreshed = await this.prisma.application.findUniqueOrThrow({
      where: { id },
      select: applicationSelect,
    });
    return this.toResponse(refreshed);
  }

  async acceptOffer(id: string, user: AuthUser) {
    await this.lifecycle.reconcile();
    const maxAttempts = 3;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        return await this.acceptOfferOnce(id, user);
      } catch (error: unknown) {
        if (!this.isPrismaError(error, 'P2034')) throw error;

        if (attempt === maxAttempts - 1) {
          throw new ConflictException({
            code: 'APPLICATION_ACCEPT_CONFLICT',
            message:
              'The application changed while it was being accepted. Please retry.',
          });
        }
      }
    }

    throw new ConflictException({
      code: 'APPLICATION_ACCEPT_CONFLICT',
      message: 'Unable to accept the offer at this time',
    });
  }

  private async acceptOfferOnce(id: string, user: AuthUser) {
    const result = await this.prisma.$transaction(
      async (tx) => {
        const current = await tx.application.findUnique({
          where: { id },
          select: applicationSelect,
        });
        if (!current) throw this.notFound();

        if (user.role !== Role.STUDENT || current.student.userId !== user.id) {
          throw new ForbiddenException({
            code: 'APPLICATION_NOT_ACCESSIBLE',
            message: 'Chỉ sinh viên sở hữu đơn mới có thể xác nhận lời mời',
          });
        }

        if (
          current.status === ApplicationStatus.ACCEPTED &&
          current.placement
        ) {
          return {
            application: current,
            notifications: [],
            autoCancelledApps: [],
          };
        }

        if (current.status !== ApplicationStatus.OFFERED) {
          throw new BadRequestException({
            code: 'OFFER_NOT_AVAILABLE',
            message:
              'Chỉ có thể nhận lời mời đang ở trạng thái chờ phản hồi (OFFERED)',
          });
        }

        const now = new Date();
        if (current.offerExpiresAt && current.offerExpiresAt < now) {
          throw new BadRequestException({
            code: 'OFFER_EXPIRED',
            message: 'Lời mời thực tập này đã quá hạn phản hồi',
          });
        }

        this.lifecycle.assertRecruitmentOpen(current.internship.semester);
        await this.reserveInternshipSlot(current.internshipId, tx);

        await tx.application.update({
          where: { id },
          data: {
            status: ApplicationStatus.ACCEPTED,
            acceptedAt: now,
            respondedAt: now,
            rejectedAt: null,
            withdrawnAt: null,
          },
        });

        await tx.applicationStatusHistory.create({
          data: {
            applicationId: id,
            fromStatus: current.status,
            toStatus: ApplicationStatus.ACCEPTED,
            changedById: user.id,
            note: 'Sinh viên xác nhận nhận lời mời thực tập',
          },
        });

        const createdPlacement =
          await this.placementsService.createPendingFromAcceptedApplication(
            tx,
            {
              applicationId: id,
              studentId: current.studentId,
              companyId: current.internship.company.id,
              internshipId: current.internshipId,
              semesterId: current.internship.semester.id,
              startDate: current.internship.startDate,
              endDate: current.internship.endDate,
            },
            user.id,
          );

        await tx.conversation.upsert({
          where: { applicationId: id },
          create: {
            applicationId: id,
            studentId: current.studentId,
            companyId: current.internship.company.id,
          },
          update: {
            studentId: current.studentId,
            companyId: current.internship.company.id,
          },
        });

        // Auto-withdraw/decline other active applications of this student in the same semester
        const otherApps = await tx.application.findMany({
          where: {
            studentId: current.studentId,
            id: { not: id },
            internship: { semesterId: current.internship.semester.id },
            status: {
              in: [
                ApplicationStatus.PENDING,
                ApplicationStatus.REVIEWING,
                ApplicationStatus.INTERVIEWING,
                ApplicationStatus.OFFERED,
              ],
            },
          },
          select: applicationSelect,
        });

        const notifications = [];

        for (const other of otherApps) {
          const targetStatus =
            other.status === ApplicationStatus.OFFERED
              ? ApplicationStatus.DECLINED
              : ApplicationStatus.WITHDRAWN;
          await tx.application.update({
            where: { id: other.id },
            data: {
              status: targetStatus,
              respondedAt:
                targetStatus === ApplicationStatus.DECLINED ? now : undefined,
              withdrawnAt:
                targetStatus === ApplicationStatus.WITHDRAWN ? now : undefined,
            },
          });
          await tx.applicationStatusHistory.create({
            data: {
              applicationId: other.id,
              fromStatus: other.status,
              toStatus: targetStatus,
              changedById: user.id,
              note: 'Tự động đóng đơn do sinh viên đã xác nhận thực tập tại doanh nghiệp khác trong cùng đợt',
            },
          });
          const otherNotif = await this.notifications.createInTransaction(tx, {
            userId: other.internship.company.userId,
            eventKey: `application:${other.id}:auto-closed:${other.internship.company.userId}`,
            type: NotificationType.APPLICATION,
            action: NotificationAction.OPEN_APPLICATION,
            title: 'Hồ sơ ứng tuyển tự động đóng',
            content: `Ứng viên ${current.student.fullName} đã xác nhận thực tập tại một doanh nghiệp khác trong học kỳ này. Hồ sơ ứng tuyển vị trí "${other.internship.title}" đã được hệ thống tự động đóng.`,
            resourceId: other.id,
            metadata: { status: targetStatus },
          });
          notifications.push(otherNotif);
        }

        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: 'APPLICATION_OFFER_ACCEPTED',
            entity: 'Application',
            entityId: id,
            metadata: {
              placementId: createdPlacement.id,
              autoClosedApplicationIds: otherApps.map((a) => a.id),
            },
          },
        });

        const companyNotification =
          await this.notifications.createInTransaction(tx, {
            userId: current.internship.company.userId,
            eventKey: `application:${id}:accepted-by-student:${current.internship.company.userId}`,
            type: NotificationType.APPLICATION,
            action: NotificationAction.OPEN_APPLICATION,
            title: 'Ứng viên đã xác nhận nhận thực tập',
            content: `Ứng viên ${current.student.fullName} đã đồng ý nhận lời mời thực tập vị trí "${current.internship.title}". Hồ sơ thực tập đã được tạo trên hệ thống.`,
            resourceId: id,
            metadata: { status: ApplicationStatus.ACCEPTED },
          });
        notifications.push(companyNotification);

        const placementNotification =
          await this.notifications.createInTransaction(tx, {
            userId: current.student.userId,
            eventKey: `placement:${createdPlacement.id}:created:${current.student.userId}`,
            type: NotificationType.PLACEMENT,
            action: NotificationAction.OPEN_PLACEMENT,
            title: 'Hồ sơ thực tập đã được khởi tạo',
            content: `Hồ sơ thực tập của bạn cho vị trí "${createdPlacement.internship.title}" tại ${createdPlacement.company.companyName} đã được ghi nhận và đang chờ nhà trường phân công giảng viên hướng dẫn.`,
            resourceId: createdPlacement.id,
            metadata: {
              placementId: createdPlacement.id,
              status: PlacementStatus.PENDING,
            },
          });
        notifications.push(placementNotification);

        const accepted = await tx.application.findUniqueOrThrow({
          where: { id },
          select: applicationSelect,
        });
        return {
          application: accepted,
          notifications,
          autoCancelledApps: otherApps,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    this.notifications.publishMany(result.notifications);

    // Send email to accepted company
    const companyToEmail =
      result.application.internship.company.contactEmail ||
      result.application.internship.company.user.email;
    await this.mailer.sendAndLogApplicationEmail({
      applicationId: id,
      type: EmailLogType.OFFER_ACCEPTED_COMPANY,
      to: companyToEmail,
      template: this.mailer.renderOfferAcceptedCompanyTemplate({
        companyName: result.application.internship.company.companyName,
        studentName: result.application.student.fullName,
        studentEmail: result.application.student.user.email,
        internshipTitle: result.application.internship.title,
        startDate: result.application.internship.startDate,
        endDate: result.application.internship.endDate,
      }),
    });

    // Send emails to auto-withdrawn/declined companies
    for (const other of result.autoCancelledApps) {
      const otherEmail =
        other.internship.company.contactEmail ||
        other.internship.company.user.email;
      await this.mailer.sendAndLogApplicationEmail({
        applicationId: other.id,
        type: EmailLogType.APPLICATION_WITHDRAWN_BY_PLACEMENT,
        to: otherEmail,
        template: this.mailer.renderWithdrawnByPlacementCompanyTemplate({
          companyName: other.internship.company.companyName,
          studentName: result.application.student.fullName,
          internshipTitle: other.internship.title,
        }),
      });
    }

    const refreshed = await this.prisma.application.findUniqueOrThrow({
      where: { id },
      select: applicationSelect,
    });
    return this.toResponse(refreshed);
  }

  async declineOffer(id: string, user: AuthUser) {
    await this.lifecycle.reconcile();
    const result = await this.prisma.$transaction(async (tx) => {
      const current = await tx.application.findUnique({
        where: { id },
        select: applicationSelect,
      });
      if (!current) throw this.notFound();

      if (user.role !== Role.STUDENT || current.student.userId !== user.id) {
        throw new ForbiddenException({
          code: 'APPLICATION_NOT_ACCESSIBLE',
          message: 'Chỉ sinh viên sở hữu đơn mới có thể từ chối lời mời',
        });
      }

      if (current.status !== ApplicationStatus.OFFERED) {
        throw new BadRequestException({
          code: 'OFFER_NOT_AVAILABLE',
          message:
            'Chỉ có thể từ chối lời mời đang ở trạng thái chờ phản hồi (OFFERED)',
        });
      }

      const now = new Date();
      await tx.application.update({
        where: { id },
        data: {
          status: ApplicationStatus.DECLINED,
          respondedAt: now,
        },
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId: id,
          fromStatus: current.status,
          toStatus: ApplicationStatus.DECLINED,
          changedById: user.id,
          note: 'Sinh viên từ chối lời mời thực tập',
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'APPLICATION_OFFER_DECLINED',
          entity: 'Application',
          entityId: id,
          metadata: {},
        },
      });

      const notification = await this.notifications.createInTransaction(tx, {
        userId: current.internship.company.userId,
        eventKey: `application:${id}:declined:${randomUUID()}`,
        type: NotificationType.APPLICATION,
        action: NotificationAction.OPEN_APPLICATION,
        title: 'Ứng viên từ chối lời mời thực tập',
        content: `Ứng viên ${current.student.fullName} đã từ chối lời mời thực tập vị trí "${current.internship.title}". Chỉ tiêu tuyển dụng đã được hoàn lại để quý công ty tiếp tục xét duyệt ứng viên khác.`,
        resourceId: id,
        metadata: { status: ApplicationStatus.DECLINED },
      });

      const updated = await tx.application.findUniqueOrThrow({
        where: { id },
        select: applicationSelect,
      });
      return { application: updated, notifications: [notification] };
    });

    this.notifications.publishMany(result.notifications);

    const companyToEmail =
      result.application.internship.company.contactEmail ||
      result.application.internship.company.user.email;
    await this.mailer.sendAndLogApplicationEmail({
      applicationId: id,
      type: EmailLogType.OFFER_DECLINED_COMPANY,
      to: companyToEmail,
      template: this.mailer.renderOfferDeclinedCompanyTemplate({
        companyName: result.application.internship.company.companyName,
        studentName: result.application.student.fullName,
        internshipTitle: result.application.internship.title,
        reasonLabel: 'Ứng viên đã từ chối lời mời thực tập',
      }),
    });

    const refreshed = await this.prisma.application.findUniqueOrThrow({
      where: { id },
      select: applicationSelect,
    });
    return this.toResponse(refreshed);
  }

  async previewEmail(id: string, query: EmailPreviewQueryDto, user: AuthUser) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      select: applicationSelect,
    });
    if (!application) throw this.notFound();
    await this.ensureCompanyCanReview(
      application.internship.company.userId,
      user,
    );

    const defaultContactEmail =
      query.contactEmail ||
      application.interview?.contactEmail ||
      application.internship.company.contactEmail ||
      application.internship.company.user.email;
    const defaultContactName =
      query.contactName ||
      application.interview?.contactName ||
      application.internship.company.contactPersonName ||
      application.internship.company.companyName;

    if (query.type === EmailPreviewKind.INTERVIEW) {
      const scheduledAt = query.scheduledAt
        ? new Date(query.scheduledAt)
        : new Date(Date.now() + 2 * DAY_MS);
      const mode = query.mode ?? InterviewMode.ONLINE;
      return this.mailer.renderInterviewInvitationTemplate({
        applicationId: id,
        studentName: application.student.fullName,
        companyName: application.internship.company.companyName,
        internshipTitle: application.internship.title,
        scheduledAt: Number.isNaN(scheduledAt.getTime())
          ? new Date(Date.now() + 2 * DAY_MS)
          : scheduledAt,
        mode,
        meetingLink: query.meetingLink,
        location: query.location || application.internship.company.address,
        contactName: defaultContactName,
        contactEmail: defaultContactEmail,
        contactPhone:
          query.contactPhone ?? application.internship.company.contactPhone,
        note: query.note,
      });
    }

    if (query.type === EmailPreviewKind.OFFER) {
      const days = query.expiresInDays ?? 2;
      const offerExpiresAt = new Date(Date.now() + days * DAY_MS);
      return this.mailer.renderOfferSentTemplate({
        studentName: application.student.fullName,
        companyName: application.internship.company.companyName,
        internshipTitle: application.internship.title,
        startDate: application.internship.startDate,
        endDate: application.internship.endDate,
        offerExpiresAt,
        offerMessage: query.offerMessage,
        contactEmail: defaultContactEmail,
      });
    }

    return this.mailer.renderApplicationRejectedTemplate({
      studentName: application.student.fullName,
      companyName: application.internship.company.companyName,
      internshipTitle: application.internship.title,
      afterInterview: application.status === ApplicationStatus.INTERVIEWING,
      rejectionReason: query.rejectionReason,
      companyFeedback: query.companyFeedback,
      contactEmail: defaultContactEmail,
    });
  }

  async resendEmail(id: string, logId: string, user: AuthUser) {
    await this.lifecycle.reconcile();
    const application = await this.prisma.application.findUnique({
      where: { id },
      select: applicationSelect,
    });
    if (!application) throw this.notFound();
    await this.ensureCompanyCanReview(
      application.internship.company.userId,
      user,
    );
    if (
      application.status !== ApplicationStatus.INTERVIEWING &&
      application.status !== ApplicationStatus.OFFERED
    ) {
      throw new BadRequestException({
        code: 'APPLICATION_EMAIL_RESEND_NOT_ALLOWED',
        message:
          'Chỉ có thể gửi lại email khi đơn đang ở trạng thái Mời phỏng vấn hoặc Đã gửi Offer',
      });
    }
    const targetLog = await this.prisma.emailLog.findFirst({
      where: { id: logId, applicationId: id },
      select: { id: true, status: true },
    });
    if (!targetLog) {
      throw new NotFoundException({
        code: 'EMAIL_LOG_NOT_FOUND',
        message: 'Không tìm thấy lịch sử email cần gửi lại',
      });
    }
    if (targetLog.status !== EmailLogStatus.FAILED) {
      throw new BadRequestException({
        code: 'EMAIL_ALREADY_SENT',
        message: 'Chỉ có thể gửi lại khi email trước đó gặp lỗi gửi',
      });
    }
    await this.mailer.resendEmailLog(id, logId);
    const refreshed = await this.prisma.application.findUniqueOrThrow({
      where: { id },
      select: applicationSelect,
    });
    return this.toResponse(refreshed);
  }

  async remove(id: string, user: AuthUser) {
    await this.lifecycle.reconcile();
    const application = await this.prisma.application.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        student: { select: { userId: true } },
        internship: { select: { company: { select: { userId: true } } } },
      },
    });
    if (!application) throw this.notFound();
    this.ensureCanAccess(application, user);

    const terminalStatuses: ApplicationStatus[] = [
      ApplicationStatus.ACCEPTED,
      ApplicationStatus.REJECTED,
      ApplicationStatus.DECLINED,
      ApplicationStatus.EXPIRED,
      ApplicationStatus.WITHDRAWN,
    ];
    if (!terminalStatuses.includes(application.status)) {
      throw new BadRequestException({
        code: 'APPLICATION_STILL_ACTIVE',
        message:
          'Chỉ có thể xóa các đơn ứng tuyển đã hoàn thành hoặc không còn hiệu lực',
      });
    }

    const now = new Date();
    const data: Prisma.ApplicationUpdateInput =
      user.role === Role.STUDENT
        ? { hiddenByStudentAt: now }
        : user.role === Role.COMPANY
          ? { hiddenByCompanyAt: now }
          : { hiddenByStudentAt: now, hiddenByCompanyAt: now };

    await this.prisma.$transaction([
      this.prisma.application.update({
        where: { id },
        data,
      }),
      this.prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'APPLICATION_HIDDEN',
          entity: 'Application',
          entityId: id,
          metadata: { role: user.role, status: application.status },
        },
      }),
    ]);

    return { id, deleted: true };
  }

  async withdraw(
    id: string,
    user: AuthUser,
    dto?: { companyFeedback?: string | null },
  ) {
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
    if (!this.isStudentWithdrawableStatus(application.status)) {
      throw new BadRequestException({
        code: 'INVALID_APPLICATION_TRANSITION',
        message:
          'Only pending, reviewing, or interviewing applications can be withdrawn',
      });
    }

    return this.transition(
      application.id,
      user,
      ApplicationStatus.WITHDRAWN,
      dto?.companyFeedback ?? null,
    );
  }

  // Legacy helper kept for backward-compatibility with existing unit test
  private async accept(id: string, user: AuthUser, feedback: string | null) {
    const maxAttempts = 3;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        return await this.acceptOnce(id, user, feedback);
      } catch (error: unknown) {
        if (!this.isPrismaError(error, 'P2034')) throw error;

        if (attempt === maxAttempts - 1) {
          throw new ConflictException({
            code: 'APPLICATION_ACCEPT_CONFLICT',
            message:
              'The application changed while it was being accepted. Please retry.',
          });
        }
      }
    }

    throw new ConflictException({
      code: 'APPLICATION_ACCEPT_CONFLICT',
      message: 'Unable to accept the application at this time',
    });
  }

  private async acceptOnce(
    id: string,
    user: AuthUser,
    _feedback: string | null,
  ) {
    return this.acceptOfferOnce(id, user);
  }

  private async transition(
    id: string,
    user: AuthUser,
    toStatus: ApplicationStatus,
    note: string | null,
  ) {
    const result = await this.prisma.$transaction(async (tx) => {
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
      this.ensureCanTransition(
        current.status,
        toStatus,
        user,
        current.student.userId,
        current.internship.company.userId,
      );

      const updated = await tx.application.update({
        where: { id },
        data: {
          status: toStatus,
          companyFeedback: note ?? undefined,
          acceptedAt:
            toStatus === ApplicationStatus.ACCEPTED ? new Date() : undefined,
          rejectedAt:
            toStatus === ApplicationStatus.REJECTED ? new Date() : undefined,
          withdrawnAt:
            toStatus === ApplicationStatus.WITHDRAWN ? new Date() : undefined,
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

      const isWithdrawn = toStatus === ApplicationStatus.WITHDRAWN;
      const notification = await this.notifications.createInTransaction(tx, {
        userId: isWithdrawn
          ? current.internship.company.userId
          : current.student.userId,
        eventKey: `application:${id}:status:${toStatus}:${randomUUID()}`,
        type: NotificationType.APPLICATION,
        action: NotificationAction.OPEN_APPLICATION,
        title: isWithdrawn
          ? 'Ứng viên đã rút hồ sơ ứng tuyển'
          : toStatus === ApplicationStatus.REJECTED
            ? 'Phản hồi hồ sơ ứng tuyển'
            : 'Hồ sơ ứng tuyển đang được xem xét',
        content: isWithdrawn
          ? `Ứng viên ${updated.student.fullName} đã chủ động rút hồ sơ ứng tuyển khỏi vị trí "${updated.internship.title}".`
          : toStatus === ApplicationStatus.REJECTED
            ? `Cảm ơn bạn đã quan tâm đến vị trí "${updated.internship.title}" tại ${updated.internship.company.companyName}. Rất tiếc hồ sơ của bạn chưa phù hợp đợt này.`
            : `${updated.internship.company.companyName} đang xem xét hồ sơ ứng tuyển của bạn cho vị trí "${updated.internship.title}".`,
        resourceId: id,
        metadata: { fromStatus: current.status, toStatus },
      });

      return { application: updated, notifications: [notification] };
    });
    this.notifications.publishMany(result.notifications);
    return result.application;
  }

  private async paginate(
    query: ListApplicationsQueryDto,
    where: Prisma.ApplicationWhereInput,
  ) {
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
    return this.paginate(query, {
      internship: { company: { userId } },
      hiddenByCompanyAt: null,
    });
  }

  private ensureCanAccess(
    application: {
      id: string;
      student: { userId: string };
      internship: { company: { userId: string } };
    },
    user: AuthUser,
  ) {
    if (user.role === Role.ADMIN) return;
    if (user.role === Role.STUDENT && application.student.userId === user.id)
      return;
    if (
      user.role === Role.COMPANY &&
      application.internship.company.userId === user.id
    )
      return;
    throw new ForbiddenException({
      code: 'APPLICATION_NOT_ACCESSIBLE',
      message: 'You cannot access this application',
    });
  }

  private ensureCanTransition(
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
      if (!this.isStudentWithdrawableStatus(fromStatus)) {
        throw new BadRequestException({
          code: 'INVALID_APPLICATION_TRANSITION',
          message:
            'Only pending, reviewing, or interviewing applications can be withdrawn',
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

  private isOpenApplicationStatus(status: ApplicationStatus) {
    return (
      status === ApplicationStatus.PENDING ||
      status === ApplicationStatus.REVIEWING
    );
  }

  private isStudentWithdrawableStatus(status: ApplicationStatus) {
    return (
      status === ApplicationStatus.PENDING ||
      status === ApplicationStatus.REVIEWING ||
      status === ApplicationStatus.INTERVIEWING
    );
  }

  private async reserveInternshipSlot(
    internshipId: string,
    tx: Prisma.TransactionClient,
  ) {
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
        semester: {
          select: { id: true, status: true, startDate: true, endDate: true },
        },
        company: {
          select: {
            id: true,
            status: true,
            userId: true,
            autoAiScanEnabled: true,
          },
        },
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
    semester: {
      id: string;
      status: SemesterStatus;
      startDate: Date;
      endDate: Date;
    };
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
    this.lifecycle.assertRecruitmentOpen(internship.semester);
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
