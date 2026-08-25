import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Notification } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { GetNotificationsQueryDto } from './dto/get-notifications-query.dto';
import { toPublicNotification } from './notification.mapper';
import { CreateNotificationInput, NotificationPublic } from './notification.types';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async findForUser(userId: string, query: GetNotificationsQueryDto) {
    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(query.isRead === undefined ? {} : { isRead: query.isRead }),
      ...(query.type ? { type: query.type } : {}),
    };
    const [items, total, unreadCount] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      items: items.map(toPublicNotification),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
      unreadCount,
    };
  }

  countUnread(userId: string) {
    return this.prisma.notification.count({ where: { userId, isRead: false } }).then((count) => ({ count }));
  }

  async markAsRead(userId: string, id: string) {
    const existing = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!existing) throw this.notFound();

    const notification = existing.isRead
      ? existing
      : await this.prisma.notification.update({
          where: { id },
          data: { isRead: true, readAt: new Date() },
        });
    const publicNotification = toPublicNotification(notification);
    this.realtime.emitToUser(userId, 'notification.read', {
      id: publicNotification.id,
      isRead: publicNotification.isRead,
      readAt: publicNotification.readAt,
    });
    return publicNotification;
  }

  async markAllAsRead(userId: string) {
    const readAt = new Date();
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt },
    });
    this.realtime.emitToUser(userId, 'notification.read-all', { readAt });
    return { updatedCount: result.count, unreadCount: 0 };
  }

  async create(input: CreateNotificationInput): Promise<NotificationPublic> {
    const notification = await this.prisma.notification.create({ data: input });
    const publicNotification = toPublicNotification(notification);
    this.publishCreated(notification);
    return publicNotification;
  }

  async createInTransaction(
    tx: Prisma.TransactionClient,
    input: CreateNotificationInput,
  ): Promise<Notification> {
    return tx.notification.create({ data: input });
  }

  publishCreated(notification: Notification) {
    this.realtime.emitToUser(
      notification.userId,
      'notification.created',
      toPublicNotification(notification),
    );
  }

  publishMany(notifications: Array<Notification & { userId: string }>) {
    for (const notification of notifications) this.publishCreated(notification);
  }

  private notFound() {
    return new NotFoundException({
      code: 'NOTIFICATION_NOT_FOUND',
      message: 'Notification not found',
    });
  }
}
