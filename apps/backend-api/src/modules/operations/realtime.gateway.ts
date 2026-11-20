import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*', credentials: true }, namespace: '/cabin' })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token as string | undefined;
      const payload = this.jwtService.verify<{ tenant_id?: string }>(token ?? '');
      if (!payload.tenant_id) throw new Error('Tenant is required');
      client.data.tenantId = payload.tenant_id;
      client.join(`tenant:${payload.tenant_id}`);
    } catch {
      client.emit('authenticated', { ok: false });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    client.data.tenantId = undefined;
  }

  @SubscribeMessage('subscribe-site')
  subscribeSite(@ConnectedSocket() client: Socket, @MessageBody() siteId: string) {
    if (!client.data.tenantId) return;
    client.join(`site:${client.data.tenantId}:${siteId}`);
  }

  emitTenant(tenantId: string, event: string, payload: unknown) {
    this.server?.to(`tenant:${tenantId}`).emit(event, payload);
  }

  emitSite(tenantId: string, siteId: string, event: string, payload: unknown) {
    this.server?.to(`site:${tenantId}:${siteId}`).emit(event, payload);
  }
}
