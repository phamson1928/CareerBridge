import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ApplicationStatus, Prisma, Role } from '../generated/prisma/client';
import { AuthUser } from '../auth/types/auth-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { ListConversationsQueryDto } from './dto/list-conversations-query.dto';
import { ListMessagesQueryDto } from './dto/list-messages-query.dto';

const conversationSelect = {
  id: true,
  applicationId: true,
  createdAt: true,
  updatedAt: true,
  application: { select: { internship: { select: { id: true, title: true } } } },
  student: { select: { id: true, userId: true, fullName: true } },
  company: { select: { id: true, userId: true, companyName: true } },
  messages: {
    select: { id: true, content: true, createdAt: true, senderId: true },
    orderBy: { createdAt: 'desc' },
    take: 1,
  },
} satisfies Prisma.ConversationSelect;

type ConversationRecord = Prisma.ConversationGetPayload<{
  select: typeof conversationSelect;
}>;

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async list(user: AuthUser, query: ListConversationsQueryDto) {
    const where = this.whereForUser(user);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.conversation.findMany({
        where,
        select: conversationSelect,
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.conversation.count({ where }),
    ]);

    return {
      items: items.map((conversation) => this.toPublic(conversation, user)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findOne(user: AuthUser, id: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, ...this.whereForUser(user) },
      select: conversationSelect,
    });
    if (!conversation) throw this.notFound();
    return this.toPublic(conversation, user);
  }

  async createForAcceptedApplication(user: AuthUser, applicationId: string) {
    this.ensureChatParticipant(user);
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        status: true,
        studentId: true,
        student: { select: { userId: true } },
        internship: { select: { companyId: true, company: { select: { userId: true } } } },
      },
    });
    if (!application) {
      throw new NotFoundException({ code: 'APPLICATION_NOT_FOUND', message: 'Application not found' });
    }
    if (application.status !== ApplicationStatus.ACCEPTED) {
      throw new BadRequestException({
        code: 'CONVERSATION_APPLICATION_NOT_ACCEPTED',
        message: 'A conversation is available only for an accepted application',
      });
    }
    if (application.student.userId !== user.id && application.internship.company.userId !== user.id) {
      throw new ForbiddenException({
        code: 'CONVERSATION_NOT_ACCESSIBLE',
        message: 'You cannot create a conversation for this application',
      });
    }

    const conversation = await this.prisma.conversation.upsert({
      where: { applicationId },
      create: {
        applicationId,
        studentId: application.studentId,
        companyId: application.internship.companyId,
      },
      update: {},
      select: conversationSelect,
    });
    return this.toPublic(conversation, user);
  }

  async listMessages(user: AuthUser, conversationId: string, query: ListMessagesQueryDto) {
    await this.findAccessibleConversation(user, conversationId);
    const where = { conversationId };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.message.findMany({
        where,
        select: { id: true, conversationId: true, senderId: true, content: true, readAt: true, createdAt: true },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.message.count({ where }),
    ]);
    return { items, pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } };
  }

  async createMessage(user: AuthUser, conversationId: string, content: string) {
    const conversation = await this.findAccessibleConversation(user, conversationId);
    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: { conversationId, senderId: user.id, content },
        select: { id: true, conversationId: true, senderId: true, content: true, readAt: true, createdAt: true },
      });
      await tx.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
      return created;
    });
    this.realtime.emitToUser(conversation.student.userId, 'chat.message.created', message);
    this.realtime.emitToUser(conversation.company.userId, 'chat.message.created', message);
    return message;
  }

  async markMessagesRead(user: AuthUser, conversationId: string) {
    const conversation = await this.findAccessibleConversation(user, conversationId);
    const readAt = new Date();
    const result = await this.prisma.message.updateMany({
      where: { conversationId, senderId: { not: user.id }, readAt: null },
      data: { readAt },
    });
    const payload = { conversationId, readAt, updatedCount: result.count };
    this.realtime.emitToUser(conversation.student.userId, 'chat.messages.read', payload);
    this.realtime.emitToUser(conversation.company.userId, 'chat.messages.read', payload);
    return payload;
  }

  async countUnreadMessages(user: AuthUser) {
    const conversation = this.whereForUser(user);
    const count = await this.prisma.message.count({
      where: { readAt: null, senderId: { not: user.id }, conversation },
    });
    return { count };
  }

  private whereForUser(user: AuthUser): Prisma.ConversationWhereInput {
    this.ensureChatParticipant(user);
    return user.role === Role.STUDENT
      ? { student: { userId: user.id } }
      : { company: { userId: user.id } };
  }

  private async findAccessibleConversation(user: AuthUser, id: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, ...this.whereForUser(user) },
      select: { id: true, student: { select: { userId: true } }, company: { select: { userId: true } } },
    });
    if (!conversation) throw this.notFound();
    return conversation;
  }

  private ensureChatParticipant(user: AuthUser) {
    if (user.role === Role.STUDENT || user.role === Role.COMPANY) return;
    throw new ForbiddenException({
      code: 'CONVERSATION_NOT_ACCESSIBLE',
      message: 'Only conversation participants can access conversations',
    });
  }

  private toPublic(conversation: ConversationRecord, user: AuthUser) {
    const isStudent = user.role === Role.STUDENT;
    const latest = conversation.messages[0] ?? null;
    return {
      id: conversation.id,
      applicationId: conversation.applicationId,
      internship: conversation.application.internship,
      participant: isStudent
        ? { id: conversation.company.id, userId: conversation.company.userId, name: conversation.company.companyName, role: Role.COMPANY }
        : { id: conversation.student.id, userId: conversation.student.userId, name: conversation.student.fullName, role: Role.STUDENT },
      latestMessage: latest,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }

  private notFound() {
    return new NotFoundException({ code: 'CONVERSATION_NOT_FOUND', message: 'Conversation not found' });
  }
}
