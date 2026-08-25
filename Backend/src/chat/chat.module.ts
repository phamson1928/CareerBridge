import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

/** Application-scoped conversations and realtime messages. */
@Module({
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
