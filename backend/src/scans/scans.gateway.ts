import { 
  WebSocketGateway, 
  WebSocketServer, 
  OnGatewayConnection, 
  OnGatewayDisconnect 
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

// O decorator inicia o servidor Socket.io na mesma porta do NestJS (3000)
@WebSocketGateway({
  cors: {
    origin: '*', // Em produção, a URL exata do Next.js
  },
})
export class ScansGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('ScansGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Frontend conectado no Socket: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Frontend desconectado: ${client.id}`);
  }

  // Método público que nosso Worker vai chamar quando acabar o Nmap/Nikto
  emitScanUpdate(scanId: string, status: string) {
    this.logger.log(`Emitindo evento via WebSocket para o Scan ${scanId}: ${status}`);
    
    this.server.emit('scanUpdate', { scanId, status });
  }
}