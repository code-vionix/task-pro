
import { JwtService } from '@nestjs/jwt';
import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private jwtService: JwtService) {}

  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>(); // userId -> socketId

  async handleConnection(client: Socket) {
    try {
      // Extract token from auth
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (token) {
        const payload = this.jwtService.verify(token);
        const userId = payload.sub;
        
        this.connectedUsers.set(userId, client.id);
        client.join(`user_${userId}`);
        client.data.userId = userId;
        
        console.log(`User ${userId} connected to notifications gateway`);
      }
    } catch (error) {
      console.error('Socket authentication failed:', error.message);
      client.disconnect();
    }
  }

  @SubscribeMessage('join_user')
  handleJoinUser(client: Socket, userId: string) {
    if (userId) {
      this.connectedUsers.set(userId, client.id);
      client.join(`user_${userId}`);
      client.data.userId = userId;
      console.log(`User ${userId} joined notification room`);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.connectedUsers.delete(userId);
      console.log(`User ${userId} disconnected from notifications gateway`);
    }
  }

  sendNotification(userId: string, notification: any) {
    console.log(`Emitting notification to room user_${userId}:`, notification);
    this.server.to(`user_${userId}`).emit('newNotification', notification);
  }
}
