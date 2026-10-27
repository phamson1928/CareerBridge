import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  NotificationAction,
  NotificationType,
  Prisma,
  Role,
  SupportRequestStatus,
  UserStatus,
} from '../generated/prisma/client';
import type { AuthUser } from '../auth/types/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateSupportRequestDto } from './dto/create-support-request.dto';
import { ListSupportRequestsQueryDto } from './dto/list-support-requests-query.dto';
import { ReplySupportRequestDto } from './dto/reply-support-request.dto';

const select = {
  id: true,
  studentId: true,
  title: true,
  content: true,
  status: true,
  adminReply: true,
  repliedById: true,
  repliedAt: true,
  createdAt: true,
  updatedAt: true,
  student: {
    select: {
      id: true,
      userId: true,
      studentCode: true,
      fullName: true,
      major: true,
      phone: true,
      user: {
        select: {
          email: true,
        },
      },
    },
  },
  repliedBy: {
    select: {
      id: true,
      email: true,
    },
  },
} satisfies Prisma.SupportRequestSelect;

type SupportRequestRecord = Prisma.SupportRequestGetPayload<{
  select: typeof select;
}>;

@Injectable()
export class SupportRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(dto: CreateSupportRequestDto, user: AuthUser) {
    const title = dto.title.trim();
    const content = dto.content.trim();
    if (!title || !content) {
      throw new BadRequestException({
        code: 'SUPPORT_REQUEST_EMPTY',
        message: 'Tiêu đề và nội dung không được để trống',
      });
    }

    const student = await this.prisma.studentProfile.findUnique({
      where: { userId: user.id },
      select: { id: true, fullName: true, studentCode: true },
    });
    if (!student) {
      throw new BadRequestException({
        code: 'STUDENT_PROFILE_REQUIRED',
        message: 'Bạn cần tạo hồ sơ sinh viên trước khi gửi yêu cầu hỗ trợ',
      });
    }

    const admins = await this.prisma.user.findMany({
      where: { role: Role.ADMIN, status: UserStatus.ACTIVE },
      select: { id: true },
    });

    const result = await this.prisma.$transaction(async (tx) => {
      const request = await tx.supportRequest.create({
        data: {
          studentId: student.id,
          title,
          content,
        },
        select,
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'SUPPORT_REQUEST_CREATED',
          entity: 'SupportRequest',
          entityId: request.id,
          metadata: { studentId: student.id, title },
        },
      });

      const createdNotifications = await Promise.all(
        admins.map((admin) =>
          this.notifications.createInTransaction(tx, {
            userId: admin.id,
            eventKey: `support-request:${request.id}:created:${admin.id}`,
            type: NotificationType.SYSTEM,
            action: NotificationAction.OPEN_SUPPORT_REQUEST,
            title: 'Yêu cầu hỗ trợ mới từ sinh viên',
            content: `Sinh viên ${student.fullName} (${student.studentCode}) vừa gửi yêu cầu: "${request.title}".`,
            resourceId: request.id,
            metadata: { studentId: student.id },
          }),
        ),
      );

      return { request, notifications: createdNotifications };
    });

    this.notifications.publishMany(result.notifications);
    return result.request;
  }

  async listStudent(query: ListSupportRequestsQueryDto, user: AuthUser) {
    return this.list(query, { student: { userId: user.id } });
  }

  async listAdmin(query: ListSupportRequestsQueryDto) {
    const search = query.search?.trim();
    const scope: Prisma.SupportRequestWhereInput = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } },
            {
              student: {
                OR: [
                  { fullName: { contains: search, mode: 'insensitive' } },
                  { studentCode: { contains: search, mode: 'insensitive' } },
                  {
                    user: {
                      email: { contains: search, mode: 'insensitive' },
                    },
                  },
                ],
              },
            },
          ],
        }
      : {};
    return this.list(query, scope);
  }

  async findOne(id: string, user: AuthUser) {
    const request = await this.prisma.supportRequest.findUnique({
      where: { id },
      select,
    });
    if (!request) throw this.notFound();
    this.assertAccess(request, user);
    return request;
  }

  async reply(id: string, dto: ReplySupportRequestDto, user: AuthUser) {
    const adminReply = dto.adminReply.trim();
    if (!adminReply) {
      throw new BadRequestException({
        code: 'SUPPORT_REPLY_EMPTY',
        message: 'Nội dung phản hồi không được để trống',
      });
    }

    const existing = await this.prisma.supportRequest.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw this.notFound();

    const repliedAt = new Date();
    const result = await this.prisma.$transaction(async (tx) => {
      const request = await tx.supportRequest.update({
        where: { id },
        data: {
          adminReply,
          status: SupportRequestStatus.RESOLVED,
          repliedById: user.id,
          repliedAt,
        },
        select,
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'SUPPORT_REQUEST_REPLIED',
          entity: 'SupportRequest',
          entityId: id,
          metadata: { studentId: request.studentId },
        },
      });

      const notification = await this.notifications.createInTransaction(tx, {
        userId: request.student.userId,
        eventKey: `support-request:${id}:replied:${repliedAt.toISOString()}`,
        type: NotificationType.SYSTEM,
        action: NotificationAction.OPEN_SUPPORT_REQUEST,
        title: 'Quản trị viên đã phản hồi yêu cầu hỗ trợ',
        content: `Yêu cầu "${request.title}" của bạn đã được Admin phản hồi.`,
        resourceId: id,
        metadata: { status: request.status },
      });

      return { request, notifications: [notification] };
    });

    this.notifications.publishMany(result.notifications);
    return result.request;
  }

  private async list(
    query: ListSupportRequestsQueryDto,
    scope: Prisma.SupportRequestWhereInput,
  ) {
    const where: Prisma.SupportRequestWhereInput = {
      ...scope,
      ...(query.status ? { status: query.status } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.supportRequest.findMany({
        where,
        select,
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.supportRequest.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  private assertAccess(request: SupportRequestRecord, user: AuthUser) {
    if (user.role === Role.ADMIN || request.student.userId === user.id) {
      return;
    }
    throw new ForbiddenException({
      code: 'SUPPORT_REQUEST_NOT_ACCESSIBLE',
      message: 'Yêu cầu hỗ trợ không có quyền truy cập',
    });
  }

  private notFound() {
    return new NotFoundException({
      code: 'SUPPORT_REQUEST_NOT_FOUND',
      message: 'Không tìm thấy yêu cầu hỗ trợ',
    });
  }
}
