import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { EnvConfig } from '../../config/env.validation';
import { AuthService } from '../auth/auth.service';
import { RealtimeService } from './realtime.service';

interface AuthenticatedSocket extends Socket {
  data: { userId?: string };
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/realtime',
})
@Injectable()
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<EnvConfig, true>,
    private readonly authService: AuthService,
    private readonly realtimeService: RealtimeService,
  ) {}

  afterInit(server: Server) {
    this.realtimeService.setServer(server);
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth?.token ??
        client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token || typeof token !== 'string') {
        throw new UnauthorizedException();
      }

      const payload = await this.jwtService.verifyAsync<{ sub: string }>(token, {
        secret: this.configService.get('JWT_ACCESS_SECRET', { infer: true }),
      });

      const user = await this.authService.validateUser(payload.sub);
      if (!user || !user.isActive) {
        throw new UnauthorizedException();
      }

      client.data.userId = user.id;
      await client.join(`user:${user.id}`);
      await client.join('feed');
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage('conversation:join')
  async joinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    payload: { conversationId: string },
  ) {
    if (!client.data.userId || !payload?.conversationId) return;
    await client.join(`conversation:${payload.conversationId}`);
    return { joined: payload.conversationId };
  }

  @SubscribeMessage('conversation:leave')
  async leaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    payload: { conversationId: string },
  ) {
    if (!payload?.conversationId) return;
    await client.leave(`conversation:${payload.conversationId}`);
    return { left: payload.conversationId };
  }
}
