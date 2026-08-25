import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { RealtimeModule } from '../realtime/realtime.module';

/** Application-scoped conversations and realtime messages. */
@Module({
  imports: [RealtimeModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
