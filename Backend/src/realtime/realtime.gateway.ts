import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Socket, Server } from 'socket.io';
import { WebSocketServer } from '@nestjs/websockets';
import { PrismaService } from '../prisma/prisma.service';
import { notificationRoom } from '../notifications/notification.constants';

type SocketTokenPayload = { sub?: string };

@WebSocketGateway({
  namespace: '/realtime',
  cors: { origin: true, credentials: true },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async handleConnection(@ConnectedSocket() socket: Socket) {
    const token = this.readToken(socket);
    if (!token) return socket.disconnect(true);

    try {
      const payload = this.jwt.verify<SocketTokenPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      });
      if (!payload.sub) return socket.disconnect(true);

      const user = await this.prisma.user.findFirst({
        where: { id: payload.sub, status: 'ACTIVE' },
        select: { id: true },
      });
      if (!user) return socket.disconnect(true);

      socket.data.userId = user.id;
      await socket.join(notificationRoom(user.id));
      this.logger.debug(`Realtime connected: ${socket.id}`);
    } catch {
      socket.disconnect(true);
    }
  }

  handleDisconnect(socket: Socket) {
    this.logger.debug(`Realtime disconnected: ${socket.id}`);
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    if (!this.server) return;
    this.server.to(notificationRoom(userId)).emit(event, payload);
  }

  private readToken(socket: Socket): string | null {
    const authToken = socket.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.trim()) return authToken.trim();
    const header = socket.handshake.headers.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice(7).trim();
    }
    return null;
  }
}
