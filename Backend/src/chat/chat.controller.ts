import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import type { AuthUser } from '../auth/types/auth-user.type';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { ListConversationsQueryDto } from './dto/list-conversations-query.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { ListMessagesQueryDto } from './dto/list-messages-query.dto';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: ListConversationsQueryDto) {
    return this.chat.list(user, query);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateConversationDto) {
    return this.chat.createForAcceptedApplication(user, dto.applicationId);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: AuthUser) {
    return this.chat.countUnreadMessages(user);
  }

  @Get(':id/messages')
  listMessages(@CurrentUser() user: AuthUser, @Param('id') id: string, @Query() query: ListMessagesQueryDto) {
    return this.chat.listMessages(user, id, query);
  }

  @Post(':id/messages')
  createMessage(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: CreateMessageDto) {
    return this.chat.createMessage(user, id, dto.content);
  }

  @Patch(':id/messages/read')
  markMessagesRead(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.chat.markMessagesRead(user, id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.chat.findOne(user, id);
  }
}
